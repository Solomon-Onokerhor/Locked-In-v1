import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

const words = ['You.', 'Study.', 'Alone?'];

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{ background: '#000000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}
    >
      {/* Ambient orange orb */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(230,60,10,0.12) 0%, transparent 70%)',
        filter: 'blur(60px)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      }} />

      {words.map((word, i) => {
        const delay = i * 8;
        const s = spring({ fps, frame: frame - delay, config: { damping: 200, mass: 1 } });
        const y = interpolate(s, [0, 1], [50, 0]);
        const alpha = interpolate(s, [0, 1], [0, 1]);
        const isAlone = word === 'Alone?';
        return (
          <div
            key={word}
            style={{
              opacity: alpha,
              transform: `translateY(${y}px)`,
              fontSize: 120,
              fontWeight: 800,
              letterSpacing: '-3px',
              lineHeight: 1,
              fontFamily: 'Inter, sans-serif',
              color: isAlone ? '#E63C0A' : '#ffffff',
              textAlign: 'center',
              textShadow: isAlone ? '0 0 80px rgba(230,60,10,0.5)' : 'none',
            }}
          >
            {word}
          </div>
        );
      })}

      {/* Tagline fades in at frame 40 */}
      <div style={{
        opacity: interpolate(frame, [44, 60], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }),
        fontSize: 32,
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginTop: 16,
      }}>
        There's a better way to lock in.
      </div>
    </AbsoluteFill>
  );
};
