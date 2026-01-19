/**
 * Supabase Server Client (Lazy Initialization)
 * 
 * Use this in API routes and server-side code.
 * Uses the service role key and BYPASSES RLS.
 * 
 * ⚠️ NEVER import this in client components!
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseAdmin: SupabaseClient | null = null

/**
 * Get the server-side Supabase admin client
 * Uses lazy initialization to prevent build-time errors
 */
export function supabaseAdmin(): SupabaseClient {
    if (_supabaseAdmin) return _supabaseAdmin

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url) {
        throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL')
    }
    if (!key) {
        throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY')
    }

    _supabaseAdmin = createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    return _supabaseAdmin
}

// Default export for convenience
export default supabaseAdmin
