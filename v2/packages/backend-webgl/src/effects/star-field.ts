import { STAR_DRIFT, STAR_EDGE_MARGIN } from '@glitterfx/effects';
import { f } from '../glsl/common.js';

/** Mirror of `starField.sample` in @glitterfx/effects. */
export const STAR_FIELD_GLSL = /* glsl */ `
bool sampleParticle(out vec2 pos, out float radius, out float alpha, out float colorPos, out float flare, out float soft) {
  float depth = position.z;
  vec2 ext = uResolution + 2.0 * ${f(STAR_EDGE_MARGIN)};
  float travel = ${f(STAR_DRIFT.speed)} * max(uResolution.x, uResolution.y) * uTime;
  vec2 drift = vec2(${f(STAR_DRIFT.x)}, ${f(STAR_DRIFT.y)}) * travel * depth * depth;
  pos = mod(position.xy * ext + drift, ext) - ${f(STAR_EDGE_MARGIN)};
  radius = aShape.x * (0.35 + 0.65 * depth);
  alpha = (0.25 + 0.75 * depth) * aShape.y * twinkle(aTime.x, aTime.y, aTime.z, uTime);
  flare = aShape.z;
  colorPos = aShape.w;
  soft = 0.0;
  return true;
}
`;
