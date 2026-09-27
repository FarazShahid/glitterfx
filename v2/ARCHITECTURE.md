# GlitterFX V2 — Architecture

## What we are building

A lightweight open-source web effects library where the same effect can run through different implementations:

```text
Effect config
     |
 GlitterFX core
     |
     +-- Canvas/CPU   -> lightweight
     |
     +-- WebGL       -> high fidelity
     |
     +-- WebGPU      -> optional later
```

The developer chooses the renderer or uses `auto`.

## Core rule

**The effect's public meaning stays the same; the backend decides how to achieve it.**

Example:

```ts
new GlitterFX(hero, {
  effect: 'star-field',
  renderer: 'canvas',
  density: 0.8,
  glow: 0.7,
  seed: 42
});
```

Changing only:

```ts
renderer: 'webgl'
```

should give the same Star Field art direction at higher fidelity/performance capacity.

## Backends

### Canvas/CPU
- first-class, not a fallback toy
- typed-array particle state
- lightweight mathematical physics
- cached/procedural drawing
- fewer particles, strong art direction

### WebGL
- Three.js implementation detail
- custom GLSL
- shader-driven animation when practical
- higher particle counts
- better glow/depth/trails
- optional post effects, not required

### WebGPU
Optional later. Use only where it materially improves an effect.

## Core must not know Three.js

Core owns:
- public config
- lifecycle
- backend selection
- normalized effect semantics
- shared timing/state contracts

Backends own rendering technology.

## Data model

Prefer data-oriented particle state:

```text
positions[]
velocities[]
sizes[]
colors[]
ages[]
lifetimes[]
seeds[]
```

not thousands of JavaScript particle objects.

## Physics

We need believable motion, not a full rigid-body engine.

Use reusable mathematical behaviors:
- gravity / buoyancy
- drag
- wind
- vortex
- attractor / repulsor
- orbit
- turbulence / curl noise
- shockwave

Rapier is not a baseline dependency.

## Architecture strategy

Do not design a giant generic Effect DSL up front.

First build Star Field in Canvas and WebGL. Then extract only the abstractions that both implementations and the next effects actually need.

That keeps the code advanced where it matters without spending tokens building framework machinery before we have evidence for it.

## Performance strategy

Performance is backend-specific:
- Canvas gets lower particle budgets and cheaper techniques.
- WebGL gets higher budgets and shader work.
- The public `density`/quality semantics remain consistent.

The playground is the primary development surface for visual comparison and tuning.

## V1 safety

V1 root files remain unchanged. V2 develops under `/v2` and on `v2-engine` until it is intentionally released as a new major version.
