import { ImageResponse } from 'next/og'

export const alt = 'cgcone — Universal AI CLI Extension Manager'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const P = '#c96a50'

const badge = {
  border: '1px solid #2a2a2a',
  borderRadius: 20,
  padding: '10px 20px',
  color: '#666666',
  fontSize: 22,
  display: 'flex',
} as const

// Icon mark drawn with CSS at ~72x72 (scale from 32x32 by 2.25)
// Nodes at y=20: (17,20), (36,20), (55,20)  — radius≈5.5 → diameter=11
// Apex at (36,55), radius≈8 → diameter=16
// Line angle: 28.7° (same geometry)
function IconMark() {
  return (
    <div style={{ width: 72, height: 72, position: 'relative', display: 'flex' }}>
      {/* Apex outer glow */}
      <div style={{ position: 'absolute', left: 19, top: 38, width: 34, height: 34, borderRadius: '50%', background: P, opacity: 0.18, display: 'flex' }} />

      {/* Horizontal bar */}
      <div style={{ position: 'absolute', left: 17, top: 19.5, width: 38, height: 1.5, background: P, opacity: 0.3, display: 'flex' }} />

      {/* Left line → rotate(-28.7°), midpoint=(26.5,37.5) */}
      <div style={{ position: 'absolute', left: 25.75, top: 17.5, width: 1.5, height: 40, background: P, opacity: 0.55, transform: 'rotate(-28.7deg)', display: 'flex' }} />

      {/* Center line → vertical */}
      <div style={{ position: 'absolute', left: 35.25, top: 20, width: 1.5, height: 35, background: P, opacity: 0.82, display: 'flex' }} />

      {/* Right line → rotate(+28.7°), midpoint=(45.5,37.5) */}
      <div style={{ position: 'absolute', left: 44.75, top: 17.5, width: 1.5, height: 40, background: P, opacity: 0.55, transform: 'rotate(28.7deg)', display: 'flex' }} />

      {/* Source nodes */}
      <div style={{ position: 'absolute', left: 11.5, top: 14.5, width: 11, height: 11, borderRadius: '50%', background: P, opacity: 0.72, display: 'flex' }} />
      <div style={{ position: 'absolute', left: 30.5, top: 14.5, width: 11, height: 11, borderRadius: '50%', background: P, display: 'flex' }} />
      <div style={{ position: 'absolute', left: 49.5, top: 14.5, width: 11, height: 11, borderRadius: '50%', background: P, opacity: 0.72, display: 'flex' }} />

      {/* Apex node */}
      <div style={{ position: 'absolute', left: 28, top: 47, width: 16, height: 16, borderRadius: '50%', background: P, display: 'flex' }} />
    </div>
  )
}

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          padding: '72px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle warm glow */}
        <div style={{
          position: 'absolute', top: -150, right: -150,
          width: 600, height: 600, borderRadius: '50%',
          background: 'rgba(201,106,80,0.05)',
          display: 'flex',
        }} />

        {/* Header: icon + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 52 }}>
          <IconMark />
          <span style={{
            color: '#f0f0f0', fontSize: 34, fontWeight: 600,
            letterSpacing: -1, fontFamily: "'Courier New', Courier, monospace",
            marginLeft: 18,
          }}>
            cgcone
          </span>
        </div>

        {/* Main headline */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ color: '#f5f5f5', fontSize: 72, fontWeight: 700, lineHeight: '1.05', letterSpacing: -2 }}>
            Universal AI CLI
          </span>
          <span style={{ color: P, fontSize: 72, fontWeight: 700, lineHeight: '1.05', letterSpacing: -2, marginBottom: 28 }}>
            Extension Manager
          </span>
          <span style={{ color: '#777777', fontSize: 28, fontWeight: 400, letterSpacing: -0.3 }}>
            Install once. Works across every AI CLI.
          </span>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', columnGap: 10 }}>
            <div style={badge}>Claude Code</div>
            <div style={badge}>Gemini CLI</div>
            <div style={badge}>OpenAI Codex</div>
            <div style={badge}>Copilot CLI</div>
          </div>
          <span style={{ color: '#444444', fontSize: 22 }}>cgcone.vercel.app</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
