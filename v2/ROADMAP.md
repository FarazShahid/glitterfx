# GlitterFX V2 Gated Roadmap

Status values: `TODO`, `IN_PROGRESS`, `BLOCKED`, `PASS`.
Rule: complete exactly one objective, verify it, record evidence, then advance.

---

## Phase 0 — Isolation and governance

### P0.O1 — Create V2 integration branch — PASS
Goal: isolate V2 from V1 production.
Deliverable: `v2-engine` branch created from current `main` head.
Verify: branch exists and initial commit equals the selected `main` head.
Exit: no V1 file changed.

### P0.O2 — Establish protected V1 boundary — PASS
Goal: make backward compatibility enforceable.
Deliverable: `COMPATIBILITY.md` and bot rules naming protected V1 files.
Verify: protected list matches current V1 runtime/demo/docs files.
Exit: future V2 work has an explicit no-touch contract.

### P0.O3 — Establish bot execution protocol — PASS
Goal: make Claude/Codex work sequential and evidence-driven.
Deliverable: `AGENTS.md`, `CLAUDE.md`, `BOT_PROTOCOL.md`, `VERIFICATION.md`.
Verify: both bot entry files point to the same canonical documents.
Exit: one-objective-at-a-time workflow is documented.

### P0.O4 — Bootstrap V2 workspace and governance CI — TODO
Goal: create isolated project folders and an automated V1-diff guard.
Deliverable: V2 workspace skeleton, package metadata, governance script, CI workflow.
Verify: governance script passes on `v2-engine`; deliberate protected-file change makes it fail in a test branch/local simulation.
Exit: V2 structure exists without implementation code.

**Phase 0 gate:** branch isolation, protected-file policy, bot protocol and automated governance guard all PASS.

---

## Phase 1 — Toolchain and package boundaries

### P1.O1 — Define workspace package graph — TODO
Goal: formalize ownership boundaries.
Deliverable: workspace packages for core, backend-canvas, backend-webgl, backend-webgpu, effects, react, and playground.
Verify: package dependency graph contains no cycles; core imports no backend.
Exit: package responsibilities match `ARCHITECTURE.md`.

### P1.O2 — Add strict TypeScript baseline — TODO
Goal: make contracts compiler-enforced.
Deliverable: shared strict tsconfig plus package configs.
Verify: empty/minimal packages typecheck with `strict`, `noImplicitOverride`, `noUncheckedIndexedAccess` (or documented equivalent).
Exit: typecheck command is green.

### P1.O3 — Add test/build/lint tooling — TODO
Goal: establish reproducible local and CI checks.
Deliverable: unit-test runner, lint/format policy, library build pipeline.
Verify: a sentinel test builds/runs in CI and locally.
Exit: one command executes required static checks.

### P1.O4 — Add package-boundary enforcement — TODO
Goal: prevent Three.js/backend leakage into core.
Deliverable: automated import-boundary rule/test.
Verify: an intentional `three` import in core fails the check.
Exit: boundary test is part of CI.

### P1.O5 — Record dependency/license policy ADR — TODO
Goal: lock open-source-only dependency rules.
Deliverable: ADR with accepted licenses, runtime dependency review fields, bundle-impact requirement.
Verify: Three.js placement and optional dependency policy are explicit.
Exit: future dependency additions have a review template.

**Phase 1 gate:** clean install, typecheck, lint, unit tests, build and boundary checks PASS.

---

## Phase 2 — Public contracts and lifecycle

### P2.O1 — Define renderer/quality/fallback types — TODO
Goal: make user choice explicit and typed.
Deliverable: `RendererKind`, `QualityProfile`, fallback policy, structured unsupported-backend error.
Verify: type tests cover explicit, auto and invalid combinations.
Exit: no renderer implementation exists yet; contract only.

### P2.O2 — Define normalized effect configuration — TODO
Goal: one semantic config independent of backend.
Deliverable: immutable normalized config model with common fields and extension channels.
Verify: normalization tests for defaults, user overrides and invalid values.
Exit: normalization is deterministic.

### P2.O3 — Define backend interface — TODO
Goal: decouple engine lifecycle from rendering implementation.
Deliverable: initialize/update/render/resize/suspend/resume/dispose capability contract.
Verify: fake backend satisfies interface and lifecycle tests.
Exit: core can run against a fake backend.

