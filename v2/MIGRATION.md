# V1 to unified GlitterFX package

GlitterFX now has one package and one release train.

## Package layout

| Import / asset | Meaning |
|---|---|
| `glitterfx` | V2 default engine: Canvas + WebGL |
| `glitterfx/canvas` | V2 Canvas-only |
| `glitterfx/react` | V2 React component |
| `glitterfx/webgl` | advanced V2 WebGL hooks |
| `glitterfx/legacy` | V1-shaped API backed by V2 |
| `glitterfx/v1` | alias of the V1-shaped adapter |
| `dist/legacy/glitterfx.v1.js` | exact historical V1 classic browser runtime |

The old root `glitterfx.js` remains in the repository during the migration window, but npm/CDN releases come from the single `glitterfx` package.

## Recommended migration path

### Stage 1: zero behavior change

Keep the exact V1 runtime, but load it from the new package release:

~~~html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/legacy/glitterfx.v1.js"></script>
~~~

Existing `new GlitterFX(...)`, registerPalette and registerEffect code continues to use the historical engine.

### Stage 2: move to the V2 engine with V1-shaped code

~~~js
import { GlitterFX } from 'glitterfx/legacy';
~~~

This preserves the common constructor and methods while the actual renderer is V2.

Supported compatibility methods:

- update
- setEffect
- setScale
- loadConfig
- start
- stop
- resize
- destroy
- listEffects
- getDefaults (translated V2 defaults)
- listPalettes
- getPalette
- listBlurModes

Compatibility limitations:

- V1 blur/blurMode are approximated using V2 glow.
- hazeColor is ignored because V2 haze is palette-tinted.
- palette arrays / custom weights are not yet mapped into V2.
- registerPalette and registerEffect require the exact V1 runtime until the equivalent extension API lands in V2.

### Stage 3: native V2

~~~js
import { GlitterFX } from 'glitterfx';

const fx = new GlitterFX(hero, {
  effect: 'galaxy',
  renderer: ['webgl', 'canvas'],
  glow: 0.7,
  interaction: { pointer: 'repel', radius: 160, strength: 0.8 },
});
~~~

Replace:

| V1 | Native V2 |
|---|---|
| galaxy-spiral | galaxy (old alias still accepted) |
| ember-drift | ember-storm (old alias still accepted) |
| setEffect(name) | update({ effect: name }) or transitionTo(name) |
| setScale(scale) | update({ size: scale, density: 1 / scale ** 2 }) |
| loadConfig(url) | update(await (await fetch(url)).json()) |
| background | CSS |
| blur / blurMode | glow + effect softness |
| hazeColor | palette-tinted haze |

## Why keep the exact V1 file temporarily?

The V2 engine already covers the complete V1 effect catalog and adds Canvas fallback, transitions, interaction and motion. The remaining compatibility gap is not the core effects; it is V1's runtime extension surface and exact post-processing behavior.

Shipping the historical file inside the same package lets existing sites move to one package/release source immediately without forcing those extension APIs into V2 prematurely.

Once V2 has native custom palettes/effect registration and the remaining V1 consumers are migrated, the exact V1 asset can be deprecated and eventually removed in a major release.
