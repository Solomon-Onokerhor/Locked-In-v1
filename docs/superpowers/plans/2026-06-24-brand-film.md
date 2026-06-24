# Brand Film Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `BrandFilm`, a new ~46.8s horizontal (1920×1080) Remotion composition for the
`remotion-video` project — an Apple-style product film themed "Learn anything. From
anyone." — without modifying the existing `LockedInProductVideo` composition.

**Architecture:** Six scene components (`scenes/brand/Scene1ColdOpen.tsx` ...
`Scene6CTA.tsx`) are orchestrated by `@remotion/transitions`' `TransitionSeries` inside
`BrandFilm.tsx`, using a custom depth-based transition (scale+blur, not flat opacity) and
a global grain/vignette overlay. A shared `constants.ts` is the single source of truth
for canvas size, frame rate, per-scene durations, and the color palette, imported by
every scene and by `BrandFilm.tsx`/`Root.tsx` so duration numbers never drift out of
sync between files. Music and SFX are generated via the Higgsfield MCP audio tool and
wired in last via Remotion's `<Audio>`.

**Tech Stack:** Remotion 4.0.466, `@remotion/transitions`, React 19, TypeScript — all
already installed in `remotion-video/`. No new npm dependencies are introduced.

## Global Constraints

- Canvas: 1920×1080, 30fps (per spec §3).
- Total timeline: 1404 frames (46.8s) — `SCENE_DURATIONS.coldOpen` (168) + `.reveal`
  (168) + `.skillRoomHero` (450) + `.proofMontage` (282) + `.payoff` (168) + `.cta` (168)
  (per spec §4, corrected).
- Cross-scene transitions: 18 frames each, depth-based (scale+blur), not flat opacity
  (per spec §5).
- Do not modify `LockedInProductVideo.tsx`, any `NScene*.tsx` file, or remove the
  existing `LockedInProductVideo` entry in `Root.tsx` (per spec §7).
- No new npm dependencies — use only `remotion`, `@remotion/transitions`, `react`
  already in `remotion-video/package.json`.
- Brand palette must match the existing app's accent colors already used in
  `NScene*.tsx`/`Scene2AppOpens.tsx`: accent `#E63C0A`, blue gradient
  `linear-gradient(135deg,#2563eb,#4f46e5)`, background `#000000`/`#0d0d0d`, muted text
  `#888888` — for visual consistency with the rest of the brand's video output.
- Verification method for this project: there is no test runner in `remotion-video/`
  (confirmed: no `*.test.*`/`*.spec.*` files, no test script in `package.json`). Visual
  correctness is the actual acceptance criterion here, so each task's "test" is: render
  a still PNG at a specified frame via `npx remotion still`, then view it with the Read
  tool (which supports image files) to confirm it matches the described visual. This
  replaces unit tests for this plan only — it is not a general pattern to apply outside
  visual/creative work.

---

## Task 1: Composition skeleton — constants, placeholders, registration

**Files:**
- Create: `remotion-video/src/scenes/brand/constants.ts`
- Create: `remotion-video/src/BrandFilm.tsx`
- Modify: `remotion-video/src/Root.tsx`

**Interfaces:**
- Produces: `WIDTH`, `HEIGHT`, `FPS`, `TRANSITION_FRAMES`, `SCENE_DURATIONS` (object with
  keys `coldOpen`, `reveal`, `skillRoomHero`, `proofMontage`, `payoff`, `cta`, all
  `number`), `TOTAL_DURATION` (number), `COLORS` (object with keys `bg`, `card`,
  `cardAlt`, `border`, `accent`, `blueGradient`, `amber`, `textMuted`, all `string`) —
  exported from `constants.ts`. All later tasks import from this file; no other file may
  redefine these values.
- Produces: `BrandFilm` (`React.FC`, no props) — exported from `BrandFilm.tsx`. Task 1
  wires it with six solid-color placeholder `<div>`s standing in for the real scenes;
  later tasks replace one placeholder at a time.

- [ ] **Step 1: Create `remotion-video/src/scenes/brand/constants.ts`**

```ts
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const TRANSITION_FRAMES = 18;

export const SCENE_DURATIONS = {
  coldOpen: 168,
  reveal: 168,
  skillRoomHero: 450,
  proofMontage: 282,
  payoff: 168,
  cta: 168,
} as const;

export const TOTAL_DURATION =
  SCENE_DURATIONS.coldOpen +
  SCENE_DURATIONS.reveal +
  SCENE_DURATIONS.skillRoomHero +
  SCENE_DURATIONS.proofMontage +
  SCENE_DURATIONS.payoff +
  SCENE_DURATIONS.cta; // 1404

export const COLORS = {
  bg: '#000000',
  card: '#0d0d0d',
  cardAlt: '#0a0a0a',
  border: 'rgba(255,255,255,0.08)',
  accent: '#E63C0A',
  blueGradient: 'linear-gradient(135deg,#2563eb,#4f46e5)',
  amber: '#fbbf24',
  textMuted: '#888888',
};
```

- [ ] **Step 2: Create `remotion-video/src/BrandFilm.tsx` with placeholder scenes**

```tsx
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { SCENE_DURATIONS, TRANSITION_FRAMES } from './scenes/brand/constants';

const T = TRANSITION_FRAMES;

const Placeholder: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <AbsoluteFill style={{ background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: '#fff', fontSize: 48, fontFamily: 'Inter, sans-serif', fontWeight: 800 }}>{label}</div>
  </AbsoluteFill>
);

export const BrandFilm: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#000000', fontFamily: 'Inter, sans-serif' }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.coldOpen + T}>
          <Placeholder color="#7f1d1d" label="1: Cold Open" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.reveal + T}>
          <Placeholder color="#78350f" label="2: Reveal" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.skillRoomHero + T}>
          <Placeholder color="#1e3a8a" label="3: Skill Room Hero" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.proofMontage + T}>
          <Placeholder color="#14532d" label="4: Proof Montage" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.payoff + T}>
          <Placeholder color="#581c87" label="5: Payoff" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.cta}>
          <Placeholder color="#831843" label="6: CTA" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
```