### P2.O4 — Define effect/capability contracts — TODO
Goal: describe effects independently from backend.
Deliverable: `EffectDefinition`, fidelity/capability matrix, performance budget metadata.
Verify: fixtures for full/approximation/unsupported backends.
Exit: effect registration does not reference Canvas or Three types.

### P2.O5 — Implement core lifecycle state machine — TODO
Goal: deterministic create/start/stop/suspend/resume/destroy behavior.
Deliverable: core runtime with explicit states and illegal-transition errors/no-ops as documented.
Verify: exhaustive state-transition unit tests.
Exit: no leaked timers/RAF in fake-backend tests.

### P2.O6 — Implement registry and dependency injection — TODO
Goal: allow backends/effects/transitions to be registered without hard coupling.
Deliverable: registries and engine service container/factory contracts.
Verify: test runtime with injected fake effect/backend.
Exit: no global mutable singleton is required.

**Phase 2 gate:** core lifecycle runs entirely without DOM/Three and all public contract tests PASS.

---

## Phase 3 — Deterministic CPU simulation foundation

### P3.O1 — Implement seeded random source — TODO
Goal: reproducible effects and tests.
Deliverable: small deterministic PRNG abstraction.
Verify: fixed seeds produce fixed sequences across runs.
Exit: no effect test uses uncontrolled `Math.random()`.

### P3.O2 — Implement data-oriented particle store — TODO
Goal: efficient CPU state storage.
Deliverable: typed-array SoA store with capacity, active count, reset/reuse.
Verify: unit tests for allocation, reuse, bounds and reset.
Exit: zero per-frame particle-object allocation in core store.

### P3.O3 — Implement simulation clock/integration policy — TODO
Goal: stable time semantics across backends.
Deliverable: capped delta + fixed/semifixed stepping policy.
Verify: identical seeded simulation under equivalent elapsed time within tolerance.
Exit: large-frame delta behavior is documented/tested.

### P3.O4 — Implement first force primitives — TODO
Goal: prove backend-neutral mathematical behaviors.
Deliverable: drift, drag, gravity/buoyancy, wind.
Verify: analytic/unit tests for expected velocity/position changes.
Exit: forces mutate typed arrays without temporary object churn.

### P3.O5 — Implement emitter primitives — TODO
Goal: deterministic particle initialization.
Deliverable: point, box/volume, sphere/ring emitters.
Verify: seeded spawn fixtures remain inside mathematical bounds.
Exit: emitters are renderer-independent.

**Phase 3 gate:** deterministic CPU simulation primitives PASS correctness and allocation checks.

---

## Phase 4 — Canvas/CPU reference backend

### P4.O1 — Implement Canvas backend lifecycle — TODO
Goal: first production-capable renderer.
Deliverable: Canvas2D backend implementing core interface.
Verify: create/resize/suspend/resume/destroy DOM tests.
Exit: cleanup gate passes.

### P4.O2 — Implement Canvas particle renderer — TODO
Goal: efficient draw path for background effects.
Deliverable: batched drawing policy, DPR handling and quality budget integration.
Verify: deterministic frame fixture and benchmark baseline.
Exit: no accidental unbounded DPR cost.

### P4.O3 — Implement procedural Canvas star glow — TODO
Goal: make CPU stars visually premium.
Deliverable: bounded-cost core/halo/diffraction recipe with cached assets/gradients where useful.
Verify: fixed star fixture; no per-particle texture allocation per frame.
Exit: visual fixture approved.

### P4.O4 — Implement `star-field` Canvas effect — TODO
Goal: establish semantic reference effect.
Deliverable: depth/parallax/twinkle/drift behavior using common config.
Verify: deterministic fixture, lifecycle tests, performance budget.
Exit: documented Canvas fidelity = full or approved approximation.

### P4.O5 — Add Canvas benchmark harness — TODO
Goal: make performance measurable.
Deliverable: playground benchmark route/scenario with fixed viewport/config/seed.
Verify: emits FPS/frame-time/memory trend metadata.
Exit: baseline stored in project evidence.

**Phase 4 gate:** Canvas `star-field` is visually approved, deterministic, leak-free and within budget.

---

## Phase 5 — WebGL high-fidelity backend

