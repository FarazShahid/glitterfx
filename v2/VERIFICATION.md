# Verification Standard

Every roadmap objective has local checks. These global gates apply whenever relevant.

## Gate A — V1 isolation
`git diff origin/main -- glitterfx.js glitterfx-demo.html glitterfx-docs.html README.md LICENSE` must be empty.

## Gate B — static correctness
When tooling exists: TypeScript strict typecheck, lint, build, unit tests and package-boundary checks must pass.

## Gate C — deterministic behavior
Simulation tests use seeded randomness and controlled time. A failed test must be reproducible.

## Gate D — backend semantic parity
For a reference effect and normalized config, Canvas and WebGL must agree on documented semantics: lifecycle, density meaning, speed direction/scale, palette behavior, transition progress, resize, pause/resume and cleanup. Pixel-identical output is not required.

## Gate E — resource cleanup
Repeated create/start/stop/destroy cycles must leave no active RAF loop, observers/listeners, Canvas nodes or disposable backend resources owned by the instance.

## Gate F — performance
Each reference effect has a declared benchmark scene and budget. Record browser/device/environment, particle count, average frame time/FPS, worst meaningful frame window, and memory trend. Performance regression thresholds will become automated after the benchmark harness exists.

## Gate G — visual regression
Reference effects get deterministic visual fixtures at fixed viewport, seed, time and configuration. Canvas and WebGL can have separate goldens because fidelity differs. Changes require explicit fixture review, not blind regeneration.

## Gate H — fallback correctness
Explicit renderer request: no silent fallback. `auto`: deterministic supported selection. Configured fallback list: ordered and observable. Unsupported effect/backend combinations return structured diagnostics.

## Gate I — accessibility/lifecycle
Reduced-motion policy, tab visibility and offscreen behavior are verified where the objective touches runtime scheduling.

## Gate J — package hygiene
No accidental duplicate Three.js bundle, no core-to-backend import inversion, no undeclared runtime dependency, and licenses remain compatible with the open-source project policy.

## Verification evidence record
Each completed objective adds to `PROJECT_STATE.md`:
- objective ID
- commit/PR
- commands/checks
- measured values
- fixtures/artifacts
- pass/fail
- known exceptions with ADR link

## Definition of done
Code written is not done. Code + tests + objective checks + global applicable gates + recorded evidence = done.