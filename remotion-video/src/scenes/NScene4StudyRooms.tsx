import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { PhoneFrame } from './NScene2AppOpens';
import { AnimatedCursor } from './components/AnimatedCursor';

const PX = (1080 - 390) / 2;
const PY = (1920 - 844) / 2;

const ROOMS = [
  { title: 'DCIT 301 — Algorithms Deep Dive', type: 'Study', code: 'DCIT 301', members: 5, duration: '90m', img: 'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?q=80&w=600&auto=format&fit=crop' },
  { title: 'AI & Machine Learning Crash Course', type: 'Skill', code: null, members: 8, duration: '120m', img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=600&auto=format&fit=crop' },
  { title: 'Thermodynamics Revision', type: 'Study', code: 'ME 202', members: 3, duration: '60m', img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop' },
];

// Cursor: enters center, moves to first room card, clicks join
const WAYPOINTS = [
  { frame: 0,  x: PX + 195, y: PY + 300 },
  { frame: 20, x: PX + 195, y: PY + 200 },   // move to first card
  { frame: 40, x: PX + 195, y: PY + 200, click: true },  // click join
  { frame: 60, x: PX + 195, y: PY + 400 },   // drift down
];

const RoomCardMock: React.FC<{ room: typeof ROOMS[0]; delay: number }> = ({ room, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - delay, config: { damping: 200 } });
  const y = interpolate(s, [0, 1], [30, 0]);

  // Avatar indicators joining one-by-one
  const avatarCount = Math.min(
    room.members,
    Math.floor(interpolate(frame - delay - 20, [0, room.members * 8], [0, room.members], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }))
  );

  return (
    <div style={{
      opacity: s, transform: `translateY(${y}px)`,
      background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20, overflow: 'hidden', marginBottom: 12,
    }}>
      <div style={{ position: 'relative', height: 100, overflow: 'hidden' }}>
        <img src={room.img} alt={room.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d0d0d, transparent)' }} />
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#ccc', textTransform: 'uppercase' }}>
            {room.type}
          </span>
          {room.code && <span style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#fff' }}>{room.code}</span>}
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 6, lineHeight: 1.3 }}>{room.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Animated member avatars */}
          <div style={{ display: 'flex', gap: -4 }}>
            {Array.from({ length: avatarCount }).map((_, i) => (
              <div key={i} style={{
                width: 24, height: 24, borderRadius: '50%', border: '2px solid #0d0d0d',
                background: `hsl(${i * 40}, 60%, 50%)`,
                marginLeft: i === 0 ? 0 : -8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff',
              }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span style={{ color: '#666', fontSize: 11 }}>{room.duration}</span>
        </div>
      </div>
    </div>
  );
};

export const Scene4StudyRooms: React.FC = () => {
  const frame = useCurrentFrame();
  const phoneOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <PhoneFrame opacity={phoneOpacity}>
        <div style={{
          width: '100%', height: '100%', background: '#000',
          padding: '60px 16px 20px', fontFamily: 'Inter, sans-serif', overflowY: 'hidden',
        }}>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Live Study Rooms</div>
          <div style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>Join a session — your peers are locking in.</div>
          {ROOMS.map((r, i) => <RoomCardMock key={r.title} room={r} delay={i * 10} />)}
        </div>
      </PhoneFrame>

      <AnimatedCursor waypoints={WAYPOINTS} opacity={interpolate(frame, [5, 20], [0, 1], { extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};
