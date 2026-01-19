/**
 * Supabase Client Exports
 * 
 * Re-exports lazy-initialized clients for convenience.
 * 
 * Usage:
 *   import { supabaseAdmin } from '@/lib/supabase'  // Server-side
 *   import { supabaseBrowser } from '@/lib/supabase'  // Client-side
 */
export { supabaseAdmin } from './server'
export { supabaseBrowser } from './browser'

// Legacy compatibility - these are now functions, not objects
// Use supabaseAdmin() instead of supabaseAdmin
