/**
 * Galaxy: a tilted two-arm spiral built from layered stellar populations, the way real galaxy
 * images get their detail:
 *   bulge  - many dim warm stars that sum into a smooth core glow
 *   disk   - faint old stars carrying light out to the rim
 *   arms   - young blue stars on the outer side of each log-spiral arm; the sharp inner edge
 *            reads as a dust lane
 *   knots  - pink star-forming clusters strung along the arms
 *   glow   - large, out-of-focus particles that give the arms soft nebular light
 * Brightness is balanced per population so dense regions keep detail instead of clipping.
 * Rigid pattern rotation keeps the arms intact. GLSL mirror: backend-webgl/src/effects/galaxy.ts.
 */
import type { ParticleEffect } from './engine/effect.js';
import { TAU, twinkle } from './engine/behaviors.js';

export const GALAXY = {
  /** Radius where the arms start (bulge edge). */
  armStart: 0.12,
  /** Pattern angular velocity (rad/s). */
  omega: 0.045,
  /** Disk inclination (rad) and on-screen rotation (rad). */
  tilt: 1.05,
  roll: -0.38,
  /** Galaxy radius as a fraction of the smaller viewport side. */
  extent: 0.7,
  /** Number of star-forming knots along the arms. */
  knots: 26,
} as const;

/** Population codes stored in v.x. */
export const BULGE = 0;
export const DISK = 1;
export const ARM = 2;
export const KNOT = 3;
export const GLOW = 4;

/** Cumulative population shares. */
const SHARES: readonly [number, number][] = [
  [0.16, BULGE],
  [0.36, DISK],
  [0.82, ARM],
  [0.9, KNOT],
  [1, GLOW],
];

/** Log spiral: arms evenly spaced, `twist` = angle gained per e-fold of radius. */
const armAngle = (r: number, arm: number, arms: number, twist: number): number =>
  (arm * TAU) / arms + Math.log(r / GALAXY.armStart) * twist;

/** Box-Muller: two independent standard normals from two uniforms. */
function gauss(r1: number, r2: number): [number, number] {
  const m = Math.sqrt(-2 * Math.log(Math.max(1e-6, r1)));
  return [m * Math.cos(TAU * r2), m * Math.sin(TAU * r2)];
}

const frac = (x: number): number => x - Math.floor(x);

interface GalaxyFrame {
  cx: number;
  cy: number;
  scale: number;
  cosTilt: number;
  sinTilt: number;
  cosRoll: number;
  sinRoll: number;
  time: number;
  /** Dims the extra WebGL particles in small views, where the same count packs into less area. */
  exposure: number;
}

/** Galaxy size (smaller view side, CSS px) at which extra particles reach full brightness. */
export const GALAXY_FULL_EXPOSURE = 700;

