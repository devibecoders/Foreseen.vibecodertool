/**
 * Supabase Client Configuration
 *
 * Provides configured Supabase clients for database access.
 * Uses environment variables for configuration.
 *
 * @module lib/supabase
 *
 * @example
 * // Client-side usage (with RLS)
 * import { supabase } from '@/lib/supabase'
 * const { data } = await supabase.from('table').select()
 *
 * @example
 * // Server-side usage (bypasses RLS - use with caution)
 * import { supabaseAdmin } from '@/lib/supabase'
 * const { data } = await supabaseAdmin.from('table').select()
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Client-side Supabase client
 *
 * Uses the anon key and respects Row Level Security (RLS) policies.
 * Safe to use in browser/client components.
 */
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

/**
 * Server-side Supabase client with admin privileges
 *
 * Uses the service role key and BYPASSES RLS policies.
 * ⚠️ Only use in server-side code (API routes, Edge Functions).
 * Never expose this client to the browser.
 */
export const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey)

/**
 * Creates a new Supabase client instance
 *
 * Useful for API routes that need a fresh client.
 * Uses anon key (respects RLS).
 *
 * @returns New Supabase client instance
 */
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

