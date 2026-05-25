import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export interface Waypoint {
  frame: number;
  x: number;
  y: number;
  click?: boolean;
}

interface AnimatedCursorProps {
  waypoints: Waypoint[];
  startFrame?: number;
  opacity?: number;
}

export const AnimatedCursor: React.FC<AnimatedCursorProps> = ({
  waypoints,
  startFrame = 0,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  // find the two surrounding waypoints
  let fromWP = waypoints[0];
  let toWP = waypoints[0];

  for (let i = 0; i < waypoints.length - 1; i++) {
    if (localFrame >= waypoints[i].frame && localFrame <= waypoints[i + 1].frame) {
      fromWP = waypoints[i];
      toWP = waypoints[i + 1];
      break;
    }
    if (localFrame > waypoints[waypoints.length - 1].frame) {
      fromWP = waypoints[waypoints.length - 1];
      toWP = waypoints[waypoints.length - 1];
    }
  }

  const segmentDuration = Math.max(1, toWP.frame - fromWP.frame);
  const segmentFrame = Math.max(0, localFrame - fromWP.frame);

  const progress = spring({
    fps,
    frame: segmentFrame,
    config: { damping: 20, stiffness: 80, mass: 1 },
    durationInFrames: segmentDuration,
  });

  const x = interpolate(progress, [0, 1], [fromWP.x, toWP.x]);
  const y = interpolate(progress, [0, 1], [fromWP.y, toWP.y]);

  // outer ring lags by 6 frames
  const laggedProgress = spring({
    fps,
    frame: Math.max(0, segmentFrame - 6),
    config: { damping: 20, stiffness: 80, mass: 1 },
    durationInFrames: segmentDuration,
  });
  const outerX = interpolate(laggedProgress, [0, 1], [fromWP.x, toWP.x]);
  const outerY = interpolate(laggedProgress, [0, 1], [fromWP.y, toWP.y]);

  // click animation — detect if any active waypoint is a click
  const isClicking = waypoints.some(
    (wp) => wp.click && Math.abs(localFrame - wp.frame) < 8
  );

  const clickScale = isClicking
    ? spring({ fps, frame: localFrame % 8, config: { damping: 15, stiffness: 300 } })
    : 1;

  const innerScale = isClicking
    ? interpolate(clickScale, [0, 1], [0.6, 1])
    : 1;

  const outerOpacity = isClicking ? 0.3 : 0.6;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity, zIndex: 9999 }}>
      {/* Outer ring */}
      <div
        style={{
          position: 'absolute',
          left: outerX - 14,
          top: outerY - 14,
          width: 28,
          height: 28,
          border: '2px solid #E63C0A',
          borderRadius: '50%',
          opacity: outerOpacity,
          transition: 'opacity 0.1s',
        }}
      />
      {/* Inner dot */}
      <div
        style={{
          position: 'absolute',
          left: x - 6,
          top: y - 6,
          width: 12,
          height: 12,
          background: '#E63C0A',
          borderRadius: '50%',
          transform: `scale(${innerScale})`,
          boxShadow: '0 0 12px rgba(230,60,10,0.8)',
        }}
      />
    </div>
  );
};
