import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Bold design: thicker lines (2.2px), solid nodes, no glow/horizontal-bar noise
// Node positions: y=8.5, x = 5 (left) | 13.5 (center) | 22 (right), diameter=6
// Apex: (12.5, 21), diameter=8
// Left line: (7.5,8.5)→(16,25), midpoint=(11.75,16.75), len≈17.7, rotate(-28.7°)
// Center line: (16,8.5)→(16,25), vertical, len=16.5
// Right line: (24.5,8.5)→(16,25), rotate(+28.7°)

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32, height: 32,
          background: '#0a0a0a',
          borderRadius: 7,
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* Left line: midpoint=(11.75,16.75), len=17.7, rotate(-28.7°) */}
        <div style={{ position: 'absolute', left: 10.75, top: 7.85, width: 2, height: 18, background: '#c96a50', opacity: 0.7, transform: 'rotate(-28.7deg)', display: 'flex' }} />

        {/* Center line: (16,8.5)→(16,25) */}
        <div style={{ position: 'absolute', left: 15, top: 8.5, width: 2, height: 16.5, background: '#c96a50', display: 'flex' }} />

        {/* Right line: midpoint=(20.25,16.75), rotate(+28.7°) */}
        <div style={{ position: 'absolute', left: 19.25, top: 7.85, width: 2, height: 18, background: '#c96a50', opacity: 0.7, transform: 'rotate(28.7deg)', display: 'flex' }} />

        {/* Source nodes - diameter=6, radius=3 */}
        <div style={{ position: 'absolute', left: 4.5, top: 5.5, width: 6, height: 6, borderRadius: '50%', background: '#c96a50', opacity: 0.85, display: 'flex' }} />
        <div style={{ position: 'absolute', left: 13, top: 5.5, width: 6, height: 6, borderRadius: '50%', background: '#c96a50', display: 'flex' }} />
        <div style={{ position: 'absolute', left: 21.5, top: 5.5, width: 6, height: 6, borderRadius: '50%', background: '#c96a50', opacity: 0.85, display: 'flex' }} />

        {/* Apex node - diameter=8, radius=4 */}
        <div style={{ position: 'absolute', left: 12, top: 21, width: 8, height: 8, borderRadius: '50%', background: '#c96a50', display: 'flex' }} />
      </div>
    ),
    { ...size },
  )
}
