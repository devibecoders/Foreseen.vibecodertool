/**
 * Supabase Client Configuration
 *
 * Provides configured Supabase clients for database access.
 * Uses environment variables for configuration.
 *
 * @module lib/supabase
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Get env vars with fallbacks for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Warn if env vars are missing at runtime (not during build)
if (typeof window === 'undefined' && !supabaseUrl) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL is not set')
}

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
