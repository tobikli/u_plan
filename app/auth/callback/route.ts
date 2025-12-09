import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchParams = url.searchParams

  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'

  // Ensure relative path
  if (!next.startsWith('/')) next = '/'

  // Determine public origin safely
  const forwardedHost = request.headers.get('x-forwarded-host') || process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '')
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const externalHost = forwardedHost || url.host || 'localhost:3000'
  const publicOrigin = `${proto}://${externalHost}`

  if (code) {
    const supabase = await createClient()
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        const redirectUrl = new URL(next, publicOrigin).toString()
        return NextResponse.redirect(redirectUrl)
      }
    } catch (err) {
      console.error('Supabase callback error:', err)
    }
  }

  // Fallback redirect
  let fallbackRedirect: string
  try {
    fallbackRedirect = new URL('/auth/auth-code-error', publicOrigin).toString()
  } catch {
    fallbackRedirect = `${publicOrigin}/`
  }

  return NextResponse.redirect(fallbackRedirect)
}
