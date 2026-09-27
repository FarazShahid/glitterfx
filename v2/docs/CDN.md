# CDN Distribution

V2 supports two CDN paths:

1. npm-based public CDNs such as jsDelivr after the glitterfx package is published.
2. The repository's own deployable CDN application under apps/cdn, intended for a controlled Vercel domain.

The self-hosted CDN is useful for demos, internal products, staged prereleases and a stable first-party URL.

## Built browser artifacts

The public package build generates:

- dist/cdn/glitterfx.js — full WebGL + Canvas build, Three.js bundled
- dist/cdn/glitterfx.canvas.js — Canvas-only build

Build from /v2:

~~~bash
npm ci
npm run build:cdn
~~~

This builds the public glitterfx browser bundles and stages the Vercel CDN output under apps/cdn/dist.

## Self-hosted CDN application

Directory:

~~~text
v2/apps/cdn/
~~~

The CDN build copies the browser artifacts into a static site with versioned and latest aliases.

Expected routes for version 2.0.0-alpha.0:

~~~text
/v2/2.0.0-alpha.0/glitterfx.js
/v2/2.0.0-alpha.0/glitterfx.canvas.js
/v2/latest/glitterfx.js
/v2/latest/glitterfx.canvas.js
/manifest.json
/
~~~

The exact package version is read from packages/glitterfx/package.json at build time.

## Recommended production URLs

Use immutable versioned URLs in production applications:

~~~html
<script type="module">
  import { GlitterFX } from 'https://cdn.example.com/v2/2.0.0-alpha.0/glitterfx.js';

  new GlitterFX(document.querySelector('#hero'), {
    effect: 'glitter-shimmer',
    renderer: ['webgl', 'canvas'],
  });
</script>
~~~

Use latest for development, demos or rapidly moving internal pages:

~~~js
import { GlitterFX } from 'https://cdn.example.com/v2/latest/glitterfx.js';
~~~

Do not use latest for a critical production page if a release could change behavior unexpectedly.

## Canvas-only CDN

~~~js
import { GlitterFX } from 'https://cdn.example.com/v2/2.0.0-alpha.0/glitterfx.canvas.js';
~~~

Use this for small effects or projects that explicitly do not want Three.js/WebGL.

## manifest.json

The CDN build emits a manifest describing the exact served files.

Example shape:

~~~json
{
  "package": "glitterfx",
  "version": "2.0.0-alpha.0",
  "files": {
    "glitterfx.js": {
      "bytes": 123456,
      "sha256": "...",
      "integrity": "sha256-..."
    }
  }
}
~~~

The hash is calculated from the final minified browser file.

## Cache policy

Versioned files are immutable:

~~~text
Cache-Control: public, max-age=31536000, immutable
~~~

latest aliases use a short CDN cache so a release can move them safely:

~~~text
Cache-Control: public, max-age=60, s-maxage=300
~~~

manifest.json also uses a short cache.

## CORS

The CDN surface sends:

~~~text
Access-Control-Allow-Origin: *
~~~

for the module and manifest routes so ES module imports can load cross-origin.

## npm/jsDelivr route

After package publication:

~~~html
<script type="module">
  import { GlitterFX } from 'https://cdn.jsdelivr.net/npm/glitterfx@next/dist/cdn/glitterfx.js';
</script>
~~~

For strict production pinning, use an exact npm version rather than next.

## Release process for the CDN

1. Update the public package version in packages/glitterfx/package.json and matching workspace package versions.
2. Run the full V2 verification.
3. Build the glitterfx package.
4. Deploy the CDN application.
5. Confirm manifest.json reports the expected version and hashes.
6. Smoke test both full and Canvas-only URLs.
7. Publish the npm package when ready.
8. Pin production users to the exact released version.

## Custom domain recommendation

Use a dedicated asset hostname such as:

~~~text
cdn.glitterfx.dev
assets.glitterfx.dev
cdn.your-company-domain.com
~~~

Keep the interactive preview on a separate host such as:

~~~text
preview.glitterfx.dev
~~~

This lets CDN caching/security policy evolve independently from the preview application.
