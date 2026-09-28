# Vercel Deployment

GlitterFX currently uses **one canonical Vercel project** for the public showcase.

## Live production project

Project:

~~~text
glitterfx-showcase
~~~

Team:

~~~text
faraz-gis
~~~

Repository:

~~~text
FarazShahid/glitterfx
~~~

Source directory:

~~~text
v2/showcase
~~~

Production alias:

https://glitterfx-showcase.vercel.app

The showcase is a Next.js static-export site. It uses the published GlitterFX V2 CDN runtime in the browser rather than bundling a private copy of the particle engine.

## Product behavior

The public site is intentionally V2-first:

- V2 is the default and recommended engine.
- The hero starts on `star-field`.
- The main hero/playground uses ordered WebGL → Canvas fallback.
- Gallery and sample-heavy surfaces use the real V2 Canvas renderer to avoid creating many WebGL contexts.
- Sports and automotive examples run canonical V2 effects.
- The exact V1 runtime is not loaded during normal browsing.
- V1 + Three.js r128 are downloaded only after an explicit legacy-demo action.

## Deployment workflow

The deployment workflow lives at:

~~~text
.github/workflows/showcase.yml
~~~

Pull requests that change `v2/showcase/**` run:

1. showcase dependency installation
2. strict TypeScript check
3. production Next.js build

After a change reaches `main`, the same checks run before the production deployment job.

The production job:

1. authenticates with the repository `VERCEL_TOKEN` GitHub Actions secret
2. confirms the `glitterfx-showcase` project exists
3. deploys `v2/showcase` to production
4. verifies the production homepage with Vercel CLI

The deployment pipeline was successfully exercised against production on **September 28, 2026**.

## Runtime environment variables

The showcase itself requires no application secrets or runtime environment variables.

The GitHub deployment workflow requires:

~~~text
VERCEL_TOKEN
~~~

as a repository Actions secret. That token is deployment infrastructure only and is not exposed to the browser application.

## Engineering playground

The engine-focused playground remains in:

~~~text
v2/apps/playground
~~~

It is not the canonical public Vercel site.

Run it locally from `/v2`:

~~~bash
npm ci
npm run dev
~~~

Useful routes:

~~~text
/                 V2 playground
/v2.html          V2 playground alias
/v1.html          legacy V1 Effect Lab, on demand
/parity.html      Canvas/WebGL parity view
/fixtures.html    deterministic visual fixtures
~~~

## CDN deployment

There is currently **no separate GlitterFX CDN Vercel project**.

The public browser bundles are delivered from the published npm package through jsDelivr. See [CDN distribution](./CDN.md).

The optional self-hosted CDN source remains at:

~~~text
v2/apps/cdn
~~~

and can be deployed later if a first-party asset hostname becomes necessary.

## Removed projects

The previous experimental Vercel projects were deleted:

~~~text
glitterfx
glitterfx-v2-preview
~~~

Do not recreate them as parallel public surfaces unless there is a concrete need.

The intended topology is:

~~~text
npm / jsDelivr
      ↓
 GlitterFX V2 runtime

FarazShahid/glitterfx main
      ↓
 v2/showcase
      ↓
glitterfx-showcase.vercel.app
~~~

## Manual CLI deployment

With an authorized Vercel token:

~~~bash
vercel deploy v2/showcase \
  --prod \
  --yes \
  --token "$VERCEL_TOKEN" \
  --project glitterfx-showcase
~~~

The automated GitHub workflow is preferred because it keeps typecheck/build validation in front of production deployment.

## Rollback

Vercel retains previous production deployments.

If the showcase regresses, roll back or promote the previous known-good deployment instead of rebuilding old source.

The npm/CDN runtime is independently version-pinned, so rolling back the showcase does not mutate already published package artifacts.
