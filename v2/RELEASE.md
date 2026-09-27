# Releasing V2 prereleases

One package is published: `glitterfx` (`packages/glitterfx`). The `@glitterfx/*` workspace libraries are private and bundled into it (the pack check enforces this). Prereleases publish under the `next` dist-tag.

The name `glitterfx` was unclaimed on npm when V2 was packaged, although the V1 README mentions `npm install glitterfx`. Decide before the first publish: either publish V1 as `glitterfx@1.x` first (so `latest` stays V1 until V2 is stable), or accept that `npm install glitterfx` installs V2.

1. Bump: set the same `version` in `packages/glitterfx/package.json`, the workspace libraries, and `VERSION` in `packages/core/src/index.ts` (a test enforces the match).
2. From `/v2`: `npm ci && npm run verify && npm run pack:check`.
3. Publish (requires an npm account; the first publish claims the name):

   ```bash
   cd packages/glitterfx && npm publish
   ```

   `publishConfig` sets `access: public` and `tag: next`.
4. Tag: `git tag v2.0.0-alpha.0 && git push origin v2.0.0-alpha.0`.
5. Smoke test from the registry in an empty folder: `npm i glitterfx@next`, mount any effect, and check the CDN URL `https://cdn.jsdelivr.net/npm/glitterfx@next/dist/cdn/glitterfx.js`.
