# GlitterFX V2

Particle backgrounds for websites with two first-class renderers: **Canvas 2D** (no dependencies, runs everywhere) and **WebGL** (Three.js, shader-driven motion, about 7 to 12x the particles at the same quality). Both render the same 27 effects from the same configuration. V2 is a prerelease (`2.0.0-alpha`) and ships as separate `@glitterfx/*` packages; the V1 `glitterfx` package and CDN script are unchanged.

## Install

```bash
npm install @glitterfx/core @glitterfx/backend-canvas            # Canvas only
npm install @glitterfx/backend-webgl three                        # add WebGL (three is a peer dependency)
npm install @glitterfx/react                                      # optional React component
```

```js
import { GlitterFX, registerBackend } from '@glitterfx/core';
import { canvasBackend } from '@glitterfx/backend-canvas';
import { webglBackend } from '@glitterfx/backend-webgl';

registerBackend(webglBackend);
registerBackend(canvasBackend);

const fx = new GlitterFX(document.querySelector('.hero'), {
  effect: 'aurora-veil',
  renderer: ['webgl', 'canvas'], // try WebGL, fall back to Canvas
  quality: 'balanced',
  haze: 0.4,
});
```

The effect mounts behind the container's children (the container becomes `position: relative; isolation: isolate`). Set the page or container background with CSS as usual.

Without a bundler, use the self-contained ESM build:

```html
<script type="module">
  import { GlitterFX } from 'https://cdn.jsdelivr.net/npm/@glitterfx/browser@next/dist/glitterfx.js';
  new GlitterFX(document.querySelector('.hero'), { effect: 'galaxy' });
</script>
```

`glitterfx.js` registers both backends (Three.js bundled, about 150 kB gzipped). `glitterfx.canvas.js` registers Canvas only (about 16 kB gzipped). See `examples/browser.html`.

## Packages

| Package | Contents | Dependencies |
|---|---|---|
| `@glitterfx/core` | `GlitterFX` class, config, backend registry, transitions, `capabilities()` | none |
| `@glitterfx/effects` | 27 effects, palettes, motion primitives and archetypes | core |
| `@glitterfx/backend-canvas` | Canvas 2D renderer | core, effects |
| `@glitterfx/backend-webgl` | WebGL renderer, `createWebGLBackend({ postprocess })` | core, effects, `three` (peer, >= 0.180) |
| `@glitterfx/react` | `<GlitterFXBackground>` | core, `react` (peer, >= 18) |
| `@glitterfx/browser` | Prebuilt ESM bundles for `<script type="module">` / CDN | bundled |

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
| `params` | object of numbers | `{}` | Effect-specific settings, e.g. `{ arms: 4 }` for galaxy (see below) |
| `palette` | palette name | per effect | See `palettes` export |
| `seed` | uint32 | 1 | Same seed, same particles on both backends |
| `pauseWhenHidden` | boolean | `true` | Stops rendering while the tab is hidden or the container is offscreen |
| `reducedMotion` | `'auto' \| 'static' \| 'ignore'` | `'auto'` | `auto` honors `prefers-reduced-motion` with a still frame |
| `backends` | backend list | registered backends | Per-instance override of the registry |

## Effect settings

Some effects declare their own settings, passed as `params` and listed on `effects[i].params` (range, default, step, label). Values are clamped to the declared range; unknown keys are ignored. Settings shape the particles, so a change regenerates them; use `transitionTo` to animate it.

| Effect | Setting | Range | Default |
|---|---|---|---|
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

Register backends once at startup as above. See `packages/react/README.md`.

## Effects

| | | |
|---|---|---|
| `star-field` | `galaxy` | `supernova` |
| `ember-storm` | `curl-flow` | `emerald-shimmer` |
| `wave-particles` | `lava-eruption` | `ray-burst` |
| `bending-chaos` | `dancing-waves` | `cherry-blossom` |
| `firefly-meadow` | `snow-storm` | `cosmic-dust` |
| `plasma-storm` | `bubble-rise` | `falling-leaves` |
| `aurora-veil` | `meteor-shower` | `confetti-drop` |
| `underwater` | `sand-storm` | `petal-burst` |
| `quantum-field` | `heartbeat-pulse` | `spiral-drift` |

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
npm run pack:check  # after build: every package packs with entry points, types and pinned versions
```

Architecture and rules: `ARCHITECTURE.md`. Current state: `PROJECT_STATE.md`. Release process: `RELEASE.md`.
