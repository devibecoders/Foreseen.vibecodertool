/**
 * Auth Callback Route
 * Handles OAuth redirects and email confirmation links
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin))
    }
  }

  // Redirect to dashboard after successful auth
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
