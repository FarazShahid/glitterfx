# V1 / V2 Compatibility Contract

## Protected V1 files
The following files are immutable during V2 development unless the repository owner explicitly opens a migration objective:
- `/glitterfx.js`
- `/glitterfx-demo.html`
- `/glitterfx-docs.html`
- `/README.md`
- `/LICENSE`

## Branch isolation
`main` is the V1 production line. `v2-engine` is the V2 integration line. Feature work branches from `v2-engine` and merges back to `v2-engine`, never directly to `main`.

## Distribution safety
Before V2 stable release:
- Do not publish V2 as npm `latest`.
- Use a prerelease version and `next`/`beta` dist-tag if publication is needed.
- Do not replace CDN URLs used by V1.
- Do not rename or delete V1 global APIs.
- Do not require existing V1 consumers to adopt modules, TypeScript, WebGPU, or a new build step.

## Semantic compatibility goal
V2 may intentionally introduce a new API, but migration must be explicit. Existing V1 projects continue running unchanged. A future compatibility adapter may translate a documented V1 config into V2 config, but that is not part of the core engine until a dedicated roadmap objective.

## Guardrail
Every V2 PR must prove that protected V1 files are unchanged relative to `main`.