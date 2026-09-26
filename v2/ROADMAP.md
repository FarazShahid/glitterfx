# GlitterFX V2 — Build Path

The goal is working software as quickly as possible while keeping V1 safe.

Each objective has only three states: `NEXT`, `DOING`, `DONE`.
Finish the objective, run its checks, update `PROJECT_STATE.md`, move on.

---

## Step 0 — Isolate V2 — DONE

Built:
- `v2-engine` branch from V1 `main`
- V2 workspace under `/v2`
- automatic guard that prevents V2 work from modifying V1 runtime/demo/docs files

Done check:
- V1 files unchanged
- governance action passes

---

## Step 1 — Make V2 runnable — NEXT

### 1.1 Workspace + TypeScript
Build:
- real package manifests for `core`, `backend-canvas`, `backend-webgl`, `effects`, and `playground`
- strict TypeScript
- minimal build/test commands

Done when:
- clean install works
- typecheck/build/test commands pass

### 1.2 Minimal public API
Build the smallest API needed for the vertical slice:

```ts
new GlitterFX(element, {
  effect: 'star-field',
  renderer: 'canvas' | 'webgl' | 'auto',
  quality: 'eco' | 'balanced' | 'high',
  density,
  speed,
  size,
  brightness,
  glow,
  palette,
  seed
});
```

Also support:
- `start()`
- `stop()`
- `resize()`
- `update()`
- `destroy()`

Done when:
- a fake backend can run through the lifecycle
- explicit renderer selection is respected
- `auto` can choose from registered backends

### 1.3 Playground shell
Build one local playground page with controls for:
- backend
- quality
- density
- speed
- size
- brightness
- glow
- seed

Done when:
- changing controls updates a running instance without page edits

---

## Step 2 — Build the first complete effect: Star Field

This is the architecture proof. Do not build a generic effect DSL first.

### 2.1 Shared Star Field semantics
Define only the shared data Star Field actually needs:
- seeded particles
- position/depth
- size
- color
- twinkle phase
- drift/parallax parameters
- quality particle budgets

Done when:
- both backends can consume the same normalized Star Field config

### 2.2 Canvas/CPU Star Field
Build:
- typed-array particle state
- deterministic seeding
- parallax/drift
- depth-aware size/alpha
- cached procedural star core + halo
- twinkle
- DPR cap

Target:
- visually premium at roughly 500–2,000 particles depending on quality

Done when:
- fixed seed reproduces the same field
- pause/resume/update/destroy work
- playground looks intentionally designed, not like basic dots

### 2.3 WebGL Star Field
Build:
- Three.js/WebGL backend
- BufferGeometry
- custom GLSL star material
- procedural core/halo/diffraction
- shader-driven twinkle and motion where practical
- depth-aware perspective
- no unnecessary per-frame CPU position loop

Target:
- substantially higher particle count/fidelity than Canvas on normal integrated graphics

Done when:
- same public config works unchanged
- visually stronger than V1 star-field
- CPU profile does not show O(N) JS position updates for shader-driven motion

### 2.4 Compare and tune
In the playground show Canvas and WebGL using the same seed/config.

Done when:
- both clearly represent the same effect
- Canvas is attractive and lightweight
- WebGL is visibly richer
- backend can be changed by one config value

---

## Step 3 — Extract the reusable engine primitives

Only extract abstractions now that two real implementations exist.

Build the minimum reusable primitives required by the next effects:
- particle store
- seeded random
- emitters: point / box / sphere / ring
- forces/behaviors: drift / gravity-buoyancy / drag / wind / vortex / turbulence
- appearance: glow / twinkle / depth
- per-backend particle budgets

Do not create a compiler or large DSL unless duplication in real effects proves it is needed.

Done when:
- Star Field still works unchanged
- at least one new effect can reuse the primitives without copying its engine

---

## Step 4 — Transitions and visual depth

### 4.1 Transition engine
Build:
- crossfade
- morph where particle correspondence is possible
- dissolve/noise

API target:

```ts
fx.transitionTo('galaxy', {
  duration: 1800,
  type: 'morph'
});
```

Done when:
- transitions can finish, cancel, and restart cleanly
- no flash caused by dispose/rebuild

### 4.2 Glow / haze / depth
Canvas:
- efficient cached glow
- depth-aware blur illusion
- lightweight haze

WebGL:
- better procedural glow
- depth-aware point response
- optional lightweight bloom/post hook, disabled by default

Done when:
- glow is visibly better than V1
- base effects remain lightweight without post-processing

---

## Step 5 — Prove the engine with four more effects

Implement each in this order, CPU/Canvas first and WebGL second:

1. `galaxy`
2. `supernova`
3. `ember-storm`
4. `curl-flow`

For each:
- use the same public config semantics
- reuse existing primitives
- add a new primitive only when necessary
- tune Canvas and WebGL separately for the same art direction
- test in playground
- verify cleanup and reasonable performance

Done when:
- five total reference effects cover stars, orbital motion, bursts/lifetimes, buoyancy/drag, turbulence/curl flow
- adding an effect is straightforward and does not require modifying core engine logic

---

## Step 6 — Website behavior and developer controls

Build:
- explicit backend choice
- `auto` backend selection
- ordered fallback option
- capability inspection
- quality profiles
- pause while tab is hidden/offscreen
- `prefers-reduced-motion`
- context-loss handling for WebGL
- React wrapper after vanilla API is stable

Done when:
- library behaves well as a website background/component effect, not a continuously running game loop

---

## Step 7 — Port the V1 catalog

Inventory the existing 26 V1 effects and port them one by one.

Per effect:
1. reproduce/upgrade visual identity in Canvas
2. build/tune WebGL version
3. reuse existing primitives
4. add only genuinely missing primitives
5. add transition compatibility
6. test in playground

Do not rewrite V1. V2 gets its own implementations.

Done when:
- V2 covers the desired V1 catalog with better visuals and the dual-backend model

---

## Step 8 — Optional WebGPU

Only after Canvas + WebGL are mature.

Build WebGPU only where it provides a real improvement:
- very high particle counts
- compute-driven simulation
- advanced post effects

It remains optional and must not increase the baseline requirements of GlitterFX.

---

## Step 9 — Package and release V2

Build:
- optimized bundles
- ESM package
- browser build if useful
- docs/examples
- V1 -> V2 migration notes
- prerelease package first

Done when:
- existing V1 users remain unaffected
- V2 can be installed independently and used in a real website with either Canvas or WebGL
