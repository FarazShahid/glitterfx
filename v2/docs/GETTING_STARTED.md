# Getting Started

## 1. Install from npm

V2 is currently a prerelease. Install the next tag:

~~~bash
npm install glitterfx@next
~~~

For a normal application, import the full entry:

~~~js
import { GlitterFX } from 'glitterfx';

const hero = document.querySelector('#hero');

const fx = new GlitterFX(hero, {
  effect: 'glitter-shimmer',
  renderer: ['webgl', 'canvas'],
});
~~~

The full entry registers both renderers. WebGL is tried first and Canvas is used if WebGL is unavailable.

## 2. Minimal HTML and CSS

~~~html
<section id="hero" class="hero">
  <div class="hero-content">
    <h1>GlitterFX V2</h1>
    <p>Page content stays interactive above the effect.</p>
  </div>
</section>
~~~

~~~css
.hero {
  min-height: 70vh;
  background: #05060a;
  color: white;
}
~~~

GlitterFX prepares the container as needed, mounts the rendering surface behind the container content, and keeps pointer events disabled on the surface itself.

## 3. Canvas-only installation

If the effect is small, subtle, or the project must avoid Three.js:

~~~js
import { GlitterFX } from 'glitterfx/canvas';

const fx = new GlitterFX(document.querySelector('#hero'), {
  effect: 'dust-motes',
  renderer: 'canvas',
  quality: 'balanced',
});
~~~

This entry never loads the WebGL backend or Three.js.

## 4. Browser/CDN installation

A self-contained browser build is produced by the package build.

Full WebGL + Canvas bundle:

~~~html
<script type="module">
  import { GlitterFX } from 'https://cdn.jsdelivr.net/npm/glitterfx@next/dist/cdn/glitterfx.js';

  new GlitterFX(document.querySelector('#hero'), {
    effect: 'aurora-veil',
    renderer: ['webgl', 'canvas'],
  });
</script>
~~~

Canvas-only:

~~~html
<script type="module">
  import { GlitterFX } from 'https://cdn.jsdelivr.net/npm/glitterfx@next/dist/cdn/glitterfx.canvas.js';

  new GlitterFX(document.querySelector('#hero'), {
    effect: 'dust-motes',
    renderer: 'canvas',
  });
</script>
~~~

The project also includes a self-hosted CDN application. See [CDN distribution](./CDN.md).

## 5. A practical production configuration

~~~js
const fx = new GlitterFX(document.querySelector('#hero'), {
  effect: 'glitter-shimmer',
  renderer: ['webgl', 'canvas'],
  quality: 'balanced',
  density: 1,
  speed: 1,
  size: 1,
  brightness: 1,
  glow: 0.7,
  haze: 0.25,
  opacity: 1,
  seed: 42,
  interaction: {
    pointer: 'repel',
    radius: 160,
    strength: 0.8,
  },
  motion: {
    x: 0,
    y: -0.04,
    z: 0.1,
    reverse: false,
  },
  pauseWhenHidden: true,
  reducedMotion: 'auto',
});
~~~

## 6. Updating a live effect

Most visual properties can change on the running instance:

~~~js
fx.update({
  glow: 0.9,
  haze: 0.5,
  brightness: 1.15,
});
~~~

Effect changes can be immediate:

~~~js
fx.update({ effect: 'galaxy' });
~~~

or animated:

~~~js
await fx.transitionTo('galaxy', {
  type: 'morph',
  duration: 1400,
});
~~~

## 7. Effect-specific parameters

Galaxy:

~~~js
new GlitterFX(hero, {
  effect: 'galaxy',
  params: {
    arms: 4,
    twist: 2.8,
  },
});
~~~

Glitter Shimmer:

~~~js
new GlitterFX(hero, {
  effect: 'glitter-shimmer',
  params: {
    flareRate: 1.4,
    shimmer: 0.8,
    depth: 0.9,
    wave: 0.3,
  },
});
~~~

Unknown parameter names are ignored by the effect. Known values are clamped to their supported range.

## 8. Multiple effects on one page

Each instance owns one host element:

~~~js
const heroFx = new GlitterFX(document.querySelector('#hero'), {
  effect: 'galaxy',
  renderer: ['webgl', 'canvas'],
});

const footerFx = new GlitterFX(document.querySelector('#footer'), {
  effect: 'dust-motes',
  renderer: 'canvas',
  density: 0.5,
});
~~~

For many small elements, prefer Canvas and lower density. Do not create dozens of independent WebGL contexts unless you have measured the target devices.

## 9. Lifecycle

~~~js
fx.stop();
fx.start();
fx.resize();
fx.reset();
fx.destroy();
~~~

Call destroy when a host element is permanently removed outside a framework wrapper.

## 10. Deterministic visuals

Particles are seeded:

~~~js
new GlitterFX(hero, {
  effect: 'star-field',
  seed: 12345,
});
~~~

The same effect, seed and configuration generate the same primary particles across Canvas and WebGL. Renderer particle budgets differ, so WebGL may add extra detail particles.

## 11. Accessibility defaults

The default reducedMotion value is auto. When the operating system requests reduced motion, GlitterFX renders a static frame instead of continuously animating.

Use static to always render still:

~~~js
new GlitterFX(hero, {
  effect: 'glitter-shimmer',
  reducedMotion: 'static',
});
~~~

Use ignore only when the product explicitly requires animation regardless of the preference:

~~~js
new GlitterFX(hero, {
  effect: 'glitter-shimmer',
  reducedMotion: 'ignore',
});
~~~

## 12. What to use where

- New application: glitterfx with renderer ['webgl', 'canvas'].
- Marketing microsite with no build: CDN full bundle.
- Small decorative surface: glitterfx/canvas.
- React or Next.js: glitterfx/react.
- Existing V1 site: keep V1 until migration is useful.
