/**
 * Closed-form motion primitives. Particle state is a pure function of (generated data, time),
 * which keeps WebGL motion in shaders, makes fixed seeds reproducible and lets transitions
 * sample any effect at any time. Each function is mirrored in backend-webgl/src/glsl/common.ts.
 */

export const TAU = Math.PI * 2;

/** Euclidean modulo, always in [0, m). */
export const wrap = (value: number, m: number): number => ((value % m) + m) % m;

export const fract = (value: number): number => value - Math.floor(value);

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** 1 - amp * (0.5 + 0.5 sin(phase + rate t)). */
export const twinkle = (phase: number, rate: number, amp: number, t: number): number =>
  1 - amp * (0.5 + 0.5 * Math.sin(phase + rate * t));

/** Displacement after `age` s from initial speed `v0` with linear drag `k` (1/s). */
export const dragDisplacement = (v0: number, k: number, age: number): number =>
  (v0 * (1 - Math.exp(-k * age))) / k;

/** Displacement after `age` s under constant acceleration `g` with linear drag `k` (starting at rest). */
export const forcedDisplacement = (g: number, k: number, age: number): number =>
  (g / k) * (age - (1 - Math.exp(-k * age)) / k);

/** Smooth fade in/out over a normalized lifetime `x` in [0, 1]. */
export const lifeFade = (x: number, fadeIn: number, fadeOut: number): number =>
  smoothstep(0, fadeIn, x) * (1 - smoothstep(1 - fadeOut, 1, x));

/** Looping age for particle-lifetime effects: [0, life). */
export const loopAge = (t: number, rate: number, phase: number, life: number): number => wrap(t * rate + phase * life, life);

/**
 * Glitter response for one particle at time `t`. Writes into `out` (no allocation):
 *   out[0] shimmer in [0, 1]: irregular flicker from two incommensurate sines, never visibly periodic.
 *   out[1] glint in [0, 1]:   a sharp spike on the peaks of one wave, gated by a slower detuned wave so
 *                             glints skip cycles irregularly. `rate` sets how often (about every
 *                             16 / rate seconds), `sharpness` how short (higher = briefer, crisper).
 * Stateless and deterministic: a fixed (phase, rate, t) always gives the same pair.
 * Mirrored by `glintPulse` in backend-webgl/src/glsl/common.ts.
 */
export function glintPulse(phase: number, rate: number, t: number, sharpness: number, out: [number, number]): [number, number] {
  const u = rate * t + phase;
  out[0] = 0.5 + 0.3 * Math.sin(u) + 0.2 * Math.sin(u * 2.713 + phase * 3.1);
  const peak = Math.max(0, Math.sin(u * 1.13 + phase * 5.3));
  out[1] = peak ** sharpness * smoothstep(0.2, 0.8, Math.sin(u * 0.311 + phase * 2.9));
  return out;
}

/**
 * Cheap turbulence: displacement from three detuned sine waves. Deterministic and
 * identical on CPU and GPU. Returns into `out` to avoid allocation.
 */
export function turbulence(x: number, y: number, t: number, out: [number, number]): [number, number] {
  out[0] = Math.sin(y * 3.1 + t * 0.9) * 0.5 + Math.sin(y * 7.3 - t * 1.7 + 1.3) * 0.25 + Math.sin((x + y) * 11.0 + t * 2.3) * 0.125;
  out[1] = Math.sin(x * 2.7 - t * 0.8 + 2.1) * 0.5 + Math.sin(x * 6.1 + t * 1.3 + 0.4) * 0.25 + Math.sin((x - y) * 13.0 - t * 2.9) * 0.125;
  return out;
}

/**
 * Divergence-free velocity from the stream function
 * psi = sum_i a_i sin(kx_i x + ky_i y + w_i t + phi_i); v = (dpsi/dy, -dpsi/dx).
 */
const CURL_WAVES: readonly (readonly [number, number, number, number, number])[] = [
  // amplitude, kx, ky, omega, phase
  [1.0, 2.1, 1.3, 0.21, 0.0],
  [0.55, -1.7, 3.3, -0.33, 1.7],
  [0.3, 4.3, -2.9, 0.47, 4.1],
];

export function curlVelocity(x: number, y: number, t: number, out: [number, number]): [number, number] {
  let vx = 0;
  let vy = 0;
  for (const [a, kx, ky, w, phi] of CURL_WAVES) {
    const c = a * Math.cos(kx * x + ky * y + w * t + phi);
    vx += c * ky;
    vy -= c * kx;
  }
  out[0] = vx;
  out[1] = vy;
  return out;
}

export const CURL_WAVE_TABLE = CURL_WAVES;

/**
 * Stateless advection: re-integrate the path from spawn with a fixed number of midpoint
 * steps. The result is a smooth function of `age`, so every frame is consistent without storing state.
 */
export function curlAdvect(x: number, y: number, spawnTime: number, age: number, speed: number, steps: number, out: [number, number]): [number, number] {
  const h = age / steps;
  const k: [number, number] = [0, 0];
  let px = x;
  let py = y;
  for (let s = 0; s < steps; s++) {
    const t = spawnTime + s * h;
    curlVelocity(px, py, t, k);
    const mx = px + k[0] * speed * h * 0.5;
    const my = py + k[1] * speed * h * 0.5;
    curlVelocity(mx, my, t + h * 0.5, k);
    px += k[0] * speed * h;
    py += k[1] * speed * h;
  }
  out[0] = px;
  out[1] = py;
  return out;
}
