import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const Scene2AppName: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    fps,
    frame: frame - 10,
    config: { damping: 200, mass: 0.5 },
  });

  const subtitleOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleMove = interpolate(frame, [30, 45], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center px-[60px]">
      <div 
        style={{ transform: `scale(${titleScale})` }}
        className="text-[120px] font-extrabold text-[#E1FF01] leading-none tracking-tight text-center"
      >
        LOCKED IN
      </div>
      <div 
        style={{ 
          opacity: subtitleOpacity, 
          transform: `translateY(${subtitleMove}px)`
        }}
        className="mt-6 text-[36px] font-semibold text-gray-400 text-center max-w-[800px]"
      >
        Your campus social accountability engine.
      </div>
    </AbsoluteFill>
  );
};
