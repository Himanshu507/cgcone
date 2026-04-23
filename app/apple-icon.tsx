import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Coordinates scaled from 32x32 to 180x180 (factor = 5.625)
// Source nodes at y=51, x = 42 | 90 | 138
// Apex at (90, 138)
// Lines: midpoints at (66,94.5) left, (90,94.5) center, (114,94.5) right

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
        {/* Apex outer glow */}
        <div style={{ position: 'absolute', left: 68, top: 116, width: 44, height: 44, borderRadius: '50%', background: '#c96a50', opacity: 0.13, display: 'flex' }} />

        {/* Horizontal source-layer bar */}
        <div style={{ position: 'absolute', left: 42, top: 50, width: 96, height: 2, background: '#c96a50', opacity: 0.28, display: 'flex' }} />

        {/* Left converging line (42,51)→(90,138), midpoint=(66,94.5), len≈99px, -28.9° */}
        <div style={{ position: 'absolute', left: 64.5, top: 45, width: 3, height: 99, background: '#c96a50', opacity: 0.55, transform: 'rotate(-28.9deg)', display: 'flex' }} />

        {/* Center converging line (90,51)→(90,138), vertical, len=87px */}
        <div style={{ position: 'absolute', left: 88.5, top: 51, width: 3, height: 87, background: '#c96a50', opacity: 0.80, display: 'flex' }} />

        {/* Right converging line (138,51)→(90,138), midpoint=(114,94.5), len≈99px, +28.9° */}
        <div style={{ position: 'absolute', left: 112.5, top: 45, width: 3, height: 99, background: '#c96a50', opacity: 0.55, transform: 'rotate(28.9deg)', display: 'flex' }} />

        {/* Source nodes */}
        <div style={{ position: 'absolute', left: 34, top: 43, width: 16, height: 16, borderRadius: '50%', background: '#c96a50', opacity: 0.72, display: 'flex' }} />
        <div style={{ position: 'absolute', left: 82, top: 43, width: 16, height: 16, borderRadius: '50%', background: '#c96a50', display: 'flex' }} />
        <div style={{ position: 'absolute', left: 130, top: 43, width: 16, height: 16, borderRadius: '50%', background: '#c96a50', opacity: 0.72, display: 'flex' }} />

        {/* Apex node */}
        <div style={{ position: 'absolute', left: 79, top: 127, width: 22, height: 22, borderRadius: '50%', background: '#c96a50', display: 'flex' }} />
      </div>
    ),
    { ...size },
  )
}
