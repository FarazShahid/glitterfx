import { GLITTER, WRAP_MARGIN } from '@glitterfx/effects';
import { f } from '../glsl/common.js';

/** Mirror of `glitterShimmer.sample` in @glitterfx/effects. */
export const GLITTER_SHIMMER_GLSL = /* glsl */ `
bool sampleParticle(out vec2 pos, out float radius, out float alpha, out float colorPos, out float flare, out float soft) {
  float m = ${f(WRAP_MARGIN)};
  vec2 ext = uResolution + 2.0 * m;
  float d = position.z;
  float par = 0.4 + 0.6 * d;
  float sway = aV.x;
  float h = uResolution.y;
  float x = position.x * ext.x + ${f(GLITTER.sway)} * h * par * sin(0.23 * uTime + sway);
  float y = position.y * ext.y - ${f(GLITTER.drift)} * h * par * uTime + ${f(GLITTER.sway)} * h * par * sin(0.17 * uTime + sway * 1.7);
  pos = mod(vec2(x, y), ext) - m;

  vec2 pulse = glintPulse(aTime.x, aTime.y, uTime, aTime.w);
  float w = aV.y;
  float band = w > 0.0 ? pow(max(0.0, sin((pos.x / uResolution.x + 0.6 * (pos.y / h)) * 4.2 - uTime * 1.1)), 6.0) : 0.0;
  float glint = min(1.0, pulse.y + (aV.w > 0.65 ? w * band * 0.5 : 0.0));
  float amount = aTime.z;
  alpha = aShape.y * (0.3 + 0.7 * d) * (1.0 - amount + amount * pulse.x) * (1.0 + w * band) + glint * aV.z;
  radius = aShape.x * (0.5 + 0.6 * d) * (1.0 + 0.8 * glint);
  flare = glint > ${f(GLITTER.flareThreshold)} && d <= 1.0 ? 1.0 : 0.0;
  colorPos = aShape.w;
  soft = d > 1.0 ? 1.0 : max(0.0, 0.55 - d) * 1.2;
  return true;
}
`;
