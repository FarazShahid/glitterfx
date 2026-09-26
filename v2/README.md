# GlitterFX V2

GlitterFX V2 is a clean-room engine evolution developed alongside V1 without changing the V1 runtime.

## Product goal
Build a lightweight open-source browser VFX runtime for website backgrounds and components. The same visual effect can have CPU/Canvas, WebGL, and optional WebGPU implementations while preserving one public semantic contract.

## Core principle
**An effect is a visual definition, not a renderer implementation.**

Developers choose the execution mode explicitly or ask GlitterFX to choose:

```ts
new GlitterFX(el, { effect: 'star-field', renderer: 'canvas', quality: 'high' });
new GlitterFX(el, { effect: 'star-field', renderer: 'webgl', quality: 'balanced' });
new GlitterFX(el, { effect: 'star-field', renderer: 'webgpu', fallback: false });
new GlitterFX(el, { effect: 'star-field', renderer: 'auto', fallback: ['webgl', 'canvas'] });
```

## V2 boundaries
- `main` remains V1 until an intentional release decision.
- `v2-engine` is the V2 integration branch.
- V2 implementation lives under this `v2/` workspace.
- V2 must not require a dedicated GPU.
- Canvas/CPU is a first-class implementation, not an afterthought.
- WebGL is the primary high-fidelity backend.
- WebGPU is an optional advanced backend after CPU/WebGL parity is proven.
- Runtime dependencies must be open source; dependency additions require an ADR.

## Workspace intent
- `packages/core`: backend-neutral API, lifecycle, effect model, scheduling and contracts.
- `packages/backend-canvas`: CPU simulation and Canvas2D rendering.
- `packages/backend-webgl`: Three.js/WebGL adapter and shader pipeline.
- `packages/backend-webgpu`: optional WebGPU/TSL/compute backend.
- `packages/effects`: backend-neutral effect definitions and reference effects.
- `packages/react`: optional React integration.
- `apps/playground`: visual test and benchmark harness.

## Work process
Agents do not improvise the next task. They read `PROJECT_STATE.md`, execute exactly one micro-objective from `ROADMAP.md`, prove it using `VERIFICATION.md`, update the state, and only then move forward.