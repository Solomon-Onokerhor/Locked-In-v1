import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const Scene6CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const urlOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  
  const slamSpring = spring({
    fps,
    frame: frame - 45,
    config: { damping: 14, mass: 2, stiffness: 100 },
  });

  const slamScale = interpolate(slamSpring, [0, 1], [3, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const slamOpacity = interpolate(frame - 45, [0, 5], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill className="flex items-center justify-center p-[60px]">
      <div 
        style={{ opacity: urlOpacity }}
        className="text-[40px] font-semibold text-gray-400 absolute"
      >
        lockedinumat.tech
      </div>
      
      {frame >= 45 && (
        <AbsoluteFill className="flex items-center justify-center">
          <div 
            style={{ 
              transform: `scale(${slamScale})`,
              opacity: slamOpacity
            }}
            className="text-[140px] font-black text-[#E1FF01] tracking-tighter"
          >
            LOCK IN.
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
