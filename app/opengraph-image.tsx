import { ImageResponse } from 'next/og'

export const alt = 'cgcone - Universal AI CLI Extension Manager'
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

// Icon mark - bold design at 72x72 (scale from 32x32 by 2.25)
// Node diameter=13 (r=3*2.25=6.75), apex diameter=18 (r=4*2.25=9)
// Lines width=5 (2.2*2.25≈5), nodes at y=19 (8.5*2.25), x=17/36/55, apex y=56 (25*2.25)
function IconMark() {
  return (
    <div style={{ width: 72, height: 72, position: 'relative', display: 'flex' }}>
      {/* Left line: (17,19)→(36,56), midpoint=(26.5,37.5), len≈39.7, rotate(-27.3°) */}
      <div style={{ position: 'absolute', left: 24, top: 17.85, width: 5, height: 40, background: P, opacity: 0.7, transform: 'rotate(-27.3deg)', display: 'flex' }} />

      {/* Center line: (36,19)→(36,56), vertical */}
      <div style={{ position: 'absolute', left: 33.5, top: 19, width: 5, height: 37, background: P, display: 'flex' }} />

      {/* Right line: (55,19)→(36,56), midpoint=(45.5,37.5), rotate(+27.3°) */}
      <div style={{ position: 'absolute', left: 43, top: 17.85, width: 5, height: 40, background: P, opacity: 0.7, transform: 'rotate(27.3deg)', display: 'flex' }} />

      {/* Source nodes - diameter=13 */}
      <div style={{ position: 'absolute', left: 10.5, top: 12.5, width: 13, height: 13, borderRadius: '50%', background: P, opacity: 0.85, display: 'flex' }} />
      <div style={{ position: 'absolute', left: 29.5, top: 12.5, width: 13, height: 13, borderRadius: '50%', background: P, display: 'flex' }} />
      <div style={{ position: 'absolute', left: 48.5, top: 12.5, width: 13, height: 13, borderRadius: '50%', background: P, opacity: 0.85, display: 'flex' }} />

      {/* Apex node - diameter=18 */}
      <div style={{ position: 'absolute', left: 27, top: 47, width: 18, height: 18, borderRadius: '50%', background: P, display: 'flex' }} />
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
