# GlitterFX V2 Project State

Updated by developer agents only after verification evidence exists.

## Current status
- Integration branch: `v2-engine`
- Current phase: Phase 1 — Toolchain and package boundaries
- Current objective: `P1.O1 — Define workspace package graph`
- Gate status: READY

## Completed objectives
- `P0.O1` — V2 integration branch created from V1 main head.
- `P0.O2` — Protected V1 compatibility boundary documented.
- `P0.O3` — Claude/Codex shared execution and verification protocol established.
- `P0.O4` — V2 workspace skeleton and automated governance guard established.

## Phase 0 evidence
- Branch base: `aeaa387293edd6400c14e05f9f24ce1b58cb9d02` (`main` at bootstrap).
- Bootstrap commit: `0ec61e9d5acfbdb358e806299d20824fad3b1237`.
- Branch comparison after bootstrap: `v2-engine` ahead of `main` by one commit, behind by zero; all 21 changed paths were additions.
- Protected V1 files had zero changes in the `main...v2-engine` comparison.
- GitHub Actions workflow `V2 Governance`, run `36265334220`, completed with conclusion `success` for the bootstrap commit.
- Governance workflow executes both the guard self-test and the live protected-file comparison.

## Next objective acceptance criteria
For `P1.O1`:
1. Convert the role-only workspace skeleton into explicit package manifests.
2. Document allowed dependency directions between packages.
3. Ensure the dependency graph has no cycle.
4. Ensure `@glitterfx/core` depends on no rendering backend and no Three.js package.
5. Add an automated graph verification that can run before TypeScript/build tooling exists.
6. Record evidence here before moving to P1.O2.

## Known risks
- V2 build/test toolchain is intentionally not selected until Phase 1.
- WebGPU implementation technology is intentionally deferred until Phase 11.
- No V1 effect has been ported; visual parity work begins only after the engine contracts exist.
- Package names are architectural intent until P1.O1 verifies the explicit workspace graph.