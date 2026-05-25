import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const DynamicBackground: React.FC = () => {
  const frame = useCurrentFrame();

  const orbX = interpolate(frame, [0, 900], [0, 500]);
  const orbY = interpolate(frame, [0, 900], [0, 300]);

  return (
    <AbsoluteFill className="bg-[#050505] overflow-hidden">
      {/* Background Grid */}
      <AbsoluteFill 
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center'
        }}
      />
      {/* Glowing Neon Orb */}
      <div 
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          left: -200 + orbX,
          top: 400 + orbY,
          background: "radial-gradient(circle, rgba(225, 255, 1, 0.08) 0%, rgba(0, 0, 0, 0) 70%)",
          filter: "blur(40px)",
          borderRadius: "50%",
        }} 
      />
    </AbsoluteFill>
  );
};
