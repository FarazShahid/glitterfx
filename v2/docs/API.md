# API Reference

## Constructor

~~~ts
new GlitterFX(container: HTMLElement, options: GlitterFXOptions)
~~~

The constructor selects a renderer, creates the backend instance, prepares the host element, mounts the rendering surface, starts observation and begins rendering.

The effect option is required. All other options are optional.

## GlitterFXOptions

| Option | Type | Range / values | Default | Behavior |
|---|---|---|---|---|
| effect | string | registered effect id | required | Visual effect |
| renderer | renderer option | auto, canvas, webgl, or ordered list | auto | Backend selection |
| quality | string | eco, balanced, high | balanced | Particle budget and DPR cap |
| density | number | 0 to 2 | 1 | Particle count multiplier |
| speed | number | 0 to 4 | 1 | Simulation time multiplier |
| size | number | 0.1 to 4 | 1 | Particle size multiplier |
| brightness | number | 0 to 2 | 1 | Global particle brightness |
| glow | number | 0 to 1 | 0.5 | Particle halo amount |
| haze | number | 0 to 1 | 0 | Atmospheric effect haze |
| opacity | number | 0 to 1 | 1 | Whole effect-layer opacity |
| params | object | finite numeric values | empty | Effect-specific controls |
| interaction | object | pointer interaction settings | off | Generic pointer influence |
| motion | object | x/y/z/reverse | still | Generic global flow |
| palette | string | known palette id | effect default | Color palette |
| seed | number | uint32 after normalization | 1 | Deterministic particle generation |
| backends | backend descriptors | advanced | global registry | Per-instance backend override |
| pauseWhenHidden | boolean | true/false | true | Pause hidden/offscreen work |
| reducedMotion | string | auto, static, ignore | auto | Motion accessibility behavior |

Numeric values are clamped to their supported range. Invalid enum values throw a TypeError.

## Renderer selection

~~~ts
renderer: 'auto'
renderer: 'canvas'
renderer: 'webgl'
renderer: ['webgl', 'canvas']
~~~

The ordered list form is the recommended production form when you explicitly want graceful fallback.

The renderer property on the running instance reports the resolved backend:

~~~js
console.log(fx.renderer); // canvas or webgl
~~~

## Quality

Quality controls particle budget and the maximum device pixel ratio used by the renderer.

| Quality | DPR cap | Typical use |
|---|---:|---|
| eco | 1 | low-power devices, small decorative areas |
| balanced | 1.5 | general production default |
| high | 2 | hero sections, desktops, controlled high-end experiences |

Each effect has separate Canvas and WebGL particle budgets.

## InteractionOptions

~~~ts
interface InteractionOptions {
  pointer?: 'none' | 'repel' | 'attract' | 'vortex';
  radius?: number;   // 10..1000 CSS px
  strength?: number; // 0..2
}
~~~

Example:

~~~js
fx.update({
  interaction: {
    pointer: 'vortex',
    radius: 220,
    strength: 1.1,
  },
});
~~~

Interaction is applied after effect placement so it works across the catalog without per-effect integration.

## MotionOptions

~~~ts
interface MotionOptions {
  x?: number;       // -1..1, positive right
  y?: number;       // -1..1, positive down
  z?: number;       // -1..1, positive toward viewer
  reverse?: boolean;
}
~~~

Example:

~~~js
fx.update({
  motion: {
    x: -0.08,
    y: -0.12,
    z: 0.4,
  },
});
~~~

Motion offsets accumulate continuously. Updating the values does not intentionally snap particles back to their initial location. reset clears accumulated motion offsets.

## update

~~~ts
fx.update(changes)
~~~

Applies a partial visual update. Runtime-only constructor options such as backends, pauseWhenHidden and reducedMotion are not part of the live update type.

Examples:

~~~js
fx.update({ brightness: 1.2, glow: 0.8 });
fx.update({ palette: 'magma' });
fx.update({ effect: 'supernova' });
fx.update({ speed: 0 });
~~~

Effect, seed, density, quality, palette and effect-parameter changes may regenerate particle data. Pure rendering controls are applied without unnecessary regeneration.

## transitionTo

~~~ts
fx.transitionTo(target, {
  type?: 'crossfade' | 'morph' | 'dissolve',
  duration?: number,
}): Promise<boolean>
~~~

Target can be an effect id or an update object.

~~~js
await fx.transitionTo('galaxy', {
  type: 'morph',
  duration: 1400,
});

await fx.transitionTo(
  { effect: 'glitter-shimmer', glow: 0.9 },
  { type: 'dissolve', duration: 900 },
);
~~~

The promise resolves true when the transition completes and false if it is cancelled or superseded.

Morph and dissolve use in-backend transition support where available. Crossfade can operate across backend changes.

## cancelTransition

~~~js
fx.cancelTransition();
~~~

Cancels the active transition and returns to its starting state.

## reset

~~~js
fx.reset();
~~~

Restores visual options to defaults while keeping the current effect and renderer preference. Accumulated motion offsets are cleared.

## start and stop

~~~js
fx.stop();
fx.start();
~~~

These control user intent. Actual rendering also depends on visibility, offscreen state and reduced-motion policy.

## resize

~~~js
fx.resize();
~~~

Forces a host remeasurement. ResizeObserver normally handles this automatically.

## destroy

~~~js
fx.destroy();
~~~

Stops animation, disconnects observers/listeners, disposes backend resources, removes rendering surfaces and restores the host preparation performed by GlitterFX.

## Runtime properties

| Property | Type | Meaning |
|---|---|---|
| container | HTMLElement | host passed to constructor |
| renderer | canvas or webgl | resolved backend |
| config | normalized config | current effective visual config |
| running | boolean | start/stop user intent |
| destroyed | boolean | instance permanently disposed |
| transitioning | boolean | transition currently active |
| animating | boolean | frames are currently being produced |

## capabilities

The public package exports capabilities to inspect browser support.

~~~js
import { capabilities } from 'glitterfx';

console.log(capabilities());
~~~

Use it for diagnostics or UI. Normal applications do not need to branch manually if they use ordered renderer fallback.

## effects and palettes exports

~~~js
import { effects, palettes } from 'glitterfx';

for (const effect of effects) {
  console.log(effect.id, effect.defaultPalette, effect.params);
}

console.log(Object.keys(palettes));
~~~

Effect definitions expose:

- id
- supported renderers
- default palette
- effect-specific parameter metadata

## Error behavior

Typical configuration mistakes fail early:

- missing or empty effect
- invalid renderer value
- empty renderer list
- invalid quality value
- non-numeric effect parameter value
- invalid interaction mode
- non-finite interaction or motion value
- unknown palette when particles are generated

When creating or switching backends/effects, the core attempts to create the new backend before discarding the working one where practical, reducing the chance that a failed update destroys a live effect.
