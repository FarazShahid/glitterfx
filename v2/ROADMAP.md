# GlitterFX V2 — Development Path

This is the only implementation roadmap for V2.

Rule: build the current objective, verify it works, then move to the next objective. No extra process layer is required.

The working V2 baseline already includes Canvas + WebGL, 27 effects, transitions, trails, haze, effect params, React/browser packages, V1 compatibility, and green CI.

---

# Step 1 — Glitter Shimmer

Goal: create the flagship effect that visually defines GlitterFX.

## 1.1 Glint pulse primitive — DONE
Build:
- CPU `glintPulse()` in shared behaviors
- matching GLSL implementation
- deterministic irregular shimmer + rare sharp flare response

Done when:
- CPU and GLSL formulas match closely
- fixed seed/time gives repeatable output
- existing effects are unchanged

## 1.2 Glitter Shimmer effect — DONE
Build:
- new `glitter-shimmer` ParticleEffect
- dense micro-glitter population
- sparse brighter flare population
- layered depth
- existing glow / softness / palette channels
- Canvas + WebGL support through current renderers

Done when:
- Canvas looks premium, not like basic dots
- WebGL is visibly richer with the same config
- no new renderer is required

## 1.3 Glitter controls + tuning — DONE
Add useful effect params:
- flare rate
- shimmer strength
- depth
- optional shimmer-wave strength

Add them to the playground automatically through the existing effect-param UI.

Done when:
- effect can be tuned from subtle component sparkle to full hero glitter
- fixed presets look good at eco / balanced / high

---

# Step 2 — Cheap New Effects

Goal: expand the catalog quickly using capabilities V2 already has.

## 2.1 Warp Speed — DONE
Use:
- radial stream
- accelerated movement
- existing trails
- starlight palette
- depth/size growth

Only extend the radial archetype if the visual genuinely needs a missing parameter.

## 2.2 Bioluminescent Ocean — DONE
Use:
- wave archetype
- strong crest-driven brightness
- aqua/quantum palette
- slow lateral flow
- dark cyan haze

Only add field-to-glow mapping if current crest alpha is not enough.

## 2.3 Ambient Drift Pack — DONE
Add:
- `pollen-drift`
- `falling-ash`
- `dust-motes`
- `dandelion-seeds`
- `rising-lanterns`

Use the existing drift archetype. Avoid engine changes unless an effect cannot be represented cleanly.

## 2.4 Accretion Disk + Planetary Rings — DONE
First try the existing radial orbit model.

Add only if required:
- disk orientation
- inner/outer radius band
- radial heat/brightness curve

Done when Step 2 adds the effects without creating another general framework.

---

# Step 3 — Pointer Interaction

Goal: make every existing effect react to the user.

## 3.1 Public interaction config — DONE
Add:

```ts
interaction: {
  pointer: 'none' | 'repel' | 'attract' | 'vortex',
  radius: 140,
  strength: 0.8
}
```

Normalize it in core.

## 3.2 Pointer runtime state — DONE
Track:
- pointer x/y in effect/container coordinates
- pointer velocity
- active/down state if useful

Keep rendering canvases `pointer-events: none`.

## 3.3 Canvas interaction — DONE
Apply the generic interaction transform after `effect.sample()` and before drawing.

Implement:
- repel
- attract
- vortex

## 3.4 WebGL interaction — DONE
Pass pointer state as shared uniforms.

Apply the same interaction math in the common WebGL particle path so every effect gets it without effect-specific shaders.

## 3.5 Playground controls — DONE
Add pointer mode, radius and strength controls.

Done when:
- Star Field, Galaxy, Glitter, Dust and Plasma all react without custom per-effect interaction code
- Canvas and WebGL feel directionally equivalent


## 3.6 Motion controls — DONE
Added on owner request: `motion: { x, y, z, reverse }` for every effect. x/y flow (wrapped), z perspective fly-through, reverse time. Integrated offsets in core; shared `applyMotion()` on Canvas and in the common WebGL point path; playground sliders + direction toggle.
---

# Step 4 — Shape Targets

Goal: particles can form text, logos, SVGs and images.

## 4.1 Target data contract — NEXT
Add a renderer-independent target type:

```ts
interface ParticleTarget {
  points: Float32Array;
  count: number;
  aspect: number;
  key?: string;
}
```

Add target data to the config path without forcing DOM/browser types into core.

## 4.2 Points + text samplers
Build browser helpers:
- `createPointsTarget()`
- `createTextTarget()`

Sampling must be deterministic.

## 4.3 Shape Target effect
Create one `shape-target` effect that maps generated particles to target positions.

Use the existing generic Canvas/WebGL rendering pipeline.

## 4.4 Reuse existing morph
Use the existing transition system for:
- Star Field -> text
- Glitter -> text
- Galaxy -> logo target
- target -> normal effect

Do not build a second assembly engine unless the existing morph is visually insufficient.

## 4.5 SVG + image samplers
Add:
- `createSvgTarget()`
- `createImageTarget()`

