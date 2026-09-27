/**
 * Curl Flow: particles advected through a slowly evolving divergence-free field, color bands by
 * spawn position. Built on the curl archetype (archetypes/curl.ts).
 */
import { createCurlEffect, type CurlParams } from './archetypes/curl.js';
import type { ParticleEffect } from './engine/effect.js';

export const CURL_FLOW = {
  id: 'curl-flow',
  palette: 'aurora',
  counts: [900, 7000],
  size: [0.6, 1.7, 2],
  alpha: 1.2,
  steps: 8,
  speed: 0.45,
  evolve: 0.25,
  unit: 0.5,
  margin: 24,
  life: [4, 9],
  bands: true,
  trail: { count: 12, spacing: 0.025, canvas: 4 },
  haze: [
    { x: 0.2, y: 0.35, rx: 0.35, ry: 0.18, angle: -0.3, color: 1, intensity: 0.22 },
    { x: 0.5, y: 0.55, rx: 0.35, ry: 0.18, angle: 0.1, color: 2, intensity: 0.22 },
    { x: 0.8, y: 0.4, rx: 0.35, ry: 0.18, angle: 0.5, color: 3, intensity: 0.22 },
  ],
} as const satisfies CurlParams;

export const curlFlow: ParticleEffect = createCurlEffect(CURL_FLOW);
