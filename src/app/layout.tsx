import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { validateEnv } from '@/lib/env'
import './globals.css'

// Valida env vars all'avvio
validateEnv()

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://triage-relay.vercel.app'

export const metadata: Metadata = {
  title: 'Triage Relay — Collaborative Issue Triage',
  description:
    'Help open-source maintainers manage their backlog. Propose, review, apply — without needing push access.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Triage Relay — Triage is a Team Sport',
    description: 'Help open-source maintainers manage their issue backlog. AI-powered triage briefs, safe proposals, one-click apply.',
    type: 'website',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Triage Relay — Triage is a Team Sport',
    description: 'AI-powered collaborative issue triage for open-source maintainers.',
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Triage Relay',
              description: 'AI-powered collaborative issue triage for open-source maintainers. Volunteers propose labels and comments, maintainers approve and apply.',
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Any',
              url: 'https://triage-relay.vercel.app',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
