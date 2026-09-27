# GlitterFX V2 — Current Work

## Branch
`v2-engine`

## Current development objective
**Step 4 — Shape Targets** (4.1 target data contract first)

Build now: renderer-independent `ParticleTarget { points, count, aspect, key? }` in the config path without DOM types in core; then points/text samplers, one `shape-target` effect, reuse of the existing morph.

## Done: single npm package (owner request)
- Published artifact is now one package, **`glitterfx`** (`packages/glitterfx`, 2.0.0-alpha.0, `next` tag): entries `glitterfx` (both renderers registered), `glitterfx/canvas` (no Three.js), `glitterfx/react` ('use client'), `glitterfx/webgl` (post-processing hook; the only entry whose types reference three), plus self-contained CDN builds in `dist/cdn/`. Workspace libraries `@glitterfx/*` are private and bundled in; `@glitterfx/browser` was folded into it and removed. `three` is a peer (auto-installed by npm 7+), React an optional peer. Types are bundled into one `.d.ts` per entry with rollup-plugin-dts, using `@typescript/typescript6` because TypeScript 7 has no JS compiler API (the risk noted in Phase 1); typechecking stays on TS7. A finalize step and `pack:check` fail the build if any published JS or `.d.ts` references a private package.
- Name `glitterfx` is unclaimed on npm (V1 was never published there despite its README). Owner decision pending: publish V1 as 1.x first, or let `npm install glitterfx` install V2. License corrected to the repo's actual LICENSE (Unlicense); earlier manifests said MIT.
- Verified as a user would: packed tarball installed into a clean project (three auto-installed, no private packages), strict TypeScript without @types/three (an invalid option is a type error), Node ESM import and React server rendering, Vite production build running in Chromium on WebGL and Canvas with the React component, Canvas-only bundle contains no Three.js, CDN file works from a plain HTML page.

## Done: reset to defaults (owner request)
- `fx.reset()`: every visual option back to its default, keeping the current effect and renderer (runtime options untouched), accumulated motion offsets cleared so flowed fields return to their layout; later updates start from defaults. Playground "Reset to defaults" button restores all controls (sliders, palette, effect settings, motion, pointer, seed, quality) to the playground baseline, keeping the chosen effect and backend. Tested in core and in Chromium on both renderers.

## Done: Step 3.6 Motion controls (owner request)
- `motion: { x, y, z, reverse }` normalized in core (flows -1..1, reverse boolean). Core integrates flows into offsets each frame (x/y in view heights, z in fly-through cycles at 0.35/s for z = 1) so live changes never jump; `reverse` negates effect time. FrameTime gains `motion` and `direction`.
- Shared `applyMotion()` before pointer interaction, on Canvas and in the common WebGL point path (single and morph shaders): x/y shift and wrap on-view particles (far off-view ones stay unwrapped); z is a perspective fly-through, each particle cycling its own depth by hash with offset from center scaled by 1/depth (uniform screen coverage; a first log-radius design collapsed fields into the center and was replaced); fades at cycle ends; size grows with sqrt(scale).
- Reverse: every effect samples finite at negative time (tested for all 37). Fixed quantum odd/even parity for negative hop counts (JS `%` vs GLSL `mod`); a continuity sweep test fails on the old code (56 px teleports) and passes now. Trails sample ahead in effect time while reversed so they stay behind the motion (Canvas and WebGL).
- Playground: horizontal/vertical/depth flow sliders and a Forward/Reverse toggle. Verified in Chromium on both renderers.

## Done in Step 3 (Pointer Interaction)
- 3.1 `interaction: { pointer: 'none' | 'repel' | 'attract' | 'vortex', radius (10-1000, default 140), strength (0-2, default 0.8) }` normalized and validated in core.
- 3.2 Core listens to pointermove/pointerdown/pointerleave/pointercancel on the container only while interaction is on (surfaces stay pointer-events: none); presence eases in/out over ~0.2 s; each frame carries `pointer: { mode, x, y, radius, strength }` (FrameTime.pointer). Pointer velocity is not tracked: nothing uses it yet.
- 3.3 Canvas: shared `applyPointer()` (effects/engine/interaction.ts) after every `sample()`, including trail samples, dissolves and morphs. Stateless displacement with a Gaussian falloff to 3 radii: repel pushes out, attract pulls in without overshooting, vortex rotates preserving distance; slight brightening near the pointer.
- 3.4 WebGL: the same math in the shared `emitPoint` path (both the single-effect and morph shaders) via `uPointer`/`uPointerMode` uniforms, so all 37 effects react with O(1) JS per frame.
- 3.5 Playground: pointer mode, radius and strength controls (live, no regeneration). Verified with fixed-pointer fixtures (both backends near-identical) and real mouse input in Chromium (repel empties the area around the pointer on Canvas and WebGL).

