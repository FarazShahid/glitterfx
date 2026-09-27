# Troubleshooting

## Nothing appears

Check:

1. The host has non-zero width and height.
2. The effect id is valid.
3. The host is not display:none.
4. The effect layer is not being covered by an unexpected stacking context.
5. The browser console does not show an import or WebGL error.

A safe host:

~~~css
.hero {
  min-height: 500px;
  background: #05060a;
}
~~~

## Content disappeared behind the effect

GlitterFX mounts its rendering surface behind host content. Avoid applying unusual negative z-index rules to the host's children or creating unrelated stacking contexts that defeat the container isolation.

## WebGL does not start

Use an ordered fallback:

~~~js
renderer: ['webgl', 'canvas']
~~~

WebGL requires WebGL2. Browser policy, remote desktop environments, GPU driver restrictions or device limitations can disable it.

Inspect:

~~~js
console.log(fx.renderer);
~~~

to see the backend actually selected.

## Canvas works but WebGL is blank

Open the console and look for shader compilation errors. Also test the parity and fixture pages from the preview deployment.

If only one effect fails, report:

- effect id
- browser/version
- GPU/device
- quality
- seed
- relevant params

## CDN import fails

Confirm the URL is an ES module and ends at the actual JavaScript file.

Correct:

~~~html
<script type="module">
  import { GlitterFX } from 'https://cdn.example.com/v2/2.0.0-alpha.0/glitterfx.js';
</script>
~~~

Do not load the V2 module with an old classic script pattern.

## CORS error

Use the self-hosted CDN routes or a CDN that returns cross-origin access headers for modules. The included Vercel CDN configuration sends Access-Control-Allow-Origin: *.

## MIME type error

Do not serve the bundle through a route that returns text/html for unknown files. Check the network response content type and body.

## Effect is too bright

Try:

~~~js
fx.update({
  brightness: 0.75,
  glow: 0.5,
  density: 0.8,
});
~~~

For dense hero effects, brightness and density interact visually.

## Effect is too slow

Reduce:

~~~js
fx.update({
  density: 0.6,
  quality: 'eco',
  haze: 0,
});
~~~

If the host is small, consider the Canvas entry.

## Effect does not react to pointer

Ensure interaction.pointer is not none.

~~~js
interaction: {
  pointer: 'repel',
  radius: 160,
  strength: 1,
}
~~~

The renderer surface itself uses pointer-events:none; the core listens relative to the container, so page controls remain clickable.

## Animation stopped unexpectedly

Check:

- fx.running
- fx.animating
- page visibility
- whether the host is offscreen
- prefers-reduced-motion
- pauseWhenHidden
- reducedMotion

running describes start/stop intent. animating describes whether frames are actually being produced.

## Transition switches immediately

Reduced-motion policy may intentionally suppress animated transitions.

Also confirm duration is greater than zero.

## React duplicates or leaks an effect

Use glitterfx/react or destroy imperative instances in useEffect cleanup.

Do not construct GlitterFX in render.

## Next.js document is not defined

The effect was instantiated in server code. Move it to a client component or use glitterfx/react.

## Unknown palette error

V2 currently accepts built-in palette names. Inspect:

~~~js
import { palettes } from 'glitterfx';
console.log(Object.keys(palettes));
~~~

Custom palette registration is not part of the current prerelease public API.

## V1 configuration does not map directly

V2 removed background, blur, blurMode and hazeColor from the public V2 config.

Use:

- CSS for background
- glow and per-effect softness instead of V1 blur controls
- palette-tinted haze
- transitionTo instead of V1-style effect switching when animation is desired

See ../MIGRATION.md.

## Reporting a reproducible rendering issue

Include:

~~~text
effect:
renderer:
quality:
density:
speed:
size:
brightness:
glow:
haze:
opacity:
palette:
params:
interaction:
motion:
seed:
browser:
device/GPU:
~~~

A fixed seed is especially important for visual bugs.
