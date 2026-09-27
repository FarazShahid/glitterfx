# Framework Integrations

## Vanilla JavaScript

~~~js
import { GlitterFX } from 'glitterfx';

const host = document.querySelector('.hero');
const fx = new GlitterFX(host, {
  effect: 'glitter-shimmer',
  renderer: ['webgl', 'canvas'],
});

window.addEventListener('beforeunload', () => fx.destroy());
~~~

## Vite

~~~bash
npm install glitterfx@next
~~~

~~~js
import { GlitterFX } from 'glitterfx';
import './style.css';

const fx = new GlitterFX(document.querySelector('#app'), {
  effect: 'galaxy',
  renderer: ['webgl', 'canvas'],
});
~~~

No Vite plugin is required.

## React

Use the React entry:

~~~jsx
import { GlitterFXBackground } from 'glitterfx/react';

export function Hero() {
  return (
    <GlitterFXBackground
      className="hero"
      effect="glitter-shimmer"
      renderer={['webgl', 'canvas']}
      quality="high"
      transition={{ type: 'morph', duration: 1200 }}
    >
      <div className="content">
        <h1>Content stays above the renderer</h1>
      </div>
    </GlitterFXBackground>
  );
}
~~~

The wrapper owns creation, prop updates and cleanup.

## Next.js App Router

GlitterFX is a browser visual. Put the React component in a client component.

~~~tsx
'use client';

import { GlitterFXBackground } from 'glitterfx/react';

export default function Hero() {
  return (
    <GlitterFXBackground
      className="min-h-screen"
      effect="galaxy"
      renderer={['webgl', 'canvas']}
      params={{ arms: 4, twist: 2.8 }}
      interaction={{ pointer: 'repel', radius: 180, strength: 0.8 }}
    >
      <main>
        <h1>Hero</h1>
      </main>
    </GlitterFXBackground>
  );
}
~~~

The React entry is marked use client in the built package. Server rendering emits the host element; rendering starts after hydration.

## Direct imperative use in React

When you need access to the GlitterFX instance yourself:

~~~tsx
'use client';

import { useEffect, useRef } from 'react';
import { GlitterFX } from 'glitterfx';

export function EffectHost() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const fx = new GlitterFX(ref.current, {
      effect: 'star-field',
      renderer: ['webgl', 'canvas'],
    });

    return () => fx.destroy();
  }, []);

  return <div ref={ref} className="effect-host" />;
}
~~~

Always destroy the instance in the effect cleanup.

## Vue / Svelte / other SPAs

There is no framework-specific dependency in the core API. Mount after the DOM node exists and destroy during component teardown.

Pseudo-pattern:

~~~js
onMount(() => {
  const fx = new GlitterFX(host, options);
  return () => fx.destroy();
});
~~~

## CMS / no-build sites

Use the CDN module build:

~~~html
<script type="module">
  import { GlitterFX } from 'YOUR_CDN/v2/latest/glitterfx.js';

  const fx = new GlitterFX(document.querySelector('.hero'), {
    effect: 'glitter-shimmer',
    renderer: ['webgl', 'canvas'],
  });
</script>
~~~

This pattern works in custom-code areas of many hosted site builders as long as ES modules and external scripts are allowed.

## Webflow / Framer / Shopify theme code

Recommended pattern:

1. Give the target region a stable id or data attribute.
2. Load the module once.
3. Create the effect after the element exists.
4. Use one effect instance per region.
5. Avoid re-running the initializer on client navigation without destroying the previous instance.

Example:

~~~html
<section data-glitterfx="hero">...</section>

<script type="module">
  import { GlitterFX } from 'YOUR_CDN/v2/latest/glitterfx.js';

  const el = document.querySelector('[data-glitterfx="hero"]');
  if (el && !el.__glitterfx) {
    el.__glitterfx = new GlitterFX(el, {
      effect: 'dust-motes',
      renderer: ['webgl', 'canvas'],
    });
  }
</script>
~~~

## Dynamic route changes

If a framework keeps the host element alive, update the existing instance:

~~~js
fx.update({ effect: nextEffect });
~~~

or transition:

~~~js
fx.transitionTo(nextEffect, {
  type: 'morph',
  duration: 1200,
});
~~~

Do not recreate an instance on every state update.

## SSR rules

- Do not construct GlitterFX during server rendering.
- The host may be server-rendered normally.
- Start the effect only in the browser.
- Prefer glitterfx/react for React SSR frameworks.
- Do not access window or document in a server module merely to configure the effect.
