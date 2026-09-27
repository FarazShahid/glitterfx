/**
 * Pointer interaction applied to any sampled particle, after the effect computed it. Stateless: a
 * displacement as a function of distance to the pointer, so every effect and both renderers get it
 * without per-effect code. Mirrored in the shared WebGL point path (backend-webgl/src/particles.ts).
 */
import type { MotionFrame, PointerFrame } from '@glitterfx/core';
import type { ParticleSample } from './effect.js';

/** Influence reaches out to 3 radii with a Gaussian falloff (1 at the pointer). */
export const POINTER_REACH = 3;

export function applyPointer(out: ParticleSample, p: PointerFrame): void {
  const dx = out.x - p.x;
  const dy = out.y - p.y;
  const u2 = (dx * dx + dy * dy) / (p.radius * p.radius);
  if (u2 > POINTER_REACH * POINTER_REACH) return;
  const k = p.strength * Math.exp(-u2 * 1.2);
  if (p.mode === 1) {
    // Repel: push outward, up to ~0.6 radius at full strength.
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1e-3) {
      const push = (p.radius * 0.6 * k) / dist;
      out.x += dx * push;
      out.y += dy * push;
    }
  } else if (p.mode === 2) {
    // Attract: pull towards the pointer, never past it.
    const pull = Math.min(0.85, 0.6 * k);
    out.x -= dx * pull;
    out.y -= dy * pull;
  } else {
    // Vortex: swirl around the pointer, distance preserved.
    const a = 1.6 * k;
    const c = Math.cos(a);
    const s = Math.sin(a);
    out.x = p.x + dx * c - dy * s;
    out.y = p.y + dx * s + dy * c;
  }
  // Particles near the pointer catch a little more light.
  out.alpha *= 1 + 0.35 * k;
}

/** Margin (CSS px) of the wrap rectangle used by x/y flow. */
export const MOTION_MARGIN = 40;
/** z flow: nearest depth a particle reaches (screen offset scales up to 1 / Z_NEAR). */
export const Z_NEAR = 0.15;

/**
 * Global flow applied to any sampled particle, before pointer interaction. Offsets come integrated from
 * core (MotionFrame). x/y shift and wrap particles that are on (or near) the view; particles an effect
 * places far outside stay unwrapped. z is a perspective fly-through: each particle cycles through its own
 * depth (phase from its hash), its offset from the view center scaling by 1 / depth, so screen density
 * stays uniform with no clumping. Mirrored in GLSL (backend-webgl/src/particles.ts).
 */
export function applyMotion(out: ParticleSample, m: MotionFrame, width: number, height: number, hash: number): void {
  if (m.x || m.y) {
    const ew = width + 2 * MOTION_MARGIN;
    const eh = height + 2 * MOTION_MARGIN;
    const on = out.x >= -MOTION_MARGIN && out.x <= width + MOTION_MARGIN && out.y >= -MOTION_MARGIN && out.y <= height + MOTION_MARGIN;
    const x = out.x + m.x * height;
    const y = out.y + m.y * height;
    out.x = on ? ((((x + MOTION_MARGIN) % ew) + ew) % ew) - MOTION_MARGIN : x;
    out.y = on ? ((((y + MOTION_MARGIN) % eh) + eh) % eh) - MOTION_MARGIN : y;
  }
  if (m.z) {
    // phase 0: at the effect's own position (depth 1); phase -> 1: approaching the viewer.
    const phase = (((hash + m.z) % 1) + 1) % 1;
    const scale = 1 / (1 - (1 - Z_NEAR) * phase);
    out.x = width / 2 + (out.x - width / 2) * scale;
    out.y = height / 2 + (out.y - height / 2) * scale;
    out.radius *= Math.sqrt(scale);
    const fadeIn = Math.min(1, phase / 0.15);
    const fadeOut = Math.min(1, (1 - phase) / 0.1);
    out.alpha *= fadeIn * fadeIn * (3 - 2 * fadeIn) * fadeOut * fadeOut * (3 - 2 * fadeOut);
  }
}
