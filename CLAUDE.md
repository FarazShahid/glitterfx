# GlitterFX V2 — Claude Code Instructions

Claude must treat `v2/PROJECT_STATE.md` as the current work pointer and `v2/BOT_PROTOCOL.md` as the common execution contract.

## Read before editing
Read `v2/PROJECT_STATE.md`, `v2/BOT_PROTOCOL.md`, the active objective in `v2/ROADMAP.md`, `v2/ARCHITECTURE.md`, `v2/VERIFICATION.md`, and any ADR referenced by that objective.

## Working discipline
- Implement exactly one micro-objective per work cycle.
- Keep V1 protected files untouched.
- Make the smallest coherent change that satisfies the active acceptance criteria.
- Add or update tests in the same objective as behavior changes.
- Verify before refactoring further.
- Do not infer completion from compilation alone; execute the objective's verification checklist.
- Update `v2/PROJECT_STATE.md` only after evidence exists.
- If a design decision changes a public contract, backend model, dependency policy, or performance model, create an ADR before implementation.

## Architectural constraints
- Effect definitions are backend-independent visual specifications.
- Backends are strategies/adapters: Canvas/CPU, WebGL, and later optional WebGPU.
- Core packages must not import Three.js.
- Common config semantics must be preserved across supported backends.
- Backend-specific overrides are allowed only when declared in capabilities and documented.
- Explicit user choice outranks auto-detection.
- Graceful fallback must be deterministic and observable.
- Performance budgets are part of correctness.

## Before declaring PASS
Run the relevant tests, type checks, lint/build checks, compatibility guard, and benchmark or visual fixture checks required by `v2/VERIFICATION.md`. Report the exact evidence; never mark an objective complete on intention.