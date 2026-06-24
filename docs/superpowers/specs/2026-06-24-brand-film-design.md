# Brand Film: "Learn Anything, From Anyone" — Design Spec

## 1. Purpose

The existing `remotion-video` project contains `LockedInProductVideo`, a 35s vertical
(1080×1920) feature-tour video covering hook → app opens → timer → study rooms →
leaderboard → skill sessions → CTA. It works as a feature checklist but doesn't feel like
a premium, "big company" product film.

This spec defines a **new, separate composition** — `BrandFilm` — that re-frames the
product around a single emotional core (peer-to-peer skill-sharing) and is built with
Apple-style cinematic techniques: depth-based transitions, parallax camera motion, film
texture, and a custom-generated music/SFX score. The existing `LockedInProductVideo`
composition is left untouched.

A horizontal master (1920×1080, optimized for landing-page hero / YouTube) is built
first. A vertical re-cut for social/TikTok is an explicit follow-up, out of scope here.

## 2. Core Message

**"Learn anything. From anyone."**

The emotional center is peer-led Skill Rooms — students teaching and learning from each
other — not the feature list. Study rooms, the focus timer, and the leaderboard are
demoted to supporting proof points ("and it does this too"), shown in a fast montage
rather than as individually lingered-on features.

## 3. Format

- Composition id: `BrandFilm`
- Resolution: 1920×1080 (horizontal)
- Frame rate: 30fps
- Duration: ~1500 frames (50s)
- Registered as a second `<Composition>` in `src/Root.tsx`, alongside the existing
  `LockedInProductVideo` (not replacing it)

## 4. Scene Breakdown

| # | Scene | Frames (~sec) | Content |
|---|-------|----------------|---------|
| 1 | Cold Open | 90f (3s) | Dark, minimal. Typography-only beat over a blurred, slow-zooming abstract background. Phrase builds: "Everyone knows something." → "Everyone wants to learn something." No app UI yet. |
| 2 | Reveal | 90f (3s) | Logo + app icon materialize from darkness (scale + blur-in) with a push-in camera move. Tagline locks into place: "Locked In." |
| 3 | Skill Room (hero) | 240f (8s) | Phone mockup rises into frame with parallax depth. A live Skill Room (e.g. "AI Prompting 101"): peer host, avatars joining with staggered spring-ins, chat bubbles, live indicator. Slowest, most lingering camera work — this is the emotional payoff. |
| 4 | Quick-fire proof montage | 150f (5s) | Three ~50f (1.7s) vignettes with snappy whip-pan/push cuts (not cross-fades): Study Room card joining → Focus Timer ticking with streak counter → Leaderboard rank climbing. Energetic pacing, contrasts scene 3's calm. |
| 5 | Payoff / breadth | 90f (3s) | Mosaic/grid of multiple skill + study room cards animating in across parallax depth layers — conveys scale/community. |
| 6 | CTA / Close | 90f (3s) | Logo lockup returns. Tagline: "Learn anything. From anyone." + call to action. Clean fade to black. |

Total content: 750f. Remaining ~750f budget covers transition overlaps and breathing
room — final per-scene frame counts may shift ±10% during implementation to land cuts on
musical beats once the score is generated.

## 5. Visual Technique

- **Depth transitions**: replace the current flat `fadePres` (opacity-only cross-fade)
  with a `DepthTransition` presentation — outgoing scene scales down + blurs + dims,
  incoming scene scales up from 1.05→1.0, via `interpolate` + CSS `filter: blur()`. No
  new dependencies required (`@remotion/transitions` already supports custom
  presentations, as the current `fadePres` proves).
- **Parallax / camera motion**: background/midground/foreground layers move at
  different rates keyed off `useCurrentFrame()`. Scenes 1, 2, 3, and 5 additionally get a
  slow continuous push-in (scale 1 → ~1.04 over the scene's duration) for cinematic feel.
  Scene 4's montage is intentionally flatter/snappier to contrast.
- **Film texture**: a subtle, fixed-opacity tileable grain overlay (`AbsoluteFill` with a
  generated noise texture, blended via `mix-blend-mode`) plus a soft vignette gradient,
  applied globally in `BrandFilm.tsx`.

## 6. Audio

- **Music**: an original instrumental track generated via Higgsfield's audio generation
  tool, cinematic/minimal-tech mood, ~50s, with an energy curve matching the scene
  arc (calm open → uplifting reveal/hero beat → energetic montage → resolved close).
  Generated specifically for this video's timing rather than sourced/licensed.
- **SFX**: short one-shot sounds (soft whoosh on scene transitions, subtle UI tap/pop on
  avatar joins and card appearances), generated or sourced, synced to specific frames via
  `<Audio startFrom={...}>` inside `<Sequence>` blocks matching the visual beats they
  accompany.
- **Mix**: music bed throughout, ducked slightly under SFX hits at transition/beat
  moments.

## 7. File Structure

New files only — nothing in the existing `LockedInProductVideo` / `NScene*` files is
modified:

```
remotion-video/src/
  BrandFilm.tsx                          # TransitionSeries orchestrating the 6 scenes
  scenes/brand/
    Scene1ColdOpen.tsx
    Scene2Reveal.tsx
    Scene3SkillRoomHero.tsx
    Scene4ProofMontage.tsx
    Scene5Payoff.tsx
    Scene6CTA.tsx
    components/
      DepthTransition.tsx                # custom TransitionPresentation
      ParallaxLayer.tsx                  # depth-rate wrapper
      GrainOverlay.tsx                   # film texture + vignette
  assets/brand/
    music.mp3                            # generated score
    sfx-whoosh.mp3, sfx-tap.mp3, ...     # generated/sourced one-shots
```

`Root.tsx` gains one additional `<Composition>` entry for `BrandFilm`; the existing
`LockedInProductVideo` entry is untouched.

## 8. Deliverable / Out of Scope

- Deliverable: render `BrandFilm` to `out/BrandFilm.mp4` and open it for review, the same
  workflow used for the existing video.
- Out of scope for this spec: vertical re-cut for social platforms, publishing/deploying
  the video anywhere, modifying the existing `LockedInProductVideo` composition.
