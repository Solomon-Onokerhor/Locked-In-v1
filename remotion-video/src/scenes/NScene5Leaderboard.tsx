import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { PhoneFrame } from './NScene2AppOpens';
import { AnimatedCursor } from './components/AnimatedCursor';

const PX = (1080 - 390) / 2;
const PY = (1920 - 844) / 2;

const STUDENTS = [
  { name: 'Kwame Asante',  faculty: 'FOE',  score: 1820, streak: 14 },
  { name: 'Abena Mensah',  faculty: 'FBS',  score: 1640, streak: 11 },
  { name: 'Kofi Boateng',  faculty: 'FMHS', score: 1410, streak: 9  },
  { name: 'Ama Darko',     faculty: 'FOE',  score: 1290, streak: 7  },
  { name: 'Solomon Osei',  faculty: 'FBS',  score: 1100, streak: 6  },
];

const WAYPOINTS = [
  { frame: 0,  x: PX + 195, y: PY + 200 },
  { frame: 30, x: PX + 195, y: PY + 420 },  // scroll down
  { frame: 60, x: PX + 195, y: PY + 160, click: true }, // tap top entry
  { frame: 85, x: PX + 195, y: PY + 160 },
];

export const Scene5Leaderboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  // Scroll animation — translateY goes negative to simulate scrolling
  const scroll = interpolate(frame, [20, 60], [0, -80], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Highlight on top row at click
  const highlightOpacity = interpolate(frame, [60, 65, 85, 100], [0, 1, 1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <PhoneFrame opacity={phoneOpacity}>
        <div style={{
          width: '100%', height: '100%', background: '#000',
          fontFamily: 'Inter, sans-serif', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '60px 16px 16px', background: '#000' }}>
            <div style={{ color: '#fff', fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px' }}>
              Leaderboard 🏆
            </div>
            <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
              See who's putting in the most effort on campus
            </div>
            {/* Tab toggle */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '8px 0', background: '#fff', borderRadius: 8, color: '#000', fontWeight: 700, fontSize: 13 }}>This Week</div>
              <div style={{ flex: 1, textAlign: 'center', padding: '8px 0', color: '#666', fontWeight: 700, fontSize: 13 }}>All-Time</div>
            </div>
          </div>

          {/* Scrollable list */}
          <div style={{ transform: `translateY(${scroll}px)`, transition: 'transform 0.1s', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STUDENTS.map((s, i) => {
              const rowOpacity = interpolate(frame - i * 5, [0, 12], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
              const isTop = i === 0;
              const isPulse = isTop;

              // Animated score count-up
              const displayScore = Math.round(
                interpolate(frame - 10 - i * 3, [0, 30], [0, s.score], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' })
              );

              return (
                <div key={s.name} style={{
                  opacity: rowOpacity,
                  background: isTop ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                  border: isTop
                    ? `1px solid rgba(255,255,255,${0.2 + highlightOpacity * 0.5})`
                    : '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 16,
                  padding: isTop ? '16px' : '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: isTop && highlightOpacity > 0.1 ? `0 0 30px rgba(230,60,10,${highlightOpacity * 0.4})` : 'none',
                }}>
                  <div style={{ color: isTop ? '#fff' : '#666', fontWeight: 900, fontSize: isTop ? 20 : 16, width: 28, textAlign: 'center' }}>
                    #{i + 1}
                  </div>
                  <div style={{
                    width: isTop ? 44 : 36, height: isTop ? 44 : 36, borderRadius: '50%',
                    background: `hsl(${i * 45}, 55%, 50%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: isTop ? 18 : 14,
                    flexShrink: 0,
                  }}>
                    {s.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: isTop ? 16 : 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ color: '#555', fontSize: 11 }}>{s.faculty}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: isTop ? '#fff' : '#999', fontWeight: 900, fontSize: isTop ? 20 : 16 }}>
                      {displayScore.toLocaleString()}
                      <span style={{ fontSize: 11, color: '#666', fontWeight: 600 }}> m</span>
                    </div>
                    {s.streak > 0 && (
                      <div style={{ color: '#f97316', fontSize: 10, fontWeight: 700 }}>🔥 {s.streak}d</div>
                    )}
                  </div>
                </div>
              );
            })}
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
