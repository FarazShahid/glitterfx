# Migrating from GlitterFX V1 to V2

V1 (`glitterfx` on npm, `cdn.jsdelivr.net/gh/FarazShahid/glitterfx`) keeps working unchanged. V2 is a separate set of packages (`@glitterfx/*`); migrate when convenient.

## What changes

| | V1 | V2 |
|---|---|---|
| Install | `three` global + `glitterfx` script | ES modules: `@glitterfx/core` + a backend, or `@glitterfx/browser` |
| Renderer | WebGL only (Three.js r128 on `window`) | Canvas or WebGL (`three` >= 0.180 as an import), chosen per instance |
| Construct | `new GlitterFX(el, config)` | same, after `registerBackend(...)` (the browser bundle registers for you) |
| Live changes | `update(patch)`, `setEffect(name)` | `update(patch)`, `transitionTo(effect, { type })` |
| Pause | `start()` / `stop()` | same; also automatic when hidden, offscreen or reduced motion |
| Background | `background` config key | plain CSS on the container or page |

## Effects

All 26 V1 effects plus `bending-chaos` exist in V2 under the same ids. Two were renamed and the old ids still work:

| V1 | V2 |
|---|---|
| `galaxy-spiral` | `galaxy` |
| `ember-drift` | `ember-storm` |

V1 palettes are available by the same names, with three exceptions: V1 `aurora` colors are `borealis` in V2 (V2 `aurora` is a softer variant), V1 `supernova` is closest to V2 `nova`, and `starlight` is a V2 variant with the same character. V2 effects are new implementations: motion character and palettes follow V1, exact frames do not.

## Config keys

| V1 key | V2 |
|---|---|
| `effect`, `palette`, `size`, `density`, `brightness`, `speed`, `haze` | same names; ranges in the README |
| `hazeColor` | removed: haze is tinted by the palette |
| `blur`, `blurMode` | removed: V2 uses `glow` and per-effect depth softness |
| `background` | removed: use CSS |
| `weights`, custom hex palettes | not yet in V2 |

| V1 method | V2 |
|---|---|
| `setEffect(name)` | `update({ effect })` or `transitionTo(name)` |
| `setScale(scale)` | `update({ size: scale, density: 1 / scale ** 2 })` |
| `loadConfig(url)` | `update(await (await fetch(url)).json())` |
| `GlitterFX.listEffects()` | `effects` export from `@glitterfx/effects` (or `@glitterfx/browser`) |
| `GlitterFX.listPalettes()` | `Object.keys(palettes)` |
| `GlitterFX.registerEffect`, `registerPalette` | not in the prerelease |

## Example

```html
<!-- V1 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/FarazShahid/glitterfx"></script>
<script>new GlitterFX(document.getElementById('hero'), { effect: 'aurora-veil', background: '#05060a' });</script>
```

```html
<!-- V2 -->
<style>#hero { background: #05060a; }</style>
<script type="module">
  import { GlitterFX } from 'https://cdn.jsdelivr.net/npm/@glitterfx/browser@next/dist/glitterfx.js';
  new GlitterFX(document.getElementById('hero'), { effect: 'aurora-veil', renderer: ['webgl', 'canvas'] });
</script>
```
