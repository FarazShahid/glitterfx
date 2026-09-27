<div align="center">

# GlitterFX

**Cinematic particle backgrounds for the web. One package, two generations, one migration path.**

V2 is the current engine: 37 deterministic effects, Canvas + WebGL, transitions, pointer interaction, x/y/z motion, React and CDN builds.

The original V1 runtime is retained as a legacy migration asset inside the same package.

</div>

## Install

~~~bash
npm install glitterfx@next
~~~

### New projects: V2

~~~js
import { GlitterFX } from 'glitterfx';

const fx = new GlitterFX(document.querySelector('#hero'), {
  effect: 'glitter-shimmer',
  renderer: ['webgl', 'canvas'],
  quality: 'balanced',
});
~~~

### Existing V1-shaped code, running on V2

~~~js
import { GlitterFX } from 'glitterfx/legacy';

const fx = new GlitterFX(document.querySelector('#hero'), {
  effect: 'galaxy-spiral',
  background: '#05060a',
  blur: 2,
});
~~~

### Exact historical V1 runtime

For old sites that depend on runtime custom effects/palettes or exact V1 blur behavior:

~~~html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/legacy/glitterfx.v1.js"></script>
~~~

## One public package

| Entry | Purpose |
|---|---|
| `glitterfx` | V2 WebGL + Canvas |
| `glitterfx/canvas` | V2 Canvas-only |
| `glitterfx/react` | V2 React component |
| `glitterfx/webgl` | advanced V2 WebGL hooks |
| `glitterfx/legacy` | V1-shaped API translated onto V2 |
| `glitterfx/v1` | alias of the legacy adapter |
| `dist/legacy/glitterfx.v1.js` | exact original V1 classic runtime |

## V2

V2 source, documentation, preview and distribution tooling live under [v2/](./v2/).

- [V2 documentation](./v2/docs/README.md)
- [Getting started](./v2/docs/GETTING_STARTED.md)
- [API reference](./v2/docs/API.md)
- [Effects catalog](./v2/docs/EFFECTS.md)
- [CDN distribution](./v2/docs/CDN.md)
- [Vercel deployment](./v2/docs/VERCEL.md)
- [Migration guide](./v2/MIGRATION.md)

## V1 archive

The original root V1 assets remain temporarily so existing GitHub-CDN URLs do not break:

- `glitterfx.js`
- `glitterfx-demo.html`
- `glitterfx-docs.html`

The previous V1 README is archived at [legacy/V1_README.md](./legacy/V1_README.md).

No new feature development should target the V1 engine. New work belongs in V2.

## Collaboration

`main` is intended to be protected and PR-only. CODEOWNERS and CI checks are kept under `.github/`; collaborators should work on branches and open pull requests.

## License

Unlicense. See [LICENSE](./LICENSE).