Note: `fade()` from `@remotion/transitions/fade` is a placeholder transition for this
skeleton task only — Task 3 replaces every `fade()` with the custom `depthPresentation()`.
(The existing `LockedInProductVideo.tsx` hand-rolls its own fade because `fade` didn't
exist in its installed version; verify it's available in the current install before
using it — see Step 3.)

- [ ] **Step 3: Verify `fade` import exists in the installed `@remotion/transitions` version**

Run: `cd "remotion-video" && node -e "console.log(Object.keys(require('@remotion/transitions/fade')))"`
Expected: prints an array including `fade`.

If this fails (no `fade` export), replace `fade()` in Step 2 with the same hand-rolled
presentation already used in `LockedInProductVideo.tsx:15-26`:

```tsx
const fade = (): TransitionPresentation<Record<string, never>> => ({
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
```
(add `import type { TransitionPresentation } from '@remotion/transitions';` and call
`fade()` the same way).

- [ ] **Step 4: Register `BrandFilm` in `remotion-video/src/Root.tsx`**

Modify the file from:

```tsx
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
```

to:

```tsx
import { Composition } from 'remotion';
import { LockedInProductVideo } from './LockedInProductVideo';
import { BrandFilm } from './BrandFilm';
import {
  WIDTH as BRAND_WIDTH,
  HEIGHT as BRAND_HEIGHT,
  FPS as BRAND_FPS,
  TOTAL_DURATION as BRAND_DURATION,
} from './scenes/brand/constants';
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
      <Composition
        id="BrandFilm"
        component={BrandFilm}
        durationInFrames={BRAND_DURATION}
        fps={BRAND_FPS}
        width={BRAND_WIDTH}
        height={BRAND_HEIGHT}
      />
    </>
  );
};
```

- [ ] **Step 5: Render verification stills**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/t1-frame0.png --frame=0
npx remotion still BrandFilm out/test-stills/t1-frame1400.png --frame=1400
```
Expected: both commands succeed with no errors. Then use the Read tool on both PNGs:
`out/test-stills/t1-frame0.png` should show dark-red "1: Cold Open"; `t1-frame1400.png`
should show pink/magenta "6: CTA". This confirms the composition is registered, all six
placeholders render, and the total duration (1404f) is correct (frame 1400 is near the
end and still shows scene 6, not a blank/error frame).

- [ ] **Step 6: Commit**

```bash
git add remotion-video/src/scenes/brand/constants.ts remotion-video/src/BrandFilm.tsx remotion-video/src/Root.tsx
git commit -m "feat(brand-film): add BrandFilm composition skeleton with placeholders"
```

---

## Task 2: Depth transition + grain overlay

**Files:**
- Create: `remotion-video/src/scenes/brand/components/DepthTransition.tsx`
- Create: `remotion-video/src/scenes/brand/components/GrainOverlay.tsx`
- Modify: `remotion-video/src/BrandFilm.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure visual primitives).
- Produces: `depthPresentation` (function, no args, returns
  `TransitionPresentation<Record<string, never>>`) from `DepthTransition.tsx`;
  `GrainOverlay` (`React.FC`, no props) from `GrainOverlay.tsx`. Used by `BrandFilm.tsx`
  from this task onward, and available to any later scene if needed.

- [ ] **Step 1: Create `remotion-video/src/scenes/brand/components/DepthTransition.tsx`**

```tsx
import type { TransitionPresentation } from '@remotion/transitions';

export const depthPresentation = (): TransitionPresentation<Record<string, never>> => ({
  component: ({ children, presentationDirection, presentationProgress }) => {
    const p = presentationProgress;
    const isEntering = presentationDirection === 'entering';
    const scale = isEntering ? 1.05 - 0.05 * p : 1 - 0.05 * p;
    const blur = isEntering ? 8 * (1 - p) : 8 * p;
    const opacity = isEntering ? p : 1 - p;

    return (
      <div
        style={{
          opacity,
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale})`,
          filter: `blur(${blur}px)`,
        }}
      >
        {children}
      </div>
    );
  },
  props: {},
});
```

- [ ] **Step 2: Create `remotion-video/src/scenes/brand/components/GrainOverlay.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill } from 'remotion';

// Procedural grain via SVG feTurbulence — no binary asset to manage.
export const GrainOverlay: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05, mixBlendMode: 'overlay' }}>
      <filter id="brand-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} stitchTiles="stitch" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#brand-grain)" />
    </svg>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />
  </AbsoluteFill>
);
```

- [ ] **Step 3: Wire both into `BrandFilm.tsx`**

In `remotion-video/src/BrandFilm.tsx`, replace the `fade`/hand-rolled-fade import and
every `presentation={fade()}` with the new depth transition, and add `<GrainOverlay />`
as the last child inside the outer `AbsoluteFill`:

```tsx
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { SCENE_DURATIONS, TRANSITION_FRAMES } from './scenes/brand/constants';
import { depthPresentation } from './scenes/brand/components/DepthTransition';
import { GrainOverlay } from './scenes/brand/components/GrainOverlay';

const T = TRANSITION_FRAMES;

const Placeholder: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <AbsoluteFill style={{ background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: '#fff', fontSize: 48, fontFamily: 'Inter, sans-serif', fontWeight: 800 }}>{label}</div>
  </AbsoluteFill>
);

