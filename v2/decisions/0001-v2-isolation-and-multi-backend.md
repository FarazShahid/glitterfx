# ADR 0001 — V2 isolation and multi-backend architecture

Status: Accepted

## Context
V1 is already used by external projects. V2 needs materially different internals while preserving those consumers. V2 must support both lightweight CPU/Canvas execution and higher-fidelity GPU execution.

## Decision
- Develop V2 on `v2-engine`, isolated under `/v2`.
- Keep V1 protected files unchanged during V2 implementation.
- Model effects as backend-independent visual specifications.
- Make Canvas/CPU and WebGL first-class backends; WebGPU is optional and deferred.
- Give developers explicit backend/quality/fallback control while also supporting `auto`.
- Explicit backend requests never silently downgrade.
- Keep Three.js behind backend adapters, not in core contracts.

## Alternatives
1. Rewrite V1 in place — rejected because it risks existing users.
2. WebGPU-only engine — rejected because it violates lightweight website/background goals.
3. Separate duplicated effects per backend — rejected as the default because semantics would drift; backend overrides remain allowed when necessary.

## Consequences
More up-front architecture and parity testing, but safer migration, cleaner dependencies, explicit performance control, and long-term portability.

## Verification
Protected-file CI guard, package-boundary tests, semantic parity suites and backend capability tests.

## Revisit trigger
Revisit only if two or more production effects demonstrate that shared semantic definitions impose unacceptable quality or complexity costs.