### P5.O1 — Add Three.js WebGL adapter behind boundary — TODO
Goal: high-end renderer without polluting core.
Deliverable: backend-webgl with Three.js peer dependency and renderer adapter.
Verify: package-boundary checks; no Three type crosses core public interfaces.
Exit: empty scene lifecycle passes.

### P5.O2 — Define WebGL particle buffer mapping — TODO
Goal: map shared particle semantics efficiently.
Deliverable: BufferGeometry/attribute mapping with explicit dirty/update rules.
Verify: buffer creation/update/disposal tests.
Exit: no unnecessary full-buffer upload for shader-driven properties.

### P5.O3 — Implement procedural GLSL star material — TODO
Goal: replace V1 canvas sprite dependence for WebGL stars.
Deliverable: core + halo + twinkle + depth-aware sizing + optional diffraction in shader.
Verify: deterministic visual fixture at fixed time/seed.
Exit: shader compiles on target WebGL2 browsers.

### P5.O4 — Implement shader-driven star motion — TODO
Goal: minimize CPU particle loops.
Deliverable: time/seed-based drift/parallax path for `star-field` where state does not require CPU mutation.
Verify: CPU profiling shows no O(N) JS position update per frame for the reference path.
Exit: visual semantics match Canvas reference.

### P5.O5 — Implement `star-field` WebGL effect — TODO
Goal: prove dual implementation.
Deliverable: same normalized config, higher fidelity/budget.
Verify: semantic parity suite + WebGL visual fixture + performance baseline.
Exit: backend switching requires no effect-specific public API change.

### P5.O6 — Add WebGL context loss/recovery behavior — TODO
Goal: website robustness.
Deliverable: documented recovery or structured failure strategy.
Verify: simulated context-loss test.
Exit: no uncontrolled crash/leak.

**Phase 5 gate:** Canvas and WebGL `star-field` pass semantic parity, visual and performance gates.

---

## Phase 6 — Effect DSL / shared behavior graph

### P6.O1 — Extract common effect primitives from StarField — TODO
Goal: avoid per-backend duplicate business semantics.
Deliverable: emitter/behavior/appearance intent model justified by two implementations.
Verify: Canvas/WebGL StarField still passes unchanged public tests.
Exit: abstractions are driven by real code, not speculation.

### P6.O2 — Implement behavior graph execution for CPU — TODO
Goal: compose approved primitives in Canvas backend.
Deliverable: ordered behavior pipeline/graph.
Verify: equivalent output to pre-extraction reference within fixture tolerance.
Exit: no regression.

### P6.O3 — Implement behavior mapping for WebGL — TODO
Goal: translate shared primitives to uniforms/shader modules where possible.
Deliverable: WebGL compiler/mapper for initial behaviors.
Verify: generated/assembled shader snapshots and runtime compile tests.
Exit: backend overrides remain possible.

### P6.O4 — Add capability declaration per primitive — TODO
Goal: prevent unsupported graphs from failing mysteriously.
Deliverable: primitive capability metadata and structured diagnostics.
Verify: unsupported primitive/backend test returns expected diagnosis.
Exit: no silent behavior omission.

**Phase 6 gate:** one backend-neutral StarField definition drives both Canvas and WebGL paths with explicit overrides only where necessary.

---

## Phase 7 — Transition engine

### P7.O1 — Define transition contract/state machine — TODO
Goal: first-class transitions with cancel/restart semantics.
Deliverable: duration, easing, progress, interruption and completion model.
Verify: deterministic timeline unit tests.
Exit: backend-independent state machine PASS.

### P7.O2 — Implement crossfade strategy — TODO
Goal: baseline transition available on all backends.
Deliverable: Canvas + WebGL implementation.
Verify: progress 0/0.5/1 fixtures and cleanup after completion/cancel.
Exit: no effect rebuild flash.

### P7.O3 — Implement morph strategy for compatible particle effects — TODO
Goal: premium transition between particle layouts.
Deliverable: stable particle correspondence policy and backend implementations.
Verify: deterministic mapping; no NaN/exploding positions on count mismatch.
Exit: semantic parity PASS.

### P7.O4 — Implement dissolve/noise strategy — TODO
Goal: visually richer general-purpose transition.
Deliverable: CPU approximation and WebGL shader implementation.
Verify: same duration/easing/cancel semantics across backends.
Exit: visual fixtures approved.

