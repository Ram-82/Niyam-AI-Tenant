import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { sanitizeObject } from '../utils/helpers.js';

const clientSchema = z.object({
  name: z.string().min(1).max(255),
  gstin: z.string().max(15).optional().nullable(),
  pan: z.string().max(10).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(15).optional().nullable(),
  business_type: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function createClient(req, res, next) {
  try {
    const body = clientSchema.parse(sanitizeObject(req.body));

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert({ ...body, ca_id: req.caId, email: body.email || null })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(client);
  } catch (err) {
    next(err);
  }
}

export async function listClients(req, res, next) {
  try {
    const { data: clients, error } = await supabaseAdmin
      .from('clients')
      .select(`
        *,
        upload_sessions (
          id,
          month,
          status,
          created_at
        )
      `)
      .eq('ca_id', req.caId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Attach computed fields
    const enriched = (clients || []).map(c => {
      const sessions = c.upload_sessions || [];
      const lastSession = sessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      return {
        ...c,
        session_count: sessions.length,
        last_session_date: lastSession?.created_at || null,
        last_session_month: lastSession?.month || null,
        upload_sessions: undefined,
      };
    });

    return res.json(enriched);
  } catch (err) {
    next(err);
  }
}

export async function getClient(req, res, next) {
  try {
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select(`
        *,
        upload_sessions (
          id,
          month,
          status,
          file_count,
          created_at,
          reports (
            id,
            total_invoices,
            total_flags,
            critical_flags,
            warning_flags,
            compliance_score,
            generated_at
          )
        )
      `)
      .eq('id', req.params.id)
      .eq('ca_id', req.caId)
      .single();

    if (error || !client) {
      return res.status(404).json({ error: true, message: 'Client not found', code: 'NOT_FOUND' });
    }

    return res.json(client);
  } catch (err) {
    next(err);
  }
}

export async function updateClient(req, res, next) {
  try {
    const body = clientSchema.partial().parse(sanitizeObject(req.body));

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('ca_id', req.caId)
      .select()
      .single();

    if (error || !client) {
      return res.status(404).json({ error: true, message: 'Client not found', code: 'NOT_FOUND' });
    }

    return res.json(client);
  } catch (err) {
    next(err);
  }
}

export async function deleteClient(req, res, next) {
  try {
    const { error } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', req.params.id)
      .eq('ca_id', req.caId);

    if (error) throw error;
    return res.json({ message: 'Client deleted' });
  } catch (err) {
    next(err);
  }
}
