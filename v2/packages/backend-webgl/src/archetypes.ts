/**
 * GLSL for archetype effects: one generator per archetype, mirroring
 * @glitterfx/effects/src/archetypes/*.ts with the effect's parameters inlined as constants.
 */
import {
  WRAP_MARGIN,
  type CurlParams,
  type DriftParams,
  type FountainParams,
  type ParticleEffect,
  type QuantumParams,
  type RadialParams,
  type WaveParams,
} from '@glitterfx/effects';
import { f } from './glsl/common.js';

const SIGNATURE = 'bool sampleParticle(out vec2 pos, out float radius, out float alpha, out float colorPos, out float flare, out float soft)';

function drift(p: DriftParams): string {
  const [vx, vy] = p.velocity;
  const len = Math.hypot(vx, vy);
  const nx = len > 0 ? -vy / len : 1;
  const ny = len > 0 ? vx / len : 0;
  const [swayAmp, swayFreq] = p.sway ?? [0, 0];
  return /* glsl */ `
${SIGNATURE} {
  float m = ${f(WRAP_MARGIN)};
  vec2 ext = uResolution + 2.0 * m;
  float h = uResolution.y;
  float d = position.z;
  float par = 0.35 + 0.65 * d;
  float phase = aTime.x;
  float move = par * aV.x * uTime * h;
  float sw = ${f(swayAmp)} * h * par * sin(${f(swayFreq)} * aV.y * uTime + phase);
  float gust = sin(0.23 * uTime) + 0.5 * sin(0.61 * uTime + 1.3);
  vec2 q = position.xy * ext + vec2(${f(vx)}, ${f(vy)}) * move + vec2(${f(nx)}, ${f(ny)}) * sw + vec2(${f(p.gust ?? 0)} * h * par * gust, 0.0);
  ${p.wander ? `q += turbulence(vec2(position.x * 5.0 + phase, position.y * 5.0), uTime * 0.25) * ${f(p.wander)} * h;` : ''}
  pos = mod(q, ext) - m;
  alpha = ${f(p.alpha ?? 1)} * aShape.y * (0.35 + 0.65 * d) * twinkle(phase, aTime.y, aTime.z, uTime);
  radius = aShape.x * (0.45 + 0.75 * d);
  ${
    p.flutter
      ? `float tumble = 0.5 + 0.5 * sin(uTime * aTime.w + phase * 3.0);
  radius *= 1.0 - 0.5 * ${f(p.flutter)} * tumble;
  alpha *= 1.0 - 0.35 * ${f(p.flutter)} * tumble;`
      : ''
  }
  ${
    p.blink
      ? `float u = fract(uTime * aV.z + phase / TAU);
  alpha *= 0.04 + 0.96 * lifeFade(u / ${f(p.blink[1])}, 0.25, 0.4) * (u < ${f(p.blink[1])} ? 1.0 : 0.0);`
      : ''
  }
  colorPos = aShape.w;
  flare = aShape.z;
  soft = ${f(p.softNear ?? 0)} * smoothstep(0.8, 1.0, d);
  return true;
}
`;
}

