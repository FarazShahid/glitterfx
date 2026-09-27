# GlitterFX V2 — Current Work

## Branch
`v2-engine`

## Current development objective
**Step 1.1 — Glint pulse primitive**

Build now:
- CPU `glintPulse()` in shared behaviors
- matching GLSL implementation
- deterministic irregular shimmer with rare sharp glints
- tests proving repeatability and CPU/GLSL intent

Then move directly to:
**Step 1.2 — Glitter Shimmer effect**

## Development path
Use only `ROADMAP.md` for implementation order.

## Current V2 baseline
Already working:
- Canvas + WebGL backends
- 27 effects
- generic ParticleEffect / ParticleStore
- drift / radial / wave / fountain / quantum / curl archetypes
- Canvas and WebGL trails
- glow / haze / depth softness
- morph / dissolve / crossfade
- effect-specific params
- visibility pause / reduced motion / context restore
- React package
- browser bundles
- full V1 catalog on V2
- package-ready `2.0.0-alpha.0`
- CI typecheck / build / tests / pack-check green

## Public alpha
Publishing `2.0.0-alpha.0` is an owner action described in `RELEASE.md`.
It does not block continued development.

## Next after Step 1
1. cheap effects pack
2. pointer interaction
3. Shape Targets
4. shaped particle renderer
5. custom palettes + Web Component
