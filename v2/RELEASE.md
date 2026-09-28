# Releasing GlitterFX prereleases

One public npm package is published: **`glitterfx`**.

## Current published prerelease

As of September 28, 2026:

~~~text
Package: glitterfx
Version: 2.0.0-alpha.0
Prerelease tag: next
Git tag: v2.0.0-alpha.0
Showcase: https://glitterfx-showcase.vercel.app
~~~

Pinned browser bundle:

~~~text
https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/cdn/glitterfx.js
~~~

V2 is the default engine. The same package also carries:

- `glitterfx/legacy` and `glitterfx/v1`: V1-shaped compatibility API backed by V2.
- `dist/legacy/glitterfx.v1.js`: the exact historical V1 browser runtime for zero-break migration.

The internal `@glitterfx/*` workspace libraries remain private and are bundled into the public package.

Prereleases publish under the `next` dist-tag.

## Release checklist

1. Bump the same version across:
   - `packages/glitterfx/package.json`
   - private workspace package manifests
   - `VERSION` in `packages/core/src/index.ts`
   - lockfile references where required

2. From `/v2` run:

   ~~~bash
   npm ci
   npm run verify
   npm run pack:check
   ~~~

3. Inspect the packed artifact:

   ~~~bash
   cd packages/glitterfx
   npm pack --dry-run
   ~~~

   Confirm it contains at least:
   - `dist/index.js`
   - `dist/canvas.js`
   - `dist/react.js`
   - `dist/webgl.js`
   - `dist/legacy.js`
   - `dist/cdn/glitterfx.js`
   - `dist/cdn/glitterfx.canvas.js`
   - `dist/cdn/glitterfx.legacy.js`
   - `dist/legacy/glitterfx.v1.js`

4. Publish the prerelease:

   ~~~bash
   npm publish --access public --tag next
   ~~~

   The repository release workflow may perform the same command using the configured npm publishing credential.

5. Tag the repository:

   ~~~bash
   git tag v2.0.0-alpha.0
   git push origin v2.0.0-alpha.0
   ~~~

6. Smoke test from an empty project:

   ~~~bash
   npm i glitterfx@next
   ~~~

   Verify:
   - `import { GlitterFX } from 'glitterfx'`
   - `import { GlitterFX } from 'glitterfx/canvas'`
   - `import { GlitterFXBackground } from 'glitterfx/react'`
   - `import { GlitterFX } from 'glitterfx/legacy'`

7. Verify the exact published CDN URLs:
   - `https://cdn.jsdelivr.net/npm/glitterfx@<version>/dist/cdn/glitterfx.js`
   - `https://cdn.jsdelivr.net/npm/glitterfx@<version>/dist/cdn/glitterfx.canvas.js`
   - `https://cdn.jsdelivr.net/npm/glitterfx@<version>/dist/cdn/glitterfx.legacy.js`
   - `https://cdn.jsdelivr.net/npm/glitterfx@<version>/dist/legacy/glitterfx.v1.js`

8. If the public showcase changed, confirm `.github/workflows/showcase.yml` deploys `v2/showcase` successfully and https://glitterfx-showcase.vercel.app loads.

## Dist-tags

During prerelease, documentation and CI should use either the exact release version or:

~~~text
next -> 2.0.0-alpha.x
~~~

Do not rely on an unqualified moving install tag for critical production integrations while V2 remains alpha.

The legacy V1 runtime is delivered from the same package and does not require a separate npm 1.x publication.

## Source branch

Releases are cut from protected `main` after PR review and green CI.
