import type { Metadata } from 'next'
import LoginClient from './login-client'

export const metadata: Metadata = {
  title: 'Sign In — Triage Relay',
  description: 'Sign in with GitHub to start collaborative issue triage.',
}

export default function LoginPage() {
  return <LoginClient />
}