export const BrandFilm: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#000000', fontFamily: 'Inter, sans-serif' }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.coldOpen + T}>
          <Placeholder color="#7f1d1d" label="1: Cold Open" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={depthPresentation()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.reveal + T}>
          <Placeholder color="#78350f" label="2: Reveal" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={depthPresentation()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.skillRoomHero + T}>
          <Placeholder color="#1e3a8a" label="3: Skill Room Hero" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={depthPresentation()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.proofMontage + T}>
          <Placeholder color="#14532d" label="4: Proof Montage" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={depthPresentation()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.payoff + T}>
          <Placeholder color="#581c87" label="5: Payoff" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={depthPresentation()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.cta}>
          <Placeholder color="#831843" label="6: CTA" />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <GrainOverlay />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: Render verification stills**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/t2-transition.png --frame=177
npx remotion still BrandFilm out/test-stills/t2-grain.png --frame=700
```
Expected: `t2-transition.png` (frame 177, mid cross-fade between scenes 1 and 2) shows a
visibly blurred, scaled blend of the dark-red and dark-amber placeholders — not a flat
crossfade. `t2-grain.png` (frame 700, inside scene 3's placeholder) shows the blue
placeholder with a faint grain texture and darkened vignette toward the edges. View both
with the Read tool to confirm.

- [ ] **Step 5: Commit**

```bash
git add remotion-video/src/scenes/brand/components/DepthTransition.tsx remotion-video/src/scenes/brand/components/GrainOverlay.tsx remotion-video/src/BrandFilm.tsx
git commit -m "feat(brand-film): add depth transition and grain overlay"
```

---

## Task 3: Scene 1 — Cold Open

**Files:**
- Create: `remotion-video/src/scenes/brand/Scene1ColdOpen.tsx`
- Modify: `remotion-video/src/BrandFilm.tsx`

**Interfaces:**
- Consumes: `SCENE_DURATIONS.coldOpen` from `./scenes/brand/constants`; reuses the
  existing `DynamicBackground` component from `../components/DynamicBackground.tsx`
  (exported as `DynamicBackground`, `React.FC`, no props — confirmed present and
  canvas-size-agnostic).
- Produces: `Scene1ColdOpen` (`React.FC`, no props), used by `BrandFilm.tsx` in place of
  the scene-1 placeholder.

- [ ] **Step 1: Create `remotion-video/src/scenes/brand/Scene1ColdOpen.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { DynamicBackground } from '../components/DynamicBackground';
import { SCENE_DURATIONS } from './constants';

const PHRASE_A = 'Everyone knows something.';
const PHRASE_B = 'Everyone wants to learn something.';

