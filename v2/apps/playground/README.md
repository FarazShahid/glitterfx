# GlitterFX Effect Lab

A zero-build live preview site for GlitterFX.

For now it uses the existing V1 runtime as the visual baseline so every current effect is immediately available while V2 is being implemented. As V2 backends become usable, this UI will become the V2 playground.

## Run

With the V2 workspace (serves both the Lab and the V2 page from one server):

```bash
cd v2 && npm ci && npm run dev
```

Then open `/` for the Effect Lab or `/v2.html` for the V2 page.

Without installing anything, from the repository root, serve the repository over HTTP. For example:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080/v2/apps/playground/
```

The page loads Three.js r128 from cdnjs and the repository's root `glitterfx.js`.

## Included

- all effects from `GlitterFX.listEffects()`
- all registered palettes
- blur modes
- density / speed / size / brightness / blur / haze controls
- pause/resume
- previous/next navigation
- autoplay
- live FPS readout
- copyable configuration
- keyboard navigation with left/right arrows and space to pause

The page deliberately mounts only one effect at a time so previewing the catalog does not create 26 simultaneous WebGL renderers.
