# CDN Distribution

GlitterFX V2 is publicly available through the published npm package and npm-backed CDNs.

## Current public CDN

The canonical browser CDN path is currently **jsDelivr backed by npm**.

Published package version:

~~~text
glitterfx@2.0.0-alpha.0
~~~

Pinned browser bundles:

| Surface | URL |
|---|---|
| Full V2: WebGL + Canvas | `https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/cdn/glitterfx.js` |
| V2 Canvas-only | `https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/cdn/glitterfx.canvas.js` |
| V1-shaped adapter running on V2 | `https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/cdn/glitterfx.legacy.js` |
| Exact historical V1 runtime | `https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/legacy/glitterfx.v1.js` |

For production demos and reproducible integrations, prefer the exact version above.

The prerelease tag is also available:

~~~text
glitterfx@next
~~~

During the alpha period, application code should use either the exact published version or `@next`; do not depend on an unqualified moving tag for critical production pages.

## Full V2 example

~~~html
<section id="hero"></section>

<script type="module">
  import { GlitterFX } from 'https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/cdn/glitterfx.js';

  new GlitterFX(document.querySelector('#hero'), {
    effect: 'star-field',
    renderer: ['webgl', 'canvas'],
    quality: 'balanced',
  });
</script>
~~~

The full browser bundle is self-contained and includes the WebGL implementation plus Canvas fallback.

## Canvas-only example

~~~html
<script type="module">
  import { GlitterFX } from 'https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/cdn/glitterfx.canvas.js';

  new GlitterFX(document.querySelector('#hero'), {
    effect: 'dust-motes',
    renderer: 'canvas',
  });
</script>
~~~

Use Canvas-only when the surface is small, the page has many independent animated regions, or the project explicitly does not want WebGL/Three.js.

## Legacy choices

V1-shaped API backed by V2:

~~~html
<script type="module">
  import { GlitterFX } from 'https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/cdn/glitterfx.legacy.js';
</script>
~~~

Exact historical V1 runtime:

~~~html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/legacy/glitterfx.v1.js"></script>
~~~

Use the exact V1 runtime only when an existing integration depends on historical V1 behavior such as runtime custom effect/palette registration or exact legacy blur behavior.

## Built browser artifacts

The public package build generates:

~~~text
dist/cdn/glitterfx.js
dist/cdn/glitterfx.canvas.js
dist/cdn/glitterfx.legacy.js
dist/legacy/glitterfx.v1.js
~~~

Build from `/v2`:

~~~bash
npm ci
npm run build:cdn
~~~

## Optional self-hosted CDN source

The repository still contains an optional static CDN application at:

~~~text
v2/apps/cdn/
~~~

It can stage versioned and latest aliases such as:

~~~text
/v2/2.0.0-alpha.0/glitterfx.js
/v2/2.0.0-alpha.0/glitterfx.canvas.js
/v2/2.0.0-alpha.0/glitterfx.legacy.js
/v2/2.0.0-alpha.0/glitterfx.v1.js
/v2/latest/glitterfx.js
/manifest.json
~~~

As of **September 28, 2026**, there is **no separate GlitterFX first-party CDN Vercel project**. The old Vercel preview/CDN experiments were removed so the only canonical GlitterFX Vercel project is the public showcase.

The active public browser distribution is npm/jsDelivr.

## Optional self-hosted cache policy

If `v2/apps/cdn` is deployed in the future, versioned files are intended to be immutable:

~~~text
Cache-Control: public, max-age=31536000, immutable
~~~

Moving aliases and `manifest.json` use short caches:

~~~text
Cache-Control: public, max-age=60, s-maxage=300
~~~

The self-hosted CDN also emits SHA-256 hashes and SRI-style integrity strings in `manifest.json`.

## Release verification

For every public release:

1. Run the full V2 verification and pack check.
2. Publish the npm package under the intended prerelease/stable tag.
3. Verify the exact package version from the npm registry.
4. Verify the exact-version jsDelivr URLs for the full, Canvas, legacy-adapter and exact-V1 artifacts.
5. Smoke test a plain HTML page importing the pinned CDN module.
6. Update documentation examples if the public version changes.

## Public showcase

The live showcase at https://glitterfx-showcase.vercel.app uses the actual published V2 CDN bundle.

The main experience is V2-first. The exact V1 runtime is downloaded only after explicit user interaction in the legacy section.
