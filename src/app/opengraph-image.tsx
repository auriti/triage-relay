import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Triage Relay — Collaborative Issue Triage'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1b2831 0%, #0f1a22 100%)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Glow decorativo */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255, 155, 81, 0.08)',
            filter: 'blur(80px)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="6" fill="#25343F"/>
            <path d="M16 4 L28 16 L16 28 L4 16 Z" fill="#FF9B51"/>
          </svg>
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#EAEFEF' }}>
            Triage Relay
          </span>
        </div>

        {/* Titolo */}
        <h1
          style={{
            fontSize: '56px',
            fontWeight: 800,
            background: 'linear-gradient(90deg, #FF9B51, #ffb980)',
            backgroundClip: 'text',
            color: 'transparent',
            textAlign: 'center',
            lineHeight: 1.1,
            margin: 0,
            maxWidth: '900px',
          }}
        >
          Triage is a Team Sport
        </h1>

        {/* Sottotitolo */}
        <p
          style={{
            fontSize: '22px',
            color: '#8ba0b0',
            textAlign: 'center',
            margin: '16px 0 0 0',
            maxWidth: '700px',
          }}
        >
          AI-powered collaborative issue triage for open-source maintainers
        </p>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '40px',
          }}
        >
          {['AI Briefs', 'Safe Proposals', 'One-Click Apply'].map((feature) => (
            <div
              key={feature}
              style={{
                padding: '8px 20px',
                borderRadius: '999px',
                border: '1px solid rgba(255, 155, 81, 0.3)',
                background: 'rgba(255, 155, 81, 0.08)',
                color: '#FF9B51',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
