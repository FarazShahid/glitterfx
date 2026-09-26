# GlitterFX V2 Architecture

## 1. Architectural thesis
An effect is a backend-independent visual specification. Execution backends interpret that specification at different fidelity/performance levels without changing the public effect semantics.

## 2. Runtime layers
```text
Public API / Facade
        |
Effect Registry + Config Normalization
        |
Capability + Backend Policy
        |
Effect Definition / EffectGraph
        |
Backend Strategy
  |          |          |
Canvas     WebGL      WebGPU(optional)
  |          |          |
CPU sim    GLSL       TSL/compute
```

## 3. Core packages
### core
Owns public types, lifecycle, configuration, capability descriptions, quality profiles, registries, scheduling, transition contracts and backend interfaces. It must not import Three.js, DOM rendering implementations, or Rapier.

### backend-canvas
First-class CPU/Canvas2D backend. Uses typed-array particle stores, deterministic seeded random, fixed/semifixed simulation stepping where appropriate, and cheap procedural drawing. It establishes the semantic reference implementation.

### backend-webgl
High-fidelity default. Uses Three.js as an implementation detail/peer dependency, BufferGeometry, custom GLSL/materials, shader-driven motion where possible, procedural point glow, optional post FX, and minimal CPU-to-GPU uploads.

### backend-webgpu
Optional enhancement package. Added only after Canvas/WebGL contracts and reference effects are stable. Uses Three WebGPU/TSL or native compute abstractions behind the backend interface.

### effects
Defines effect identities, defaults, emitters, force/behavior graphs, material intent, capability declarations and backend overrides when required.

## 4. Core design patterns
- Facade: simple `GlitterFX` public entry point.
- Strategy: selected execution backend.
- Abstract Factory: backend resources (particle stores, materials, targets).
- Adapter: Canvas/Three/WebGPU hidden behind core interfaces.
- Registry: effects, backends, transitions, palettes and extensions.
- Builder: declarative effect authoring.
- Composite: EffectGraph/BehaviorGraph.
- State: lifecycle and transition state machines.
- Command: timeline/transition commands.
- Observer/Event Bus: lifecycle, collision-like effect events, performance notifications.
- Object Pool/Flyweight: reusable resources and shared immutable assets.
- Chain of Responsibility: explicit fallback policy and auto backend selection.
- Data-Oriented Design: SoA typed arrays and GPU-friendly buffers are preferred over object-heavy particle models.

## 5. Backend selection contract
`renderer` values: `canvas | webgl | webgpu | auto`.
`quality` values: `eco | balanced | high | ultra | auto`.

Explicit renderer selection is strict. If `renderer: 'webgpu'` is requested and unavailable, the runtime throws/returns a structured unsupported-backend error unless the user supplied a fallback list.

`renderer: 'auto'` may choose the best supported backend using capability and performance policy. Selection must be queryable and logged through diagnostics.

## 6. Common effect semantics
All backends consume normalized config. Shared fields have the same meaning regardless of backend, including effect, density, speed, brightness, size, palette, glow, interaction and transition options.

Backend-specific capabilities can be declared as:
```ts
type Fidelity = 'unsupported' | 'approximation' | 'full';

interface EffectCapabilities {
  canvas: Fidelity;
  webgl: Fidelity;
  webgpu: Fidelity;
}
```

An approximation must preserve art direction and public configuration semantics even if implementation complexity is reduced.

## 7. Effect definition model
Target authoring model:
```ts
defineEffect({
  id: 'star-field',
  defaults: { density: 1, speed: 1, glow: 0.8 },
  capabilities: { canvas: 'full', webgl: 'full', webgpu: 'full' },
  emitter: volumeBox(...),
  behaviors: [drift(...), parallax(...), twinkle(...)],
  appearance: starGlow(...),
  performance: { canvas: 800, webgl: 8000, webgpu: 100000 }
});
```

The DSL evolves only after the Canvas and WebGL reference implementations demonstrate that a shared primitive can be expressed correctly on both.

## 8. Particle data model
Conceptual state:
- position
- velocity
- acceleration/force accumulator when needed
- age/lifetime
- size
- rotation/angular velocity when needed
- color/emissive/glow parameters
- deterministic seed
- flags/custom channels

CPU storage uses typed-array Structure-of-Arrays. WebGL uses matching buffer attributes/textures as required. WebGPU later uses storage buffers. Backends may omit state that an effect does not need.

## 9. Physics model
V2 core uses lightweight mathematical forces, not a rigid-body engine:
- gravity / buoyancy
- drag
- wind
- vortex
- attractor / repulsor
- orbit
- turbulence / curl noise
- Brownian motion
- shockwave
- surface/flow fields

Rapier, if ever added, is an optional adapter for coarse rigid objects and is never required for standard background particles.

## 10. Glow and depth
Canvas: layered procedural radial gradients/sprites with bounded cost.
WebGL: procedural fragment-shader core + halo + optional diffraction, depth-aware sizing/fading, and optional selective post FX.
WebGPU: may add HDR/compute/post effects without changing effect configuration semantics.

## 11. Transition model
Transitions are first-class and independent from individual effects. Initial strategies:
- crossfade
- morph
- dissolve
- collapse/expand
- flow/warp

Transition implementations may use backend-specific optimizations, but duration/easing/progress/cancellation semantics are common.

## 12. Performance is correctness
Every effect declares backend budgets. Quality profiles map semantic density to backend-appropriate particle counts and expensive features. No objective passes if it meets visual behavior but violates its measured budget.

## 13. Accessibility and lifecycle
Core must support pause/resume/destroy, visibility suspension, resize, deterministic cleanup and `prefers-reduced-motion` policy. Reduced motion behavior must be documented and overridable by the application.

## 14. Dependency policy
All runtime dependencies must be open-source. Core should be dependency-light. Three.js is allowed only behind WebGL/WebGPU adapters. Any additional runtime dependency requires an ADR with license, bundle impact, alternatives and removal strategy.

## 15. Compatibility boundary
V2 development never mutates V1 runtime files. V2 may eventually release as major version 2, but prereleases use a non-`latest` channel until migration tests and documentation are complete.