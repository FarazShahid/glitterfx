# Releasing V2 prereleases

Packages: `@glitterfx/core`, `effects`, `backend-canvas`, `backend-webgl`, `react`, `browser`. All share one version and publish with the `next` dist-tag, so `npm install @glitterfx/core` (latest) is unaffected until a stable release. The V1 `glitterfx` package is never touched.

1. Bump: set the same `version` in every `packages/*/package.json`, the internal `@glitterfx/*` dependency pins, and `VERSION` in `packages/core/src/index.ts` (a test enforces the match).
2. From `/v2`: `npm ci && npm run verify && npm run pack:check`.
3. Publish in dependency order (requires npm access to the `@glitterfx` scope):

   ```bash
   for p in core effects backend-canvas backend-webgl react browser; do (cd packages/$p && npm publish); done
   ```

   `publishConfig` sets `access: public` and `tag: next`.
4. Tag: `git tag v2.0.0-alpha.0 && git push origin v2.0.0-alpha.0`.
5. Smoke test from the registry in an empty folder: `npm i @glitterfx/core@next @glitterfx/backend-canvas@next` and mount any effect.