const PhraseText: React.FC<{ text: string; fadeInStart: number; fadeOutStart?: number }> = ({
  text,
  fadeInStart,
  fadeOutStart,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [fadeInStart, fadeInStart + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut =
    fadeOutStart !== undefined
      ? interpolate(frame, [fadeOutStart, fadeOutStart + 15], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;
  const opacity = Math.min(fadeIn, fadeOut);
  const scale = interpolate(frame, [fadeInStart, fadeInStart + 20], [0.96, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 800,
          fontSize: 56,
          letterSpacing: '-0.02em',
          textAlign: 'center',
          maxWidth: 900,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Scene1ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const bgScale = interpolate(frame, [0, SCENE_DURATIONS.coldOpen], [1, 1.06]);
  const bgBlur = interpolate(frame, [0, 30], [0, 6], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#000000' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${bgScale})`, filter: `blur(${bgBlur}px)` }}>
        <DynamicBackground />
      </div>
      <PhraseText text={PHRASE_A} fadeInStart={10} fadeOutStart={65} />
      <PhraseText text={PHRASE_B} fadeInStart={85} />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Replace the scene-1 placeholder in `BrandFilm.tsx`**

Add `import { Scene1ColdOpen } from './scenes/brand/Scene1ColdOpen';` to the imports, and
replace:

```tsx
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.coldOpen + T}>
          <Placeholder color="#7f1d1d" label="1: Cold Open" />
        </TransitionSeries.Sequence>
```

with:

```tsx
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.coldOpen + T}>
          <Scene1ColdOpen />
        </TransitionSeries.Sequence>
```

- [ ] **Step 3: Render verification stills**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/t3-phraseA.png --frame=20
npx remotion still BrandFilm out/test-stills/t3-phraseB.png --frame=140
```
Expected: `t3-phraseA.png` shows "Everyone knows something." centered over a dark,
blurred glowing background. `t3-phraseB.png` shows "Everyone wants to learn something."
(phrase A fully faded out). View both with the Read tool to confirm the text and
background render correctly and phrase A is gone by frame 140.

- [ ] **Step 4: Commit**

```bash
git add remotion-video/src/scenes/brand/Scene1ColdOpen.tsx remotion-video/src/BrandFilm.tsx
git commit -m "feat(brand-film): add Scene1ColdOpen"
```

---

## Task 4: Scene 2 — Reveal

**Files:**
- Create: `remotion-video/src/scenes/brand/Scene2Reveal.tsx`
- Modify: `remotion-video/src/BrandFilm.tsx`

**Interfaces:**
- Consumes: `SCENE_DURATIONS.reveal`, `COLORS.bg`, `COLORS.blueGradient` from
  `./scenes/brand/constants`.
- Produces: `Scene2Reveal` (`React.FC`, no props).

- [ ] **Step 1: Create `remotion-video/src/scenes/brand/Scene2Reveal.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS, SCENE_DURATIONS } from './constants';

export const Scene2Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const materialize = spring({ fps, frame: frame - 10, config: { damping: 200, mass: 1.2 } });
  const iconScale = interpolate(materialize, [0, 1], [0.7, 1]);
  const iconOpacity = interpolate(materialize, [0, 1], [0, 1]);
  const iconBlur = interpolate(materialize, [0, 1], [12, 0]);

  const taglineDelay = 45;
  const tagline = spring({ fps, frame: frame - taglineDelay, config: { damping: 200 } });
  const taglineOpacity = interpolate(tagline, [0, 1], [0, 1]);
  const taglineY = interpolate(tagline, [0, 1], [16, 0]);

  const pushScale = interpolate(frame, [0, SCENE_DURATIONS.reveal], [1, 1.04]);

  return (
    <AbsoluteFill style={{ background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ transform: `scale(${pushScale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 36,
            background: COLORS.blueGradient,
            opacity: iconOpacity,
            transform: `scale(${iconScale})`,
            filter: `blur(${iconBlur}px)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 80px rgba(37,99,235,0.4)',
          }}
        >
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 72, fontFamily: 'Inter, sans-serif' }}>L</span>
        </div>
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            fontSize: 48,
            letterSpacing: '-0.01em',
          }}
        >
          Locked In.
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Replace the scene-2 placeholder in `BrandFilm.tsx`**

Add `import { Scene2Reveal } from './scenes/brand/Scene2Reveal';`, replace:

```tsx
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.reveal + T}>
          <Placeholder color="#78350f" label="2: Reveal" />
        </TransitionSeries.Sequence>
```

with:

```tsx
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.reveal + T}>
          <Scene2Reveal />
        </TransitionSeries.Sequence>
```

- [ ] **Step 3: Render verification stills**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/t4-icon.png --frame=183
npx remotion still BrandFilm out/test-stills/t4-tagline.png --frame=248
```
Expected: `t4-icon.png` (global frame 183 = local frame 15 into scene 2) shows the blue
gradient "L" icon mid-materialization (partially scaled/blurred in). `t4-tagline.png`
(global 248 = local 80) shows the icon fully formed with "Locked In." settled below it.
View both with the Read tool.

- [ ] **Step 4: Commit**

```bash
git add remotion-video/src/scenes/brand/Scene2Reveal.tsx remotion-video/src/BrandFilm.tsx
git commit -m "feat(brand-film): add Scene2Reveal"
```

---

## Task 5: Scene 3 — Skill Room Hero (+ PhoneMockup, ParallaxLayer)

**Files:**
- Create: `remotion-video/src/scenes/brand/components/PhoneMockup.tsx`
- Create: `remotion-video/src/scenes/brand/components/ParallaxLayer.tsx`
- Create: `remotion-video/src/scenes/brand/Scene3SkillRoomHero.tsx`
- Modify: `remotion-video/src/BrandFilm.tsx`

**Interfaces:**
- Consumes: `WIDTH`, `HEIGHT`, `COLORS`, `SCENE_DURATIONS.skillRoomHero` from
  `./constants`.
- Produces: `PhoneMockup` (`React.FC<{ children: React.ReactNode; scale?: number;
  opacity?: number; translateY?: number }>`); `ParallaxLayer` (`React.FC<{ children:
  React.ReactNode; speed: number; startFrame?: number }>`) — both reused by later scenes
  (Task 7 reuses `ParallaxLayer`); `Scene3SkillRoomHero` (`React.FC`, no props).

- [ ] **Step 1: Create `remotion-video/src/scenes/brand/components/PhoneMockup.tsx`**

```tsx
import React from 'react';
import { WIDTH, HEIGHT } from '../constants';

const PHONE_W = 390;
const PHONE_H = 844;

export const PhoneMockup: React.FC<{
  children: React.ReactNode;
  scale?: number;
  opacity?: number;
  translateY?: number;
}> = ({ children, scale = 1, opacity = 1, translateY = 0 }) => (
  <div
    style={{
      position: 'absolute',
      width: PHONE_W,
      height: PHONE_H,
      left: (WIDTH - PHONE_W) / 2,
      top: (HEIGHT - PHONE_H) / 2,
      overflow: 'hidden',
      borderRadius: 40,
      transform: `translateY(${translateY}px) scale(${scale})`,
      opacity,
      boxShadow: '0 0 120px rgba(230,60,10,0.15), 0 0 0 1px rgba(255,255,255,0.05)',
      background: '#000000',
    }}
  >
    {children}
  </div>
);
```

- [ ] **Step 2: Create `remotion-video/src/scenes/brand/components/ParallaxLayer.tsx`**

```tsx
import React from 'react';
import { useCurrentFrame } from 'remotion';

export const ParallaxLayer: React.FC<{
  children: React.ReactNode;
  speed: number;
  startFrame?: number;
}> = ({ children, speed, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);
  const offset = localFrame * speed;

  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateY(${offset}px)` }}>
      {children}
    </div>
  );
};
```

- [ ] **Step 3: Create `remotion-video/src/scenes/brand/Scene3SkillRoomHero.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { PhoneMockup } from './components/PhoneMockup';
import { ParallaxLayer } from './components/ParallaxLayer';
import { COLORS, SCENE_DURATIONS } from './constants';

const MEMBERS = ['K', 'A', 'S', 'M', 'J', 'D'];

const ChatBubble: React.FC<{ name: string; text: string; delay: number }> = ({ name, text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - delay, config: { damping: 200 } });
  const y = interpolate(s, [0, 1], [16, 0]);

  return (
    <div style={{ opacity: s, transform: `translateY(${y}px)`, marginBottom: 10 }}>
      <div style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 700, marginBottom: 2 }}>{name}</div>
      <div
        style={{
          display: 'inline-block',
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14,
          padding: '8px 12px',
          color: '#fff',
          fontSize: 13,
          maxWidth: 260,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Scene3SkillRoomHero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = spring({ fps, frame: frame - 10, config: { damping: 200, mass: 1.4 }, durationInFrames: 60 });
  const phoneY = interpolate(rise, [0, 1], [220, 0]);
  const phoneOpacity = interpolate(rise, [0, 1], [0, 1]);
  const phoneScale = interpolate(frame, [0, SCENE_DURATIONS.skillRoomHero], [0.96, 1.02]);

  const avatarCount = Math.min(
    MEMBERS.length,
    Math.floor(
      interpolate(frame, [40, 40 + MEMBERS.length * 12], [0, MEMBERS.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    )
  );

  return (
    <AbsoluteFill style={{ background: COLORS.bg, overflow: 'hidden' }}>
      <ParallaxLayer speed={0.15}>
        <div
          style={{
            position: 'absolute',
            width: 900,
            height: 900,
            left: -200,
            top: -300,
            background: 'radial-gradient(circle, rgba(230,60,10,0.10) 0%, rgba(0,0,0,0) 70%)',
            filter: 'blur(60px)',
            borderRadius: '50%',
          }}
        />
      </ParallaxLayer>
      <ParallaxLayer speed={-0.08}>
        <div
          style={{
            position: 'absolute',
            width: 700,
            height: 700,
            right: -150,
            bottom: -250,
            background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, rgba(0,0,0,0) 70%)',
            filter: 'blur(60px)',
            borderRadius: '50%',
          }}
        />
      </ParallaxLayer>

      <PhoneMockup translateY={phoneY} opacity={phoneOpacity} scale={phoneScale}>
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#000',
            fontFamily: 'Inter, sans-serif',
            overflowY: 'hidden',
            padding: '60px 16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                background: 'rgba(230,60,10,0.15)',
                color: COLORS.accent,
                fontSize: 10,
                fontWeight: 800,
                borderRadius: 20,
                padding: '3px 10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              ● Live
            </span>
            <span style={{ color: COLORS.textMuted, fontSize: 11 }}>Skill Room</span>
          </div>

          <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>AI Prompting 101</div>
          <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Hosted by Ama — taught by a peer, for peers.</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {MEMBERS.slice(0, avatarCount).map((m, i) => (
              <div
                key={m}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '2px solid #000',
                  background: `hsl(${i * 50}, 60%, 50%)`,
                  marginLeft: i === 0 ? 0 : -8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {m}
              </div>
            ))}
            <span style={{ color: COLORS.textMuted, fontSize: 11, marginLeft: 4 }}>{avatarCount} joined</span>
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ChatBubble name="Kwame" text="This is exactly what I needed 🔥" delay={120} />
            <ChatBubble name="Ama" text="Try giving the model a role first." delay={160} />
            <ChatBubble name="Sena" text="That changed everything, thank you!" delay={210} />
          </div>
        </div>
      </PhoneMockup>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: Replace the scene-3 placeholder in `BrandFilm.tsx`**

Add `import { Scene3SkillRoomHero } from './scenes/brand/Scene3SkillRoomHero';`, replace:

```tsx
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.skillRoomHero + T}>
          <Placeholder color="#1e3a8a" label="3: Skill Room Hero" />
        </TransitionSeries.Sequence>
```

with:

```tsx
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.skillRoomHero + T}>
          <Scene3SkillRoomHero />
        </TransitionSeries.Sequence>
```

- [ ] **Step 5: Render verification stills**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/t5-rising.png --frame=366
npx remotion still BrandFilm out/test-stills/t5-chat.png --frame=561
```
Expected: `t5-rising.png` (global 366 = local 30) shows the phone mockup risen into
frame, "AI Prompting 101" header visible, few/no avatars yet. `t5-chat.png` (global 561
= local 225) shows multiple avatars joined and at least one chat bubble visible. View
both with the Read tool.

- [ ] **Step 6: Commit**

```bash
git add remotion-video/src/scenes/brand/components/PhoneMockup.tsx remotion-video/src/scenes/brand/components/ParallaxLayer.tsx remotion-video/src/scenes/brand/Scene3SkillRoomHero.tsx remotion-video/src/BrandFilm.tsx
git commit -m "feat(brand-film): add Scene3SkillRoomHero with PhoneMockup and ParallaxLayer"
```

---

## Task 6: Scene 4 — Proof Montage

**Files:**
- Create: `remotion-video/src/scenes/brand/Scene4ProofMontage.tsx`
- Modify: `remotion-video/src/BrandFilm.tsx`

**Interfaces:**
- Consumes: `WIDTH`, `COLORS`, `SCENE_DURATIONS.proofMontage` from `./constants`.
- Produces: `Scene4ProofMontage` (`React.FC`, no props).

- [ ] **Step 1: Create `remotion-video/src/scenes/brand/Scene4ProofMontage.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS, WIDTH, SCENE_DURATIONS } from './constants';

const VIGNETTE_DURATION = SCENE_DURATIONS.proofMontage / 3; // 94
const SLIDE_FRAMES = 12;

const Vignette: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => {
  const frame = useCurrentFrame();
  const start = index * VIGNETTE_DURATION;
  const local = frame - start;

  const slideIn = interpolate(local, [0, SLIDE_FRAMES], [WIDTH * 0.3, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const slideOut = interpolate(local, [VIGNETTE_DURATION - SLIDE_FRAMES, VIGNETTE_DURATION], [0, -WIDTH * 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateX = local < VIGNETTE_DURATION / 2 ? slideIn : slideOut;

  const opacity = Math.min(
    interpolate(local, [0, SLIDE_FRAMES], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    interpolate(local, [VIGNETTE_DURATION - SLIDE_FRAMES, VIGNETTE_DURATION], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  if (local < -SLIDE_FRAMES || local > VIGNETTE_DURATION + SLIDE_FRAMES) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        transform: `translateX(${translateX}px)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; sublabel: string }> = ({ label, value, sublabel }) => (
  <div
    style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 28,
      padding: '40px 56px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}
  >
    <div style={{ color: COLORS.textMuted, fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {label}
    </div>
    <div style={{ color: '#fff', fontSize: 72, fontWeight: 900 }}>{value}</div>
    <div style={{ color: COLORS.textMuted, fontSize: 16 }}>{sublabel}</div>
  </div>
);

export const Scene4ProofMontage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const studyPop = spring({ fps, frame, config: { damping: 200 } });
  const timerPop = spring({ fps, frame: frame - VIGNETTE_DURATION, config: { damping: 200 } });
  const leaderboardPop = spring({ fps, frame: frame - VIGNETTE_DURATION * 2, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, overflow: 'hidden' }}>
      <Vignette index={0}>
        <div style={{ transform: `scale(${interpolate(studyPop, [0, 1], [0.85, 1])})` }}>
          <StatCard label="Study Rooms" value="DCIT 301" sublabel="5 students locked in right now" />
        </div>
      </Vignette>
      <Vignette index={1}>
        <div style={{ transform: `scale(${interpolate(timerPop, [0, 1], [0.85, 1])})` }}>
          <StatCard label="Focus Streak" value="12 days" sublabel="Solo Lock-In sessions tracked automatically" />
        </div>
      </Vignette>
      <Vignette index={2}>
        <div style={{ transform: `scale(${interpolate(leaderboardPop, [0, 1], [0.85, 1])})` }}>
          <StatCard label="Campus Leaderboard" value="#3" sublabel="Climbing the ranks against your peers" />
        </div>
      </Vignette>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Replace the scene-4 placeholder in `BrandFilm.tsx`**

Add `import { Scene4ProofMontage } from './scenes/brand/Scene4ProofMontage';`, replace:

```tsx
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.proofMontage + T}>
          <Placeholder color="#14532d" label="4: Proof Montage" />
        </TransitionSeries.Sequence>
```

with:

```tsx
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.proofMontage + T}>
          <Scene4ProofMontage />
        </TransitionSeries.Sequence>
```

- [ ] **Step 3: Render verification stills**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/t6-vignette1.png --frame=816
npx remotion still BrandFilm out/test-stills/t6-vignette2.png --frame=927
npx remotion still BrandFilm out/test-stills/t6-vignette3.png --frame=1046
```
Expected: `t6-vignette1.png` shows the "Study Rooms / DCIT 301" stat card centered.
`t6-vignette2.png` shows "Focus Streak / 12 days". `t6-vignette3.png` shows "Campus
Leaderboard / #3". Each should show only its own card, not an overlap of two. View all
three with the Read tool.

- [ ] **Step 4: Commit**

```bash
git add remotion-video/src/scenes/brand/Scene4ProofMontage.tsx remotion-video/src/BrandFilm.tsx
git commit -m "feat(brand-film): add Scene4ProofMontage"
```

---

## Task 7: Scene 5 — Payoff

**Files:**
- Create: `remotion-video/src/scenes/brand/Scene5Payoff.tsx`
- Modify: `remotion-video/src/BrandFilm.tsx`

**Interfaces:**
- Consumes: `ParallaxLayer` from `./components/ParallaxLayer` (created in Task 5);
  `COLORS` from `./constants`.
- Produces: `Scene5Payoff` (`React.FC`, no props).

- [ ] **Step 1: Create `remotion-video/src/scenes/brand/Scene5Payoff.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { ParallaxLayer } from './components/ParallaxLayer';
import { COLORS } from './constants';

const CARDS = [
  { title: 'AI & Machine Learning', type: 'Skill', depth: 0 },
  { title: 'DCIT 301 — Algorithms', type: 'Study', depth: 1 },
  { title: 'Graphic Design Basics', type: 'Skill', depth: 0 },
  { title: 'Thermodynamics Revision', type: 'Study', depth: 1 },
  { title: 'Public Speaking', type: 'Skill', depth: 2 },
  { title: 'ME 202 — Mechanics', type: 'Study', depth: 2 },
];

const POSITIONS = [
  { x: 140, y: 140 },
  { x: 700, y: 90 },
  { x: 1280, y: 160 },
  { x: 220, y: 620 },
  { x: 760, y: 700 },
  { x: 1320, y: 640 },
];

const MosaicCard: React.FC<{ title: string; type: string; x: number; y: number; delay: number }> = ({
  title,
  type,
  x,
  y,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - delay, config: { damping: 200 } });
  const scale = interpolate(s, [0, 1], [0.8, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: s,
        transform: `scale(${scale})`,
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 18,
        padding: '16px 20px',
        width: 280,
      }}
    >
      <span
        style={{
          background: type === 'Skill' ? 'rgba(230,60,10,0.15)' : 'rgba(37,99,235,0.15)',
          color: type === 'Skill' ? COLORS.accent : '#60a5fa',
          fontSize: 10,
          fontWeight: 800,
          borderRadius: 20,
          padding: '3px 10px',
          textTransform: 'uppercase',
        }}
      >
        {type}
      </span>
      <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginTop: 8 }}>{title}</div>
    </div>
  );
};

