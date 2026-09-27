# GlitterFX V2

Particle backgrounds for websites with two first-class renderers: **Canvas 2D** (no dependencies, runs everywhere) and **WebGL** (Three.js, shader-driven motion, about 7 to 12x the particles at the same quality). Both render the same 37 effects from the same configuration. V2 is a prerelease (`2.0.0-alpha`) and ships as separate `@glitterfx/*` packages; the V1 `glitterfx` package and CDN script are unchanged.



## Documentation

The detailed V2 documentation lives in [docs/](./docs/README.md):

- [Getting started](./docs/GETTING_STARTED.md) — npm, browser/CDN, Canvas-only, lifecycle and first integrations
- [API reference](./docs/API.md) — options, methods, transitions, runtime properties and exports
- [Effects catalog](./docs/EFFECTS.md) — all 37 effects, palettes, aliases and effect-specific parameters
- [Framework integrations](./docs/FRAMEWORKS.md) — React, Next.js, Vite and generic SPA patterns
- [CDN distribution](./docs/CDN.md) — npm CDN and the self-hosted Vercel CDN surface
- [Vercel deployment](./docs/VERCEL.md) — preview and CDN project configuration
- [Performance](./docs/PERFORMANCE.md) — renderer selection, quality levels, mobile guidance and profiling
- [Troubleshooting](./docs/TROUBLESHOOTING.md) — common integration and rendering issues

The interactive preview app is in [apps/playground](./apps/playground). The deployable CDN surface is in [apps/cdn](./apps/cdn).

## Install

```bash
npm install glitterfx@next
```

```js
import { GlitterFX } from 'glitterfx';

const fx = new GlitterFX(document.querySelector('.hero'), {
  effect: 'aurora-veil',
  renderer: ['webgl', 'canvas'], // try WebGL, fall back to Canvas
  quality: 'balanced',
  haze: 0.4,
});
```

The effect mounts behind the container's children (the container becomes `position: relative; isolation: isolate`). Set the page or container background with CSS as usual. `three` is a peer dependency that npm 7+ installs automatically; React is optional.

| Import | What you get |
|---|---|
| `glitterfx` | Both renderers registered on import (WebGL via Three.js, Canvas fallback) |
| `glitterfx/canvas` | Canvas only; Three.js is never loaded (smallest bundle) |
| `glitterfx/react` | `<GlitterFXBackground>` (registers both renderers, marked `'use client'`) |
| `glitterfx/webgl` | `createWebGLBackend({ postprocess })` for post effects; types need `@types/three` |

Without a bundler, use the self-contained CDN build:

```html
<script type="module">
  import { GlitterFX } from 'https://cdn.jsdelivr.net/npm/glitterfx@next/dist/cdn/glitterfx.js';
  new GlitterFX(document.querySelector('.hero'), { effect: 'galaxy' });
</script>
```

`dist/cdn/glitterfx.js` includes Three.js (about 150 kB gzipped); `dist/cdn/glitterfx.canvas.js` is Canvas only (about 21 kB gzipped). See `examples/browser.html`.

## Packages

One package is published: **`glitterfx`** (`packages/glitterfx`). It bundles the private workspace libraries it is built from, so users install nothing else:

| Workspace library (private) | Contents |
|---|---|
| `@glitterfx/core` | `GlitterFX` class, config, backend registry, transitions, `capabilities()` |
| `@glitterfx/effects` | 37 effects, palettes, motion primitives and archetypes |
| `@glitterfx/backend-canvas` | Canvas 2D renderer |
| `@glitterfx/backend-webgl` | WebGL renderer (Three.js) |
| `@glitterfx/react` | `<GlitterFXBackground>` |

## Options

