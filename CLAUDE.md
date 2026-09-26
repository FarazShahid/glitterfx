# GlitterFX V2 — Claude

Build V2; do not manage V2.

Start with `v2/PROJECT_STATE.md`, then execute the matching step in `v2/ROADMAP.md`.

Keep these constraints:
- V1 root implementation stays untouched.
- One public effect/config model; Canvas/CPU and WebGL implement it differently.
- Optimize for a lightweight website-effects library, not a game engine.
- Use TypeScript and data-oriented particle storage.
- WebGL should move work into shaders where useful; CPU/Canvas must remain visually strong.
- WebGPU is optional after Canvas + WebGL are proven.
- Avoid speculative frameworks, ADRs, duplicated abstractions, and unrelated refactors.
- Add only the tests/checks needed to prove the current work.
- Finish the current objective before moving to the next one.