export const Scene5Payoff: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg, overflow: 'hidden' }}>
      {CARDS.map((card, i) => (
        <ParallaxLayer key={card.title} speed={card.depth === 0 ? 0.05 : card.depth === 1 ? 0.1 : 0.16}>
          <MosaicCard title={card.title} type={card.type} x={POSITIONS[i].x} y={POSITIONS[i].y} delay={i * 8} />
        </ParallaxLayer>
      ))}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Replace the scene-5 placeholder in `BrandFilm.tsx`**

Add `import { Scene5Payoff } from './scenes/brand/Scene5Payoff';`, replace:

```tsx
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.payoff + T}>
          <Placeholder color="#581c87" label="5: Payoff" />
        </TransitionSeries.Sequence>
```

with:

```tsx
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.payoff + T}>
          <Scene5Payoff />
        </TransitionSeries.Sequence>
```

- [ ] **Step 3: Render verification still**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/t7-mosaic.png --frame=1152
```
Expected: shows all 6 mosaic cards ("AI & Machine Learning", "DCIT 301 — Algorithms",
etc.) laid out across the frame, fully faded in. View with the Read tool.

- [ ] **Step 4: Commit**

```bash
git add remotion-video/src/scenes/brand/Scene5Payoff.tsx remotion-video/src/BrandFilm.tsx
git commit -m "feat(brand-film): add Scene5Payoff"
```

---

## Task 8: Scene 6 — CTA

**Files:**
- Create: `remotion-video/src/scenes/brand/Scene6CTA.tsx`
- Modify: `remotion-video/src/BrandFilm.tsx`

**Interfaces:**
- Consumes: `COLORS`, `SCENE_DURATIONS.cta` from `./constants`.
- Produces: `Scene6CTA` (`React.FC`, no props).

- [ ] **Step 1: Create `remotion-video/src/scenes/brand/Scene6CTA.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS, SCENE_DURATIONS } from './constants';

