'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function RoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center p-6">
      <h2 className="text-xl font-bold">Room Error</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || 'Failed to load room data.'}
      </p>
      <div className="mt-4 flex gap-2">
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
