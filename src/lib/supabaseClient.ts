/**
 * Supabase Client for Vite App
 *
 * Uses import.meta.env (Vite) instead of process.env (Node)
 * This client uses the anon key and respects RLS policies.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase environment variables not set. ' +
        'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    )
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
)

export type { User, Session } from '@supabase/supabase-js'
