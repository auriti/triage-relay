// OAuth callback — cattura provider_token e salva in cookie httpOnly
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Protezione open redirect — accetta solo percorsi relativi interni
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.session) {
      // CRITICO: cattura il provider_token GitHub — Supabase NON lo persiste dopo il primo login
      if (data.session.provider_token) {
        const cookieStore = await cookies()
        cookieStore.set('gh_token', data.session.provider_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 8, // 8 ore
          path: '/',
        })
      }

      return NextResponse.redirect(new URL(next, origin))
    }
  }

  // Errore OAuth — redirect a login con messaggio
  return NextResponse.redirect(new URL('/login?error=auth', origin))
}
