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
| 1 | Cold Open | 168f (5.6s) | Dark, minimal. Typography-only beat over a blurred, slow-zooming abstract background. Phrase builds: "Everyone knows something." → "Everyone wants to learn something." No app UI yet. |
| 2 | Reveal | 168f (5.6s) | Logo + app icon materialize from darkness (scale + blur-in) with a push-in camera move. Tagline locks into place: "Locked In." |
| 3 | Skill Room (hero) | 450f (15s) | Phone mockup rises into frame with parallax depth. A live Skill Room (e.g. "AI Prompting 101"): peer host, avatars joining with staggered spring-ins, chat bubbles, live indicator. Slowest, most lingering camera work — this is the emotional payoff. |
| 4 | Quick-fire proof montage | 282f (9.4s) | Three ~94f (3.1s) vignettes with snappy whip-pan/push cuts (not cross-fades): Study Room card joining → Focus Timer ticking with streak counter → Leaderboard rank climbing. Energetic pacing, contrasts scene 3's calm. |
| 5 | Payoff / breadth | 168f (5.6s) | Mosaic/grid of multiple skill + study room cards animating in across parallax depth layers — conveys scale/community. |
| 6 | CTA / Close | 168f (5.6s) | Logo lockup returns. Tagline: "Learn anything. From anyone." + call to action. Clean fade to black. |

Total timeline: 1404f (46.8s @ 30fps). Each non-final scene's `TransitionSeries.Sequence`
is declared as `base + 18` frames (the trailing 18 frames overlap into the cross-fade
with the next scene, per the `@remotion/transitions` convention already used in
`LockedInProductVideo`); the final scene is declared as `base` only. Because the
transition's overlap consumes exactly the extra frames added to each sequence, the net
visible timeline length equals the sum of the `base` values above — 1404f — not
1404 + (5 × 18). (Corrected from an earlier draft of this spec that both miscalculated
the per-scene seconds, summing to 25s instead of 50s, and then separately double-counted
the transition overlap on top of that. Scene order and proportions are unchanged; only
the frame math is fixed. 46.8s comfortably fits the ~45–60s horizontal-hero target
discussed earlier.)

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