### P7.O5 — Add transition performance budget — TODO
Goal: prevent transition double-render spikes from breaking pages.
Deliverable: benchmark scenarios and temporary-resource caps.
Verify: measured peak cost recorded.
Exit: transition budgets PASS.

**Phase 7 gate:** at least crossfade/morph/dissolve are deterministic, cancellable, leak-free and budgeted.

---

## Phase 8 — Glow, haze and depth system

### P8.O1 — Define appearance semantics — TODO
Goal: common meaning for glow/core/halo/depth/twinkle.
Deliverable: normalized appearance config.
Verify: config tests and docs.
Exit: no backend-specific public glow knobs unless namespaced.

### P8.O2 — Upgrade Canvas depth/glow model — TODO
Goal: premium CPU illusion with bounded cost.
Deliverable: depth-aware size/alpha/halo strategy.
Verify: visual fixtures at multiple quality levels.
Exit: performance stays within Canvas budget.

### P8.O3 — Upgrade WebGL glow/depth model — TODO
Goal: high-end shader appearance.
Deliverable: linear-space/emissive-aware shader path as supported, with tone-safe procedural halo.
Verify: visual fixtures and overdraw stress benchmark.
Exit: dense fields do not collapse into white wash.

### P8.O4 — Implement lightweight haze semantics — TODO
Goal: replace V1 CSS-only haze with backend-aware atmospheric treatment.
Deliverable: Canvas approximation + WebGL shader/pass implementation.
Verify: haze=0 has zero/near-zero extra cost; fixed fixtures.
Exit: haze config semantic parity PASS.

### P8.O5 — Add optional WebGL post-FX hook — TODO
Goal: allow bloom/post without making it mandatory.
Deliverable: composable opt-in post pipeline contract.
Verify: disabled path carries no extra render targets; enabled fixture/budget passes.
Exit: base effects remain lightweight.

**Phase 8 gate:** stars/glow/haze/depth meet visual target on both first-class backends without requiring post FX.

---

## Phase 9 — Reference effect expansion

Each effect is implemented Canvas first, then WebGL, then parity/benchmark verified before the next effect.

### P9.O1 — Galaxy — TODO
Deliverable: shared definition + Canvas/WebGL implementations.
Verify: deterministic spiral/orbit semantics, visual fixtures, budgets, transition compatibility.

### P9.O2 — Supernova — TODO
Deliverable: radial emission, lifetime, drag/shock behavior, Canvas/WebGL.
Verify: seeded burst reproducibility, no particle leak, budget.

### P9.O3 — Ember Storm — TODO
Deliverable: buoyancy, drag, wind/turbulence, thermal appearance approximation.
Verify: motion direction/decay parity, fixture, budget.

### P9.O4 — Curl Flow — TODO
Deliverable: divergence-like flow/turbulence semantics with CPU and shader implementations.
Verify: deterministic CPU field, stable WebGL field, fixture, budget.

### P9.O5 — Prove effect authoring ergonomics — TODO
Goal: ensure DSL is usable by contributors.
Deliverable: contributor guide creates a fifth small effect without backend internals leaking.
Verify: new effect implementation diff stays mostly in effects package plus justified overrides.
Exit: architecture review PASS before porting V1 catalog.

**Phase 9 gate:** five reference effects prove emitters, forces, appearance and transitions on Canvas/WebGL.

---

## Phase 10 — Runtime performance and website behavior

### P10.O1 — Visibility suspension — TODO
Deliverable: IntersectionObserver/page-visibility policy.
Verify: RAF/render calls stop when policy says suspended and resume cleanly.

### P10.O2 — Reduced-motion policy — TODO
Deliverable: respect `prefers-reduced-motion` with documented application override.
Verify: automated media-query simulation.

### P10.O3 — Quality profile budgets — TODO
Deliverable: eco/balanced/high/ultra mappings per backend.
Verify: density/feature caps are deterministic and inspectable.

### P10.O4 — Capability inspector API — TODO
Deliverable: `inspectCapabilities()` and `inspectEffect()` style diagnostics.
Verify: synthetic capability environments produce expected results.

### P10.O5 — Auto backend selector — TODO
Deliverable: deterministic policy using support + declared budgets/capabilities.
Verify: matrix tests; explicit renderer still outranks auto.

### P10.O6 — Long-run leak/performance test — TODO
Deliverable: repeated mount/unmount and 10+ minute benchmark scenario.
Verify: bounded memory trend and stable frame-time envelope.

