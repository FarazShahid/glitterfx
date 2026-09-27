# GlitterFX V2 — Post-Alpha Effects Plan

This plan is based on the working V2 engine currently in `v2-engine`.

The current engine already has:
- Canvas + WebGL backends
- 27 effects
- generic `ParticleEffect` + `ParticleStore`
- drift / radial / wave / fountain / quantum / curl archetypes
- stateless closed-form CPU + GLSL motion
- morph / dissolve / crossfade
- trails on both backends
- haze / glow / depth softness
- effect-specific numeric params
- React and browser bundles

The goal is therefore **not to build more engine first**. Add the smallest extension that unlocks the next visible feature.

---

## Phase 1 — Signature effect + almost-free catalog additions

### 1. Glitter Shimmer — first

Create a new flagship `glitter-shimmer` effect, separate from V1 `emerald-shimmer`.

Visual target:
- dense micro-sparkles
- many low-energy glints
- rare sharp diffraction flares
- layered depth
- irregular timing, never synchronized blinking
- optional slow shimmer wave passing through the field

Implementation:
- add CPU `glintPulse()` to `effects/src/engine/behaviors.ts`
- mirror it in `backend-webgl/src/glsl/common.ts`
- add a hand-written `glitter-shimmer.ts` effect using the existing ParticleStore channels
- reuse current `flare`, glow, softness and palette channels
- add matching WebGL GLSL under `backend-webgl/src/effects`
- register in `effects/src/index.ts`
- add params only where useful: `flareRate`, `shimmer`, `depth`

Do not create a new renderer.

Done when Canvas looks premium and WebGL looks richer using the same seed/config.

### 2. Warp Speed — parameter-set first

The current radial archetype plus trails already supplies almost everything.

Build `warp-speed` using:
- radial stream
- accel curve
- zero/very low spin
- long trail samples
- strong depth/size growth
- starlight palette

Only extend the radial archetype if the visual genuinely requires a configurable vanishing point or trail taper not already available.

### 3. Bioluminescent Ocean — parameter-set first

The wave archetype already supports crest-driven alpha.

Build `bioluminescent-ocean` using:
- wave archetype
- crest near 1
- aqua / quantum-like palette
- slow lateral flow
- dark cyan haze
- fine particles plus a few bright crest flares if needed

Only add a field-to-glow parameter if alpha modulation is visually insufficient.

### 4. Ambient Drift Pack

Add as inexpensive catalog entries over `createDriftEffect()`:
- `pollen-drift`
- `falling-ash`
- `dust-motes`
- `dandelion-seeds`
- `rising-lanterns`

Do not add engine code unless a visual requirement cannot be represented by existing velocity/sway/wander/gust/blink/flutter/softness controls.

### 5. Accretion Disk + Planetary Rings

The radial orbit mode already has radius-dependent angular velocity.

First try parameter-set implementations:
- `accretion-disk`
- `planetary-rings`

Potential tiny radial extensions, only if required:
- whole-disk rotation angle
- radial brightness/heat curve
- configurable inner/outer radius band

Avoid physical N-body gravity; this is a visual background effect.

---

## Phase 2 — Pointer interaction as a global capability

This is cheaper in the current codebase than Shape Targets and improves almost every effect.

### Public API

Target:

```ts
new GlitterFX(el, {
  effect: 'galaxy',
  interaction: {
    pointer: 'repel', // none | repel | attract | vortex
    radius: 140,
    strength: 0.8
  }
});
```

### Core

Add normalized pointer-interaction config.

Track pointer position/velocity from the container without changing the effect clock.

Extend the backend frame/runtime input with:
- pointer x/y in CSS pixels
- pointer velocity
- active/down state

Keep the surface itself `pointer-events: none`; listen on the container/window as appropriate.

### Canvas

Apply a generic interaction transform after `effect.sample()` and before `paint()`.

Initial modes:
- repel
- attract
- vortex

This means all 27+ effects gain pointer interaction without effect-specific code.

### WebGL

Add uniforms for pointer state and interaction settings.

Apply the same generic displacement in the shared WebGL emission path before clip-space conversion.

### Follow-up interactions

Once the global force works:
- pointer wake
- sparkle cursor trail
- click burst

Trail/burst can be separate features; do not block the first pointer release on them.

---

## Phase 3 — Shape Targets

This is the largest product differentiator.

The existing morph system already solves the visual transition between an ordinary effect and a target effect. The missing piece is target point data.

### 3.1 Renderer-independent target type

Add a small core type:

```ts
interface ParticleTarget {
  readonly points: Float32Array; // normalized x,y pairs or x,y,z triples
  readonly count: number;
  readonly aspect: number;
  readonly key?: string;
}
```

Add `target?: ParticleTarget` to the options/config path.

Regenerate only when the target identity/key changes.

Do not put DOM/Text/SVG parsing in core.

### 3.2 Browser target samplers

Put browser-specific sampling helpers in the browser package (or a tiny targets package only if size justifies it):

- `createTextTarget(text, options)`
- `createSvgTarget(svg, options)`
- `createImageTarget(image, options)`
- `createPointsTarget(points)`

All helpers output the same `ParticleTarget`.

Sampling should be deterministic for a fixed source + seed.

### 3.3 Shape Target effect

Create one `shape-target` ParticleEffect.

Particle generation maps particles to target points using deterministic correspondence.

Canvas and WebGL then use the existing generic renderers.

### 3.4 Reuse existing transitions

This is the important shortcut:

```ts
fx.transitionTo(
  { effect: 'shape-target', target },
  { type: 'morph', duration: 1800 }
);
```