## 4.6 Playground target lab
Add:
- text input
- SVG paste/upload
- image target input
- assemble/morph demo

Done when the same target data works on Canvas and WebGL.

---

# Step 5 — Shaped Particles

Goal: petals, leaves, confetti and snow look like real objects instead of glowing points.

## 5.1 Sprite particle data
Support:
- sprite id
- rotation
- angular velocity
- aspect ratio

Keep normal point particles unchanged.

## 5.2 Canvas sprite renderer
Use cached sprites/images and transformed `drawImage()`.

## 5.3 WebGL sprite renderer
Add billboard/instanced quads with a compact sprite atlas.

Do not replace the existing THREE.Points renderer.

## 5.4 Upgrade existing effects
Convert in this order:
1. confetti-drop
2. cherry-blossom
3. falling-leaves
4. snow-storm
5. bubble-rise

Done when motion still comes from the existing archetypes and only visual representation changes.

---

# Step 6 — Custom Palettes + Web Component

Goal: make GlitterFX easier to brand and embed.

## 6.1 Custom palette input
Support:
- named palette
- hex color array
- weighted palette object

Example:

```ts
palette: {
  colors: ['#ff4d8d', '#ffd36a', '#ffffff'],
  weights: [0.5, 0.3, 0.2]
}
```

Keep the current internal Palette format.

## 6.2 Palette registry
Expose:

```ts
registerPalette('brand', ...)
```

## 6.3 CSS/brand helper
Browser helper may resolve CSS variables / computed brand colors.

Do not put CSS parsing in the effects package.

## 6.4 Web Component
Create a thin wrapper:

```html
<glitter-fx
  effect="galaxy"
  renderer="webgl"
  quality="high"
  palette="aurora">
</glitter-fx>
```

Observed attributes cover common scalar options.
Advanced objects remain JavaScript properties.

Done when it uses the same browser/core runtime with no duplicate engine.

---

# Step 7 — New Closed-Form Effects

Goal: add richer effects while preserving V2's stateless GPU-friendly architecture.

## 7.1 Fireworks
Implement deterministic repeating groups:
- launch time
- burst center
- radial direction
- gravity
- drag
- color cooling
- lifetime

Do not build a generic event bus first.

## 7.2 Rain + Splash
Build:
- rain streak effect
- deterministic splash population tied to impact phase

No collision engine required.

## 7.3 Comet
Build:
- moving bright head
- deterministic turbulent tail
- velocity-aligned trail

## 7.4 Parametric path archetype
Add one reusable path model.

Use it for:
- DNA helix
- data streams
- orbital ribbons

Done when all effects remain closed-form and WebGL keeps O(1) JS work per frame.

---

# Step 8 — Micro-Interactions

Goal: move GlitterFX beyond backgrounds into component effects.

## 8.1 Sparkle helper
Target API:

```ts
GlitterFX.sparkle(button, {
  trigger: 'hover',
  preset: 'diamond-glint'
});
```

## 8.2 Initial presets
Build:
- button hover glitter
- heading shimmer/glint
- card-edge sparkle
- click burst
- cursor glitter trail
- success celebration

## 8.3 Small-effect performance
Start with Canvas for tiny local effects.

Only build a shared WebGL page renderer if real measurements show many component instances create too many contexts.

Done when component effects are lightweight enough for normal websites.

---

# Step 9 — External Control + Network Effects

## 9.1 Manual time / seek
Expose deterministic manual control such as:

```ts
fx.seek(seconds)
```

Use it for scroll-driven animation without coupling core to a scroll library.

## 9.2 Scroll helper
Map page/section progress to GlitterFX time or transitions.

## 9.3 Constellation/network layer
Add nearby-particle lines.

Use a spatial grid; never naive O(N²).

## 9.4 Audio input
Accept normalized:
- level
- bass
- mid
- treble

Keep microphone/WebAudio capture in a browser helper.

Done when external input is optional and normal effects remain deterministic without it.

---

# Step 10 — WebGPU / Stateful Physics

Do this only when an effect actually needs persistent simulation state.

Candidates:
- flocking / boids
- fluid particles
- N-body / dynamic gravity wells
- collisions
- reaction-diffusion
- very large stateful simulations

Objectives:
1. choose one stateful flagship effect
2. prove WebGL is actually the limiting factor
3. implement WebGPU for that use case
4. keep Canvas/WebGL approximation where practical

Do not migrate existing closed-form effects to WebGPU just for parity.

---

# Shipping Order

Work in this exact order unless a real implementation dependency proves otherwise:

1. Glitter Shimmer
2. Cheap effects pack
3. Pointer interaction
4. Shape Targets
5. Shaped particles
6. Custom palettes + Web Component
7. Fireworks / Rain / Comet / Parametric paths
8. Micro-interactions
9. Scroll / Constellations / Audio
10. Stateful physics / WebGPU

The public alpha release is independent of this development sequence and does not block Step 1.
