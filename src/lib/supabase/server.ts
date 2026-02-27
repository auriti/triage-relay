// Client Supabase per il server (Server Components, API Routes, Server Actions)
import { createServerClient } from '@supabase/ssr'
import { createClient as createJsClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Client autenticato con sessione utente (per query con RLS)
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Il metodo setAll è chiamato da Server Component —
            // può essere ignorato se c'è un middleware che refresha la sessione
          }
        },
      },
    }
  )
}

// Client con service_role key — bypassa RLS per operazioni server-side
// USARE SOLO in API routes per operazioni di sistema (cache, upsert, ecc.)
export function createServiceClient() {
  return createJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
