import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchParams = url.searchParams

  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'

  // Ensure "next" is always a relative path
  if (!next.startsWith('/')) next = '/'

  // ---- Determine the correct public origin ----
  const forwardedHost =
    request.headers.get('x-forwarded-host') ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '')

  const proto =
    request.headers.get('x-forwarded-proto') ?? 'https'

  // Fallback only if no forwardedHost is available
  const externalHost = forwardedHost || url.host

  const publicOrigin = `${proto}://${externalHost}`

  // ---------------------------------------------

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Always redirect using the REAL public origin
      return NextResponse.redirect(`${publicOrigin}${next}`)
    }
  }

  // Error case → use the correct public origin as well
  return NextResponse.redirect(`${publicOrigin}/auth/auth-code-error`)
}
