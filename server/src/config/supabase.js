import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Admin client with service role key (full DB access)
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Public client with anon key
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
