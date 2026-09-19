# Brand Film Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the existing `BrandFilm` composition (built in `docs/superpowers/plans/2026-06-24-brand-film.md`, all 8 tasks complete on branch `feat/brand-film`) per user feedback that the silent cut felt static and generic. This plan: (1) replaces the hand-rolled 2D depth transition with the built-in 3D `flip()` transition, (2) removes all logo/icon treatments in favor of pure wordmark typography, (3) replaces the phone-mockup device frame with a desktop/browser window matching the real product's actual UI, (4) replaces fabricated UI copy with real copy/layout sourced from screenshots of the live app at lockedinumat.tech, (5) adds continuous (not just entrance) 3D motion throughout to address the "not fully animated" feedback, (6) rebuilds Scene1 as a search-engine URL-typing opening, and (7) adds voiceover, music, and SFX.

**Architecture:** Same `TransitionSeries`-based composition in `BrandFilm.tsx`. Existing scene files are modified in place (not replaced) to preserve git history and the already-reviewed file structure. Two components are added (`BrowserWindow`, `TypingText`); `PhoneMockup` is deleted once its last consumer (Scene3) is reworked.

**Tech Stack:** Remotion 4.0.466, `@remotion/transitions` (now including `@remotion/transitions/flip`), React 19, TypeScript — all already installed. Per the `remotion-best-practices` skill: use individual CSS transform properties (`scale`, `translate`, `rotate`) instead of composed `transform` strings for all new/modified animation code in this plan (existing already-reviewed code that isn't touched by a given task is left as-is).

## Global Constraints

- Canvas: 1920×1080, 30fps, same `SCENE_DURATIONS` as before (coldOpen 168, reveal 168, skillRoomHero 450, proofMontage 282, payoff 168, cta 168 — unchanged; this rework changes scene *content*, not *timing*).
- **No logo or icon box anywhere.** Brand identity is conveyed via the wordmark "Locked In." (exact capitalization) plus the small caption "LOCK IN. LEVEL UP." — both sourced verbatim from the real app's sidebar (see `screenshots/Screenshot (391).png`).
- Use the built-in `flip` transition from `@remotion/transitions/flip` for all scene-to-scene transitions — do not hand-roll a new transition presentation.
- All UI mockups (browser chrome, sidebar nav, room cards, leaderboard, stats) must use a desktop/browser window frame, not a phone frame, and must use real copy/layout sourced from the screenshots in `D:\Projects\locked in\screenshots\` — not invented copy.
- New/modified animation code must use individual transform properties (`scale`, `translate`, `rotate`) in the `style` prop, not a composed `transform` string, per the `remotion-best-practices` skill. `perspective` is set on the parent of a 3D-rotated element, not on the rotated element itself.
- Every scene must have continuous motion across its full duration (idle drift/tilt/wobble), not just a one-time entrance animation that then holds static.
- No new npm dependencies beyond what's already installed (the `flip` transition is part of the already-installed `@remotion/transitions` package).
- Do not modify `LockedInProductVideo.tsx`, any `NScene*.tsx` file, or the existing `LockedInProductVideo` entry in `Root.tsx`.
- Verification method: there is no test runner in `remotion-video/`. Render a still PNG via `npx remotion still` and visually inspect it with the Read tool — this replaces unit tests for this plan, same as the prior plan.

---

## Task 1: Replace DepthTransition with built-in flip()

**Files:**
- Delete: `remotion-video/src/scenes/brand/components/DepthTransition.tsx`
- Modify: `remotion-video/src/BrandFilm.tsx`

**Interfaces:**
- Consumes: `flip` from `@remotion/transitions/flip` (already installed; confirmed present at `remotion-video/node_modules/@remotion/transitions/dist/presentations/flip.d.ts`, signature `flip(props?: { direction?: 'from-left'|'from-right'|'from-top'|'from-bottom'; perspective?: number; ... }) => TransitionPresentation`).
- Produces: nothing new exported — this task only changes which transition presentation `BrandFilm.tsx` uses.

- [ ] **Step 1: Delete the old transition file**

Delete `remotion-video/src/scenes/brand/components/DepthTransition.tsx` entirely (it is fully replaced by the built-in `flip`).

- [ ] **Step 2: Update `BrandFilm.tsx` imports and transitions**

Remove the line `import { depthPresentation } from './scenes/brand/components/DepthTransition';` and replace it with:

```tsx
import { flip } from '@remotion/transitions/flip';
```

Replace each of the 5 `<TransitionSeries.Transition presentation={depthPresentation()} ...>` elements with one of the following, in this exact order (alternating direction for visual variety), keeping each one's existing `timing={linearTiming({ durationInFrames: T })}` unchanged:

```tsx
<TransitionSeries.Transition presentation={flip({ direction: 'from-right', perspective: 1600 })} timing={linearTiming({ durationInFrames: T })} />
```
```tsx
<TransitionSeries.Transition presentation={flip({ direction: 'from-left', perspective: 1600 })} timing={linearTiming({ durationInFrames: T })} />
```
```tsx
<TransitionSeries.Transition presentation={flip({ direction: 'from-right', perspective: 1600 })} timing={linearTiming({ durationInFrames: T })} />
```
```tsx
<TransitionSeries.Transition presentation={flip({ direction: 'from-left', perspective: 1600 })} timing={linearTiming({ durationInFrames: T })} />
```
```tsx
<TransitionSeries.Transition presentation={flip({ direction: 'from-right', perspective: 1600 })} timing={linearTiming({ durationInFrames: T })} />
```

(i.e., transition 1→2 uses from-right, 2→3 from-left, 3→4 from-right, 4→5 from-left, 5→6 from-right — matching the order the `<TransitionSeries.Transition>` elements already appear in the file.)

`<GrainOverlay />` stays untouched at the bottom of the file.

- [ ] **Step 3: Render verification stills**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/r1-flip1.png --frame=177
npx remotion still BrandFilm out/test-stills/r1-flip3.png --frame=800
```
Expected: both show a 3D-rotated/foreshortened blend between two scenes (one scene appearing edge-on/rotated in perspective), not a blurred 2D crossfade. View both with the Read tool.

- [ ] **Step 4: Commit**

```bash
git add remotion-video/src/BrandFilm.tsx
git rm remotion-video/src/scenes/brand/components/DepthTransition.tsx
git commit -m "feat(brand-film): replace hand-rolled depth transition with built-in flip()"
```

---

## Task 2: Add BrowserWindow and TypingText shared components, extend constants

**Files:**
- Modify: `remotion-video/src/scenes/brand/constants.ts`
- Create: `remotion-video/src/scenes/brand/components/BrowserWindow.tsx`
- Create: `remotion-video/src/scenes/brand/components/TypingText.tsx`

**Interfaces:**
- Produces: `COLORS.white` (`'#ffffff'`), `COLORS.searchBg` (`'#f1f3f4'`), `COLORS.textDark` (`'#202124'`) added to the existing `COLORS` export (all other existing `constants.ts` exports unchanged).
- Produces: `BrowserWindow` (`React.FC<{ children: React.ReactNode; url?: string }>`, default `url = 'lockedinumat.tech'`) — used by Task 5 (replacing `PhoneMockup`).
- Produces: `TypingText` (`React.FC<{ text: string; startFrame: number; framesPerChar: number; cursorColor?: string; style?: React.CSSProperties }>`) — used by Task 3.

- [ ] **Step 1: Extend `constants.ts`**

Add these three keys to the existing `COLORS` object (do not remove or rename any existing key):

```ts
  white: '#ffffff',
  searchBg: '#f1f3f4',
  textDark: '#202124',
```

- [ ] **Step 2: Create `remotion-video/src/scenes/brand/components/BrowserWindow.tsx`**

```tsx
import React from 'react';
import { WIDTH, HEIGHT, COLORS } from '../constants';

const WINDOW_W = 1400;
const WINDOW_H = 820;

export const BrowserWindow: React.FC<{
  children: React.ReactNode;
  url?: string;
}> = ({ children, url = 'lockedinumat.tech' }) => (
  <div
    style={{
      position: 'absolute',
      width: WINDOW_W,
      height: WINDOW_H,
      left: (WIDTH - WINDOW_W) / 2,
      top: (HEIGHT - WINDOW_H) / 2,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 40px 120px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
      background: COLORS.bg,
    }}
  >
    <div style={{ height: 44, background: '#1a1a1a', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8 }}>
      <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
      <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
      <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
      <div
        style={{
          marginLeft: 16,
          background: '#0d0d0d',
          borderRadius: 8,
          padding: '5px 14px',
          color: COLORS.textMuted,
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {url}
      </div>
    </div>
    <div style={{ width: '100%', height: WINDOW_H - 44, position: 'relative', overflow: 'hidden' }}>
      {children}
    </div>
  </div>
);
```

- [ ] **Step 3: Create `remotion-video/src/scenes/brand/components/TypingText.tsx`**

```tsx
import React from 'react';
import { useCurrentFrame } from 'remotion';

export const TypingText: React.FC<{
  text: string;
  startFrame: number;
  framesPerChar: number;
  cursorColor?: string;
  style?: React.CSSProperties;
}> = ({ text, startFrame, framesPerChar, cursorColor = '#202124', style }) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const charsShown = Math.min(text.length, Math.floor(elapsed / framesPerChar));
  const shown = text.slice(0, charsShown);
  const cursorOn = Math.floor(frame / 15) % 2 === 0;

  return (
    <span style={style}>
      {shown}
      <span style={{ opacity: cursorOn ? 1 : 0, color: cursorColor }}>|</span>
    </span>
  );
};
```

- [ ] **Step 4: Verify the project still builds**

Run: `cd "remotion-video" && npx tsc --noEmit 2>&1 | grep -v "src/mocks\|NScene3Timer\|NScene5Leaderboard"`
Expected: no output (the pre-existing errors in `src/mocks/*`, `NScene3Timer.tsx`, `NScene5Leaderboard.tsx` are filtered out; this task's new/changed files must not introduce any new error).

- [ ] **Step 5: Commit**

```bash
git add remotion-video/src/scenes/brand/constants.ts remotion-video/src/scenes/brand/components/BrowserWindow.tsx remotion-video/src/scenes/brand/components/TypingText.tsx
git commit -m "feat(brand-film): add BrowserWindow and TypingText components, extend palette"
```

---

## Task 3: Rebuild Scene1ColdOpen as a search-engine URL-typing opening

**Files:**
- Modify: `remotion-video/src/scenes/brand/Scene1ColdOpen.tsx` (full rewrite of the file's contents)

**Interfaces:**
- Consumes: `TypingText` from `./components/TypingText` (Task 2); `COLORS`, `SCENE_DURATIONS.coldOpen` from `./constants`.
- Produces: `Scene1ColdOpen` (`React.FC`, no props) — same export name/signature as before, so `BrandFilm.tsx` requires no change for this task.

- [ ] **Step 1: Replace the full contents of `Scene1ColdOpen.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { TypingText } from './components/TypingText';
import { COLORS } from './constants';

const URL_TEXT = 'lockedinumat.tech';
const TYPE_START = 20;
const FRAMES_PER_CHAR = 6;
const TYPING_DONE_FRAME = TYPE_START + URL_TEXT.length * FRAMES_PER_CHAR;

export const Scene1ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();

  const barIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const barScale = interpolate(barIn, [0, 1], [0.96, 1]);

  const submitGlow = interpolate(
    frame,
    [TYPING_DONE_FRAME + 10, TYPING_DONE_FRAME + 20, TYPING_DONE_FRAME + 30],
    [0, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ background: COLORS.white, alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          opacity: barIn,
          scale: barScale,
          width: 640,
          height: 64,
          borderRadius: 32,
          background: COLORS.searchBg,
          border: `1px solid ${submitGlow > 0 ? COLORS.accent : 'rgba(0,0,0,0.08)'}`,
          boxShadow:
            submitGlow > 0
              ? `0 0 ${20 * submitGlow}px rgba(230,60,10,${0.4 * submitGlow})`
              : '0 2px 12px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 14,
        }}
      >
        <span style={{ fontSize: 20, color: COLORS.textDark, opacity: 0.5 }}>🔍</span>
        <TypingText
          text={URL_TEXT}
          startFrame={TYPE_START}
          framesPerChar={FRAMES_PER_CHAR}
          cursorColor={COLORS.textDark}
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 22, color: COLORS.textDark, fontWeight: 500 }}
        />
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Render verification stills**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/r3-typing-mid.png --frame=60
npx remotion still BrandFilm out/test-stills/r3-typing-done.png --frame=140
```
Expected: `r3-typing-mid.png` (frame 60, 40 frames after typing starts at 20, so `(60-20)/6 = 6` characters shown) shows a light page with the search bar partway through typing "locked" (or similar partial substring) with a cursor. `r3-typing-done.png` (frame 140) shows the full "lockedinumat.tech" typed, with the search bar showing the orange submit-glow border (since `TYPING_DONE_FRAME = 20 + 17*6 = 122`, and frame 140 is 18 frames after — within the `[132, 142]` glow-peak window). View both with the Read tool.

- [ ] **Step 3: Commit**

```bash
git add remotion-video/src/scenes/brand/Scene1ColdOpen.tsx
git commit -m "feat(brand-film): rebuild Scene1ColdOpen as search-engine URL-typing opening"
```

---

## Task 4: Rework Scene2Reveal — pure wordmark, 3D flip-in, no logo

**Files:**
- Modify: `remotion-video/src/scenes/brand/Scene2Reveal.tsx` (full rewrite)

**Interfaces:**
- Consumes: `COLORS`, `SCENE_DURATIONS.reveal` from `./constants`.
- Produces: `Scene2Reveal` (`React.FC`, no props) — same export name/signature as before.

- [ ] **Step 1: Replace the full contents of `Scene2Reveal.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS, SCENE_DURATIONS } from './constants';

export const Scene2Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const materialize = spring({ fps, frame: frame - 10, config: { damping: 200, mass: 1.2 } });
  const wordmarkRotateY = interpolate(materialize, [0, 1], [70, 0]);
  const wordmarkOpacity = interpolate(materialize, [0, 1], [0, 1]);
  const idleWobble = materialize >= 1 ? Math.sin(frame / 45) * 2.5 : 0;

  const captionDelay = 40;
  const caption = spring({ fps, frame: frame - captionDelay, config: { damping: 200 } });
  const captionOpacity = interpolate(caption, [0, 1], [0, 1]);
  const captionY = interpolate(caption, [0, 1], [10, 0]);

  const pushScale = interpolate(frame, [0, SCENE_DURATIONS.reveal], [1, 1.03]);

  return (
    <AbsoluteFill style={{ background: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ scale: pushScale, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ perspective: 800 }}>
          <div
            style={{
              opacity: wordmarkOpacity,
              rotate: `y ${wordmarkRotateY + idleWobble}deg`,
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: 64,
              letterSpacing: '-0.02em',
            }}
          >
            Locked In.
          </div>
        </div>
        <div
          style={{
            opacity: captionOpacity,
            translate: `0 ${captionY}px`,
            color: COLORS.textMuted,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}
        >
          Lock In. Level Up.
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Render verification stills**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/r4-wordmark-mid.png --frame=183
npx remotion still BrandFilm out/test-stills/r4-wordmark-done.png --frame=248
```
Expected: `r4-wordmark-mid.png` (global 183 = local 15 into Scene2) shows "Locked In." mid-flip (rotated, partially visible, no icon anywhere). `r4-wordmark-done.png` (global 248 = local 80) shows "Locked In." fully settled, flat-on, with "LOCK IN. LEVEL UP." caption visible beneath it — still no icon/logo box anywhere in the frame. View both with the Read tool.

- [ ] **Step 3: Commit**

```bash
git add remotion-video/src/scenes/brand/Scene2Reveal.tsx
git commit -m "feat(brand-film): rework Scene2Reveal as pure wordmark with 3D flip-in, no logo"
```

---

## Task 5: Rework Scene3SkillRoomHero — BrowserWindow, real sidebar/room card, continuous 3D tilt

**Files:**
- Modify: `remotion-video/src/scenes/brand/Scene3SkillRoomHero.tsx` (full rewrite)
- Delete: `remotion-video/src/scenes/brand/components/PhoneMockup.tsx` (only after confirming no other file imports it — see Step 1)

**Interfaces:**
- Consumes: `BrowserWindow` from `./components/BrowserWindow` (Task 2); `COLORS` from `./constants`. Does **not** consume `PhoneMockup` (being deleted) or `ParallaxLayer` (still needed by Task 7/Scene5Payoff — do not delete `ParallaxLayer.tsx`).
- Produces: `Scene3SkillRoomHero` (`React.FC`, no props) — same export name/signature as before.

- [ ] **Step 1: Confirm `PhoneMockup` has no other consumers before deleting it**

Run: `cd "remotion-video" && grep -rl "PhoneMockup" src/`
Expected output: only `src/scenes/brand/Scene3SkillRoomHero.tsx` (the file this task is about to rewrite) and `src/scenes/brand/components/PhoneMockup.tsx` itself. If any other file appears, stop and report back instead of deleting — that would mean another scene still depends on it.

- [ ] **Step 2: Replace the full contents of `Scene3SkillRoomHero.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BrowserWindow } from './components/BrowserWindow';
import { COLORS } from './constants';

const NAV_ITEMS = ['Dashboard', 'Leaderboard', 'Buddies', 'Host Room', 'Resources'];
const MEMBERS = ['K', 'A', 'S', 'M'];

const Sidebar: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - delay, config: { damping: 200 } });
  const x = interpolate(s, [0, 1], [-24, 0]);

  return (
    <div
      style={{
        opacity: s,
        translate: `${x}px 0`,
        width: 220,
        height: '100%',
        background: '#0a0a0a',
        borderRight: `1px solid ${COLORS.border}`,
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 2 }}>Locked In.</div>
      <div style={{ color: COLORS.textMuted, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', marginBottom: 28 }}>
        LOCK IN. LEVEL UP.
      </div>
      {NAV_ITEMS.map((item) => (
        <div
          key={item}
          style={{
            color: item === 'Host Room' ? '#fff' : COLORS.textMuted,
            background: item === 'Host Room' ? COLORS.card : 'transparent',
            fontSize: 13,
            fontWeight: 600,
            padding: '10px 12px',
            borderRadius: 10,
            marginBottom: 4,
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

const RoomCard: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - delay, config: { damping: 200 } });
  const y = interpolate(s, [0, 1], [24, 0]);

  const joinedCount = Math.min(
    MEMBERS.length,
    Math.floor(
      interpolate(frame, [delay + 30, delay + 30 + MEMBERS.length * 14], [0, MEMBERS.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    )
  );

  return (
    <div
      style={{
        opacity: s,
        translate: `0 ${y}px`,
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20,
        padding: 24,
        width: 420,
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <span
          style={{
            background: 'rgba(230,60,10,0.15)',
            color: COLORS.accent,
            fontSize: 10,
            fontWeight: 800,
            borderRadius: 20,
            padding: '3px 10px',
            textTransform: 'uppercase',
          }}
        >
          Skill
        </span>
        <span
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: COLORS.textMuted,
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 20,
            padding: '3px 10px',
          }}
        >
          120m
        </span>
      </div>
      <div style={{ color: '#fff', fontSize: 24, fontWeight: 800, lineHeight: 1.25, marginBottom: 10 }}>
        Creating Portfolio Websites with AI
      </div>
      <div style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 18 }}>
        Learn to build a professional AI-powered portfolio site from scratch — live, no experience needed.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex' }}>
          {MEMBERS.slice(0, joinedCount).map((m, i) => (
            <div
              key={m}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: `2px solid ${COLORS.card}`,
                background: `hsl(${i * 60}, 60%, 50%)`,
                marginLeft: i === 0 ? 0 : -10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {m}
            </div>
          ))}
        </div>
        <span style={{ color: COLORS.textMuted, fontSize: 12 }}>{joinedCount} Buddies Inside</span>
      </div>
    </div>
  );
};

export const Scene3SkillRoomHero: React.FC = () => {
  const frame = useCurrentFrame();

  const windowIn = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const windowScale = interpolate(windowIn, [0, 1], [0.92, 1]);

  const tiltX = Math.sin(frame / 110) * 3;
  const tiltY = Math.cos(frame / 130) * 5;

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <div style={{ position: 'absolute', inset: 0, opacity: windowIn, scale: windowScale, perspective: 1800 }}>
        <div style={{ position: 'absolute', inset: 0, rotate: `x ${tiltX}deg` }}>
          <div style={{ position: 'absolute', inset: 0, rotate: `y ${tiltY}deg` }}>
            <BrowserWindow>
              <div style={{ display: 'flex', height: '100%' }}>
                <Sidebar delay={15} />
                <div style={{ flex: 1, padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
                  <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Live Skill Rooms</div>
                  <RoomCard delay={35} />
                </div>
              </div>
            </BrowserWindow>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Delete the now-unused `PhoneMockup.tsx`**

(Only after Step 1 confirmed no other consumer.)

```bash
git rm remotion-video/src/scenes/brand/components/PhoneMockup.tsx
```

- [ ] **Step 4: Render verification stills**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/r5-browser-in.png --frame=366
npx remotion still BrandFilm out/test-stills/r5-roomcard.png --frame=561
```
Expected: `r5-browser-in.png` (global 366 = local 30) shows the browser window risen/scaled in, sidebar visible with "Locked In." + "LOCK IN. LEVEL UP." + nav items, room card area starting to appear. `r5-roomcard.png` (global 561 = local 225) shows the full room card "Creating Portfolio Websites with AI" with avatars joined, and the whole window subtly tilted in 3D (not perfectly flat-on) due to the continuous `tiltX`/`tiltY` drift. View both with the Read tool.

- [ ] **Step 5: Commit**

```bash
git add remotion-video/src/scenes/brand/Scene3SkillRoomHero.tsx
git commit -m "feat(brand-film): rework Scene3SkillRoomHero with BrowserWindow, real room card, continuous 3D tilt"
```

---

## Task 6: Rework Scene4ProofMontage — real stats, flip-style vignette transitions

**Files:**
- Modify: `remotion-video/src/scenes/brand/Scene4ProofMontage.tsx` (full rewrite)

**Interfaces:**
- Consumes: `COLORS`, `WIDTH`, `SCENE_DURATIONS.proofMontage` from `./constants`.
- Produces: `Scene4ProofMontage` (`React.FC`, no props) — same export name/signature as before.

- [ ] **Step 1: Replace the full contents of `Scene4ProofMontage.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS, SCENE_DURATIONS } from './constants';

const VIGNETTE_DURATION = SCENE_DURATIONS.proofMontage / 3; // 94
const ROTATE_FRAMES = 16;

const Vignette: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => {
  const frame = useCurrentFrame();
  const start = index * VIGNETTE_DURATION;
  const local = frame - start;

  const rotateIn = interpolate(local, [0, ROTATE_FRAMES], [80, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rotateOut = interpolate(local, [VIGNETTE_DURATION - ROTATE_FRAMES, VIGNETTE_DURATION], [0, -80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rotateY = local < VIGNETTE_DURATION / 2 ? rotateIn : rotateOut;

  const opacity = Math.min(
    interpolate(local, [0, ROTATE_FRAMES], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    interpolate(local, [VIGNETTE_DURATION - ROTATE_FRAMES, VIGNETTE_DURATION], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  if (local < -ROTATE_FRAMES || local > VIGNETTE_DURATION + ROTATE_FRAMES) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, perspective: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ opacity, rotate: `y ${rotateY}deg` }}>{children}</div>
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

  const pop0 = spring({ fps, frame, config: { damping: 200 } });
  const pop1 = spring({ fps, frame: frame - VIGNETTE_DURATION, config: { damping: 200 } });
  const pop2 = spring({ fps, frame: frame - VIGNETTE_DURATION * 2, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, overflow: 'hidden' }}>
      <Vignette index={0}>
        <div style={{ scale: interpolate(pop0, [0, 1], [0.85, 1]) }}>
          <StatCard label="Students" value="76+" sublabel="Already locked in across campus" />
        </div>
      </Vignette>
      <Vignette index={1}>
        <div style={{ scale: interpolate(pop1, [0, 1], [0.85, 1]) }}>
          <StatCard label="Focus Minutes" value="1,200+" sublabel="Logged and counting" />
        </div>
      </Vignette>
      <Vignette index={2}>
        <div style={{ scale: interpolate(pop2, [0, 1], [0.85, 1]) }}>
          <StatCard label="#1 Jnr Einstein" value="75 pts" sublabel="Faculty of Engineering — 2d streak" />
        </div>
      </Vignette>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Render verification stills**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/r6-v1.png --frame=816
npx remotion still BrandFilm out/test-stills/r6-v2.png --frame=927
npx remotion still BrandFilm out/test-stills/r6-v3.png --frame=1046
```
Expected: `r6-v1.png` shows "Students / 76+ / Already locked in across campus", flat-on (well past its 16-frame rotate-in window). `r6-v2.png` shows "Focus Minutes / 1,200+ / Logged and counting". `r6-v3.png` shows "#1 Jnr Einstein / 75 pts / Faculty of Engineering — 2d streak". Each isolated, no overlap. View all three with the Read tool.

- [ ] **Step 3: Commit**

```bash
git add remotion-video/src/scenes/brand/Scene4ProofMontage.tsx
git commit -m "feat(brand-film): rework Scene4ProofMontage with real stats and flip-style vignette transitions"
```

---

## Task 7: Rework Scene5Payoff — real room titles, translateZ depth

**Files:**
- Modify: `remotion-video/src/scenes/brand/Scene5Payoff.tsx` (full rewrite)

**Interfaces:**
- Consumes: `ParallaxLayer` from `./components/ParallaxLayer` (unchanged, still exists from the original plan's Task 5); `COLORS` from `./constants`.
- Produces: `Scene5Payoff` (`React.FC`, no props) — same export name/signature as before.

- [ ] **Step 1: Replace the full contents of `Scene5Payoff.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { ParallaxLayer } from './components/ParallaxLayer';
import { COLORS } from './constants';

const CARDS = [
  { title: 'Creating Portfolio Websites with AI', type: 'Skill', depth: 0 },
  { title: 'Calculus Study Group', type: 'Study', depth: 1 },
  { title: 'Intro to Machine Learning', type: 'Skill', depth: 0 },
  { title: 'Thermodynamics Revision', type: 'Study', depth: 1 },
  { title: 'Public Speaking Workshop', type: 'Skill', depth: 2 },
  { title: 'Geosciences Field Methods', type: 'Study', depth: 2 },
];

const POSITIONS = [
  { x: 140, y: 140 },
  { x: 700, y: 90 },
  { x: 1280, y: 160 },
  { x: 220, y: 620 },
  { x: 760, y: 700 },
  { x: 1320, y: 640 },
];

const DEPTH_Z: Record<number, number> = { 0: 60, 1: 0, 2: -60 };

const MosaicCard: React.FC<{ title: string; type: string; x: number; y: number; depth: number; delay: number }> = ({
  title,
  type,
  x,
  y,
  depth,
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
        scale,
        translate: `0px 0px ${DEPTH_Z[depth]}px`,
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
    <AbsoluteFill style={{ background: COLORS.bg, overflow: 'hidden', perspective: 2000 }}>
      {CARDS.map((card, i) => (
        <ParallaxLayer key={card.title} speed={card.depth === 0 ? 0.05 : card.depth === 1 ? 0.1 : 0.16}>
          <MosaicCard
            title={card.title}
            type={card.type}
            x={POSITIONS[i].x}
            y={POSITIONS[i].y}
            depth={card.depth}
            delay={i * 8}
          />
        </ParallaxLayer>
      ))}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Render verification still**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/r7-mosaic.png --frame=1152
```
Expected: shows all 6 cards with the new real titles ("Creating Portfolio Websites with AI", "Calculus Study Group", "Intro to Machine Learning", "Thermodynamics Revision", "Public Speaking Workshop", "Geosciences Field Methods"), fully faded in. View with the Read tool.

- [ ] **Step 3: Commit**

```bash
git add remotion-video/src/scenes/brand/Scene5Payoff.tsx
git commit -m "feat(brand-film): rework Scene5Payoff with real room titles and translateZ depth"
```

---

## Task 8: Rework Scene6CTA — pure wordmark, 3D flip, real+campaign tagline

**Files:**
- Modify: `remotion-video/src/scenes/brand/Scene6CTA.tsx` (full rewrite)

**Interfaces:**
- Consumes: `COLORS`, `SCENE_DURATIONS.cta` from `./constants`.
- Produces: `Scene6CTA` (`React.FC`, no props) — same export name/signature as before.

- [ ] **Step 1: Replace the full contents of `Scene6CTA.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS, SCENE_DURATIONS } from './constants';

export const Scene6CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const materialize = spring({ fps, frame: frame - 5, config: { damping: 200 } });
  const wordmarkRotateY = interpolate(materialize, [0, 1], [60, 0]);
  const wordmarkOpacity = interpolate(materialize, [0, 1], [0, 1]);
  const idleWobble = materialize >= 1 ? Math.sin(frame / 40) * 2 : 0;

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
    <AbsoluteFill style={{ background: COLORS.bg, opacity: fadeOut, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ perspective: 700 }}>
          <div
            style={{
              opacity: wordmarkOpacity,
              rotate: `y ${wordmarkRotateY + idleWobble}deg`,
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: 56,
              letterSpacing: '-0.02em',
            }}
          >
            Locked In.
          </div>
        </div>

        <div
          style={{
            opacity: taglineOpacity,
            translate: `0 ${taglineY}px`,
            color: COLORS.textMuted,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 22,
            textAlign: 'center',
          }}
        >
          Learn anything. From anyone.
        </div>

        <div
          style={{
            opacity: ctaOpacity,
            marginTop: 10,
            background: COLORS.white,
            borderRadius: 14,
            padding: '14px 36px',
            color: '#000',
            fontWeight: 800,
            fontSize: 18,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Get Started — Free
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Render verification stills**

Run:
```bash
cd "remotion-video"
npx remotion still BrandFilm out/test-stills/r8-cta-mid.png --frame=1290
npx remotion still BrandFilm out/test-stills/r8-cta-done.png --frame=1396
```
Expected: `r8-cta-mid.png` (global 1290 = local 54) shows "Locked In." settled (flip-in spring at frame-5 has had 49 frames to settle) and the tagline "Learn anything. From anyone." beginning to appear (taglineIn spring at frame-35=19, partway through), CTA button not yet visible (ctaIn at frame-65=-11, not started) — no icon/logo box anywhere. `r8-cta-done.png` (global 1396 = local 160) shows wordmark, tagline, and the white "Get Started — Free" button all visible, dimmed toward black per the fade-out window `[148,168]`. View both with the Read tool.

- [ ] **Step 3: Commit**

```bash
git add remotion-video/src/scenes/brand/Scene6CTA.tsx
git commit -m "feat(brand-film): rework Scene6CTA with pure wordmark, 3D flip, real CTA copy"
```

---

## Task 9: Full silent render and review (redo)

**Files:** none (render/verification only).

- [ ] **Step 1: Render the full silent video**

Run:
```bash
cd "remotion-video"
npx remotion render BrandFilm out/BrandFilm-silent-v2.mp4
```
Expected: renders all 1404 frames without errors.

- [ ] **Step 2: Open for review**

Run: `explorer.exe "out/BrandFilm-silent-v2.mp4"`

Confirm with the user that: no logos/icons appear anywhere, the opening URL-typing beat reads clearly, the browser-window hero scene with the real room card feels alive (continuous tilt) rather than static, the flip transitions read as 3D rather than flat fades, and the stats/leaderboard content in the proof montage and the room titles in the payoff mosaic are the real copy from the screenshots. **Do not proceed to Task 10 until the user has confirmed.**

- [ ] **Step 3: Commit (if any fixes were made during review)**

If changes were requested, make them, re-render, and commit:
```bash
git add remotion-video/src/scenes/brand/
git commit -m "fix(brand-film): address rework review feedback"
```
If no changes were needed, skip this step.

---

## Task 10: Generate voiceover via Higgsfield TTS

**Files:**
- Create: `remotion-video/public/brand/vo-reveal.mp3`
- Create: `remotion-video/public/brand/vo-hero.mp3`
- Create: `remotion-video/public/brand/vo-montage.mp3`
- Create: `remotion-video/public/brand/vo-payoff.mp3`
- Create: `remotion-video/public/brand/vo-cta.mp3`

**Interfaces:**
- Produces: 5 voiceover audio files (no narration on Scene1 — the typing visual carries that beat), used by Task 12.

- [ ] **Step 1: Pick a voice**

Call the Higgsfield `list_voices` tool. Pick one preset voice suited to a calm, confident, modern product-film narrator (not overly energetic/ad-like). Note its exact `voice_id` and `voice_type` for Step 2.

- [ ] **Step 2: Generate each line with `generate_audio`**

For each line below, call `generate_audio` with `model: 'text2speech_v2_elevenlabs'` (or another `text2speech_v2_*` model if `text2speech_v2_elevenlabs` is unavailable), the chosen `voice_id`/`voice_type` from Step 1, and `prompt` set to the line text:

| File | Line |
|------|------|
| `vo-reveal.mp3` | "This is Locked In." |
| `vo-hero.mp3` | "Join a live skill room — taught by a student just like you. Ask questions, get answers, and actually get it, in real time." |
| `vo-montage.mp3` | "Seventy-six plus students. Twelve hundred plus focus minutes. Across six faculties — and counting." |
| `vo-payoff.mp3` | "Hundreds of rooms. Every subject. Every skill." |
| `vo-cta.mp3` | "Learn anything. From anyone. Get locked in." |

Save each generated file to `remotion-video/public/brand/<filename>` (create the `public/brand/` directory if it doesn't exist).

- [ ] **Step 3: Verify each file's duration fits its scene**

Each scene has a maximum available window (in seconds, at 30fps): reveal ≤5.6s, hero ≤15s, montage ≤9.4s, payoff ≤5.6s, cta ≤5.6s. For each file, run:
```bash
cd "remotion-video"
node -e "console.log(require('fs').statSync('public/brand/vo-reveal.mp3').size)"
```
(repeat per file to confirm non-zero size). Then get each clip's duration — if `ffprobe` is available: `ffprobe -i public/brand/vo-reveal.mp3 -show_entries format=duration -v quiet -of csv="p=0"` (repeat per file). If any clip's duration exceeds its scene's window, that line must be shortened and regenerated (do not let voiceover run past its scene into the next one).

- [ ] **Step 4: Commit**

```bash
git add remotion-video/public/brand/vo-reveal.mp3 remotion-video/public/brand/vo-hero.mp3 remotion-video/public/brand/vo-montage.mp3 remotion-video/public/brand/vo-payoff.mp3 remotion-video/public/brand/vo-cta.mp3
git commit -m "feat(brand-film): add generated voiceover lines"
```

---

## Task 11: Source royalty-free music and SFX

**Files:**
- Create: `remotion-video/public/brand/music.mp3`
- Create: `remotion-video/public/brand/sfx-whoosh.mp3`

**Interfaces:**
- Produces: a music bed and one transition whoosh SFX, used by Task 12.

- [ ] **Step 1: Find a royalty-free track**

Use WebSearch to find a cinematic/minimal-tech instrumental track (roughly 45-50s, or loopable/trimmable to that length) explicitly licensed for free commercial use with no attribution required, or attribution-required if the license terms are clearly stated and acceptable (note the license and any required attribution in the commit message). Prefer sources with explicit "royalty-free" or Creative Commons licensing pages (e.g. Pixabay Music's royalty-free license, which permits commercial use without attribution). Do not use a track without confirming its license terms allow this use.

- [ ] **Step 2: Find a transition whoosh SFX**

Similarly source one short (under 1s) soft whoosh sound effect under a compatible free-commercial-use license.

- [ ] **Step 3: Download and place both files**

Save to `remotion-video/public/brand/music.mp3` and `remotion-video/public/brand/sfx-whoosh.mp3`.

- [ ] **Step 4: Verify both files**

```bash
cd "remotion-video"
node -e "console.log(require('fs').statSync('public/brand/music.mp3').size)"
node -e "console.log(require('fs').statSync('public/brand/sfx-whoosh.mp3').size)"
```
Expected: both non-zero.

- [ ] **Step 5: Commit**

```bash
git add remotion-video/public/brand/music.mp3 remotion-video/public/brand/sfx-whoosh.mp3
git commit -m "feat(brand-film): add royalty-free music bed and transition SFX

Source/license: [fill in the actual source URL and license terms found in Step 1-2]"
```

---

## Task 12: Wire voiceover, music, and SFX into BrandFilm; final render

**Files:**
- Modify: `remotion-video/src/BrandFilm.tsx`

**Interfaces:**
- Consumes: all files from Tasks 10-11 in `remotion-video/public/brand/`; global scene start frames: coldOpen=0, reveal=168, skillRoomHero=336, proofMontage=786, payoff=1068, cta=1236 (derived from `SCENE_DURATIONS`/`TRANSITION_FRAMES` exactly as in the original plan).
- Produces: final `out/BrandFilm.mp4`.

- [ ] **Step 1: Add audio imports and elements**

Change the existing `import { AbsoluteFill } from 'remotion';` line to:

```tsx
import { AbsoluteFill, Sequence, Audio, staticFile } from 'remotion';
```

Add as the last children inside the outer `AbsoluteFill` (after `<GrainOverlay />`):

```tsx
      <GrainOverlay />

      <Audio src={staticFile('brand/music.mp3')} volume={0.7} />

      <Sequence from={150}><Audio src={staticFile('brand/sfx-whoosh.mp3')} volume={0.5} /></Sequence>
      <Sequence from={318}><Audio src={staticFile('brand/sfx-whoosh.mp3')} volume={0.5} /></Sequence>
      <Sequence from={768}><Audio src={staticFile('brand/sfx-whoosh.mp3')} volume={0.5} /></Sequence>
      <Sequence from={1050}><Audio src={staticFile('brand/sfx-whoosh.mp3')} volume={0.5} /></Sequence>
      <Sequence from={1218}><Audio src={staticFile('brand/sfx-whoosh.mp3')} volume={0.5} /></Sequence>

      <Sequence from={168}><Audio src={staticFile('brand/vo-reveal.mp3')} volume={1} /></Sequence>
      <Sequence from={336}><Audio src={staticFile('brand/vo-hero.mp3')} volume={1} /></Sequence>
      <Sequence from={786}><Audio src={staticFile('brand/vo-montage.mp3')} volume={1} /></Sequence>
      <Sequence from={1068}><Audio src={staticFile('brand/vo-payoff.mp3')} volume={1} /></Sequence>
      <Sequence from={1236}><Audio src={staticFile('brand/vo-cta.mp3')} volume={1} /></Sequence>
```

- [ ] **Step 2: Final render**

Run:
```bash
cd "remotion-video"
npx remotion render BrandFilm out/BrandFilm.mp4
```
Expected: renders without errors, producing `out/BrandFilm.mp4` with full audio.

- [ ] **Step 3: Open for review**

Run: `explorer.exe "out/BrandFilm.mp4"`

Confirm with the user that voiceover lines land correctly in their scenes, music plays throughout, and whoosh SFX hit the 5 transitions.

- [ ] **Step 4: Commit**

```bash
git add remotion-video/src/BrandFilm.tsx
git commit -m "feat(brand-film): wire voiceover, music, and SFX into BrandFilm, final render"
```