Existing morph should provide:
- galaxy -> logo
- star field -> text
- glitter -> SVG
- logo -> another effect

Do not build a separate assembly engine until this is visually proven insufficient.

### First demos

1. `HELLO` assembled from glitter
2. GlitterFX logo from stars
3. Galaxy -> logo -> galaxy
4. SVG icon -> supernova

---

## Phase 4 — Shaped particles

Current particles are point sprites. Petals/leaves/confetti/snow can become much better.

Do this as a separate rendering capability rather than bloating every current point effect.

### Data needed

Per particle:
- sprite id
- rotation
- angular velocity
- aspect ratio

### Canvas

Use cached sprite canvases/images and transformed `drawImage()`.

### WebGL

Use instanced/billboard quads plus a small texture atlas.

Do not replace the current THREE.Points renderer. Add a sprite renderer used only by effects that need it.

### First conversions

1. `confetti-drop`
2. `cherry-blossom`
3. `falling-leaves`
4. `snow-storm`
5. `bubble-rise`

Same motion archetypes; only appearance renderer changes.

---

## Phase 5 — Custom palettes + Web Component

These improve adoption rather than animation mechanics.

### 5.1 Custom palettes

Current `palette` is a registered string. Extend it without breaking named palettes.

Target API:

```ts
palette: ['#ff4d8d', '#ffd36a', '#ffffff']
```

and optionally:

```ts
palette: {
  colors: ['#ff4d8d', '#ffd36a', '#ffffff'],
  weights: [0.5, 0.3, 0.2]
}
```

Also expose:

```ts
registerPalette('brand', ...)
```

Resolve CSS variables in browser-facing helpers rather than in backend/effects math.

Keep the internal `Palette` representation exactly as it is now.

### 5.2 Web Component

Build a thin wrapper over the browser bundle, not a second engine.

Target:

```html
<glitter-fx
  effect="galaxy"
  renderer="webgl"
  quality="high"
  palette="aurora"
  density="0.8"
  glow="0.9">
</glitter-fx>
```

Support observed attributes for the common scalar config.

For advanced data such as shape targets and custom palette objects, expose JavaScript properties.

---

## Phase 6 — Closed-form effects before stateful systems

The V2 architecture is strongest when effects stay closed-form. Prefer that whenever possible.

### Fireworks

Do **not** build an event bus first.

Implement fireworks as deterministic repeating particle groups:
- each group has launch/burst time
- deterministic center
- deterministic burst direction
- gravity + drag closed form
- cooling color over life

Only add a general event-emitter system if multiple later effects prove it is required.

### Rain

First add `rain` as a drift/streak parameter set.

Then `rain-splash` as a custom closed-form two-population effect:
- drops
- splashes whose phase is derived from impact time

Again, no runtime collision engine is required.

### Comet

Use a closed-form moving head and trail particles derived from time.

### DNA / Data Streams

Add a single new parametric-path archetype:
- helix
- line/lane
- spline-like closed-form paths where practical

First effects:
- `dna-helix`
- `data-streams`
- `orbital-ribbons`

---

## Phase 7 — Component effects / micro-interactions

Build this after pointer + custom palette are stable.

Target use cases:
- button hover glitter
- heading glint sweep
- card edge sparkle
- click burst
- cursor glitter trail
- success celebration
- image dust reveal

Initial API can be simple:

```ts
GlitterFX.sparkle(button, {
  trigger: 'hover',
  preset: 'diamond-glint'
});
```

Start with Canvas for very small effects.

Only introduce a shared WebGL page renderer if measurements show that many component instances create too many contexts.

---

## Phase 8 — Scroll and external signals

### Scroll

Do not couple core to a scroll library.

Expose deterministic clock control:

```ts
fx.seek(seconds)
```

or a manual-time mode.

Then a helper can map scroll position to time.

Later, if needed, expose manual transition progress separately.

### Audio

Effects should consume normalized signals, not own microphone/WebAudio capture.

Possible normalized input:
- level
- bass
- mid
- treble

Map them to effect properties or effect-specific modulation.

Keep capture in a browser helper.

---

## Phase 9 — Constellation/network layer

This is a separate visual layer over particles.

Canvas:
- spatial grid
- compare local cells only
- draw lines below a distance threshold

WebGL:
- start with CPU-generated line segments
- optimize only after profiling

This spatial grid can later help:
- flocking neighborhoods
- local reactions
- collision approximations

Never start with O(N²).

---

## Phase 10 — WebGPU only for stateful simulation

The current WebGL architecture already does closed-form motion in shaders with O(1) JS per frame.

WebGPU becomes justified when we intentionally build:
- boids/flocking
- fluid particles
- persistent gravity wells / N-body
- particle collisions
- reaction-diffusion
- very large stateful simulations

Do not move current closed-form effects to WebGPU merely for technology parity.

---

# Recommended shipping order

After the 2.0 alpha:

1. **Glitter Shimmer**
2. **Warp Speed + Bioluminescent Ocean + Ambient Drift pack** — cheap catalog expansion
3. **Pointer interaction**
4. **Shape Targets: points/text**
5. **Shape Targets: SVG/image**
6. **Shaped particle renderer**
7. **Custom palettes**
8. **Web Component**
9. **Fireworks + Rain/Splash + Comet**
10. **Parametric paths: DNA/Data Streams**
11. **Micro-interactions**
12. **Scroll/manual time**
13. **Constellation lines**
14. **Audio reactive**
15. **Stateful physics/WebGPU, only when requested**

This order maximizes visible payoff while reusing the engine that already exists.