export const Scene6CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ fps, frame: frame - 5, config: { damping: 200 } });
  const logoScale = interpolate(logoIn, [0, 1], [0.8, 1]);
  const logoOpacity = interpolate(logoIn, [0, 1], [0, 1]);

  const taglineIn = spring({ fps, frame: frame - 35, config: { damping: 200 } });
  const taglineOpacity = interpolate(taglineIn, [0, 1], [0, 1]);
  const taglineY = interpolate(taglineIn, [0, 1], [14, 0]);

  const ctaIn = spring({ fps, frame: frame - 65, config: { damping: 200 } });
  const ctaOpacity = interpolate(ctaIn, [0, 1], [0, 1]);

  const fadeOut = interpolate(frame, [SCENE_DURATIONS.cta - 20, SCENE_DURATIONS.cta], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, opacity: fadeOut, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 28,
            background: COLORS.blueGradient,
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 60px rgba(37,99,235,0.4)',
          }}
        >
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 52, fontFamily: 'Inter, sans-serif' }}>L</span>
        </div>

        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            fontSize: 40,
            textAlign: 'center',
          }}
        >
          Learn anything. From anyone.
        </div>

        <div
          style={{
            opacity: ctaOpacity,
            marginTop: 8,
            background: COLORS.accent,
            borderRadius: 14,
            padding: '14px 36px',
            color: '#fff',
            fontWeight: 800,
            fontSize: 18,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Join Locked In →
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Replace the scene-6 placeholder in `BrandFilm.tsx`**

Add `import { Scene6CTA } from './scenes/brand/Scene6CTA';`, replace:

```tsx
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.cta}>
          <Placeholder color="#831843" label="6: CTA" />
        </TransitionSeries.Sequence>
```

with:

```tsx
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.cta}>
          <Scene6CTA />
        </TransitionSeries.Sequence>
```

Also remove the now-unused `Placeholder` component definition from `BrandFilm.tsx` since
all six placeholders have been replaced.

- [ ] **Step 3: Render verification stills**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/t8-cta.png --frame=1276
npx remotion still BrandFilm out/test-stills/t8-fadeout.png --frame=1396
```
Expected: `t8-cta.png` (global 1276 = local 40) shows the logo, tagline "Learn anything.
From anyone.", and "Join Locked In →" button all visible. `t8-fadeout.png` (global 1396 =
local 160, 8 frames before the very end at 1404) shows the scene visibly faded toward
black. View both with the Read tool.

- [ ] **Step 4: Commit**

```bash
git add remotion-video/src/scenes/brand/Scene6CTA.tsx remotion-video/src/BrandFilm.tsx
git commit -m "feat(brand-film): add Scene6CTA, remove placeholder component"
```

---

## Task 9: Full silent render and review

**Files:** none (render/verification only).

**Interfaces:** none — this task verifies the integration of Tasks 1–8 before audio is
added.

- [ ] **Step 1: Render the full silent video**

Run:
```bash
cd "remotion-video"
npx remotion render BrandFilm out/BrandFilm-silent.mp4
```
Expected: renders all 1404 frames without errors, producing `out/BrandFilm-silent.mp4`.

- [ ] **Step 2: Open for review**

Run:
```bash
explorer.exe "out/BrandFilm-silent.mp4"
```
(or report the absolute path to the user if `explorer.exe` is unavailable in the
execution environment). Confirm with the user that the full sequence — cold open, reveal,
skill room hero, proof montage, payoff, CTA — flows correctly with the depth transitions
and grain overlay, before proceeding to audio. **Do not proceed to Task 10 until the user
has confirmed the silent cut looks right** — audio generation in Tasks 10–12 is
comparatively expensive to redo if the visual cut still needs changes.

- [ ] **Step 3: Commit (if any fixes were made during review)**

If the user requested visual changes during review, make them in the relevant scene
file(s), re-render per Step 1, and commit:
```bash
git add remotion-video/src/scenes/brand/
git commit -m "fix(brand-film): address review feedback on silent cut"
```
If no changes were needed, skip this step (nothing to commit).

---

## Task 10: Generate music score

**Files:**
- Create: `remotion-video/public/brand/music.mp3` (downloaded, not authored by hand)

Note: confirmed during planning that `remotion-video/` has no `public/` directory yet —
Remotion's `staticFile()` (used in Task 12) serves files from `public/` at the project
root, so this task creates that directory.

**Interfaces:**
- Produces: a music file at the path above, used by Task 12.

- [ ] **Step 1: Generate the track**

Call the Higgsfield `generate_audio` tool with a prompt describing a cinematic,
minimal-tech instrumental, ~47 seconds, with an energy curve matching the picture:
calm/sparse for the first ~11s (Scenes 1–2), building and warmer through the ~15s hero
beat (Scene 3), peaking energetically through the ~9.4s montage (Scene 4), and resolving
gently through the close (Scenes 5–6). No vocals/lyrics — instrumental only, since
Scene's no spoken voiceover.

- [ ] **Step 2: Download and place the file**

Save the generated audio to `remotion-video/public/brand/music.mp3` (create the
`public/brand/` directory if it doesn't exist yet).

- [ ] **Step 3: Verify the file**

Run: `cd "remotion-video" && node -e "console.log(require('fs').statSync('public/brand/music.mp3').size)"`
Expected: prints a non-zero byte size (confirms the file downloaded correctly and isn't
empty/corrupted).

- [ ] **Step 4: Commit**

```bash
git add remotion-video/public/brand/music.mp3
git commit -m "feat(brand-film): add generated music score"
```

---

## Task 11: Generate SFX one-shots

**Files:**
- Create: `remotion-video/public/brand/sfx-whoosh.mp3`
- Create: `remotion-video/public/brand/sfx-tap.mp3`

**Interfaces:**
- Produces: two short SFX files at the paths above, used by Task 12.

- [ ] **Step 1: Generate "whoosh" transition sound**

Call the Higgsfield `generate_audio` tool for a short (under 1s) soft cinematic whoosh
sound effect, suitable for a scene transition — not harsh or noisy, subtle. Save to
`remotion-video/public/brand/sfx-whoosh.mp3`.

- [ ] **Step 2: Generate "tap/pop" UI sound**

Call the Higgsfield `generate_audio` tool for a short (under 0.3s) soft UI tap/pop sound,
suitable for an avatar or card appearing on screen — subtle, not a harsh click. Save to
`remotion-video/public/brand/sfx-tap.mp3`.

- [ ] **Step 3: Verify both files**

Run:
```bash
cd "remotion-video"
node -e "console.log(require('fs').statSync('public/brand/sfx-whoosh.mp3').size)"
node -e "console.log(require('fs').statSync('public/brand/sfx-tap.mp3').size)"
```
Expected: both print a non-zero byte size.

- [ ] **Step 4: Commit**

```bash
git add remotion-video/public/brand/sfx-whoosh.mp3 remotion-video/public/brand/sfx-tap.mp3
git commit -m "feat(brand-film): add generated transition and UI SFX"
```

---

## Task 12: Wire audio into BrandFilm and final render

**Files:**
- Modify: `remotion-video/src/BrandFilm.tsx`

**Interfaces:**
- Consumes: `remotion-video/public/brand/music.mp3`,
  `remotion-video/public/brand/sfx-whoosh.mp3`,
  `remotion-video/public/brand/sfx-tap.mp3` (from Tasks 10–11, served via Remotion's
  `staticFile()` from `public/`); global scene start frames derived from
  `SCENE_DURATIONS`/`TRANSITION_FRAMES`: Scene1=0, Scene2=168, Scene3=336, Scene4=786,
  Scene5=1068, Scene6=1236 (each transition's whoosh plays at the next scene's start
  frame minus `TRANSITION_FRAMES`, i.e. when the cross-fade begins).
- Produces: final `out/BrandFilm.mp4`.

- [ ] **Step 1: Add audio to `BrandFilm.tsx`**

Change the existing `import { AbsoluteFill } from 'remotion';` line to:

```tsx
import { AbsoluteFill, Sequence, Audio, staticFile } from 'remotion';
```

Add `<Audio>` elements as the last children inside the outer `AbsoluteFill` (after
`<GrainOverlay />`):

```tsx
      <GrainOverlay />

      <Audio src={staticFile('brand/music.mp3')} volume={0.8} />

      {/* whoosh at each transition start (next scene's global start minus the 18f overlap) */}
      <Sequence from={150}><Audio src={staticFile('brand/sfx-whoosh.mp3')} volume={0.6} /></Sequence>
      <Sequence from={318}><Audio src={staticFile('brand/sfx-whoosh.mp3')} volume={0.6} /></Sequence>
      <Sequence from={768}><Audio src={staticFile('brand/sfx-whoosh.mp3')} volume={0.6} /></Sequence>
      <Sequence from={1050}><Audio src={staticFile('brand/sfx-whoosh.mp3')} volume={0.6} /></Sequence>
      <Sequence from={1218}><Audio src={staticFile('brand/sfx-whoosh.mp3')} volume={0.6} /></Sequence>

      {/* tap when avatars/cards pop in during Scene 3 (local frames 40,52,64,76,88,100 → global +336) and Scene 5 (local 0,8,16,24,32,40 → global +1068) */}
      {[40, 52, 64, 76, 88, 100].map((f) => (
        <Sequence key={`s3-tap-${f}`} from={336 + f}><Audio src={staticFile('brand/sfx-tap.mp3')} volume={0.4} /></Sequence>
      ))}
      {[0, 8, 16, 24, 32, 40].map((f) => (
        <Sequence key={`s5-tap-${f}`} from={1068 + f}><Audio src={staticFile('brand/sfx-tap.mp3')} volume={0.4} /></Sequence>
      ))}
```

- [ ] **Step 2: Final render**

Run:
```bash
cd "remotion-video"
npx remotion render BrandFilm out/BrandFilm.mp4
```
Expected: renders without errors, producing `out/BrandFilm.mp4` with audio.

- [ ] **Step 3: Open for review**

Run:
```bash
explorer.exe "out/BrandFilm.mp4"
```
Confirm with the user that music plays throughout, whoosh sounds land on the six
transitions, and tap sounds land on the avatar/card pop-ins in Scenes 3 and 5.

- [ ] **Step 4: Commit**

```bash
git add remotion-video/src/BrandFilm.tsx
git commit -m "feat(brand-film): wire music and SFX into BrandFilm, final render"
```
