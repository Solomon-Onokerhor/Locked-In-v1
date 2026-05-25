import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { PhoneFrame } from './NScene2AppOpens';
import { AnimatedCursor } from './components/AnimatedCursor';

const PX = (1080 - 390) / 2;
const PY = (1920 - 844) / 2;

const SESSIONS = [
  { title: 'Intro to Agentic AI', host: 'Dr. Asiedu', date: 'Nov 12', spots: 8 },
  { title: 'React Performance Tuning', host: 'Solomon O.', date: 'Nov 14', spots: 12 },
  { title: 'Advanced RLS & Security', host: 'Kwame A.', date: 'Nov 18', spots: 6 },
];

// Cursor moves to Join Free Session button and clicks
const WAYPOINTS = [
  { frame: 0,  x: PX + 195, y: PY + 300 },
  { frame: 20, x: PX + 195, y: PY + 560 },  // move to button
  { frame: 38, x: PX + 195, y: PY + 560, click: true },
  { frame: 55, x: PX + 195, y: PY + 400 },
];

export const Scene6SkillSessions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  // Button click effect
  const btnClickFrame = 38;
  const isClicked = frame >= btnClickFrame && frame < btnClickFrame + 20;
  const btnScale = isClicked
    ? spring({ fps, frame: frame - btnClickFrame, config: { damping: 15, stiffness: 400 } })
    : 1;
  const btnScaleVal = interpolate(btnScale, [0, 1], [0.95, 1]);
  const glowOpacity = interpolate(frame - btnClickFrame, [0, 5, 15, 25], [0, 1, 0.6, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <PhoneFrame opacity={phoneOpacity}>
        <div style={{
          width: '100%', height: '100%', background: '#000',
          fontFamily: 'Inter, sans-serif',
          padding: '60px 16px 24px',
          display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'hidden',
        }}>
          {/* Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ background: 'rgba(230,60,10,0.2)', borderRadius: 12, padding: 10, fontSize: 20 }}>⚡</div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>Free AI Skill Sessions</div>
            </div>
            <div style={{ color: '#666', fontSize: 13 }}>Semester 2 sessions — open to all UMaT students</div>
          </div>

          {/* Session cards */}
          {SESSIONS.map((session, i) => {
            const cardOpacity = interpolate(frame - i * 8, [0, 12], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
            const cardY = interpolate(frame - i * 8, [0, 12], [20, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
            return (
              <div key={session.title} style={{
                opacity: cardOpacity, transform: `translateY(${cardY}px)`,
                background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 18, padding: '16px 14px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                {/* Date badge */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(230,60,10,0.15)', border: '1px solid rgba(230,60,10,0.4)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <div style={{ color: '#E63C0A', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nov</div>
                  <div style={{ color: '#E63C0A', fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{session.date.split(' ')[1]}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.3, marginBottom: 3 }}>{session.title}</div>
                  <div style={{ color: '#666', fontSize: 11 }}>by {session.host} · {session.spots} spots left</div>
                </div>
              </div>
            );
          })}

          {/* JOIN button with glow on click */}
          <div style={{ position: 'relative', marginTop: 8 }}>
            {glowOpacity > 0.05 && (
              <div style={{
                position: 'absolute', inset: -20, borderRadius: 28,
                background: `rgba(230,60,10,${glowOpacity * 0.4})`,
                filter: 'blur(20px)',
              }} />
            )}
            <div style={{
              position: 'relative',
              transform: `scale(${btnScaleVal})`,
              background: 'linear-gradient(135deg, #E63C0A, #ff6b35)',
              borderRadius: 18, padding: '18px',
              textAlign: 'center', color: '#fff', fontWeight: 900, fontSize: 17,
              boxShadow: `0 0 ${30 + glowOpacity * 40}px rgba(230,60,10,${0.3 + glowOpacity * 0.5})`,
              letterSpacing: '0.05em',
            }}>
              ⚡ JOIN FREE SESSION →
            </div>
          </div>
        </div>
      </PhoneFrame>

      <AnimatedCursor
        waypoints={WAYPOINTS}
        opacity={interpolate(frame, [5, 18], [0, 1], { extrapolateRight: 'clamp' })}
      />
    </AbsoluteFill>
  );
};
