# Performance Guide

## Renderer strategy

Recommended production default:

~~~js
renderer: ['webgl', 'canvas']
~~~

WebGL runs motion in shaders and supports far larger particle counts with constant per-frame JavaScript work for shared archetype effects.

Canvas is dependency-light and appropriate for smaller effects, low-power devices and many small regions.

## Quality levels

| Quality | DPR cap | Intent |
|---|---:|---|
| eco | 1 | battery-sensitive / low-end |
| balanced | 1.5 | default |
| high | 2 | premium hero / high-end |

Quality changes the effect's particle budget as well as render resolution.

## Density

Density scales particle count after the effect's quality budget.

~~~js
fx.update({ density: 0.6 });
~~~

Lower density first when a page is GPU or CPU constrained.

## Haze

Haze is optional atmospheric rendering.

~~~js
haze: 0
~~~

means no haze work. Do not enable it on every decorative region by default.

## Glow

Glow changes the particle halo character rather than the simulation complexity. Very strong glow can create more overdraw visually, especially in dense WebGL fields.

## Many instances

For one full-screen hero, WebGL is normally ideal.

For many cards or small sections:

- prefer Canvas
- use eco or balanced
- lower density
- keep haze off
- avoid unnecessary simultaneous animation

Browsers limit practical WebGL context counts. A page should not create a WebGL instance for every card without measurement.

## Automatic pausing

pauseWhenHidden defaults to true.

GlitterFX pauses continuous rendering when:

- the document tab is hidden
- the host is offscreen
- reduced-motion policy prevents animation

This is important for long pages.

## Reduced motion

Keep reducedMotion: auto unless a product requirement says otherwise.

Static rendering retains the visual identity without continuous motion.

## Motion and pointer cost

Global pointer interaction is implemented generically. WebGL applies it in the shared shader path.

Motion x/y/z is also generic and does not require a separate simulation engine.

Still, any interactive hero should be tested on representative mobile hardware, not only desktop Chrome.

## WebGL context loss

The WebGL backend is designed to stop and recover on context restoration. Do not treat a context-loss event as a reason to create a second instance manually.

## Measuring

Measure real pages with:

- browser performance panel
- FPS / long-frame observations
- mobile thermal/battery behavior
- GPU memory where available
- total number of active GlitterFX instances

Tune in this order:

1. reduce density
2. switch high to balanced
3. reduce/disable haze
4. use Canvas for small regions
5. reduce the number of simultaneous animated instances

## Background work

Do not add your own requestAnimationFrame around GlitterFX. The instance owns its frame loop.

Use update for state changes rather than continuously pushing the same values every frame.

## Determinism and testing

Use a fixed seed and fixed fixture time for screenshots:

~~~text
/fixtures.html?effects=galaxy&renderers=canvas,webgl&t=5&seed=42
~~~

This gives repeatable review material.
