# Releasing GlitterFX V2 prereleases

One public npm package is published: **`glitterfx`**.

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
   npm publish
   ~~~

   `publishConfig` sets `access: public` and `tag: next`.

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

7. Smoke test CDN artifacts:
   - `dist/cdn/glitterfx.js`
   - `dist/cdn/glitterfx.canvas.js`
   - `dist/cdn/glitterfx.legacy.js`
   - `dist/legacy/glitterfx.v1.js`

## Dist-tags

During prerelease:

~~~text
next -> 2.0.0-alpha.x
~~~

Do not point `latest` at V2 until the release is considered stable for normal production installs.

The legacy V1 runtime is delivered from the same package and does not require a separate npm 1.x publication.

## Source branch

Releases are cut from protected `main` after PR review and green CI.
