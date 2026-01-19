/**
 * Supabase Browser Client (Lazy Initialization)
 * 
 * Use this in client components and browser-side code.
 * Uses the anon key and respects RLS policies.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseBrowser: SupabaseClient | null = null

/**
 * Get the browser-side Supabase client
 * Uses lazy initialization to prevent build-time errors
 */
export function supabaseBrowser(): SupabaseClient {
    if (_supabaseBrowser) return _supabaseBrowser

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url) {
        throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL')
    }
    if (!key) {
        throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    _supabaseBrowser = createClient(url, key)

    return _supabaseBrowser
}

// Default export for convenience
export default supabaseBrowser
