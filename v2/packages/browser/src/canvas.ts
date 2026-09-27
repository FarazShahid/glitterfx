/**
 * Browser bundle, Canvas only (no Three.js): GlitterFX with the Canvas backend registered.
 *   import { GlitterFX } from '.../glitterfx.canvas.js';
 *   new GlitterFX(el, { effect: 'star-field' });
 */
import { registerBackend } from '@glitterfx/core';
import { canvasBackend } from '@glitterfx/backend-canvas';

registerBackend(canvasBackend);

export * from '@glitterfx/core';
export { effects, palettes, V1_ALIASES } from '@glitterfx/effects';
export { canvasBackend };
