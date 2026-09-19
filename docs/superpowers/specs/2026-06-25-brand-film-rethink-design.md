# Brand Film Rethink: "Learn Anything, From Anyone" — Design Spec v2

## 1. Overview

This spec extends the existing `BrandFilm` composition (defined in `2026-06-24-brand-film-design.md`) with a restructured narrative arc that borrows four motion-graphic techniques from the Madison AI explainer reference video. The existing 6-scene structure becomes a 7-scene structure by prepending a **Problem Beat** (Scene0) and expanding/rebuilding two mid-film scenes.

**Unchanged from v1:** Scene1ColdOpen, Scene2Reveal, Scene4ProofMontage, Scene6CTA — these files are untouched.

## 2. New Narrative Arc

| Beat | Emotion | Scene |
|------|---------|-------|
| Problem | "That's me" frustration | Scene0 |
| Bridge | Curiosity — someone searched for a fix | Scene1 |
| Reveal | Hope — the product appears | Scene2 |
| Feature walkthrough | Trust — see exactly how it works | Scene3 |
| Social proof | Validation — real numbers | Scene4 |
| Breadth / community | Desire — this is for everyone | Scene5 |
| CTA | Action | Scene6 |

## 3. Scene Breakdown

### Scene0 — Problem Beat (NEW)
- **Duration:** 150f (5s)
- **Background:** `#000000`
- **Content:** Three frustration bubbles stagger in (spring, offset by 15f each):
  - Bubble 1: "Textbooks don't explain it clearly 😤"
  - Bubble 2: "YouTube tutorials are 45 mins long 😩"
  - Bubble 3: "My study group just doesn't get it either 🤦"
  - Each is a dark pill (`#0d0d0d`, 1px `#333` border, 14px radius, white text 18px)
- **Outro text:** "Studying alone is hard." fades in at frame 110, white 48px bold, centered
- **Technique borrowed:** Madison floating task/pain bubbles

### Scene1 — Cold Open (UNCHANGED)
- **Duration:** 168f
- **File:** `Scene1ColdOpen.tsx` — no edits
- **Role in new arc:** The URL typing "lockedinumat.tech" now reads as someone actively searching for the solution introduced by Scene0

### Scene2 — Reveal (UNCHANGED)
- **Duration:** 168f
- **File:** `Scene2Reveal.tsx` — no edits

### Scene3 — Skill Room Hero (EXPANDED)
- **Duration:** 510f (17s), up from 450f
- **File:** `Scene3SkillRoomHero.tsx` — modified
- **Sub-beats:**

  | Frames | Content |
  |--------|---------|
  | 0–149 | Dashboard tab active in BrowserWindow sidebar. Stats cards: "3 rooms live", "12 students online", "Your streak: 5 days". Continuous tiltX/tiltY wobble (existing). |
  | 150–329 | Sidebar switches to "Host Room". A form appears: "Room Title" field, "Skill Category" dropdown, "Max Students" stepper. TypingText types "Creating Portfolio Websites with AI" into the title field (startFrame:160, framesPerChar:5). |
  | 330–509 | Existing RoomCard ("Creating Portfolio Websites with AI") fully visible. Cursor SVG animates from form → Join button → clicks. Floating reaction bubble appears at frame 420: "🔥 Just what I needed!" in a speech-bubble pill, springs in from top-right. |

- **Cursor:** White arrow SVG, 24×24px, absolute position, `interpolate` path across 3 waypoints
- **Reaction bubble:** `#1a1a1a` bg, white text, `border-radius:20px`, `border: 1px solid #333`, spring scale 0→1 at frame 420
- **Technique borrowed:** Madison cursor-driven UI tour + floating reaction bubbles

### Scene4 — Proof Montage (UNCHANGED)
- **Duration:** 282f
- **File:** `Scene4ProofMontage.tsx` — no edits

### Scene5 — Payoff / Breadth (REBUILT)
- **Duration:** 200f (6.7s), up from 168f
- **File:** `Scene5Payoff.tsx` — full rewrite
- **Content:** 6 avatar initials (K, A, S, M, J, R) orbit a central point in a ring. Each avatar is a 64×64 circle:
  - Background: accent color `#E63C0A`
  - Text: white, 20px bold
  - Orbit radius: 160px, evenly spaced (60° apart)
  - Each avatar starts at a random screen edge and springs to its orbit position over 60f, staggered by 8f per avatar
- **Wordmark formation:** At frame 140, avatars begin spiraling inward. By frame 180 they collapse to center-screen and "Locked In." wordmark crossfades in (opacity 0→1 over frames 160–180), scale 0.8→1.0 via spring
- **Technique borrowed:** Madison orbiting-avatar payoff / product coalesce

### Scene6 — CTA (UNCHANGED)
- **Duration:** 168f
- **File:** `Scene6CTA.tsx` — no edits

## 4. Duration & Timing Summary

| Scene | Duration | Change |
|-------|----------|--------|
| Scene0Problem | 150f | NEW |
| Scene1ColdOpen | 168f | — |
| Scene2Reveal | 168f | — |
| Scene3SkillRoomHero | 510f | +60f |
| Scene4ProofMontage | 282f | — |
| Scene5Payoff | 200f | +32f |
| Scene6CTA | 168f | — |
| **Total** | **1646f** | **+242f** |

TransitionSeries: 6 transitions × 18f overlap. Net visible = 1646f (54.9s @ 30fps).

## 5. Constants Changes

In `src/scenes/brand/constants.ts`:

```ts
// ADD to SCENE_DURATIONS:
problem: 150,

// CHANGE:
skillRoomHero: 510,   // was 450
payoff: 200,          // was 168

// TOTAL_DURATION recalculates automatically via Object.values sum
```

## 6. BrandFilm.tsx Changes

- Import `Scene0Problem` from `./scenes/brand/Scene0Problem`
- Add as the first `<TransitionSeries.Sequence>` with `durationInFrames={SCENE_DURATIONS.problem + T}`
- Flip transition directions: Scene0→Scene1 right, Scene1→Scene2 left, etc. (alternating)
- Update total sequence count comment (6 transitions, 7 scenes)

## 7. New File

`src/scenes/brand/Scene0Problem.tsx` — created fresh per spec above.

## 8. Madison Technique Checklist

| Technique | Scene | Status |
|-----------|-------|--------|
| Floating pain/task bubbles | Scene0 | Implemented |
| Cursor-driven UI walkthrough | Scene3 sub-beat 3 | Implemented |
| Floating reaction bubble | Scene3 sub-beat 3 | Implemented |
| Orbiting-avatar payoff formation | Scene5 | Implemented |

## 9. Out of Scope

- Audio (voiceover, music, SFX) — deferred
- Vertical re-cut for social
- Any changes to `LockedInProductVideo` composition
