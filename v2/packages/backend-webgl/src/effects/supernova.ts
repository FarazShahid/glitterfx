import { SUPERNOVA } from '@glitterfx/effects';
import { f } from '../glsl/common.js';

/** Mirror of `supernova.sample` in @glitterfx/effects. */
export const SUPERNOVA_GLSL = /* glsl */ `
bool sampleParticle(out vec2 pos, out float radius, out float alpha, out float colorPos, out float flare, out float soft) {
  float kind = aTime.x;
  float life = aTime.w;
  float age = mod(uTime - aV.z, ${f(SUPERNOVA.period)});
  if (age > life) return false;
  float x = age / life;
  float dist = dragDisplacement(aV.x, aV.y, age);
  float scale = min(uResolution.x, uResolution.y) * ${f(SUPERNOVA.extent)};
  float persp = 1.0 + 0.3 * position.z * dist;
  pos = uResolution * 0.5 + position.xy * dist * scale * persp;
  float flash = kind == 1.0 ? 1.0 : 1.0 + 2.5 * exp(-age * 5.0);
  float pulse = kind == 2.0 ? 0.75 + 0.25 * sin(uTime * 2.2 + aV.w * 6.283) : 1.0;
  alpha = aShape.y * lifeFade(x, 0.015, kind == 2.0 ? 0.2 : 0.65) * flash * pulse * twinkle(aV.w * 6.283, aTime.y, aTime.z, uTime);
  radius = aShape.x * persp * (kind == 0.0 ? 1.1 - 0.4 * x : 1.0);
  colorPos = min(uPaletteSize - 1.0, aShape.w + x * (kind == 2.0 ? 0.5 : 2.4));
  flare = aShape.z;
  soft = smoothstep(0.35, 0.9, position.z) * min(1.0, dist * 2.5);
  return true;
}
`;
