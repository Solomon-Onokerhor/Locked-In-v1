import React from "react";
import { AbsoluteFill } from "remotion";
import { SplitText } from "./components/SplitText";

export const Scene1Hook: React.FC = () => {
  return (
    <AbsoluteFill className="flex items-center justify-center px-[60px] pt-[150px] pb-[170px]">
      <div className="text-center font-extrabold text-[72px] leading-[1.1] tracking-tight">
        <SplitText text="Finding study buddies shouldn't be hard." />
      </div>
    </AbsoluteFill>
  );
};
