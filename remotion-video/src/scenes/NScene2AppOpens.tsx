import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

// Phone frame wrapper — 390×844, centered on 1080×1920 canvas
export const PhoneFrame: React.FC<{ children: React.ReactNode; scale?: number; opacity?: number }> = ({
  children, scale = 1, opacity = 1,
}) => (
  <div style={{
    position: 'absolute',
    width: 390,
    height: 844,
    left: (1080 - 390) / 2,
    top: (1920 - 844) / 2,
    overflow: 'hidden',
    borderRadius: 40,
    transform: `scale(${scale})`,
    opacity,
    boxShadow: '0 0 120px rgba(230,60,10,0.15), 0 0 0 1px rgba(255,255,255,0.05)',
    background: '#000000',
  }}>
    {children}
  </div>
);

export const Scene2AppOpens: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({ fps, frame: frame - 5, config: { damping: 200, mass: 1.2 } });
  const scale = interpolate(fadeIn, [0, 1], [0.92, 1]);
  const opacity = interpolate(fadeIn, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <PhoneFrame scale={scale} opacity={opacity}>
        {/* Real Dashboard content — static preview since data is mocked */}
        <div style={{
          width: '100%', height: '100%', background: '#000',
          fontFamily: 'Inter, sans-serif', overflowY: 'hidden', padding: '60px 16px 20px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {/* Header */}
          <div>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px' }}>
              Welcome, Kwame 👋
            </div>
            <div style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Lock In. Level Up.</div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[{ label: 'Buddies', val: '15', color: '#fff' }, { label: 'Focus Score', val: '950', color: '#fbbf24' }].map(s => (
              <div key={s.label} style={{
                background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>{s.val}</div>
                  <div style={{ color: '#888', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Leaderboard banner */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
            background: '#0a0a0a',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🏆</span>
              <div>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Campus Leaderboards are live!</div>
                <div style={{ color: '#888', fontSize: 11 }}>Check where you stand among your peers.</div>
              </div>
            </div>
            <span style={{ color: '#888', fontSize: 18 }}>›</span>
          </div>

          {/* Timer card preview */}
          <div style={{
            background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🔥
              </div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>Solo Lock-In</div>
            </div>
            <div style={{ color: '#555', fontSize: 13 }}>Start a focused solo session. Track your progress.</div>
            <div style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', borderRadius: 14, padding: '14px', textAlign: 'center', color: '#fff', fontWeight: 900, fontSize: 16 }}>
              START LOCKED IN →
            </div>
          </div>
        </div>
      </PhoneFrame>
    </AbsoluteFill>
  );
};