**Phase 10 gate:** V2 behaves responsibly as a website background/component library.

---

## Phase 11 — Optional WebGPU backend

### P11.O1 — ADR for WebGPU implementation technology — TODO
Goal: choose Three WebGPU/TSL vs alternate approach based on current stable APIs.
Deliverable: ADR with browser support, fallback implications, bundle cost and maintenance risk.
Verify: decision uses a small spike, not assumptions.

### P11.O2 — WebGPU backend lifecycle skeleton — TODO
Deliverable: optional package implementing backend interface.
Verify: unsupported environment reports cleanly and does not affect Canvas/WebGL bundles.

### P11.O3 — StarField WebGPU implementation — TODO
Deliverable: first optional advanced implementation.
Verify: same semantic parity suite + WebGPU visual/performance fixture.

### P11.O4 — GPU compute particle store — TODO
Deliverable: storage-buffer simulation path where justified.
Verify: deterministic-enough test strategy, performance comparison vs WebGL.

### P11.O5 — Add WebGPU versions only where measurable value exists — TODO
Goal: avoid feature duplication for its own sake.
Deliverable: per-effect adoption decisions.
Verify: each added WebGPU implementation has a documented quality/performance reason.

**Phase 11 gate:** WebGPU is optional, isolated, measurable and never required for core operation.

---

## Phase 12 — Framework integrations and contributor surface

### P12.O1 — Stabilize plugin/registration API — TODO
Deliverable: third-party effect/backend/transition registration contracts.
Verify: external fixture package registers an effect without private imports.

### P12.O2 — React adapter — TODO
Deliverable: component/hook wrapper with mount/update/unmount safety.
Verify: Strict Mode/double-mount lifecycle test.

### P12.O3 — Playground/devtools — TODO
Deliverable: effect picker, backend/quality selector, live controls, diagnostics and benchmark panel.
Verify: every reference effect/backend can be exercised without source edits.

### P12.O4 — Contributor authoring guide — TODO
Deliverable: documented effect creation workflow, testing, budgets and capability declarations.
Verify: clean checkout contributor exercise.

**Phase 12 gate:** third-party usage and contributor workflow are stable.

---

## Phase 13 — V1 catalog migration

### P13.O1 — Inventory V1 effects by primitive family — TODO
Goal: group migration work by mechanics, not by visual name.
Deliverable: mapping of all 26 V1 effects to existing/new primitives.
Verify: every V1 effect accounted for.

### P13.O2+ — Port effects one at a time — TODO
For each effect: shared definition -> Canvas -> verification -> WebGL -> parity -> performance -> transition fixtures. A port is not complete until all checks pass.

### P13.O3 — V1 config migration adapter — TODO
Deliverable: optional documented adapter for supported V1 configurations.
Verify: representative V1 config fixtures normalize correctly.

**Phase 13 gate:** V1 catalog coverage is measured, not assumed.

---

## Phase 14 — Release hardening

### P14.O1 — Browser/device matrix — TODO
Deliverable: supported browser policy and test matrix for Canvas/WebGL plus optional WebGPU.
Verify: CI/manual matrix evidence.

### P14.O2 — Bundle-size budgets — TODO
Deliverable: per-package compressed/uncompressed limits.
Verify: automated size report fails on threshold regression.

### P14.O3 — API documentation and migration guide — TODO
Deliverable: V2 API, backend choice guide, performance guide, V1 migration guide.
Verify: examples build against release candidate.

### P14.O4 — Prerelease publish under `next`/`beta` — TODO
Deliverable: prerelease only; never `latest`.
Verify: V1 latest/CDN path unchanged; install commands resolve intended version.

### P14.O5 — Release candidate soak — TODO
Deliverable: real-site integration tests and issue burn-down.
Verify: no open release-blocking correctness/leak/compatibility regressions.

### P14.O6 — Owner-controlled stable release decision — TODO
Goal: promote only after explicit repository-owner approval.
Deliverable: release checklist and signed-off version/tag plan.
Verify: all prior phase gates PASS.

**Phase 14 gate:** V2 is releasable without breaking V1 consumers.

---

## Sequence rule
Do not collapse phases to save time. Parallel research is allowed, but implementation advances only through the current `PROJECT_STATE.md` objective and its gate.