// Route per logout sicuro — cancella cookie httpOnly gh_token
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const response = NextResponse.json({ success: true })

  // Cancella il cookie httpOnly gh_token lato server
  response.cookies.set('gh_token', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })

  return response
}
