import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Bold design scaled 32→180 (factor=5.625)
// Source nodes at y=48 (8.5*5.625): x=42(7.5*5.625), 90(16*5.625), 138(24.5*5.625)
// Apex at (90,141) (25*5.625=140.6)
// Node diameter: 6*5.625=33.75 → 34 (radius=17)
// Apex diameter: 8*5.625=45 → 44 (radius=22)
// Line width: 2*5.625=11.25 → 11
//
// Left line: (42,48)→(90,141), midpoint=(66,94.5), len=sqrt(48²+93²)≈104, rotate(-27.3°)
// Center line: (90,48)→(90,141), vertical, len=93
// Right line: (138,48)→(90,141), midpoint=(114,94.5), rotate(+27.3°)

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180, height: 180,
          background: '#0a0a0a',
          borderRadius: 40,
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* Left line: midpoint=(66,94.5), len≈104, rotate(-27.3°) */}
        <div style={{ position: 'absolute', left: 60.5, top: 42.5, width: 11, height: 104, background: '#c96a50', opacity: 0.7, transform: 'rotate(-27.3deg)', display: 'flex' }} />

        {/* Center line: (90,48)→(90,141) */}
        <div style={{ position: 'absolute', left: 84.5, top: 48, width: 11, height: 93, background: '#c96a50', display: 'flex' }} />

        {/* Right line: midpoint=(114,94.5), rotate(+27.3°) */}
        <div style={{ position: 'absolute', left: 108.5, top: 42.5, width: 11, height: 104, background: '#c96a50', opacity: 0.7, transform: 'rotate(27.3deg)', display: 'flex' }} />

        {/* Source nodes — diameter=34, radius=17 */}
        <div style={{ position: 'absolute', left: 25, top: 31, width: 34, height: 34, borderRadius: '50%', background: '#c96a50', opacity: 0.85, display: 'flex' }} />
        <div style={{ position: 'absolute', left: 73, top: 31, width: 34, height: 34, borderRadius: '50%', background: '#c96a50', display: 'flex' }} />
        <div style={{ position: 'absolute', left: 121, top: 31, width: 34, height: 34, borderRadius: '50%', background: '#c96a50', opacity: 0.85, display: 'flex' }} />

        {/* Apex node — diameter=44, radius=22 */}
        <div style={{ position: 'absolute', left: 68, top: 119, width: 44, height: 44, borderRadius: '50%', background: '#c96a50', display: 'flex' }} />
      </div>
    ),
    { ...size },
  )
}
