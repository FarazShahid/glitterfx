# GlitterFX V2 Documentation

GlitterFX V2 is the current development line of GlitterFX: a deterministic particle-effects engine for website backgrounds and ambient motion with two first-class renderers, Canvas 2D and WebGL.

V2 currently ships 37 effects through one public package, **glitterfx**, with the same high-level configuration on both renderers.

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
| [Vercel deployment](./VERCEL.md) | You are deploying the preview or CDN projects |
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

V1 remains on the repository main line and continues to support existing integrations. V2 lives under /v2 and is intentionally consumed differently.

- Keep V1 in existing projects unless there is a reason to migrate.
- Use V2 for new projects.
- V2 accepts the legacy effect ids galaxy-spiral and ember-drift as aliases.
- V2 does not require the old global THREE pattern.
- V2 backgrounds are ordinary CSS rather than a background configuration field.

See [Migration from V1](../MIGRATION.md) for the exact mapping.
