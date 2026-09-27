import { BULGE, GALAXY, GALAXY_FULL_EXPOSURE, GLOW } from '@glitterfx/effects';
import { f } from '../glsl/common.js';

/** Mirror of `galaxy.sample` in @glitterfx/effects. */
export const GALAXY_GLSL = /* glsl */ `
bool sampleParticle(out vec2 pos, out float radius, out float alpha, out float colorPos, out float flare, out float soft) {
  float phase = aTime.x;
  float r = position.x * (1.0 + 0.02 * sin(phase + 0.3 * uTime));
  float a = position.y + ${f(GALAXY.omega)} * uTime;
  vec3 g = vec3(cos(a) * r, sin(a) * r, position.z);
  float ct = cos(${f(GALAXY.tilt)}), st = sin(${f(GALAXY.tilt)});
  float cr = cos(${f(GALAXY.roll)}), sr = sin(${f(GALAXY.roll)});
  float ty = g.y * ct - g.z * st;
  float depth = g.y * st + g.z * ct;
  vec2 s = vec2(g.x * cr - ty * sr, g.x * sr + ty * cr);
  float persp = 1.0 + 0.15 * depth;
  float scale = min(uResolution.x, uResolution.y) * ${f(GALAXY.extent)};
  pos = uResolution * 0.5 + s * scale * persp;
  radius = aShape.x * persp;
  float exposure = clamp(pow(min(uResolution.x, uResolution.y) / ${f(GALAXY_FULL_EXPOSURE)}, 1.2), 0.35, 1.0);
  alpha = aShape.y * twinkle(phase, aTime.y, aTime.z, uTime) * mix(1.0, exposure, aV.y);
  flare = aShape.z;
  colorPos = aShape.w;
  soft = aV.x == ${f(GLOW)} ? 1.0 : aV.x == ${f(BULGE)} ? 0.5 : max(0.0, -depth) * 0.6;
  return true;
}
`;
