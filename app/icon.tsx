import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Coordinates match the 32x32 SVG design exactly:
// Nodes at y=9: (7.5,9), (16,9), (24.5,9), r=2.5 → diameter=5
// Apex at (16,24.5), r=3.5 → diameter=7
// Lines 1.5px wide; angles from 32x32 geometry atan(8.5/15.5)≈28.7°

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
        {/* Apex outer glow */}
        <div style={{ position: 'absolute', left: 8.5, top: 17, width: 15, height: 15, borderRadius: '50%', background: '#c96a50', opacity: 0.13, display: 'flex' }} />

        {/* Horizontal source-layer bar */}
        <div style={{ position: 'absolute', left: 7.5, top: 8.5, width: 17, height: 1, background: '#c96a50', opacity: 0.28, display: 'flex' }} />

        {/* Left line: (7.5,9)→(16,24.5), midpoint=(11.75,16.75), len≈18, rotate(-28.7°) */}
        <div style={{ position: 'absolute', left: 11, top: 8, width: 1.5, height: 18, background: '#c96a50', opacity: 0.55, transform: 'rotate(-28.7deg)', display: 'flex' }} />

        {/* Center line: vertical, (16,9)→(16,24.5) */}
        <div style={{ position: 'absolute', left: 15.25, top: 9, width: 1.5, height: 15.5, background: '#c96a50', opacity: 0.80, display: 'flex' }} />

        {/* Right line: (24.5,9)→(16,24.5), midpoint=(20.25,16.75), rotate(+28.7°) */}
        <div style={{ position: 'absolute', left: 19.5, top: 8, width: 1.5, height: 18, background: '#c96a50', opacity: 0.55, transform: 'rotate(28.7deg)', display: 'flex' }} />

        {/* Source nodes */}
        <div style={{ position: 'absolute', left: 5, top: 6.5, width: 5, height: 5, borderRadius: '50%', background: '#c96a50', opacity: 0.72, display: 'flex' }} />
        <div style={{ position: 'absolute', left: 13.5, top: 6.5, width: 5, height: 5, borderRadius: '50%', background: '#c96a50', display: 'flex' }} />
        <div style={{ position: 'absolute', left: 22, top: 6.5, width: 5, height: 5, borderRadius: '50%', background: '#c96a50', opacity: 0.72, display: 'flex' }} />

        {/* Apex node */}
        <div style={{ position: 'absolute', left: 12.5, top: 21, width: 7, height: 7, borderRadius: '50%', background: '#c96a50', display: 'flex' }} />
      </div>
    ),
    { ...size },
  )
}
