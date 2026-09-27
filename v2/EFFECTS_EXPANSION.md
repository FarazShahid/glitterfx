# GlitterFX V2 — Effects Expansion Plan

Use this after the first five V2 reference effects are working. The rule is simple: build the smallest reusable primitive that unlocks the most visible effects.

## A. Fast wins: mostly reuse existing engine

### A1. Glitter Shimmer
Goal: signature GlitterFX effect — dense fine sparkles, irregular micro-glints, rare bright star flares, layered depth.
Reuse: star glow, twinkle, depth, drift, palette, seeded randomness.
Add: `glintPulse(seed, frequency, sharpness)` and optional shimmer-wave modulation.
Canvas: cached sparkle sprites, mostly tiny glints, sparse larger flares.
WebGL: procedural core/halo + sharp glint pulse + diffraction on a subset.
Done when: it reads as premium glitter, not another star field, and works on both hero backgrounds and small components.

### A2. Warp Speed / Hyperspace
Reuse: star field, radial motion, depth.
Add: velocity-aligned streak rendering.
Canvas: draw previous-to-current projected line.
WebGL: stretched billboard/point or instanced streak.
Done when: one config can range from subtle space travel to aggressive hyperspace.

### A3. Fireworks
Reuse: supernova burst, gravity, drag, lifetime, glow.
Add: grouped/event burst centers.
Done when: multiple independent bursts can launch, explode, fall and fade without one-off engine code.

### A4. Ambient Drift Family
Effects: `rising-lanterns`, `pollen-drift`, `dandelion-seeds`, `falling-ash`, `dust-motes`.
Reuse: box emitter, wind, drift, buoyancy/gravity, depth, fade.
Add only if needed: oscillating sway.
Done when: each new effect is mostly art direction/configuration.

### A5. Bioluminescent Ocean
Reuse: wave field, glow, depth.
Add: scalar-field-to-appearance mapping so wave height can drive brightness/glow.
Canvas: projected 2D/2.5D wave points.
WebGL: vertex displacement + crest brightness.
Done when: luminous intensity clearly follows the moving wave crests.

## B. Reusable motion geometry

### B1. Accretion Disk / Black Hole
Reuse: ring emitter, orbit, depth, glow.
Add: radius-dependent angular velocity and configurable disk flattening/orientation.
Later WebGL option: center distortion/lensing.

### B2. Planetary Rings
Reuse: ring emitter/orbit/depth.
Add: oriented emitter transform and layered ring bands.

### B3. Comet
Reuse: moving source, trails, turbulence, glow.
Add: emitter attached to a moving target.

### B4. DNA Helix
Add: parametric path sampler.
CPU: closed-form helix positions.
WebGL: evaluate path from particle parameter in shader where useful.
Primitive should later support ribbons, spirals and curved data streams.

### B5. Data Streams
Reuse: parametric/path motion, glow, speed variance.
Add only if needed: lane/path routing.
Target variants: Matrix-like vertical streams, horizontal network traffic, curved AI/data flows.

### B6. Rain + Splash
Reuse: directional emitter, gravity, streaks, event burst.
Add: simple boundary/collision event that can trigger a secondary splash emitter.

## C. Major differentiating capabilities

### C1. Shape Targets — highest priority differentiator
Particles should form text, logos, SVG paths, icons and image silhouettes.

Core needs:
- target -> sampled point set
- deterministic particle-to-target mapping
- attract/morph toward target
- release/scatter away from target

CPU: pre-sampled target points + spring/lerp attraction.
WebGL: target buffer/texture + shader interpolation/force.

First demos:
1. text -> glitter
2. SVG/logo -> stars
3. logo -> galaxy morph

Done when: target sampling is renderer-independent and the same target data feeds Canvas and WebGL.

### C2. Pointer Interaction
Modes: repel, attract, orbit/swirl, sparkle trail, click burst, pointer wake.

API direction:
`interaction: { pointer: 'repel', radius: 120, strength: 0.8 }`

Canvas: local CPU force.
WebGL: pointer uniform + shader displacement/force where possible.
Done when: interaction can be attached to existing effects without effect-specific code.

### C3. Shaped Particles / Sprite Atlas
Targets: petals, leaves, snowflakes, hearts, confetti rectangles, bubbles, custom sprite.
Particle data: sprite index, rotation, angular velocity, aspect ratio.
Canvas: cached image/path sprites.
WebGL: billboard quads/instancing + texture atlas.
First upgrades: cherry blossom, falling leaves, confetti, snow.

### C4. Scroll-Driven Motion
Core exposes deterministic progress control, e.g. `fx.setProgress(0.42)`.
Browser helper maps scroll -> time, transition progress or preset.
Done when: animations can scrub forward/backward and do not depend on an internal clock.

