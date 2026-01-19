/**
 * Supabase Client Configuration
 *
 * Provides configured Supabase clients for database access.
 * Uses lazy initialization to prevent build-time errors when env vars are missing.
 *
 * @module lib/supabase
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Cached client instances
let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

/**
 * Get environment variables with validation
 */
function getEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return { supabaseUrl, supabaseAnonKey, supabaseServiceKey }
}

/**
 * Client-side Supabase client (lazy initialized)
 *
 * Uses the anon key and respects Row Level Security (RLS) policies.
 * Safe to use in browser/client components.
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const { supabaseUrl, supabaseAnonKey } = getEnvVars()
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase client env vars not configured')
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

/**
 * Server-side Supabase client with admin privileges (lazy initialized)
 *
 * Uses the service role key and BYPASSES RLS policies.
 * ⚠️ Only use in server-side code (API routes, Edge Functions).
 * Never expose this client to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const { supabaseUrl, supabaseServiceKey } = getEnvVars()
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase admin env vars not configured')
    }
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  }
  return _supabaseAdmin
}

// Legacy exports for backward compatibility (using getters)
// These will throw at runtime if env vars are missing, but NOT at build time
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop]
  }
})

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as any)[prop]
  }
})

/**
 * Creates a new Supabase client instance
 */
export function createClientInstance() {
  const { supabaseUrl, supabaseAnonKey } = getEnvVars()
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env vars not configured')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Alias for backward compatibility
export { createClientInstance as createClient }