## Done in Step 2 (Cheap New Effects), 37 effects total
All are parameter sets in `effects/src/pack.ts` on existing archetypes; new palettes are data only.
- 2.1 `warp-speed`: accelerating radial stream, 16-sample trails (8 on Canvas), size growth.
- 2.2 `bioluminescent-ocean`: wave sheet with brightness almost entirely on crests, three swells, cyan haze.
- 2.3 `pollen-drift`, `falling-ash`, `dust-motes` (slanted sunbeam haze), `dandelion-seeds`, `rising-lanterns` on the drift archetype. Dandelion seeds read as soft round flakes until shaped particles (Step 5).
- 2.4 `accretion-disk` (white-hot inner edge cooling outward, sheared orbit, beamed approaching side, trails) and `planetary-rings` (tilted banded ring around a glowing planet). Additive rendering cannot occlude, so the ring does not pass behind the planet.
- One archetype extension, needed by warp speed and both disks: radial `band` (stream/sync start radius, so the center stays open; orbit inner/outer radius), `roll`, and orbit-only `heat`, `beaming`, `ringlets`. All default off; a pixel diff of the 7 existing radial effects on both backends against the pre-change code is exactly 0.

## Done in Step 1 (Glitter Shimmer)
- 1.1 `glintPulse(phase, rate, t, sharpness)` in shared behaviors + GLSL mirror: irregular shimmer (two incommensurate sines) and rare sharp glints (peaky wave gated by a slower detuned wave; about one glint per 16 / rate s, `sharpness` sets how brief). Tests prove repeatability, range, rarity and irregular spacing. New `apps/playground/parity.html` runs the shared GLSL on the GPU (float32 target) and compares with the CPU functions: max |GPU - CPU| glintPulse 6.5e-3 (float32 argument precision at t up to 300 s with steep exponents), twinkle 6e-5, turbulence 1.5e-4, curlVelocity 7.3e-4. Existing effects unchanged (no existing code path calls it).
- 1.2 `glitter-shimmer` (now the first effect and playground default): dense micro-glitter floating in depth, per-frame star-cross flare sprite while a flake glints, sparse larger flakes that glint longer, warm out-of-focus foreground bokeh, far flakes soft, new `glitter` palette, optional warm haze. Runs through the existing generic renderers (no new renderer). Budgets 900/2000/3600 Canvas, 8k/22k/44k WebGL.
- 1.3 Params `flareRate`, `shimmer`, `depth`, `wave` (diagonal band of light; only a hashed 35% of flakes flare in it so the band never clips), exposed automatically in the playground. Reviewed subtle (density 0.35, low flare/shimmer/depth), default and hero (flare 2, wave 1, haze 0.5) on both backends.

## Development path
Use only `ROADMAP.md` for implementation order.

## Current V2 baseline
Already working:
- Canvas + WebGL backends
- 37 effects (27 V1 catalog + glitter-shimmer + 9 Step 2 effects)
- generic ParticleEffect / ParticleStore
- drift / radial / wave / fountain / quantum / curl archetypes
- Canvas and WebGL trails
- glow / haze / depth softness
- morph / dissolve / crossfade
- effect-specific params
- visibility pause / reduced motion / context restore
- React package
- browser bundles
- full V1 catalog on V2
- package-ready `2.0.0-alpha.0`
- CI typecheck / build / tests / pack-check green

## Public alpha
Publishing `2.0.0-alpha.0` is an owner action described in `RELEASE.md`.
It does not block continued development.

## Next after Step 1
1. cheap effects pack
2. pointer interaction
3. Shape Targets
4. shaped particle renderer
5. custom palettes + Web Component
