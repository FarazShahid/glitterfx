/** Mirror of `emberStorm.sample` in @glitterfx/effects. */
export const EMBER_STORM_GLSL = /* glsl */ `
bool sampleParticle(out vec2 pos, out float radius, out float alpha, out float colorPos, out float flare, out float soft) {
  float depth = position.z;
  float life = aTime.w;
  float age = loopAge(uTime, 1.0, aTime.x, life);
  float x = age / life;
  float par = 0.6 + 0.6 * depth;
  float rise = forcedDisplacement(aV.x, aV.y, age) * uResolution.y * par;
  vec2 turb = turbulence(vec2(position.x * 4.0 + aTime.x * 7.0, age * 0.35), uTime * 0.5);
  pos.x = position.x * uResolution.x + aV.z * age * uResolution.x * par + turb.x * uResolution.y * 0.04 * (0.3 + age * 0.3);
  pos.y = uResolution.y * (1.0 + position.y) - rise + turb.y * uResolution.y * 0.012;
  radius = aShape.x;
  alpha = aShape.y * lifeFade(x, 0.06, 0.5) * (0.55 + 0.45 * depth) * twinkle(aV.w * 6.283, aTime.y, aTime.z, uTime);
  colorPos = min(uPaletteSize - 1.0, aShape.w + x * (uPaletteSize - 2.0));
  flare = 0.0;
  soft = smoothstep(0.78, 1.0, depth);
  return true;
}
`;
