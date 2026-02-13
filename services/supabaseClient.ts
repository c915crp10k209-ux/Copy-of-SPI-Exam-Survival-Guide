
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Support both standard and NEXT_PUBLIC environment variables
const supabaseUrl = (process.env as any).NEXT_PUBLIC_SUPABASE_URL || (process.env as any).SUPABASE_URL;
const supabaseAnonKey = (process.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY || (process.env as any).SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Only initialize if credentials exist to avoid "supabaseUrl is required" error
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
