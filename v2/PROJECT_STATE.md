# GlitterFX V2 Project State

Updated by developer agents only after verification evidence exists.

## Current status
- Integration branch: `v2-engine`
- Current phase: Phase 0 — Isolation and governance
- Current objective: `P0.O4 — Bootstrap V2 workspace and governance CI`
- Gate status: IN_PROGRESS

## Completed objectives
- `P0.O1` — V2 integration branch created from V1 main head.
- `P0.O2` — Protected V1 compatibility boundary documented.
- `P0.O3` — Claude/Codex shared execution and verification protocol established.

## Evidence
Initial branch base: `aeaa387293edd6400c14e05f9f24ce1b58cb9d02`.
Protected V1 source remains in root and is not part of the V2 workspace.

## Active objective acceptance criteria
For `P0.O4`:
1. `v2/` workspace skeleton exists.
2. Package roles are visible without implementation code.
3. A zero-dependency governance script verifies required V2 control files.
4. CI checks that protected V1 files remain unchanged relative to `main`.
5. Governance verification is run successfully on the branch.
6. Evidence is recorded here before moving to P1.O1.

## Known risks
- V2 build/test toolchain is intentionally not selected until Phase 1.
- WebGPU implementation technology is intentionally deferred until Phase 11.
- No V1 effect has been ported; visual parity work begins only after the engine contracts exist.