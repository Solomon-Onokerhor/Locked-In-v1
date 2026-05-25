import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const Scene5SocialProof: React.FC = () => {
  const frame = useCurrentFrame();

  const studentsCount = Math.floor(
    interpolate(frame, [15, 60], [0, 155], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })
  );
  
  const facultiesCount = Math.floor(
    interpolate(frame, [45, 75], [0, 6], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })
  );

  const containerOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center p-[60px]" style={{ opacity: containerOp }}>
      <div className="flex flex-col items-start gap-12 w-full max-w-[800px]">
        <div className="flex flex-col">
          <span className="text-[120px] font-black text-[#E1FF01] tabular-nums leading-none">
            {studentsCount}+
          </span>
          <span className="text-[48px] font-bold text-gray-400 -mt-2">ACTIVE STUDENTS.</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[120px] font-black text-white tabular-nums leading-none">
            {facultiesCount}
          </span>
          <span className="text-[48px] font-bold text-gray-400 -mt-2">FACULTIES.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
