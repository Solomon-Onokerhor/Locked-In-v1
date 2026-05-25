import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

// Ambient particles drifting upward
const Particle: React.FC<{ x: number; speed: number; size: number; delay: number }> = ({ x, speed, size, delay }) => {
  const frame = useCurrentFrame();
  const localframe = frame - delay;
  if (localframe < 0) return null;
  const y = interpolate(localframe, [0, 120 / speed], [1960, -60], { extrapolateRight: 'wrap' });
  const opacity = interpolate(Math.sin(localframe / 20), [-1, 1], [0.05, 0.18]);
  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width: size, height: size,
      borderRadius: '50%',
      background: '#E63C0A',
      opacity,
    }} />
  );
};

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 67) % 1080,
  speed: 0.4 + (i % 5) * 0.15,
  size: 4 + (i % 4) * 3,
  delay: (i * 7) % 30,
}));

export const Scene7CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // URL types letter-by-letter
  const url = 'lockedinumat.tech';
  const urlLetters = Math.floor(
    interpolate(frame, [5, 40], [0, url.length], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' })
  );
  const urlOpacity = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: 'clamp' });

  // "LOCK IN." slams in at frame 45
  const slamSpring = spring({ fps, frame: frame - 45, config: { damping: 12, stiffness: 200, mass: 1.4 } });
  const slamScale = interpolate(slamSpring, [0, 1], [1.6, 1]);
  const slamOpacity = interpolate(frame, [45, 52], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Subtitle fade
  const subtitleOpacity = interpolate(frame, [70, 85], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Particles */}
      {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      {/* Background pulse */}
      <div style={{
        position: 'absolute', width: 800, height: 800, borderRadius: '50%', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        background: `radial-gradient(circle, rgba(230,60,10,${0.06 + Math.sin(frame / 20) * 0.03}) 0%, transparent 70%)`,
        filter: 'blur(80px)',
      }} />

      {/* URL */}
      <div style={{
        opacity: urlOpacity,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: 36,
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: '0.05em',
        marginBottom: 32,
      }}>
        {url.slice(0, urlLetters)}
        <span style={{ opacity: frame % 20 < 10 ? 1 : 0, color: '#E63C0A' }}>|</span>
      </div>

      {/* LOCK IN. */}
      <div style={{
        opacity: slamOpacity,
        transform: `scale(${slamScale})`,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 800,
        fontSize: 128,
        letterSpacing: '-4px',
        lineHeight: 0.95,
        color: '#ffffff',
        textAlign: 'center',
        textShadow: '0 0 80px rgba(230,60,10,0.6)',
      }}>
        LOCK IN<span style={{ color: '#E63C0A' }}>.</span>
      </div>

      {/* Tagline */}
      <div style={{
        opacity: subtitleOpacity,
        marginTop: 28,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: 24,
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
      }}>
        Free. Built for UMaT.
      </div>
    </AbsoluteFill>
  );
};