export const galaxy: ParticleEffect<GalaxyFrame> = {
  id: 'galaxy',
  defaultPalette: 'galaxy',
  budget: {
    canvas: { eco: 1000, balanced: 2000, high: 3200 },
    webgl: { eco: 12000, balanced: 36000, high: 70000 },
  },
  draws: 10,
  params: {
    arms: { min: 1, max: 8, default: 2, step: 1, label: 'Arms' },
    twist: { min: 0.8, max: 4, default: 2.3, label: 'Arm winding' },
  },

  generate(s, i, r, dust, params) {
    const arms = params['arms']!;
    const twist = params['twist']!;
    // More arms share the disk: keep them narrower so they stay distinct.
    const armWidth = Math.min(1, Math.sqrt(2 / arms));
    // Fewer arms concentrate the same stars: dim them so a single arm does not clip.
    const armLight = Math.min(1, (arms / 2) ** 0.7);
    const [rt, rr, rs1, rs2, rz, rsz, rc, rp, rrate, rf] = r as unknown as number[];
    const picked = SHARES.find(([share]) => rt! < share)![1];
    // Extra WebGL particles never join knots: hundreds per knot would clip them to white.
    const pop = dust && picked === KNOT ? ARM : picked;
    const [g1, g2] = gauss(rs2!, rz!);
    let radius: number;
    let angle: number;
    let z: number;
    let size: number;
    let intensity: number;
    let color: number;
    let twinkleAmp = 0.12 + 0.25 * rrate!;

    switch (pop) {
      case BULGE:
        // Concentrated, slightly flattened ellipsoid.
        radius = Math.min(0.42, (0.45 * -Math.log(1 - 0.97 * rr!)) / 3.5);
        angle = TAU * rs1!;
        z = g1 * radius * 0.55;
        size = 0.35 + 0.8 * rsz! ** 3;
        intensity = 0.5;
        color = rc! < 0.6 ? 0 : 1;
        break;
      case DISK:
        radius = Math.min(1.05, 0.1 - Math.log(1 - 0.96 * rr!) / 3.2);
        angle = TAU * rs1!;
        z = g1 * 0.015;
        size = 0.3 + 0.9 * rsz! ** 4;
        intensity = 0.4 + 0.35 * (1 - radius);
        color = rc! < 0.15 ? 1 : rc! < 0.55 ? 0 : 2;
        break;
      case ARM: {
        // Exponential falloff along the arm.
        radius = Math.min(1, GALAXY.armStart - Math.log(1 - 0.95 * rr!) / 2.8);
        const arm = Math.min(arms - 1, Math.floor(rs1! * arms));
        // One-sided spread: stars lie outside the arm's inner edge, which reads as a dust lane.
        // Two components, with physical (not angular) width so arms stay even from root to rim:
        // a tight bright ridge and a broad feathered envelope.
        const width = (rrate! < 0.55 ? 0.03 + 0.04 * radius : 0.07 + 0.08 * radius) * armWidth;
        angle = armAngle(radius, arm, arms, twist) + (Math.abs(g1) * width) / radius - 0.02;
        z = g2 * 0.012;
        size = 0.35 + 1.3 * rsz! ** 4;
        // Dimmer near the crowded arm roots so they keep detail.
        // Arms emerge gradually from the bulge instead of starting as bright hooks.
        intensity = 0.42 * armLight * Math.min(1, Math.max(0, (radius - 0.1) / 0.25));
        color = rc! < 0.5 ? 3 : rc! < 0.72 ? 4 : 2;
        break;
      }
      case KNOT: {
        // Deterministic knot centers along the arms, just outside the lane.
        // Skewed pick: a few large star-forming regions and many small ones.
        const k = Math.floor(rs1! ** 1.35 * GALAXY.knots);
        const spread = 0.006 + 0.014 * frac(k * 0.7548777);
        const kr = 0.2 + 0.75 * frac(k * 0.618034 + 0.13);
        const ka = armAngle(kr, k % arms, arms, twist) + (0.06 + 0.1 * frac(k * 0.414214)) * armWidth;
        radius = kr + g1 * spread;
        angle = ka + (g2 * spread) / kr;
        z = 0;
        size = 0.4 + 1.2 * rsz! ** 2;
        intensity = 0.7;
        color = rc! < 0.7 ? 5 : 3;
        twinkleAmp = 0.08;
        break;
      }
      default: {
        // Soft nebular arm light: large, faint, out of focus, steady.
        radius = GALAXY.armStart + 0.85 * rr!;
        const arm = Math.min(arms - 1, Math.floor(rs1! * arms));
        angle = armAngle(radius, arm, arms, twist) + (Math.abs(g1) * (0.06 + 0.08 * radius) * armWidth) / radius;
        z = 0;
        size = 1.4 + 1.6 * rsz!;
        intensity = 0.1 * armLight * Math.min(1, Math.max(0, (radius - 0.1) / 0.2));
        color = radius < 0.3 ? 1 : 3;
        twinkleAmp = 0;
      }
    }

    const flare = !dust && pop === ARM && rf! < 0.004;
    if (flare) {
      size = 1.6 + rsz!;
      intensity = 1;
    }
    s.p.set([radius, angle, z], i * 3);
    s.v.set([pop, dust ? 1 : 0, 0], i * 4);
    // Extra WebGL particles (~17x the Canvas count) add fine structure, not brightness.
    // Glow keeps more of its light: it is what the extra particles are for.
    const dustScale = pop === GLOW ? 0.3 : pop === BULGE ? 0.3 : 0.16;
    s.shape.set([dust ? size * 0.65 : size, dust ? intensity * dustScale : intensity, flare ? 1 : 0, Math.min(s.palette.colors.length - 1, color)], i * 4);
    s.time.set([rp! * TAU, 0.4 + 1.6 * rrate!, twinkleAmp, 0], i * 4);
  },

  prepare(view, time) {
    return {
      cx: view.width / 2,
      cy: view.height / 2,
      scale: Math.min(view.width, view.height) * GALAXY.extent,
      cosTilt: Math.cos(GALAXY.tilt),
      sinTilt: Math.sin(GALAXY.tilt),
      cosRoll: Math.cos(GALAXY.roll),
      sinRoll: Math.sin(GALAXY.roll),
      time,
      exposure: Math.min(1, Math.max(0.35, (Math.min(view.width, view.height) / GALAXY_FULL_EXPOSURE) ** 1.2)),
    };
  },

  sample(s, i, f, out) {
    const o = i * 4;
    const phase = s.time[o]!;
    const radius = s.p[i * 3]! * (1 + 0.02 * Math.sin(phase + 0.3 * f.time));
    const angle = s.p[i * 3 + 1]! + GALAXY.omega * f.time;
    const gx = Math.cos(angle) * radius;
    const gy = Math.sin(angle) * radius;
    const gz = s.p[i * 3 + 2]!;
    // Tilt around x, then roll on screen.
    const ty = gy * f.cosTilt - gz * f.sinTilt;
    const depth = gy * f.sinTilt + gz * f.cosTilt; // +: nearer to the viewer
    const sx = gx * f.cosRoll - ty * f.sinRoll;
    const sy = gx * f.sinRoll + ty * f.cosRoll;
    const persp = 1 + 0.15 * depth;
    out.x = f.cx + sx * f.scale * persp;
    out.y = f.cy + sy * f.scale * persp;
    out.radius = s.shape[o]! * persp;
    out.alpha = s.shape[o + 1]! * twinkle(phase, s.time[o + 1]!, s.time[o + 2]!, f.time) * (s.v[o + 1] ? f.exposure : 1);
    out.flare = s.shape[o + 2]!;
    out.color = s.shape[o + 3]!;
    // Glow is always out of focus, the bulge partly (smooth core light), the far disk side slightly.
    const pop = s.v[o];
    out.soft = pop === GLOW ? 1 : pop === BULGE ? 0.5 : Math.max(0, -depth) * 0.6;
    return true;
  },

  haze(view) {
    const scale = Math.min(view.width, view.height) * GALAXY.extent;
    const flat = Math.cos(GALAXY.tilt);
    return [
      // Compact warm nucleus plus a wider bulge halo.
      { x: view.width / 2, y: view.height / 2, rx: scale * 0.13, ry: scale * 0.13 * (0.6 + 0.4 * flat), angle: GALAXY.roll, color: 0, intensity: 1 },
      { x: view.width / 2, y: view.height / 2, rx: scale * 0.35, ry: scale * 0.35 * (0.55 + 0.45 * flat), angle: GALAXY.roll, color: 1, intensity: 0.35 },
      // Faint disk light along the tilted plane.
      { x: view.width / 2, y: view.height / 2, rx: scale * 1.05, ry: scale * 1.05 * flat, angle: GALAXY.roll, color: 3, intensity: 0.18 },
    ];
  },
};
