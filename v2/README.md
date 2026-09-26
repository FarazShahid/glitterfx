# GlitterFX V2

V2 is the new dual-backend GlitterFX engine. It is isolated from V1 so existing projects using V1 are not affected.

## Target

One effect API, multiple implementations:

- Canvas/CPU — lightweight, strong visuals, broad compatibility
- WebGL — high-end shaders, more particles, richer glow/depth
- WebGPU — optional later, only where it adds real value

Start here:
1. `PROJECT_STATE.md` — what to build now
2. `ROADMAP.md` — shortest build path
3. `ARCHITECTURE.md` — only the architectural rules we need

V1 remains in the repository root. V2 lives under `/v2` on the `v2-engine` branch until release.
