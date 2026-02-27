'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function CopyJoinLink({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    // Costruisce il link di join con il room ID come parametro
    const joinUrl = `${window.location.origin}/dashboard?join=${roomId}`
    navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="mt-2 w-full gap-1.5 text-xs"
    >
      {copied ? (
        <>
          <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z" />
          </svg>
          Share invite link
        </>
      )}
    </Button>
  )
}