function radial(p: RadialParams): string {
  const curve = { linear: 'x', sqrt: 'sqrt(x)', ease: '1.0 - (1.0 - x) * (1.0 - x)', accel: 'x * x' }[p.curve];
  const [fadeIn, fadeOut] = p.fade ?? [0.05, 0.4];
  const spin = f(p.spin ?? 0);
  const motion =
    p.emission === 'orbit'
      ? `rr = reach * ${f(p.reach)} * (1.0 + 0.04 * sin(phase * TAU + 0.35 * uTime));
  ang = a0 + dir * ${spin} * uTime * 0.7 / (0.3 + reach);`
      : `${
          p.emission === 'stream'
            ? 'float age = loopAge(uTime, 1.0, phase, life);'
            : `float age = mod(uTime - aV.y - aV.z, ${f(p.period ?? 4)});
  if (age > life) return false;
  alpha *= 1.0 + ${f(p.flash ?? 0)} * exp(-age * 6.0);`
        }
  x = age / life;
  float c = ${curve};
  rr = reach * ${f(p.reach)} * c;
  ang = a0 + dir * ${spin} * age + ${f(p.twist ?? 0)} * reach * c;
  alpha *= lifeFade(x, ${f(fadeIn)}, ${f(fadeOut)});`;
  return /* glsl */ `
${SIGNATURE} {
  float a0 = position.x;
  float reach = position.y;
  float dir = position.z;
  float phase = aTime.x;
  float life = aV.x;
  float scale = min(uResolution.x, uResolution.y) * 0.5;
  alpha = ${f(p.alpha ?? 1)} * aShape.y * twinkle(phase * TAU, aTime.y, aTime.z, uTime);
  float x = 0.0;
  float rr, ang;
  ${motion}
  pos = uResolution * 0.5 + vec2(cos(ang) * rr * scale, sin(ang) * rr * scale * ${f(p.squash ?? 1)});
  radius = aShape.x * (1.0 + ${f(p.grow ?? 0)} * x);
  colorPos = min(uPaletteSize - 1.0, aShape.w + ${f(p.cool ?? 0)} * x);
  flare = aShape.z;
  soft = 0.0;
  return true;
}
`;
}

function wave(p: WaveParams): string {
  const ampSum = p.waves.reduce((a, w) => a + w[0], 0) || 1;
  const [b0, b1] = p.band;
  const waves = p.waves.map(([a, k, w, ph]) => `h += ${f(a)} * sin(TAU * ${f(k)} * u + ${f(w)} * uTime + ${f(ph)} + d * 0.6);`).join('\n  ');
  const crest = f(p.crest ?? 0);
  const color =
    p.colorBy === 'height' ? 'clamp(hn, 0.0, 1.0) * (uPaletteSize - 1.0)' : p.colorBy === 'band' ? '(1.0 - by) * (uPaletteSize - 1.0)' : 'aShape.w';
  return /* glsl */ `
${SIGNATURE} {
  float m = ${f(WRAP_MARGIN)};
  float d = position.z;
  float by = position.y;
  float ew = uResolution.x + 2.0 * m;
  float px = mod(position.x * ew + ${f(p.flow ?? 0)} * uResolution.x * uTime * (0.6 + 0.4 * d), ew) - m;
  float u = px / uResolution.x;
  float h = 0.0;
  ${waves}
  float hn = 0.5 + 0.5 * h / ${f(ampSum)};
  float x = px;
  ${p.fold ? `x += ${f(p.fold[0])} * uResolution.y * sin(TAU * ${f(p.fold[1])} * by + ${f(p.fold[2])} * uTime + u * 3.0);` : ''}
  pos = vec2(x, (${f(b0)} + ${f(b1 - b0)} * by) * uResolution.y + h * uResolution.y * (0.6 + 0.4 * d));
  alpha = ${f(p.alpha ?? 1)} * aShape.y * (0.4 + 0.6 * d) * (1.0 - ${crest} + ${crest} * hn) * (1.0 - ${f(p.taper ?? 0)} * (1.0 - by)) *
    twinkle(aTime.x, aTime.y, aTime.z, uTime);
  radius = aShape.x * (0.5 + 0.7 * d);
  colorPos = ${color};
  flare = 0.0;
  soft = 0.0;
  return true;
}
`;
}

