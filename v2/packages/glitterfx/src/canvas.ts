/**
 * GlitterFX, Canvas renderer only: no Three.js is imported, so bundles stay small.
 *
 *   import { GlitterFX } from 'glitterfx/canvas';
 */
import { registerBackend } from '@glitterfx/core';
import { canvasBackend } from '@glitterfx/backend-canvas';

registerBackend(canvasBackend);

export * from './shared.js';
export { canvasBackend };
