import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const CalendarCard: React.FC<{ day: number; topic: string; frameDelay: number }> = ({ day, topic, frameDelay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    fps,
    frame: frame - frameDelay,
    config: { damping: 200, mass: 2 },
  });

  const float = Math.sin((frame - frameDelay) / 30) * 10;
  
  return (
    <div 
      style={{
        transform: `scale(${entrance}) translateY(${float}px)`,
        opacity: interpolate(entrance, [0, 1], [0, 1]),
      }}
      className="p-6 bg-white/[0.04] border border-white/10 rounded-3xl w-80 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex gap-4 items-center">
        <div className="w-16 h-16 rounded-2xl bg-[#E1FF01]/20 border border-[#E1FF01] flex flex-col items-center justify-center">
          <span className="text-[#E1FF01] text-[12px] font-bold uppercase tracking-widest leading-none mb-1">Nov</span>
          <span className="text-[#E1FF01] text-[28px] font-black leading-none">{day}</span>
        </div>
        <div>
          <p className="text-gray-400 text-[14px] font-bold uppercase tracking-wider">Upcoming Session</p>
          <p className="text-white text-[22px] font-bold leading-tight">{topic}</p>
        </div>
      </div>
    </div>
  );
};

export const Scene4SkillSessions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    fps,
    frame: frame - 15,
    config: { damping: 200, mass: 1.5 },
  });

  const subtitleOpacity = interpolate(
    frame,
    [30, 45],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center p-[60px]">
      
      {/* Background Calendar Cards Animating */}
      <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 flex justify-center gap-12 opacity-40 blur-[2px]">
        <CalendarCard day={12} topic="Intro to Agentic AI" frameDelay={5} />
        <CalendarCard day={14} topic="React Perf Tuning" frameDelay={15} />
        <CalendarCard day={18} topic="Advanced RLS Auth" frameDelay={25} />
      </div>

      <div className="relative z-10 flex flex-col items-center backdrop-blur-md bg-black/40 py-12 px-24 rounded-full border border-white/5">
        <div 
          style={{ transform: `translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`, opacity: titleSpring }}
          className="text-[96px] font-extrabold text-[#E1FF01] text-center leading-[1] tracking-tight drop-shadow-2xl"
        >
          FREE AI SKILL SESSIONS
        </div>
        <div 
          style={{ opacity: subtitleOpacity }}
          className="mt-8 text-[64px] font-bold text-white text-center tracking-[0.2em]"
        >
          SEMESTER 2
        </div>
      </div>
    </AbsoluteFill>
  );
};
