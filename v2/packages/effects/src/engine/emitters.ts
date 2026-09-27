/**
 * Emitters map uniform random draws to initial positions. They take draws instead of an RNG
 * so every particle consumes a fixed number of numbers (prefix-stable generation).
 */
import { TAU } from './behaviors.js';

export type Vec3 = [number, number, number];

/** Uniform point in an axis-aligned box. */
export const boxEmitter = (r1: number, r2: number, r3: number, min: Vec3, max: Vec3): Vec3 => [
  min[0] + (max[0] - min[0]) * r1,
  min[1] + (max[1] - min[1]) * r2,
  min[2] + (max[2] - min[2]) * r3,
];

/** Uniform direction on the unit sphere. */
export function sphereDirection(r1: number, r2: number): Vec3 {
  const z = 2 * r1 - 1;
  const s = Math.sqrt(Math.max(0, 1 - z * z));
  const phi = TAU * r2;
  return [s * Math.cos(phi), s * Math.sin(phi), z];
}

/** Uniform point in a ball of `radius` (shell = true: on its surface). */
export function sphereEmitter(r1: number, r2: number, r3: number, radius: number, shell = false): Vec3 {
  const [x, y, z] = sphereDirection(r1, r2);
  const r = shell ? radius : radius * Math.cbrt(r3);
  return [x * r, y * r, z * r];
}

/** Point on a ring of `radius` with radial `width`, in the xy plane. */
export function ringEmitter(r1: number, r2: number, radius: number, width: number): Vec3 {
  const a = TAU * r1;
  const r = radius + (r2 - 0.5) * width;
  return [Math.cos(a) * r, Math.sin(a) * r, 0];
}

/** Approximately normal value from two uniforms (triangular, mean 0, range [-1, 1]). */
export const triangular = (r1: number, r2: number): number => r1 + r2 - 1;
