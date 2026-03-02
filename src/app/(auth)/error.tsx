'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-6">
      <svg className="mb-4 h-12 w-12 text-destructive/50" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
        <Button asChild variant="ghost">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
