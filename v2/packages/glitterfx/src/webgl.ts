/**
 * Advanced WebGL access: build a WebGL backend with a post-processing hook (e.g. bloom through an
 * EffectComposer). Types reference Three.js, so this entry needs `@types/three` in TypeScript projects.
 *
 *   import { GlitterFX } from 'glitterfx';
 *   import { createWebGLBackend } from 'glitterfx/webgl';
 *   new GlitterFX(el, { effect: 'galaxy', backends: [createWebGLBackend({ postprocess: (ctx) => ... })] });
 */
export { createWebGLBackend, THREE_REVISION, webglBackend, type WebGLBackendOptions } from '@glitterfx/backend-webgl';
