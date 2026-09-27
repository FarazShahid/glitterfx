# @glitterfx/react

React component for GlitterFX backgrounds. Peer dependency: `react >= 18`.

```tsx
import { registerBackend } from '@glitterfx/core';
import { canvasBackend } from '@glitterfx/backend-canvas';
import { webglBackend } from '@glitterfx/backend-webgl';
import { GlitterFXBackground } from '@glitterfx/react';

registerBackend(webglBackend);
registerBackend(canvasBackend);

export function Hero({ effect }: { effect: string }) {
  return (
    <GlitterFXBackground
      className="hero"
      effect={effect}
      renderer={['webgl', 'canvas']}
      quality="balanced"
      transition={{ type: 'morph', duration: 1400 }}
    >
      <h1>Content stays on top</h1>
    </GlitterFXBackground>
  );
}
```

- Creates the instance on mount and destroys it on unmount (StrictMode-safe).
- Visual props (`effect`, `palette`, `glow`, ...) are applied with `update()` after a shallow diff; unchanged props cost nothing.
- With `transition`, effect changes animate through `transitionTo()`.
- Changing `backends`, `pauseWhenHidden` or `reducedMotion` recreates the instance.
- `onReady(fx)` exposes the instance for imperative control; `onError(error)` receives construction or update errors.
- Server rendering outputs a plain element; the effect starts after hydration.
