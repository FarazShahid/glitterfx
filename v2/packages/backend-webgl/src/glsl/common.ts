/**
 * GLSL mirrors of `@glitterfx/effects/src/engine/behaviors.ts` and `appearance.ts`.
 * Keep both in sync; the Canvas path evaluates the TypeScript versions.
 */
import { CURL_WAVE_TABLE } from '@glitterfx/effects';

/** Format a number as a GLSL float literal. */
export const f = (x: number): string => (Number.isInteger(x) ? `${x}.0` : String(x));

const curlTerms = CURL_WAVE_TABLE.map(
  ([a, kx, ky, w, phi]) => `  c = ${f(a)} * cos(${f(kx)} * p.x + ${f(ky)} * p.y + ${f(w)} * t + ${f(phi)}); v += vec2(c * ${f(ky)}, -c * ${f(kx)});`,
).join('\n');

export const COMMON_GLSL = /* glsl */ `
const float TAU = 6.283185307179586;

float wrapMod(float x, float m) { return mod(x, m); }
float twinkle(float phase, float rate, float amp, float t) { return 1.0 - amp * (0.5 + 0.5 * sin(phase + rate * t)); }
float dragDisplacement(float v0, float k, float age) { return v0 * (1.0 - exp(-k * age)) / k; }
float forcedDisplacement(float g, float k, float age) { return g / k * (age - (1.0 - exp(-k * age)) / k); }
float lifeFade(float x, float fadeIn, float fadeOut) { return smoothstep(0.0, fadeIn, x) * (1.0 - smoothstep(1.0 - fadeOut, 1.0, x)); }
float loopAge(float t, float rate, float phase, float life) { return mod(t * rate + phase * life, life); }

vec2 turbulence(vec2 p, float t) {
  return vec2(
    sin(p.y * 3.1 + t * 0.9) * 0.5 + sin(p.y * 7.3 - t * 1.7 + 1.3) * 0.25 + sin((p.x + p.y) * 11.0 + t * 2.3) * 0.125,
    sin(p.x * 2.7 - t * 0.8 + 2.1) * 0.5 + sin(p.x * 6.1 + t * 1.3 + 0.4) * 0.25 + sin((p.x - p.y) * 13.0 - t * 2.9) * 0.125
  );
}

vec2 curlVelocity(vec2 p, float t) {
  vec2 v = vec2(0.0);
  float c;
${curlTerms}
  return v;
}

// Midpoint re-integration from spawn; CURL_STEPS must match the TypeScript call site.
#ifndef CURL_STEPS
#define CURL_STEPS 10
#endif
vec2 curlAdvect(vec2 p, float spawnTime, float age, float speed) {
  float h = age / float(CURL_STEPS);
  for (int s = 0; s < CURL_STEPS; s++) {
    float t = spawnTime + float(s) * h;
    vec2 k1 = curlVelocity(p, t);
    vec2 m = p + k1 * speed * h * 0.5;
    p += curlVelocity(m, t + h * 0.5) * speed * h;
  }
  return p;
}
`;
