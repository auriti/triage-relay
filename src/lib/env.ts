// Validazione env vars — importato da layout.tsx per fallire subito all'avvio
const requiredServerVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GROQ_API_KEY',
] as const

export function validateEnv() {
  const missing = requiredServerVars.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Variabili ambiente mancanti: ${missing.join(', ')}. Controlla .env.local`
    )
  }
}
