/**
 * GlitterFX: particle backgrounds for websites, Canvas and WebGL.
 *
 *   import { GlitterFX } from 'glitterfx';
 *   new GlitterFX(document.querySelector('.hero'), { effect: 'glitter-shimmer' });
 *
 * This entry registers both renderers: `renderer: 'auto'` uses WebGL (Three.js) where available and
 * falls back to Canvas. Use `glitterfx/canvas` for a Canvas-only build that never loads Three.js.
 */
import { registerBackend } from '@glitterfx/core';
import { canvasBackend } from '@glitterfx/backend-canvas';
import { webglBackend } from '@glitterfx/backend-webgl';

registerBackend(canvasBackend);
registerBackend(webglBackend);

export * from './shared.js';
// Post-processing hooks (createWebGLBackend) live in 'glitterfx/webgl' so these types never need @types/three.
export { canvasBackend, webglBackend };
