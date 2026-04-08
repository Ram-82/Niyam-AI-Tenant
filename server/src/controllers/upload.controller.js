import { supabaseAdmin } from '../config/supabase.js';
import { parseFile, detectFileType } from '../services/parser/index.js';
import { runValidators } from '../services/validator/index.js';
import { generatePdfReport } from '../services/reportGenerator.js';
import { calculateComplianceScore } from '../utils/helpers.js';

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/jpeg',
  'image/png',
];

export async function uploadFiles(req, res, next) {
  try {
    const { session_id } = req.params;

    // Verify session belongs to CA
    const { data: session } = await supabaseAdmin
      .from('upload_sessions')
      .select('id, client_id, ca_id, month')
      .eq('id', session_id)
      .eq('ca_id', req.caId)
      .single();

    if (!session) {
      return res.status(404).json({ error: true, message: 'Session not found', code: 'NOT_FOUND' });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: true, message: 'No files uploaded', code: 'NO_FILES' });
    }

    // Update session status
    await supabaseAdmin
      .from('upload_sessions')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', session_id);

    const uploadedFileRecords = [];

    for (const file of files) {
      if (!ALLOWED_MIMES.includes(file.mimetype)) continue;
      if (file.size > 10 * 1024 * 1024) continue; // 10MB max

      const fileType = detectFileType(file.mimetype, file.originalname);
      const storagePath = `${req.caId}/${session.client_id}/${session_id}/${Date.now()}_${file.originalname}`;

      // Upload to Supabase Storage
      const { error: storageError } = await supabaseAdmin.storage
        .from('ca-uploads')
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (storageError) {
        console.error('[Upload] Storage error:', storageError.message);
      }

      const { data: fileRecord } = await supabaseAdmin
        .from('uploaded_files')
        .insert({
          session_id,
          ca_id: req.caId,
          client_id: session.client_id,
          original_filename: file.originalname,
          storage_path: storagePath,
          file_type: fileType,
          file_size_bytes: file.size,
          parse_status: 'pending',
        })
        .select()
        .single();

      uploadedFileRecords.push({ file, fileRecord, fileType });
    }

    // Update file count
    await supabaseAdmin
      .from('upload_sessions')
      .update({ file_count: uploadedFileRecords.length, updated_at: new Date().toISOString() })
      .eq('id', session_id);

    // Trigger async processing (don't await — respond immediately)
    processFilesAsync(session, uploadedFileRecords, req.caId).catch(err => {
      console.error('[Processing] Async error:', err.message);
    });

    return res.json({
      session_id,
      files_uploaded: uploadedFileRecords.length,
      status: 'processing',
    });
  } catch (err) {
    next(err);
  }
}

async function processFilesAsync(session, uploadedFileRecords, caId) {
  const allInvoices = [];

  for (const { file, fileRecord, fileType } of uploadedFileRecords) {
    if (!fileType || fileType === 'image') {
      await supabaseAdmin
        .from('uploaded_files')
        .update({ parse_status: 'failed' })
        .eq('id', fileRecord.id);
      continue;
    }

    try {
      const extracted = await parseFile(file.buffer, fileType);

      for (const inv of extracted) {
        if (!inv || Object.values(inv).every(v => !v)) continue;

        const { data: savedInv } = await supabaseAdmin
          .from('extracted_invoices')
          .insert({
            session_id: session.id,
            file_id: fileRecord.id,
            client_id: session.client_id,
            invoice_number: inv.invoice_number,
            invoice_date: inv.invoice_date,
            seller_gstin: inv.seller_gstin,
            buyer_gstin: inv.buyer_gstin,
            seller_name: inv.seller_name,
            buyer_name: inv.buyer_name,
            hsn_code: inv.hsn_code,
            taxable_amount: inv.taxable_amount,
            cgst: inv.cgst,
            sgst: inv.sgst,
            igst: inv.igst,
            total_amount: inv.total_amount,
            raw_extracted: inv.raw_extracted,
          })
          .select()
          .single();

        if (savedInv) {
          allInvoices.push({ ...inv, _tempId: savedInv.id, _dbId: savedInv.id });
        }
      }

      await supabaseAdmin
        .from('uploaded_files')
        .update({ parse_status: 'success' })
        .eq('id', fileRecord.id);
    } catch (err) {
      console.error('[Processing] Parse error:', err.message);
      await supabaseAdmin
        .from('uploaded_files')
        .update({ parse_status: 'failed' })
        .eq('id', fileRecord.id);
    }
  }

  // Run validators
  const flags = runValidators(allInvoices);

  // Save flags
  for (const flag of flags) {
    const invoiceId = flag.invoiceId;
    await supabaseAdmin
      .from('validation_flags')
      .insert({
        session_id: session.id,
        invoice_id: invoiceId || null,
        flag_type: flag.flag_type,
        severity: flag.severity,
        field_name: flag.field_name,
        expected_value: flag.expected_value,
        actual_value: flag.actual_value,
        message: flag.message,
      });
  }

  const criticalCount = flags.filter(f => f.severity === 'critical').length;
  const warningCount = flags.filter(f => f.severity === 'warning').length;
  const score = calculateComplianceScore(criticalCount, warningCount);

  // Generate PDF report
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('name, gstin')
    .eq('id', session.client_id)
    .single();

  const { data: ca } = await supabaseAdmin
    .from('cas')
    .select('full_name, firm_name')
    .eq('id', caId)
    .single();

  // Fetch all flags with invoice numbers for report
  const { data: fullFlags } = await supabaseAdmin
    .from('validation_flags')
    .select('*, extracted_invoices(invoice_number)')
    .eq('session_id', session.id);

  const flagsForReport = (fullFlags || []).map(f => ({
    ...f,
    invoice_number: f.extracted_invoices?.invoice_number || null,
  }));

  let reportStoragePath = null;
  try {
    const pdfBuffer = await generatePdfReport({
      client: client || { name: 'Unknown Client', gstin: null },
      ca: ca || { full_name: 'Unknown CA', firm_name: null },
      session,
      invoices: allInvoices,
      flags: flagsForReport,
      score,
      month: session.month,
    });

    reportStoragePath = `reports/${caId}/${session.id}/report_${Date.now()}.pdf`;
    await supabaseAdmin.storage
      .from('ca-uploads')
      .upload(reportStoragePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });
  } catch (err) {
    console.error('[Report] Generation error:', err.message);
  }

  // Save report record
  await supabaseAdmin
    .from('reports')
    .insert({
      session_id: session.id,
      ca_id: caId,
      client_id: session.client_id,
      month: session.month,
      total_invoices: allInvoices.length,
      total_flags: flags.length,
      critical_flags: criticalCount,
      warning_flags: warningCount,
      compliance_score: score,
      storage_path: reportStoragePath,
    });

  // Mark session complete
  await supabaseAdmin
    .from('upload_sessions')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', session.id);
}
