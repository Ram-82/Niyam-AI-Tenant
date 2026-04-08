import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';

const sessionSchema = z.object({
  client_id: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in format YYYY-MM'),
});

export async function createSession(req, res, next) {
  try {
    const { client_id, month } = sessionSchema.parse(req.body);

    // Verify client belongs to this CA
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('ca_id', req.caId)
      .single();

    if (!client) {
      return res.status(404).json({ error: true, message: 'Client not found', code: 'NOT_FOUND' });
    }

    // Check for existing session (warn but allow)
    const { data: existing } = await supabaseAdmin
      .from('upload_sessions')
      .select('id, status')
      .eq('client_id', client_id)
      .eq('month', month)
      .eq('ca_id', req.caId)
      .single();

    if (existing) {
      return res.status(200).json({ ...existing, warning: 'Session for this month already exists' });
    }

    const { data: session, error } = await supabaseAdmin
      .from('upload_sessions')
      .insert({ client_id, month, ca_id: req.caId, status: 'pending' })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function getSession(req, res, next) {
  try {
    const { data: session, error } = await supabaseAdmin
      .from('upload_sessions')
      .select(`
        *,
        clients (id, name, gstin),
        uploaded_files (id, original_filename, file_type, file_size_bytes, parse_status, created_at)
      `)
      .eq('id', req.params.id)
      .eq('ca_id', req.caId)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: true, message: 'Session not found', code: 'NOT_FOUND' });
    }

    const { count: invoiceCount } = await supabaseAdmin
      .from('extracted_invoices')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', req.params.id);

    const { count: flagCount } = await supabaseAdmin
      .from('validation_flags')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', req.params.id);

    return res.json({ ...session, invoice_count: invoiceCount || 0, flag_count: flagCount || 0 });
  } catch (err) {
    next(err);
  }
}

export async function getSessionResults(req, res, next) {
  try {
    const { data: session } = await supabaseAdmin
      .from('upload_sessions')
      .select('id, status, month, client_id, clients(name, gstin)')
      .eq('id', req.params.id)
      .eq('ca_id', req.caId)
      .single();

    if (!session) {
      return res.status(404).json({ error: true, message: 'Session not found', code: 'NOT_FOUND' });
    }

    const { data: invoices } = await supabaseAdmin
      .from('extracted_invoices')
      .select('*')
      .eq('session_id', req.params.id)
      .order('created_at');

    const { data: flags } = await supabaseAdmin
      .from('validation_flags')
      .select('*')
      .eq('session_id', req.params.id)
      .order('severity');

    const { data: report } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('session_id', req.params.id)
      .single();

    return res.json({
      session,
      invoices: invoices || [],
      flags: flags || [],
      report: report || null,
    });
  } catch (err) {
    next(err);
  }
}
