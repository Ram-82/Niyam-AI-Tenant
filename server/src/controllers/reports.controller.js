import { supabaseAdmin } from '../config/supabase.js';

export async function listReports(req, res, next) {
  try {
    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        clients (id, name, gstin),
        upload_sessions (id, month, status)
      `)
      .eq('ca_id', req.caId)
      .order('generated_at', { ascending: false });

    if (error) throw error;
    return res.json(reports || []);
  } catch (err) {
    next(err);
  }
}

export async function getReportBySession(req, res, next) {
  try {
    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        clients (id, name, gstin),
        upload_sessions (id, month, status)
      `)
      .eq('session_id', req.params.session_id)
      .eq('ca_id', req.caId)
      .single();

    if (error || !report) {
      return res.status(404).json({ error: true, message: 'Report not found', code: 'NOT_FOUND' });
    }

    return res.json(report);
  } catch (err) {
    next(err);
  }
}

export async function downloadReport(req, res, next) {
  try {
    const { data: report } = await supabaseAdmin
      .from('reports')
      .select('storage_path')
      .eq('id', req.params.id)
      .eq('ca_id', req.caId)
      .single();

    if (!report || !report.storage_path) {
      return res.status(404).json({ error: true, message: 'Report not found', code: 'NOT_FOUND' });
    }

    const { data: signedUrl, error } = await supabaseAdmin.storage
      .from('ca-uploads')
      .createSignedUrl(report.storage_path, 86400); // 24 hours

    if (error) throw error;
    return res.json({ url: signedUrl.signedUrl });
  } catch (err) {
    next(err);
  }
}
