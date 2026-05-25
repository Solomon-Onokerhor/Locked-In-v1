import { Composition } from 'remotion';
import { LockedInProductVideo } from './LockedInProductVideo';
import './index.css';

// 35s @ 30fps = 1050 frames
// 7 scenes with 6 × 18-frame cross-fades
const DURATION = 1050;
const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LockedInProductVideo"
        component={LockedInProductVideo}
        durationInFrames={DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
