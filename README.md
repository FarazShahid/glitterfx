<div align="center">

# GlitterFX

**Cinematic particle backgrounds for the web.**
Drop a single library on any container and turn it into a living atmosphere — sparkling glitter, drifting embers, swirling galaxies, splashing waves. 26 effects, 17 palettes, 6 blur modes. ~110 KB. Zero dependencies except Three.js.

[**Live Demo**](https://your-username.github.io/glitterfx/) ・ [**Documentation**](https://your-username.github.io/glitterfx/) 

</div>

---

## Quick Start

```html
<!-- 1. Container that will host the effect -->
<section id="hero" style="height: 100vh;">
  <h1>Your content here</h1>
</section>

<!-- 2. Three.js + GlitterFX -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/your-username/glitterfx@latest/dist/glitterfx.js"></script>

<!-- 3. Two lines and you're done -->
<script>
  new GlitterFX(document.getElementById('hero'), {
    effect: 'emerald-shimmer',
    palette: 'emerald-gold',
  });
</script>
```

That's it. Your section now has a living particle background. Content already inside the container is automatically promoted above the canvas — no z-index work needed.

---

## Why GlitterFX?

**Most particle libraries make confetti.** GlitterFX is built around the visual physics of *real* light: distant stars, atmospheric haze, depth-of-field bokeh, energy-conserving brightness. Particles look like points of light at any size or density — never the muddy white wash you get when additive blending saturates.

- **Realistic by default.** Energy-conserving brightness means bigger particles dim per-pixel instead of stacking into a white blob. Asynchronous twinkle, depth dimming, and a star-profile texture (sharp core, soft halo) make particles read as distant points of light.
- **Container-scoped.** Apply it to any `<div>`. The library handles canvas insertion, layering, and resize.
- **Compositional.** Effects, palettes, blur modes, and haze are independent axes. Mix and match without writing shader code.
- **Tiny surface.** One class, six methods, one config object. No build step required.
- **Mobile-friendly.** WebGL-accelerated, with sensible defaults for low-power devices.

---

## Installation

### Via CDN (recommended for quick use)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/FarazShahid/glitterfx"></script>
```

### Via NPM

```bash
npm install three glitterfx
```

```js
import * as THREE from 'three';
window.THREE = THREE;          // GlitterFX expects THREE on window
import 'glitterfx';            // Adds GlitterFX to window
```

### Direct download

Grab [`dist/glitterfx.js`](./dist/glitterfx.js) and serve it from your own static host.

---

## The 26 Effects

| Effect | Vibe | Default Palette |
|--------|------|-----------------|
| `emerald-shimmer` | Gold glitter on green velvet, drifting toward camera | emerald-gold |
| `wave-particles` | Multicolor dot-field surface flowing into the distance | confetti |
| `curl-flow` | Particles riding invisible swirling curves, leaving filament trails | cobalt-cyan |
| `supernova` | Radial explosion of star-spike particles fading outward | supernova |
| `lava-eruption` | Fountains of hot particles cooling as they arc under gravity | magma |
| `ray-burst` | Particles spiraling outward in a single direction along log-spiral arcs | aurora |
| `bending-chaos` | Same swirl, but with crossing trails — particles spinning both ways for turbulent feel | aurora |
| `dancing-waves` | Splashes erupting from a horizontal shore — slow, breathing, sparse | cobalt-cyan |
| `cherry-blossom` | Petals drifting down with gentle horizontal sway | sakura |
| `firefly-meadow` | Sparse glowing dots, gentle drift, asynchronous blink | firefly |
| `snow-storm` | Directional snowfall with wind variation | mono-white |
| `cosmic-dust` | Slow swirling galactic dust on dark space | cosmic |
| `plasma-storm` | Chaotic high-energy curl flow, electric palette | plasma |
| `bubble-rise` | Bubbles floating up with wobble | aqua |
| `falling-leaves` | Autumn leaves with wide tumbling sway | autumn |
| `aurora-veil` | Flowing curtains of color, wave-like horizontal drift | aurora |
| `meteor-shower` | Diagonal streaks falling at angle | supernova |
| `confetti-drop` | Celebratory tumble | confetti |
| `galaxy-spiral` | Logarithmic 3-arm spiral with differential rotation | cosmic |
| `underwater` | Slow upward drift with sway, dreamy soft focus | aqua |
| `ember-drift` | Embers rising from below, cooling as they rise | magma |
| `star-field` | Slow parallax twinkling stars | starlight |
| `sand-storm` | Horizontal blowing fine particles | desert |
| `petal-burst` | Radial pink/red explosion of "petals" with gravity | sakura |
| `quantum-field` | Particles snapping between random nearby positions | quantum |
| `heartbeat-pulse` | Concentric expanding rings | love |
| `spiral-drift` | Smooth Fibonacci-spiral particle motion | cosmic |

---

## API Reference

### Constructor

```js
new GlitterFX(container, config)
```

Mounts a particle effect inside `container` (any HTMLElement). Returns an instance you can use to update the effect live or tear it down.

| Argument | Type | Description |
|----------|------|-------------|
| `container` | `HTMLElement` | The element that will host the effect. Style is auto-fixed: `position: relative` and `overflow: hidden` are applied if missing. Existing children are promoted above the canvas. |
| `config` | `object` | Initial configuration. See [config keys](#config-keys) below. |

### Instance Methods

#### `update(patch)` — Patch any field live
```js
fx.update({ palette: 'magma', haze: 0.6 });
```
Most fields apply instantly. `density`, `palette`, `weights`, and `effect` rebuild the particle geometry.

#### `setEffect(name)` — Convenience for switching effects
```js
fx.setEffect('curl-flow');   // adopts that effect's defaults
```
Equivalent to `update({ effect: name })`. Drops stale config from the previous effect so the new one starts clean.

#### `setScale(scale)` — Coupled size+density
```js
fx.setScale(2.0);   // 2× particle size, density auto-adjusted to stay uncluttered
```
Convenience for "zoom in" / "zoom out" on the field. Density scales as `1 / scale²` so coverage stays roughly constant.

#### `loadConfig(url)` — Fetch config from JSON endpoint
```js
await fx.loadConfig('/api/glitter-config.json');
```
Useful when configs are managed in a CMS.

#### `start()` / `stop()` — Pause and resume the animation loop
```js
fx.stop();
// ... later
fx.start();
```
Useful for scroll-triggered or visibility-based pausing to save battery.

#### `destroy()` — Tear down everything
```js
fx.destroy();
```
Removes the canvas, disposes WebGL resources, removes resize listeners. Call this if you remove the container from the DOM.

### Static Methods

```js
GlitterFX.listEffects()         // → ['emerald-shimmer', 'wave-particles', ...]
GlitterFX.getDefaults(name)     // → { effect, palette, blur, ... }
GlitterFX.registerEffect(name, definition)

GlitterFX.listPalettes()        // → ['emerald-gold', 'cobalt-cyan', ...]
GlitterFX.getPalette(name)      // → { colors: [...], weights: [...] }
GlitterFX.registerPalette(name, colors, weights)

GlitterFX.listBlurModes()       // → ['none', 'uniform', 'lens', 'motion', 'center-focus', 'vignette-blur']
```

---

### Config Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `effect` | `string` | `'emerald-shimmer'` | Effect ID. See the [effects table](#the-26-effects). |
| `palette` | `string \| string[]` | per-effect | Palette name or custom hex array (e.g. `['#ff0000', '#00ff00']`). |
| `weights` | `number[]` | uniform | Optional weights for custom palette colors. |
| `size` | `number` | per-effect | Particle scale multiplier. `1.0` = baseline. Range 0.2–3.0 typical. |
| `density` | `number` | per-effect | Particle count multiplier. `1.0` = baseline. Range 0.2–2.0 typical. |
| `brightness` | `number` | per-effect | Brightness multiplier. `1.0` = baseline. |
| `speed` | `number` | per-effect | Animation speed multiplier. `1.0` = baseline. |
| `blur` | `number` | per-effect | Blur strength in pixels (0–20). |
| `blurMode` | `string` | per-effect | `'none' \| 'uniform' \| 'lens' \| 'motion' \| 'center-focus' \| 'vignette-blur'`. |
| `haze` | `number` | per-effect | Atmospheric glow strength (0–1). |
| `hazeColor` | `string` | per-effect | Haze hue, any CSS color. |
| `background` | `string` | per-effect | Container background, any CSS background value (gradients welcome). |

---

## Curated defaults

Each effect ships with a full curated configuration — palette, blur mode, size, density, all dialed in. Calling `new GlitterFX(el, { effect: 'name' })` with just the effect ID gives you these settings out of the box.

If you want to start from one of these and tweak a few values, copy the snippet and override:

<details>
<summary><strong>ray-burst</strong> · single-direction swirling vortex</summary>

```js
new GlitterFX(el, {
  effect: 'ray-burst',
  palette: 'aurora',
  blurMode: 'lens',
  blur: 2,
  size: 0.49,
  brightness: 0.94,
  speed: 0.50,
  density: 0.43,
  haze: 0.06,
  hazeColor: '#7faaff',
});
```
</details>

<details>
<summary><strong>bending-chaos</strong> · bidirectional swirl with crossing trails</summary>

```js
new GlitterFX(el, {
  effect: 'bending-chaos',
  palette: 'aurora',
  blurMode: 'lens',
  blur: 2,
  size: 0.49,
  brightness: 0.94,
  speed: 0.50,
  density: 0.43,
  haze: 0.06,
  hazeColor: '#7faaff',
});
```
</details>

<details>
<summary><strong>plasma-storm</strong> · turbulent purple plasma with vignette blur</summary>

```js
new GlitterFX(el, {
  effect: 'plasma-storm',
  palette: 'plasma',
  blurMode: 'vignette-blur',
  blur: 0.5,
  size: 0.56,
  brightness: 1.20,
  speed: 0.21,
  density: 0.71,
  haze: 0.60,
  hazeColor: '#9a4dff',
});
```
</details>

<details>
<summary><strong>cherry-blossom</strong> · pink petals drifting down</summary>

```js
new GlitterFX(el, {
  effect: 'cherry-blossom',
  palette: 'sakura',
  blurMode: 'uniform',
  blur: 2,
  size: 1.00,
  brightness: 0.75,
  speed: 1.19,
  density: 0.60,
  haze: 0.30,
  hazeColor: '#ff9ec7',
});
```
</details>

<details>
<summary><strong>bubble-rise</strong> · floating bubbles with soft lens blur</summary>

```js
new GlitterFX(el, {
  effect: 'bubble-rise',
  palette: 'supernova',
  blurMode: 'lens',
  blur: 2.5,
  size: 1.20,
  brightness: 0.81,
  speed: 1.78,
  density: 1.19,
  haze: 0.40,
  hazeColor: '#3aa8c8',
});
```
</details>

<details>
<summary><strong>falling-leaves</strong> · autumn tumble</summary>

```js
new GlitterFX(el, {
  effect: 'falling-leaves',
  palette: 'autumn',
  blurMode: 'uniform',
  blur: 1.5,
  size: 1.00,
  brightness: 0.85,
  speed: 1.79,
  density: 0.50,
  haze: 0.35,
  hazeColor: '#d4762a',
});
```
</details>

<details>
<summary><strong>aurora-veil</strong> · dreamy waving curtains of color</summary>

```js
new GlitterFX(el, {
  effect: 'aurora-veil',
  palette: 'aurora',
  blurMode: 'lens',
  blur: 6,
  size: 0.77,
  brightness: 0.90,
  speed: 0.30,
  density: 1.20,
  haze: 0.55,
  hazeColor: '#5cffb3',
});
```
</details>

<details>
<summary><strong>meteor-shower</strong> · diagonal streaks with motion blur</summary>

```js
new GlitterFX(el, {
  effect: 'meteor-shower',
  palette: 'supernova',
  blurMode: 'motion',
  blur: 1,
  size: 0.55,
  brightness: 1.05,
  speed: 0.53,
  density: 0.70,
  haze: 0.30,
  hazeColor: '#bfd9ff',
});
```
</details>

<details>
<summary><strong>confetti-drop</strong> · celebratory tumble</summary>

```js
new GlitterFX(el, {
  effect: 'confetti-drop',
  palette: 'confetti',
  blurMode: 'uniform',
  blur: 0.5,
  size: 0.30,
  brightness: 0.95,
  speed: 0.70,
  density: 0.70,
  haze: 0.62,
  hazeColor: '#ff8acc',
});
```
</details>

<details>
<summary><strong>underwater</strong> · slow upward drift, dreamy soft focus</summary>

```js
new GlitterFX(el, {
  effect: 'underwater',
  palette: 'supernova',
  blurMode: 'lens',
  blur: 3,
  size: 0.70,
  brightness: 0.70,
  speed: 1.96,
  density: 0.55,
  haze: 0.55,
  hazeColor: '#3aa8d4',
});
```
</details>

<details>
<summary><strong>star-field</strong> · twinkling parallax stars</summary>

```js
new GlitterFX(el, {
  effect: 'star-field',
  palette: 'confetti',
  blurMode: 'none',
  blur: 0,
  size: 0.48,
  brightness: 1.00,
  speed: 1.80,
  density: 1.50,
  haze: 0.00,
  hazeColor: '#ffffff',
});
```
</details>

<details>
<summary><strong>sand-storm</strong> · horizontal blowing fine particles</summary>

```js
new GlitterFX(el, {
  effect: 'sand-storm',
  palette: 'desert',
  blurMode: 'motion',
  blur: 2,
  size: 0.45,
  brightness: 0.80,
  speed: 0.25,
  density: 1.60,
  haze: 0.40,
  hazeColor: '#c8985a',
});
```
</details>

<details>
<summary><strong>quantum-field</strong> · particles snapping between positions</summary>

```js
new GlitterFX(el, {
  effect: 'quantum-field',
  palette: 'magma',
  blurMode: 'lens',
  blur: 0.5,
  size: 0.50,
  brightness: 1.00,
  speed: 0.05,
  density: 1.59,
  haze: 0.34,
  hazeColor: '#3affc4',
});
```
</details>

<details>
<summary><strong>heartbeat-pulse</strong> · concentric expanding rings</summary>

```js
new GlitterFX(el, {
  effect: 'heartbeat-pulse',
  palette: 'confetti',
  blurMode: 'uniform',
  blur: 0,
  size: 0.26,
  brightness: 1.17,
  speed: 0.12,
  density: 1.20,
  haze: 0.55,
  hazeColor: '#ff3a6a',
});
```
</details>

<details>
<summary><strong>lava-eruption</strong> · cooling embers from below</summary>

```js
new GlitterFX(el, {
  effect: 'lava-eruption',
  palette: 'magma',
  blurMode: 'center-focus',
  blur: 2,
  size: 0.27,
  brightness: 1.05,
  speed: 0.41,
  density: 1.73,
  haze: 0.21,
  hazeColor: '#1a4a26',
});
```
</details>

> Other effects (emerald-shimmer, wave-particles, curl-flow, supernova, dancing-waves, firefly-meadow, snow-storm, cosmic-dust, ember-drift, petal-burst, galaxy-spiral, spiral-drift) ship with their original defaults — see `GlitterFX.getDefaults('effect-name')` for any current effective config.

---

## Examples

### Hero section

```js
new GlitterFX(document.querySelector('#hero'), {
  effect: 'emerald-shimmer',
  haze: 0.4,
  blur: 2,
  blurMode: 'lens',
});
```

### Subtle ambient (e.g. behind a long article)

```js
new GlitterFX(document.querySelector('.article-bg'), {
  effect: 'firefly-meadow',
  density: 0.4,
  size: 0.6,
  brightness: 0.5,
  speed: 0.3,
});
```

### Dramatic full-page background

```js
new GlitterFX(document.body, {
  effect: 'cosmic-dust',
  haze: 0.6,
  blurMode: 'center-focus',
  blur: 4,
});
```

### Switch effects on scroll

```js
const fx = new GlitterFX(hero, { effect: 'star-field' });

window.addEventListener('scroll', () => {
  const t = window.scrollY / window.innerHeight;
  if (t < 1)        fx.setEffect('star-field');
  else if (t < 2)   fx.setEffect('cosmic-dust');
  else              fx.setEffect('galaxy-spiral');
});
```

### Pause when not visible (battery saver)

```js
const fx = new GlitterFX(section, { effect: 'aurora-veil' });

new IntersectionObserver(([entry]) => {
  entry.isIntersecting ? fx.start() : fx.stop();
}).observe(section);
```

### Custom palette

```js
GlitterFX.registerPalette('brand', ['#ff6b35', '#f7c548', '#ffe5d4'], [0.5, 0.35, 0.15]);

new GlitterFX(el, {
  effect: 'curl-flow',
  palette: 'brand',
});
```

### Custom effect

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full kernel API. Short version:

```js
GlitterFX.registerEffect('my-effect', {
  defaults: {
    background: '#000',
    density: 1.0,
    size: 0.7,
    brightness: 0.9,
    speed: 0.5,
    blur: 1,
    blurMode: 'lens',
    haze: 0.3,
    hazeColor: '#3a90ff',
    palette: 'cobalt-cyan',
  },
  build(ctx) {
    return buildKernelEffect(ctx, {
      countBase: 2000,
      cameraPos: [0, 0, 25],
      cameraTarget: [0, 0, 0],
      useLifetime: false,
      spawn(k) {
        const i = k.i, p = k.positions;
        p[i*3]   = (Math.random() - 0.5) * 40;
        p[i*3+1] = (Math.random() - 0.5) * 40;
        p[i*3+2] = (Math.random() - 0.5) * 10;
      },
      step(k) {
        const i = k.i, p = k.positions;
        p[i*3] += Math.sin(k.time + i) * k.dt;
      },
    });
  }
});

new GlitterFX(el, { effect: 'my-effect' });
```

---

## Browser Support

WebGL 1.0 required. Tested on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+, mobile Safari 14+, Chrome Android. Will fall back gracefully if WebGL is unavailable (canvas remains transparent, no errors).

---

## Performance

Particle counts auto-scale by effect; the kernel caps at ~12,000 particles for the densest effects. Typical desktop GPU: 60fps at all settings. Typical mid-range mobile (e.g. iPhone 11): 60fps for kernel-based effects, 30–60fps for the most particle-heavy ones (snow-storm, plasma-storm).

For best mobile performance:
- Lower `density` to 0.5–0.7
- Use `blurMode: 'none'` or `'uniform'` (avoid `motion` and `center-focus` which add a backdrop-filter pass)
- Pause via `fx.stop()` when not visible

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Contributing

Contributions welcome — especially new effects and palettes. See [CONTRIBUTING.md](./CONTRIBUTING.md).
