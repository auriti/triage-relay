import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginClient from './login-client'

export const metadata: Metadata = {
  title: 'Sign In — Triage Relay',
  description: 'Sign in with GitHub to start collaborative issue triage.',
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  )
}
