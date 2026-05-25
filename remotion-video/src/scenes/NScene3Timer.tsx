import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { PhoneFrame } from './NScene2AppOpens';
import { AnimatedCursor } from './components/AnimatedCursor';

const PX = (1080 - 390) / 2;
const PY = (1920 - 844) / 2;

// Cursor: hover over start button, click, then drift to timer
const WAYPOINTS = [
  { frame: 0,  x: PX + 195, y: PY + 420 },
  { frame: 22, x: PX + 195, y: PY + 660, click: false },
  { frame: 38, x: PX + 195, y: PY + 660, click: true },
  { frame: 55, x: PX + 195, y: PY + 360 },
];

export const Scene3Timer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow zoom-in on timer
  const zoomS = spring({ fps, frame: frame - 20, config: { damping: 200 } });
  const scale = interpolate(zoomS, [0, 1], [1.0, 1.08]);
  const phoneOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const cursorOpacity = interpolate(frame, [8, 22], [0, 1], { extrapolateRight: 'clamp' });

  // Timer counts down: 25:00 → ~18:34 over 180 frames
  const totalSeconds = 25 * 60;
  const elapsedSeconds = Math.floor(interpolate(frame, [38, 180], [0, 390], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }));
  const remaining = totalSeconds - elapsedSeconds;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  // Progress ring
  const progress = elapsedSeconds / totalSeconds;
  const circumference = 289;
  const dashOffset = circumference - progress * circumference;

  // Click button state
  const clicked = frame >= 38;
  const btnVisible = !clicked;

  // Pulse glow
  const glowPulse = 0.6 + Math.sin(frame / 15) * 0.3;

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', width: 700, height: 700, borderRadius: '50%',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: `radial-gradient(circle, rgba(59,130,246,${clicked ? glowPulse * 0.12 : 0.05}) 0%, transparent 70%)`,
        filter: 'blur(80px)',
      }} />

      <PhoneFrame scale={scale} opacity={phoneOpacity}>
        <div style={{
          width: '100%', height: '100%', background: '#000',
          fontFamily: 'Inter, sans-serif',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '60px 20px 30px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔥</div>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>Solo Lock-In</div>
          </div>

          {!clicked ? (
            /* SETUP VIEW */
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ color: '#666', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Topic / Subject</div>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>Data Structures</div>
              </div>
              <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ color: '#666', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Session Goal</div>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>Finish graph algorithms</div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 4 }}>
                {[25, 45, 60].map(d => (
                  <div key={d} style={{
                    padding: '10px 18px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                    background: d === 25 ? '#2563eb' : 'rgba(255,255,255,0.05)',
                    color: d === 25 ? '#fff' : '#666',
                    border: d === 25 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    boxShadow: d === 25 ? '0 0 20px rgba(37,99,235,0.4)' : 'none',
                  }}>{d}m</div>
                ))}
              </div>
              <div style={{
                marginTop: 8, width: '100%', padding: '16px', borderRadius: 18,
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                color: '#fff', fontWeight: 900, fontSize: 17,
                textAlign: 'center', letterSpacing: '0.03em',
                boxShadow: '0 0 30px rgba(79,70,229,0.4)',
              }}>
                START LOCKED IN →
              </div>
            </div>
          ) : (
            /* ACTIVE TIMER VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              {/* Status badge */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 20, padding: '5px 14px', color: '#60a5fa', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  Locked In
                </div>
              </div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>Data Structures</div>
              <div style={{ color: '#4ade80', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                🎯 <span>Goal: Finish graph algorithms</span>
              </div>

              {/* SVG Ring Timer */}
              <div style={{ position: 'relative', width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                  background: `rgba(59,130,246,${glowPulse * 0.1})`,
                  filter: 'blur(30px)',
                }} />
                <svg width={240} height={240} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                  <circle cx={120} cy={120} r={100} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth={8} />
                  <circle
                    cx={120} cy={120} r={100}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <div style={{ fontSize: 54, fontWeight: 300, color: '#fff', fontFamily: 'monospace', letterSpacing: '-2px' }}>
                  {mm}:{ss}
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 8 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: '#fff',
                }}>‖</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 20px', borderRadius: 30,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171', fontSize: 13, fontWeight: 700,
                }}>
                  ✕ Quit Early
                </div>
              </div>
            </div>
          )}
        </div>
      </PhoneFrame>

      <AnimatedCursor waypoints={WAYPOINTS} opacity={cursorOpacity} />
    </AbsoluteFill>
  );
};
