import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const TimerMock: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerSpring = spring({ fps, frame, config: { damping: 200 } });
  
  const circleProgress = spring({
    fps,
    frame: frame - 15,
    config: { damping: 200, mass: 2 },
  });

  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - circleProgress * circumference;

  return (
    <div style={{ transform: `scale(${containerSpring}) perspective(1000px) rotateX(10deg)` }} className="flex flex-col items-center">
      <h2 className="text-[48px] font-bold text-white mb-12 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">Solo Accountability</h2>
      <div className="relative w-[360px] h-[360px] flex items-center justify-center">
        {/* Glow effect under timer */}
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[#E1FF01]/10 blur-[50px] z-0" />
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="180" cy="180" r="140" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
          <circle 
            cx="180" cy="180" r="140" 
            stroke="#E1FF01" strokeWidth="12" fill="transparent"
            strokeLinecap="round"
            style={{ strokeDasharray: circumference, strokeDashoffset }}
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-[72px] font-black text-white tabular-nums tracking-tighter">25:00</span>
          <p className="text-[20px] text-gray-500 font-bold uppercase tracking-widest mt-2">Locked In</p>
        </div>
      </div>
      <button className="mt-12 bg-[#E1FF01] text-black px-12 py-5 rounded-full font-bold text-[28px] opacity-90">
        End Session
      </button>
    </div>
  );
};

const DashboardMock: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  
  const containerSpring = spring({ fps, frame, config: { damping: 200 } });

  const cards = [
    { type: 'Study', title: 'Calculus CP151 Prep', hours: '60 mins', count: 4 },
    { type: 'Skill', title: 'React Performance Tuning', hours: '120 mins', count: 8 },
  ];

  return (
    <div style={{ transform: `translateY(${interpolate(containerSpring, [0, 1], [200, 0])}px) perspective(1000px) rotateX(5deg)` }} className="w-full max-w-[800px] flex flex-col gap-8">
      <h2 className="text-[48px] font-bold text-white mb-4 drop-shadow-xl">Live Study Rooms</h2>
      {cards.map((card, i) => {
        const cardOpacity = interpolate(frame - 10 - i * 8, [0, 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
        const cardSlide = interpolate(frame - 10 - i * 8, [0, 10], [40, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
        return (
          <div key={i} style={{ opacity: cardOpacity, transform: `translateY(${cardSlide}px)` }} className="p-8 bg-white/[0.03] border border-white/[0.08] rounded-[32px] shadow-2xl backdrop-blur-xl hover:bg-white/[0.05] transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="px-4 py-1.5 bg-white/10 rounded-full text-[20px] font-bold text-gray-300">{card.type} Room</span>
              <span className="text-gray-500 font-bold text-[20px]">{card.count} members</span>
            </div>
            <h3 className="text-[40px] font-bold text-white">{card.title}</h3>
            <p className="text-gray-500 text-[24px] mt-2">Duration: {card.hours}</p>
          </div>
        );
      })}
    </div>
  );
};

const LeaderboardMock: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const containerSpring = spring({ fps, frame, config: { damping: 200 } });

  const users = [
    { rank: 1, name: 'Alice M.', hours: '142 hrs' },
    { rank: 2, name: 'Solomon O.', hours: '138 hrs' },
    { rank: 3, name: 'Kwame A.', hours: '94 hrs' },
  ];

  return (
    <div style={{ transform: `scale(${containerSpring}) perspective(1000px) rotateX(10deg)` }} className="w-full max-w-[800px] flex flex-col items-center">
      <h2 className="text-[48px] font-bold text-white mb-12 drop-shadow-xl">Leaderboard</h2>
      <div className="w-full bg-white/[0.02] border border-white/[0.08] shadow-2xl backdrop-blur-2xl rounded-[32px] overflow-hidden">
        {users.map((user, i) => {
          const rowOpacity = interpolate(frame - 10 - i * 5, [0, 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          return (
            <div key={i} style={{ opacity: rowOpacity }} className="p-6 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="text-[32px] font-black text-gray-400 w-12 text-center">#{user.rank}</span>
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-[24px] font-bold">{user.name[0]}</div>
                <span className="text-[32px] font-bold text-white">{user.name}</span>
              </div>
              <span className="text-[32px] font-black text-[#E1FF01]">{user.hours}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Scene3Features: React.FC = () => {
  return (
    <AbsoluteFill className="flex items-center justify-center p-[60px]">
      <Sequence from={0} durationInFrames={100}>
        <AbsoluteFill className="items-center justify-center"><TimerMock /></AbsoluteFill>
      </Sequence>
      <Sequence from={100} durationInFrames={100}>
        <AbsoluteFill className="items-center justify-center"><DashboardMock /></AbsoluteFill>
      </Sequence>
      <Sequence from={200} durationInFrames={112}>
        <AbsoluteFill className="items-center justify-center"><LeaderboardMock /></AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
