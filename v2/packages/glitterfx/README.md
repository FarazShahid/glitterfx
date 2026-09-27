# GlitterFX

Particle backgrounds for websites. 37 effects (glitter, galaxies, starfields, snow, aurora, embers, warp speed and more) rendered with **WebGL** (Three.js, shader-driven) or **Canvas 2D** (no dependencies), from one configuration. Transitions, pointer interaction, motion controls, React component, TypeScript types.

> Prerelease: `2.0.0-alpha`. Install with the `next` tag.

## Install

```bash
npm install glitterfx@next
```

`three` is a peer dependency (installed automatically by npm 7+). React is optional.

## Use

```js
import { GlitterFX } from 'glitterfx';

const fx = new GlitterFX(document.querySelector('.hero'), {
  effect: 'glitter-shimmer',
  renderer: ['webgl', 'canvas'], // WebGL where available, Canvas otherwise
});
```

The effect renders behind the element's content; style the element's background with CSS as usual.

| Import | Renderers | Notes |
|---|---|---|
| `glitterfx` | WebGL + Canvas | Everything, registered on import |
| `glitterfx/canvas` | Canvas | Never loads Three.js: smallest bundle |
| `glitterfx/react` | WebGL + Canvas | `<GlitterFXBackground>`, marked `'use client'` |
| `glitterfx/webgl` | - | `createWebGLBackend({ postprocess })` for post effects such as bloom; types need `@types/three` |

### React

```jsx
import { GlitterFXBackground } from 'glitterfx/react';

export function Hero() {
  return (
    <GlitterFXBackground className="hero" effect="galaxy" params={{ arms: 4 }} transition={{ type: 'morph' }}>
      <h1>Content stays on top</h1>
    </GlitterFXBackground>
  );
}
```

Server rendering outputs a plain element; the effect starts after hydration.

### CDN, no build step

```html
<script type="module">
  import { GlitterFX } from 'https://cdn.jsdelivr.net/npm/glitterfx@next/dist/cdn/glitterfx.js';
  new GlitterFX(document.querySelector('.hero'), { effect: 'aurora-veil' });
</script>
```

`dist/cdn/glitterfx.js` includes Three.js (~150 kB gzip). `dist/cdn/glitterfx.canvas.js` is Canvas only (~21 kB gzip).

## Options

| Option | Values | Default |
|---|---|---|
| `effect` | effect id (see `effects`) | required |
| `renderer` | `'auto'`, `'canvas'`, `'webgl'`, or an ordered list | `'auto'` |
| `quality` | `'eco'`, `'balanced'`, `'high'` | `'balanced'` |
| `density`, `speed`, `size`, `brightness` | multipliers (0 to 2, 0 to 4, 0.1 to 4, 0 to 2) | 1 |
| `glow`, `haze`, `opacity` | 0 to 1 | 0.5, 0, 1 |
| `palette` | palette name (see `palettes`) | per effect |
| `params` | effect settings, e.g. `{ arms: 5 }` for galaxy | `{}` |
| `motion` | `{ x, y, z, reverse }`: flow along each axis (-1 to 1), run backwards | still |
| `interaction` | `{ pointer: 'repel' \| 'attract' \| 'vortex', radius, strength }` | off |
| `seed` | integer: same seed, same particles | 1 |
| `pauseWhenHidden` | pause when the tab is hidden or the element is offscreen | `true` |
| `reducedMotion` | `'auto'` honors `prefers-reduced-motion` with a still frame | `'auto'` |

## API

```js
fx.update({ glow: 0.8, motion: { y: -0.3 } });                // live changes
await fx.transitionTo('galaxy', { type: 'morph', duration: 1400 }); // 'crossfade' | 'morph' | 'dissolve'
fx.reset();                                                   // back to defaults, same effect
fx.stop(); fx.start(); fx.destroy();

import { effects, palettes, capabilities } from 'glitterfx';
effects.map((e) => e.id);  // all effect ids, default palettes and settings
capabilities();            // which renderers this browser supports
```

## Effects

glitter-shimmer, star-field, galaxy, supernova, ember-storm, curl-flow, emerald-shimmer, wave-particles, lava-eruption, ray-burst, bending-chaos, dancing-waves, cherry-blossom, firefly-meadow, snow-storm, cosmic-dust, plasma-storm, bubble-rise, falling-leaves, aurora-veil, meteor-shower, confetti-drop, underwater, sand-storm, petal-burst, quantum-field, heartbeat-pulse, spiral-drift, warp-speed, bioluminescent-ocean, pollen-drift, falling-ash, dust-motes, dandelion-seeds, rising-lanterns, accretion-disk, planetary-rings.

## License

Unlicense (public domain). Source: https://github.com/FarazShahid/glitterfx