### C5. Constellation / Network Lines
Connect nearby particles with opacity based on distance; optional pulses travel across edges.
CPU: spatial grid, never naive O(N²).
WebGL: start with CPU-built line segments; optimize only if measured need exists.

### C6. Audio Reactive
Normalize microphone/AudioElement/WebAudio analyser data into simple bands/amplitude.
Map to brightness, size, speed, burst rate, wave amplitude and palette shift.
Keep WebAudio capture as a helper; effects consume normalized values.

## D. Component-level GlitterFX

### D1. Micro-interactions
Targets: button hover glitter, heading shimmer, card-edge sparkle, click burst, cursor trail, success celebration, input-focus glow, image dust reveal.

API direction:
`GlitterFX.sparkle(button, { trigger: 'hover', preset: 'diamond-glint' })`

Important: tiny local budgets. If many components require WebGL, consider a shared page renderer only after prototypes prove it is needed.

## E. Product features

### E1. Brand palettes
Support direct hex arrays, weighted colors and CSS variables. Later optionally derive palettes from supplied brand colors.

### E2. Web Component
Thin wrapper over stable vanilla API:
`<glitter-fx effect="galaxy" renderer="webgl" quality="balanced"></glitter-fx>`

### E3. Preset Gallery + Shareable URLs
Serialize playground state into URL. Support copy link, copy JS config, copy Web Component markup, curated presets and Canvas/WebGL comparison.

### E4. Auto Quality
Under `quality: 'auto'`, adapt particle count, DPR, trails and expensive post effects when sustained frame time degrades. Manual quality remains authoritative.

### E5. Still-image fallback
Capture deterministic frames for reduced-motion users and instant first paint.

### E6. Video/frame export
Deterministic seed + time makes exact frame sequences possible. Prefer image sequence/WebM first; keep GIF encoding optional.

### E7. No-code integrations
After API/Web Component stability: Webflow, Framer, Shopify and WordPress wrappers. They must wrap the same engine, not fork it.

## F. WebGPU / advanced stateful physics candidates

Only revisit WebGPU where it creates measurable value:
- flocking / boids
- N-body attraction
- fluid-like particles
- reaction-diffusion fields
- dense collision fields
- very large dynamic network simulations
- hundreds of thousands of persistent particles

Canvas/WebGL should still provide a cheaper approximation where practical.

## Recommended implementation order after the five reference effects

1. Glitter Shimmer
2. Pointer Interaction
3. Shape Targets: text
4. Shape Targets: SVG/logo
5. Shaped Particles
6. Warp Speed
7. Fireworks
8. Rain + Splash
9. Accretion Disk
10. Bioluminescent Ocean
11. DNA / Parametric Paths
12. Constellation Lines
13. Scroll-driven control
14. Micro-interactions
15. Brand palettes
16. Web Component
17. Preset sharing
18. Audio reactive
19. Auto quality
20. Export / static fallback
21. Optional advanced WebGPU physics

Why this order: glitter gives immediate brand identity; pointer improves many effects; shape targets are the biggest differentiator; shaped particles upgrade several V1 effects; later work adds new primitives with broad reuse; product wrappers wait until the API is stable.

## Primitive -> capability map

| Primitive | Unlocks |
|---|---|
| glint pulse | glitter shimmer, diamond sparkle, button glints |
| velocity streak | warp speed, meteors, rain, comet |
| event/burst emitter | fireworks, rain splashes, click bursts |
| scalar field -> appearance | bioluminescent ocean, heat/plasma maps |
| radius-dependent orbit | accretion disk, planetary systems |
| moving attached emitter | comet, pointer trail, object trails |
| parametric path | DNA, data streams, ribbons, spirals |
| boundary/collision event | rain splash, bounce/spark surfaces |
| shape target sampler | text/logo/image formation and dissolve |
| pointer force | repel, attract, vortex, wake |
| sprite atlas + rotation | petals, leaves, snowflakes, confetti, hearts |
| external progress | scroll-driven effects, scrubbed transitions |
| spatial grid | constellation/network lines |
| normalized audio input | music-reactive effects |
| shared small-effect runtime | component micro-interactions |

## Playground evolution

Near term:
- V1 Reference / Canvas V2 / WebGL V2 selector
- side-by-side comparison
- quality + seed controls
- interaction toggle
- transition selector

Capability stage:
- text field for shape targets
- SVG upload/paste
- pointer interaction controls
- sprite selector
- scroll scrub slider
- audio demo input

Public gallery stage:
- categories
- curated presets
- shareable URLs
- copy code
- performance readout
- backend/device capability readout

The playground is where an effect is judged. If it is not visibly good there, it is not finished.