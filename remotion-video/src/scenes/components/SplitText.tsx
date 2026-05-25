import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const SplitText: React.FC<{
  text: string;
  delay?: number;
  className?: string;
}> = ({ text, delay = 0, className = "" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(" ");

  return (
    <div className={`flex flex-wrap justify-center gap-x-4 ${className}`}>
      {words.map((word, i) => {
        const wordDelay = delay + i * 3; // stagger words 3 frames apart
        const scale = spring({
          fps,
          frame: frame - wordDelay,
          config: { damping: 200 },
        });

        const opacity = interpolate(
          frame - wordDelay,
          [0, 5],
          [0, 1],
          { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
        );

        return (
          <span
            key={i}
            style={{
              opacity,
              transform: `scale(${scale})`,
              display: "inline-block",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