function fountain(p: FountainParams): string {
  const [fadeIn, fadeOut] = p.fade ?? [0.03, 0.45];
  const drag = f(Math.max(0.05, p.drag));
  return /* glsl */ `
${SIGNATURE} {
  float life = aV.x;
  float age = loopAge(uTime, 1.0, aTime.x, life);
  float x = age / life;
  float spawn = uTime - age;
  float strength = 1.0 - ${f(p.pulse ?? 0)} * (0.5 + 0.5 * sin(spawn * 0.9 + aV.y * 2.1));
  float v0 = position.y * strength * uResolution.y;
  float ang = position.z;
  pos.x = position.x * uResolution.x + dragDisplacement(sin(ang) * v0, ${drag}, age);
  pos.y = uResolution.y + 6.0 - dragDisplacement(cos(ang) * v0, ${drag}, age) + forcedDisplacement(${f(p.gravity)} * uResolution.y, ${drag}, age);
  if (pos.y > uResolution.y + 30.0 && age > 0.2) return false;
  alpha = ${f(p.alpha ?? 1)} * aShape.y * lifeFade(x, ${f(fadeIn)}, ${f(fadeOut)}) * twinkle(aV.w * TAU, aTime.y, aTime.z, uTime);
  radius = aShape.x * (1.0 + ${f(p.grow ?? 0)} * x);
  colorPos = min(uPaletteSize - 1.0, aShape.w + ${f(p.cool ?? 0)} * x);
  flare = aShape.z;
  soft = 0.0;
  return true;
}
`;
}

function quantum(p: QuantumParams): string {
  return /* glsl */ `
${SIGNATURE} {
  float m = ${f(WRAP_MARGIN)};
  vec2 ext = uResolution + 2.0 * m;
  float scale = min(uResolution.x, uResolution.y);
  float phase = aTime.x;
  float u = uTime * aV.z + phase;
  float n = floor(u);
  float jump = smoothstep(${f(p.dwell)}, 1.0, u - n);
  float w = mod(n, 2.0) > 0.5 ? 1.0 - jump : jump;
  float drift = 0.03 * sin(0.07 * uTime + phase * TAU);
  pos = mod(position.xy * ext + vec2(aV.x * w + drift, aV.y * w) * scale, ext) - m;
  float d = position.z;
  alpha = ${f(p.alpha ?? 1)} * aShape.y * d * (1.0 - 0.85 * sin(3.141592653589793 * jump)) * twinkle(phase * TAU, aTime.y, aTime.z, uTime);
  radius = aShape.x * (0.5 + 0.6 * d);
  colorPos = aShape.w;
  flare = aShape.z;
  soft = 0.0;
  return true;
}
`;
}

function curl(p: CurlParams): string {
  return /* glsl */ `
${SIGNATURE} {
  float life = aTime.w;
  float age = loopAge(uTime, 1.0, aTime.x, life);
  float spawn = uTime - age;
  float ref = max(uResolution.x, uResolution.y) * ${f(p.unit)};
  vec2 p0 = position.xy * uResolution / ref;
  float m = ${f(p.margin)};
  pos = mod(curlAdvect(p0, spawn * ${f(p.evolve)}, age, ${f(p.speed)}) * ref + m, uResolution + 2.0 * m) - m;
  radius = aShape.x;
  alpha = ${f(p.alpha ?? 1)} * aShape.y * lifeFade(age / life, 0.15, 0.35) * (0.45 + 0.55 * position.z) *
    twinkle(aV.w * TAU, aTime.y, aTime.z, uTime);
  colorPos = aShape.w;
  flare = aShape.z;
  soft = 0.0;
  return true;
}
`;
}

/** GLSL `sampleParticle` and preprocessor defines for an archetype effect, or null. */
export function archetypeGlsl(effect: ParticleEffect): { glsl: string; defines: string } | null {
  const a = effect.archetype;
  if (!a) return null;
  switch (a.kind) {
    case 'drift':
      return { glsl: drift(a.params as DriftParams), defines: '' };
    case 'radial':
      return { glsl: radial(a.params as RadialParams), defines: '' };
    case 'wave':
      return { glsl: wave(a.params as WaveParams), defines: '' };
    case 'fountain':
      return { glsl: fountain(a.params as FountainParams), defines: '' };
    case 'quantum':
      return { glsl: quantum(a.params as QuantumParams), defines: '' };
    case 'curl':
      return { glsl: curl(a.params as CurlParams), defines: `#define CURL_STEPS ${(a.params as CurlParams).steps}\n` };
    default:
      return null;
  }
}
