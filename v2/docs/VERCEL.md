# Vercel Deployment

V2 is prepared as two independent Vercel projects.

## Project A: interactive preview

Purpose: public review of the current V2 playground.

Recommended Vercel project name:

~~~text
glitterfx-v2-preview
~~~

Repository:

~~~text
FarazShahid/glitterfx
~~~

Git branch:

~~~text
v2-engine
~~~

Root Directory:

~~~text
v2/apps/playground
~~~

The directory includes vercel.json with the install command, build command, output directory and root rewrite.

The root URL rewrites to v2.html.

Useful routes:

~~~text
/                 main V2 playground
/v2.html          main V2 playground
/parity.html      Canvas/WebGL parity view
/fixtures.html    deterministic visual fixture page
~~~

The Vite build has all three pages as explicit entries.

### Preview validation

After deployment:

1. Open / and confirm an effect animates.
2. Switch renderer among auto, Canvas and WebGL.
3. Open /parity.html and compare the two backends.
4. Open /fixtures.html?effects=glitter-shimmer&renderers=canvas,webgl&t=5&seed=42.
5. Verify the browser console has no shader, import or asset errors.
6. Test a mobile viewport.
7. Test prefers-reduced-motion.

## Project B: CDN

Recommended Vercel project name:

~~~text
glitterfx-v2-cdn
~~~

Root Directory:

~~~text
v2/apps/cdn
~~~

The CDN project builds the public glitterfx package and stages the self-contained browser bundles into its own dist folder.

Routes:

~~~text
/v2/<version>/glitterfx.js
/v2/<version>/glitterfx.canvas.js
/v2/latest/glitterfx.js
/v2/latest/glitterfx.canvas.js
/manifest.json
~~~

Versioned files receive long immutable cache headers. latest and manifest use short cache headers.

## Git deployment behavior

For both projects:

- Production branch: v2-engine while V2 is prerelease.
- Other branches may be enabled as Vercel Preview Deployments.
- V1 main remains independent.

When V2 is released and merged into the repository's normal release line, production branch policy can change without changing the application build.

## Suggested domains

Preview:

~~~text
v2.glitterfx.dev
preview.glitterfx.dev
~~~

CDN:

~~~text
cdn.glitterfx.dev
~~~

If the domain is not available yet, keep the generated vercel.app URLs.

## Environment variables

Neither the preview nor CDN application currently requires secrets or runtime environment variables.

That is intentional: both are static outputs.

## Rollback

Vercel retains prior deployments. If a preview or CDN build has a regression, promote/rollback to the previous known-good deployment rather than rebuilding old source.

For CDN users pinned to an exact versioned URL, previously deployed immutable assets should remain stable.

## Vercel CLI equivalent

If deploying from a machine with Vercel CLI authentication:

~~~bash
vercel --cwd v2/apps/playground
vercel --cwd v2/apps/cdn
~~~

For production:

~~~bash
vercel --prod --cwd v2/apps/playground
vercel --prod --cwd v2/apps/cdn
~~~

## Why two projects

The preview is an application: it changes frequently and should not have year-long caching.

The CDN is an asset service: versioned files should be immutable, stable and aggressively cached.

Keeping them separate prevents a preview deployment change from accidentally changing CDN behavior or cache policy.
