# GlitterFX V2 — Codex Operating Instructions

This file is authoritative for Codex-style coding agents working on the `v2-engine` program.

## Mandatory read order
1. `v2/PROJECT_STATE.md`
2. `v2/BOT_PROTOCOL.md`
3. `v2/ROADMAP.md`
4. `v2/ARCHITECTURE.md`
5. `v2/VERIFICATION.md`
6. `v2/COMPATIBILITY.md`

## Non-negotiable rules
- V1 is production compatibility territory. Do not modify `glitterfx.js`, `glitterfx-demo.html`, `glitterfx-docs.html`, root `README.md`, or `LICENSE` while implementing V2.
- Work only on one roadmap micro-objective at a time.
- Start each objective from `v2-engine` on a branch named `v2/p<phase>-o<objective>-<slug>`.
- Do not mark an objective complete until every verification item in that objective passes.
- Record evidence in `v2/PROJECT_STATE.md`: tests run, benchmark/result where applicable, changed contracts, and commit/PR reference.
- Do not begin the next objective when the current gate is red.
- Do not add a runtime dependency without an ADR. V2 is open-source only.
- Three.js may be a peer/runtime dependency for the WebGL/WebGPU backends; core domain code must not depend on Three.js types.
- Canvas/CPU and WebGL implementations must expose the same public effect semantics.
- WebGPU is optional enhancement, never a baseline requirement.
- Explicit backend selection must never silently downgrade. Fallback occurs only when configured or when backend is `auto`.
- Prefer data-oriented particle storage (typed arrays / GPU buffers) over per-particle objects.
- No premature port of all V1 effects. Reference effects prove the architecture first.

## Required completion response
At the end of an objective, report: Objective ID, files changed, verification commands/results, performance evidence if required, compatibility impact, unresolved risks, and whether the gate is PASS or FAIL.

## Stop conditions
Stop and leave the objective uncompleted if tests fail, V1 protected files change, a public contract is ambiguous, a backend cannot preserve the documented effect semantics, or an architectural decision requires a new ADR.