| Option | Values | Default | Notes |
|---|---|---|---|
| `effect` | effect id (below) | required | V1 ids `galaxy-spiral` and `ember-drift` are accepted |
| `renderer` | `'auto' \| 'canvas' \| 'webgl' \| ['webgl', 'canvas']` | `'auto'` | `auto` prefers WebGL; a list is tried in order |
| `quality` | `'eco' \| 'balanced' \| 'high'` | `'balanced'` | Particle budget and pixel-ratio cap (1, 1.5, 2) |
| `density` | 0 to 2 | 1 | Particle count multiplier |
| `speed` | 0 to 4 | 1 | Animation speed; 0 freezes motion |
| `size` | 0.1 to 4 | 1 | Particle size multiplier |
| `brightness` | 0 to 2 | 1 | |
| `glow` | 0 to 1 | 0.5 | Halo size and strength |
| `haze` | 0 to 1 | 0 | Soft atmospheric light; 0 costs nothing |
| `opacity` | 0 to 1 | 1 | Transparency of the whole effect layer, any effect and renderer |
| `motion` | `{ x, y, z, reverse }` | still | Global flow for every effect: `x` horizontal and `y` vertical (view heights per second, -1 to 1), `z` depth fly-through (+ towards the viewer), `reverse` runs the effect backwards |
| `interaction` | `{ pointer, radius, strength }` | off | Pointer reaction for every effect: `pointer: 'none' \| 'repel' \| 'attract' \| 'vortex'`, `radius` 10 to 1000 px (140), `strength` 0 to 2 (0.8) |
| `params` | object of numbers | `{}` | Effect-specific settings, e.g. `{ arms: 4 }` for galaxy (see below) |
| `palette` | palette name | per effect | See `palettes` export |
| `seed` | uint32 | 1 | Same seed, same particles on both backends |
| `pauseWhenHidden` | boolean | `true` | Stops rendering while the tab is hidden or the container is offscreen |
| `reducedMotion` | `'auto' \| 'static' \| 'ignore'` | `'auto'` | `auto` honors `prefers-reduced-motion` with a still frame |
| `backends` | backend list | registered backends | Per-instance override of the registry |

## Motion

```js
fx.update({ motion: { x: -0.2 } });           // drift everything left
fx.update({ motion: { y: -0.3 } });           // float everything up
fx.update({ motion: { z: 0.6 } });            // fly through it
fx.update({ motion: { reverse: true } });     // run backwards: embers sink, supernovas implode
```

Applied to every effect on both renderers after the effect places its particles. Flows accumulate over time, so changing them live never makes particles jump. `x`/`y` wrap particles around the view edges. `z` is a perspective fly-through (each particle cycles through its own depth); it suits full-screen fields such as stars, glitter, snow and dust, and makes centered effects such as galaxy burst outward.

## Pointer interaction

```js
new GlitterFX(el, { effect: 'glitter-shimmer', interaction: { pointer: 'repel', radius: 160, strength: 1 } });
fx.update({ interaction: { pointer: 'vortex' } }); // live, no regeneration
```

Every effect reacts on both renderers with no per-effect code: particles are displaced around the pointer after the effect places them (on WebGL in the shared shader path, so per-frame JavaScript work stays constant). The influence eases in and out as the pointer enters and leaves the container. Rendering surfaces keep `pointer-events: none`, so page content stays clickable.

## Effect settings

Some effects declare their own settings, passed as `params` and listed on `effects[i].params` (range, default, step, label). Values are clamped to the declared range; unknown keys are ignored. Settings shape the particles, so a change regenerates them; use `transitionTo` to animate it.

| Effect | Setting | Range | Default |
|---|---|---|---|
| `glitter-shimmer` | `flareRate` (how often flakes glint) | 0.2 to 3 | 1 |
| `glitter-shimmer` | `shimmer` (flicker strength) | 0 to 1 | 0.6 |
| `glitter-shimmer` | `depth` (near/far spread) | 0 to 1 | 0.7 |
| `glitter-shimmer` | `wave` (sweeping band of light) | 0 to 1 | 0 |
| `galaxy` | `arms` (spiral arm count) | 1 to 8, integer | 2 |
| `galaxy` | `twist` (arm winding) | 0.8 to 4 | 2.3 |

