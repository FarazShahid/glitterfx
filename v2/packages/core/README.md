# @glitterfx/core

Backend-neutral public API, lifecycle, normalized configuration, backend selection and the frame loop. Must not import Three.js or renderer-specific types.

```ts
import { GlitterFX, registerBackend } from '@glitterfx/core';
import { canvasBackend } from '@glitterfx/backend-canvas';

registerBackend(canvasBackend);

const fx = new GlitterFX(hero, { effect: 'star-field', renderer: 'auto', quality: 'balanced', seed: 42 });
fx.update({ speed: 0.5 });
fx.stop();
fx.start();
fx.destroy();
```

`auto` picks the first supported backend in `AUTO_ORDER` (webgl, then canvas). An explicit renderer that is not registered or not supported throws, leaving the container untouched.
