# GlitterFX V2 Documentation

GlitterFX V2 is the current development line of GlitterFX: a deterministic particle-effects engine for website backgrounds and ambient motion with two first-class renderers, Canvas 2D and WebGL.

V2 currently ships 37 effects through one public package, **glitterfx**, with the same high-level configuration on both renderers.

## Live public surfaces

- Showcase: https://glitterfx-showcase.vercel.app
- npm: `glitterfx@2.0.0-alpha.0` via the `next` prerelease tag
- Pinned V2 CDN: `https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/cdn/glitterfx.js`

The public showcase is implemented in `v2/showcase`. It uses the real published V2 CDN bundle, starts on `star-field`, uses WebGL-first ordered fallback for the main hero/playground, and loads the exact V1 runtime only after explicit legacy-demo interaction.

## What V2 is designed for

GlitterFX is meant to be mounted onto ordinary page elements rather than owning an application shell. A hero, section, full page, card background, product showcase or campaign landing page can host an effect without changing the content hierarchy.

Key capabilities:

- Canvas 2D and WebGL backends from one API.
- Ordered renderer fallback, normally WebGL first and Canvas second.
- 37 deterministic effects with seeded generation.
- Crossfade, morph and dissolve transitions.
- Global x/y/z motion controls and reverse playback.
- Generic pointer repel, attract and vortex interaction.
- Automatic resize, tab/offscreen pausing and reduced-motion handling.
- React and Next.js-friendly client component.
- Canvas-only entry point for small bundles.
- Self-contained CDN bundles for sites without a build step.

## Documentation map

| Guide | Use it when |
|---|---|
| [Getting started](./GETTING_STARTED.md) | You are integrating GlitterFX for the first time |
| [API reference](./API.md) | You need the exact public options and runtime methods |
| [Effects catalog](./EFFECTS.md) | You are choosing or tuning an effect |
| [Framework integrations](./FRAMEWORKS.md) | You use React, Next.js, Vite or another SPA |
| [CDN distribution](./CDN.md) | You need browser-module URLs or want to operate the CDN |
| [Vercel deployment](./VERCEL.md) | You are operating the public showcase deployment |
| [Performance](./PERFORMANCE.md) | You are tuning quality, particle count or mobile behavior |
| [Troubleshooting](./TROUBLESHOOTING.md) | Something does not render or behaves unexpectedly |
| [Migration from V1](../MIGRATION.md) | You are upgrading an existing V1 integration |
| [Architecture](../ARCHITECTURE.md) | You are contributing to the engine |

## Public package

The public package is **glitterfx**.

~~~bash
npm install glitterfx@next
~~~

The internal workspace libraries under the @glitterfx scope are implementation packages and remain private. Applications should consume one of these public entry points:

| Import | Purpose |
|---|---|
| glitterfx | WebGL + Canvas, automatic registration |
| glitterfx/canvas | Canvas only, no Three.js runtime import |
| glitterfx/react | React component, both renderers registered |
| glitterfx/webgl | Advanced WebGL backend creation and post-processing hooks |
| glitterfx/legacy | V1-shaped compatibility API backed by V2 |
| glitterfx/v1 | Alias of the V1-shaped compatibility adapter |

## Recommended default

For most applications:

~~~js
import { GlitterFX } from 'glitterfx';

const fx = new GlitterFX(document.querySelector('#hero'), {
  effect: 'glitter-shimmer',
  renderer: ['webgl', 'canvas'],
  quality: 'balanced',
  glow: 0.7,
  haze: 0.25,
});
~~~

Use CSS for the host background:

~~~css
#hero {
  min-height: 100vh;
  background: #05060a;
}
~~~

## V1 and V2 coexistence

V2 is the default product and development line. V1 is retained only for compatibility: through the V1-shaped adapter over V2 or the exact historical runtime packaged under `dist/legacy/`.

- Use V2 for every new project.
- Use `glitterfx/legacy` when migrating V1-shaped code onto V2.
- Load the exact V1 runtime only when an existing integration depends on historical V1 behavior.
- V2 accepts the legacy effect ids `galaxy-spiral` and `ember-drift` as aliases.
- Native V2 does not require the old global THREE pattern.
- V2 backgrounds are ordinary CSS rather than a background configuration field.

See [Migration from V1](../MIGRATION.md) for the exact mapping.
