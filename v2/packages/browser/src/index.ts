/**
 * Browser bundle, full: GlitterFX with the WebGL (Three.js bundled) and Canvas backends
 * registered. `renderer: 'auto'` picks WebGL and falls back to Canvas.
 */
import { registerBackend } from '@glitterfx/core';
import { webglBackend } from '@glitterfx/backend-webgl';

export * from './canvas.js';
export { webglBackend };

registerBackend(webglBackend);
