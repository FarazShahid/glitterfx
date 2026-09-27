# V1 Safety

V2 must not break projects already using GlitterFX V1.

During V2 development, do not modify:
- `/glitterfx.js`
- `/glitterfx-demo.html`
- `/glitterfx-docs.html`
- `/README.md`
- `/LICENSE`

`main` remains V1. `v2-engine` is the V2 integration branch.

An automated GitHub Action checks this rule. That is the only mandatory governance layer.
