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

    // During build, env vars may not be available - return a dummy client that will fail at runtime
    // This prevents build failures while still catching issues at runtime
    if (!url || !key) {
        console.warn('[Supabase] Missing env vars during build - this is expected during static analysis')
        // Return a proxy that throws helpful errors at runtime
        return new Proxy({} as SupabaseClient, {
            get(_, prop) {
                if (prop === 'from') {
                    return () => new Proxy({} as any, {
                        get() {
                            throw new Error('supabaseUrl is required. Check NEXT_PUBLIC_SUPABASE_URL env var.')
                        }
                    })
                }
                throw new Error('Supabase client not initialized. Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY')
            }
        })
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
