'use client'

// Boundary di errore globale Next.js — sostituisce l'intero layout,
// quindi deve contenere <html> e <body> esplicitamente.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="mx-auto max-w-md space-y-4 p-8 text-center">
          <h2 className="text-xl font-bold">Qualcosa è andato storto</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || 'Si è verificato un errore imprevisto.'}
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Riprova
          </button>
        </div>
      </body>
    </html>
  )
}