```js
fx.transitionTo({ params: { arms: 5, twist: 3 } }, { type: 'morph' }); // morph a 2-arm galaxy into 5 arms
```

## Instance API

```js
fx.update({ glow: 0.8, palette: 'magma' });                       // live; rebuilds only what changed
await fx.transitionTo('galaxy', { type: 'morph', duration: 1400 }); // 'crossfade' | 'morph' | 'dissolve'
fx.cancelTransition();                                              // back to where the transition started
fx.reset();                                                         // all options to defaults (keeps effect and renderer), motion offsets cleared
fx.stop(); fx.start();
fx.destroy();

fx.renderer;      // 'canvas' | 'webgl' actually in use
fx.config;        // normalized config
fx.animating;     // frames being produced (running, visible, motion allowed)
fx.transitioning;
```

`transitionTo` resolves `true` when it completes and `false` if cancelled or superseded. Morph moves each particle of the old effect to a particle of the new one; dissolve fades particles individually; crossfade blends two instances and works across renderers.

`capabilities()` reports which renderers work in this browser, what `auto` would choose, and whether reduced motion is requested.

## React

```jsx
<GlitterFXBackground className="hero" effect={effect} renderer={['webgl', 'canvas']} transition={{ type: 'morph' }}>
  <h1>Content</h1>
</GlitterFXBackground>
```

Import from `glitterfx/react`; it registers both renderers. See `packages/react/README.md`.

## Effects

| | | |
|---|---|---|
| `glitter-shimmer` | `star-field` | `galaxy` |
| `supernova` | `ember-storm` | `curl-flow` |
| `emerald-shimmer` | `wave-particles` | `lava-eruption` |
| `ray-burst` | `bending-chaos` | `dancing-waves` |
| `cherry-blossom` | `firefly-meadow` | `snow-storm` |
| `cosmic-dust` | `plasma-storm` | `bubble-rise` |
| `falling-leaves` | `aurora-veil` | `meteor-shower` |
| `confetti-drop` | `underwater` | `sand-storm` |
| `petal-burst` | `quantum-field` | `heartbeat-pulse` |
| `spiral-drift` | `warp-speed` | `bioluminescent-ocean` |
| `pollen-drift` | `falling-ash` | `dust-motes` |
| `dandelion-seeds` | `rising-lanterns` | `accretion-disk` |
| `planetary-rings` |  |  |

Each effect has a default palette and renders on both backends. WebGL adds particles (dust layers), motion trails where they help, and noise-textured haze; Canvas draws fewer particles with cached sprites.

## Choosing a renderer

Canvas has no dependencies and the smallest bundle, and is the safe choice for small backgrounds or older devices. WebGL does all motion in shaders (no per-particle JavaScript per frame), so it carries far more particles at lower CPU cost; it needs WebGL2. `renderer: ['webgl', 'canvas']` gives WebGL where available and Canvas elsewhere. WebGL context loss is handled: rendering pauses and resumes when the browser restores the context.

## Migrating from V1

See [MIGRATION.md](./MIGRATION.md).

## Develop

Requires Node 22.12+. From `/v2`:

```bash
npm ci              # install workspace
npm run dev         # playground: /v2.html (V2), /fixtures.html (deterministic renders), / (V1 Effect Lab)
npm run typecheck   # strict TypeScript, no build needed
npm run build       # package ESM + .d.ts, browser bundles, playground
npm test            # Vitest, including package boundary checks
npm run verify      # all of the above plus V1 protection
npm run pack:check  # after build: glitterfx packs with every entry point and bundled types
```

Architecture and rules: `ARCHITECTURE.md`. Current state: `PROJECT_STATE.md`. Release process: `RELEASE.md`.
