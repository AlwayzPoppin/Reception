import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Only create client if configured, otherwise return null
let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn('⚠️ Supabase not configured: URL or ANON_KEY missing in environment.');
}

export const supabase = supabaseClient;
