import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import type { TransitionPresentation } from '@remotion/transitions';

import { Scene1Hook }          from './scenes/NScene1Hook';
import { Scene2AppOpens }      from './scenes/NScene2AppOpens';
import { Scene3Timer }         from './scenes/NScene3Timer';
import { Scene4StudyRooms }    from './scenes/NScene4StudyRooms';
import { Scene5Leaderboard }   from './scenes/NScene5Leaderboard';
import { Scene6SkillSessions } from './scenes/NScene6SkillSessions';
import { Scene7CTA }           from './scenes/NScene7CTA';

// Hand-rolled fade — the exported 'fade' from @remotion/transitions doesn't exist in this version
const fadePres = (): TransitionPresentation<Record<string, never>> => ({
  component: ({ children, presentationDirection, presentationProgress }) => {
    const opacity =
      presentationDirection === 'entering' ? presentationProgress : 1 - presentationProgress;
    return (
      <div style={{ opacity, width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
        {children}
      </div>
    );
  },
  props: {},
});

// 35 seconds @ 30fps = 1050 frames
// Scene durations:  120 + 90 + 180 + 180 + 150 + 120 + 120 = 960
// + 6×18f overlaps = 108  →  total 1050f ✓
const T = 18; // cross-fade overlap frames

export const LockedInProductVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#000000', fontFamily: 'Inter, sans-serif' }}>
      <TransitionSeries>

        <TransitionSeries.Sequence durationInFrames={120 + T}>
          <Scene1Hook />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fadePres()}
          timing={linearTiming({ durationInFrames: T })}
        />

        <TransitionSeries.Sequence durationInFrames={90 + T}>
          <Scene2AppOpens />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fadePres()}
          timing={linearTiming({ durationInFrames: T })}
        />

        <TransitionSeries.Sequence durationInFrames={180 + T}>
          <Scene3Timer />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fadePres()}
          timing={linearTiming({ durationInFrames: T })}
        />

        <TransitionSeries.Sequence durationInFrames={180 + T}>
          <Scene4StudyRooms />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fadePres()}
          timing={linearTiming({ durationInFrames: T })}
        />

        <TransitionSeries.Sequence durationInFrames={150 + T}>
          <Scene5Leaderboard />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fadePres()}
          timing={linearTiming({ durationInFrames: T })}
        />

        <TransitionSeries.Sequence durationInFrames={120 + T}>
          <Scene6SkillSessions />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fadePres()}
          timing={linearTiming({ durationInFrames: T })}
        />

        <TransitionSeries.Sequence durationInFrames={120}>
          <Scene7CTA />
        </TransitionSeries.Sequence>

      </TransitionSeries>
    </AbsoluteFill>
  );
};
