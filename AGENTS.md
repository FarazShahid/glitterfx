# GlitterFX V2 — Codex

Work on `v2-engine`. V1 on `main` is production and must not be changed.

Read only:
1. `v2/PROJECT_STATE.md`
2. the current step in `v2/ROADMAP.md`
3. `v2/ARCHITECTURE.md` only when the task touches architecture

Rules:
- Build the current objective; do not invent process.
- Prefer the shortest clean implementation that moves V2 toward a working effects library.
- Do not add abstractions until a real implementation needs them.
- Canvas/CPU and WebGL are first-class. They expose the same user-facing effect/config semantics.
- WebGPU is optional later.
- Three.js stays inside GPU backends, not core contracts.
- Keep runtime dependencies open source and minimal.
- Test the behavior you changed. For visual work, use the playground and a fixed seed/config.
- When the objective works, update `PROJECT_STATE.md` with what was built and set the next objective.
- Never modify V1 protected files unless Faraz explicitly asks.
