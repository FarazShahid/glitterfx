/**
 * Generic WebGL renderer for any ParticleEffect: static attributes straight from the shared
 * ParticleStore, motion in the effect's GLSL `sampleParticle`, look from the shared profile.
 */
import type { GlitterFXConfig } from '@glitterfx/core';
import { generateParticles, needsRegenerate, type ParticleEffect, type ParticleStore } from '@glitterfx/effects';
import type { FrameTime, MotionFrame, PointerFrame } from '@glitterfx/core';
import { MOTION_MARGIN, Z_NEAR } from '@glitterfx/effects';
import { BufferAttribute, BufferGeometry, CustomBlending, Group, OneFactor, Points, ShaderMaterial, Vector2, Vector3, Vector4 } from 'three';
import { createHazeLayer } from './haze.js';
import type { WebGLEffect } from './effect.js';
import { COMMON_GLSL } from './glsl/common.js';

const MAX_PALETTE = 8;

/** Shared point emission: clip position, halo size, sub-pixel handling, varyings. */
const EMIT_GLSL = /* glsl */ `
// Mirror of applyPointer() in @glitterfx/effects: uPointer = (x, y, radius, strength), uPointerMode 0 off.
void applyPointer(inout vec2 pos, inout float alpha) {
  if (uPointerMode < 0.5 || uPointer.w <= 0.0) return;
  vec2 d = pos - uPointer.xy;
  float u2 = dot(d, d) / (uPointer.z * uPointer.z);
  if (u2 > 9.0) return;
  float k = uPointer.w * exp(-u2 * 1.2);
  if (uPointerMode < 1.5) {
    float dist = length(d);
    if (dist > 1e-3) pos += d * (uPointer.z * 0.6 * k / dist);
  } else if (uPointerMode < 2.5) {
    pos -= d * min(0.85, 0.6 * k);
  } else {
    float a = 1.6 * k;
    float c = cos(a), s = sin(a);
    pos = uPointer.xy + vec2(d.x * c - d.y * s, d.x * s + d.y * c);
  }
  alpha *= 1.0 + 0.35 * k;
}

// Mirror of applyMotion() in @glitterfx/effects: uMotion = integrated (x, y) in view heights, z in fly-through cycles.
void applyMotion(inout vec2 pos, inout float radius, inout float alpha, float hash) {
  if (uMotion.x != 0.0 || uMotion.y != 0.0) {
    float m = ${MOTION_MARGIN.toFixed(1)};
    vec2 ext = uResolution + 2.0 * m;
    bool on = pos.x >= -m && pos.x <= uResolution.x + m && pos.y >= -m && pos.y <= uResolution.y + m;
    pos += uMotion.xy * uResolution.y;
    if (on) pos = mod(pos + m, ext) - m;
  }
  if (uMotion.z != 0.0) {
    float phase = fract(hash + uMotion.z);
    float scale = 1.0 / (1.0 - ${(1 - Z_NEAR).toFixed(6)} * phase);
    vec2 c = uResolution * 0.5;
    pos = c + (pos - c) * scale;
    radius *= sqrt(scale);
    alpha *= smoothstep(0.0, 1.0, min(1.0, phase / 0.15)) * smoothstep(0.0, 1.0, min(1.0, (1.0 - phase) / 0.1));
  }
}

void emitPoint(bool visible, vec2 pos, float radius, float alpha, vec3 color, float flare, float soft, float hash) {
  if (visible) {
    applyMotion(pos, radius, alpha, hash);
    applyPointer(pos, alpha);
  }
  if (!visible || alpha < 0.004) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }
  gl_Position = vec4(pos.x / uResolution.x * 2.0 - 1.0, 1.0 - pos.y / uResolution.y * 2.0, 0.0, 1.0);
  radius *= uSize;
  float halo = (2.0 + 6.0 * uGlow) * mix(1.0, 2.5, flare);
  // Depth-of-field (mirror of softness()): wider core, same energy.
  float coreSize = 2.0 * radius * uPixelRatio * (1.0 + 2.5 * soft);
  alpha /= 1.0 + 1.6 * soft;
  float pointSize = 2.0 * radius * uPixelRatio * halo;
  // Sub-pixel particles: keep a 2px footprint and conserve energy instead of flickering.
  if (pointSize < 2.0) {
    alpha *= pointSize * pointSize * 0.25;
    coreSize *= 2.0 / pointSize;
    pointSize = 2.0;
  }
  // Hardware point-size ceiling: crop the halo, keep the core size.
  pointSize = min(pointSize, uMaxPointSize);
  gl_PointSize = pointSize;
  vCore = min(0.95, coreSize / pointSize);
  vFlare = flare;
  vColor = color;
  vAlpha = alpha;
}
`;

const vertexShader = (effectGlsl: string, defines: string) => /* glsl */ `
precision highp float;
${defines}

attribute vec4 aV;     // effect-defined; w = per-particle hash
attribute vec4 aShape; // size, intensity, flare, palette position
attribute vec4 aTime;  // phase, rate, amplitude, life
attribute float aTrail; // 0 = head, k = k-th trail sample

uniform float uTimeBase;
uniform float uTrailDt;
uniform float uTrailCount;
uniform vec2 uResolution;
uniform float uPixelRatio;
uniform float uMaxPointSize;
uniform float uSize;
uniform float uBrightness;
uniform float uGlow;
uniform float uReveal;
uniform vec4 uPointer;
uniform float uPointerMode;
uniform vec3 uMotion;
uniform vec3 uPalette[${MAX_PALETTE}];
uniform float uPaletteSize;

varying vec3 vColor;
varying float vAlpha;
varying float vCore;
varying float vFlare;

// Effects read uTime; trail samples see the same particle slightly in the past.
float uTime;

${COMMON_GLSL}
${effectGlsl}

vec3 paletteColor(float x) {
  float i = clamp(x, 0.0, uPaletteSize - 1.0);
  int a = int(floor(i));
  int b = min(a + 1, int(uPaletteSize) - 1);
  return mix(uPalette[a], uPalette[b], fract(i));
}

${EMIT_GLSL}

void main() {
  uTime = uTimeBase - aTrail * uTrailDt;
  vec2 pos;
  float radius, alpha, colorPos, flare, soft;
  bool visible = sampleParticle(pos, radius, alpha, colorPos, flare, soft);
  if (aTrail > 0.0) {
    float k = 1.0 - aTrail / uTrailCount;
    alpha *= k * k * 0.8;
    radius *= 0.55 + 0.45 * k;
  }
  alpha *= uBrightness;
  if (uReveal < 1.0) alpha *= clamp((uReveal - aV.w * 0.85) / 0.15, 0.0, 1.0);
  emitPoint(visible, pos, radius, alpha, paletteColor(colorPos), flare, soft, aV.w);
}
`;

/** Mirror of `particleProfile` in @glitterfx/effects. */
const fragmentShader = /* glsl */ `
precision highp float;

uniform float uGlow;

varying vec3 vColor;
varying float vAlpha;
varying float vCore;
varying float vFlare;

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(uv, uv);
  if (r2 >= 1.0) discard;

  float s = sqrt(r2) / vCore;
  float win = (1.0 - r2) * (1.0 - r2);
  float core = exp(-s * s * 1.8);
  float halo = exp(-s * 0.8) * (0.14 + 0.6 * uGlow) * win;
  float spikes = 0.0;
  if (vFlare > 0.5) {
    float w = vCore * 0.28;
    vec2 a = abs(uv);
    spikes = (exp(-a.y / w) * pow(1.0 - a.x, 4.0) + exp(-a.x / w) * pow(1.0 - a.y, 4.0)) * 0.9 * win;
  }

  float a = min(1.0, core + halo + spikes) * vAlpha;
  vec3 color = mix(vColor, vec3(1.0), min(1.0, core * 0.7));
  // Premultiplied output, blended additively.
  gl_FragColor = vec4(color * a, a);
}
`;

/** Pointer and motion uniforms: O(1) per frame. */
function setGlobals(u: Record<string, { value: unknown }>, p: PointerFrame | undefined, m: MotionFrame | undefined): void {
  u['uPointerMode']!.value = p ? p.mode : 0;
  if (p) (u['uPointer']!.value as Vector4).set(p.x, p.y, p.radius, p.strength);
  (u['uMotion']!.value as Vector3).set(m?.x ?? 0, m?.y ?? 0, m?.z ?? 0);
}

/** Static attributes straight from the shared store (no copies), uploaded once per field. */
export function buildGeometry(store: ParticleStore, trail = 1): BufferGeometry {
  const geometry = new BufferGeometry();
  const repeat = (a: Float32Array) => {
    if (trail <= 1) return a;
    const out = new Float32Array(a.length * trail);
    for (let k = 0; k < trail; k++) out.set(a, k * a.length);
    return out;
  };
  geometry.setAttribute('position', new BufferAttribute(repeat(store.p), 3));
  geometry.setAttribute('aV', new BufferAttribute(repeat(store.v), 4));
  geometry.setAttribute('aShape', new BufferAttribute(repeat(store.shape), 4));
  geometry.setAttribute('aTime', new BufferAttribute(repeat(store.time), 4));
  const index = new Float32Array(store.count * trail);
  for (let k = 1; k < trail; k++) index.fill(k, k * store.count, (k + 1) * store.count);
  geometry.setAttribute('aTrail', new BufferAttribute(index, 1));
  return geometry;
}

export function paletteUniform(store: { palette: ParticleStore['palette'] }): Vector3[] {
  return Array.from({ length: MAX_PALETTE }, (_, i) => {
    const c = store.palette.colors[Math.min(i, store.palette.colors.length - 1)]!;
    return new Vector3(c[0], c[1], c[2]);
  });
}

export interface WebGLParticles extends WebGLEffect {
  readonly points: Points;
  /** Haze visibility weight in [0, 1] (transitions). */
  setHazeWeight(value: number): void;
  /** Dissolve amount in [0, 1]; 1 = fully visible. */
  setReveal(value: number): void;
  /** Current data, for building a morph. */
  readonly store: ParticleStore;
  readonly config: GlitterFXConfig;
  readonly glsl: string;
  readonly defines: string;
}

export function createWebGLParticles(
  effect: ParticleEffect,
  effectGlsl: string,
  initial: GlitterFXConfig,
  maxPointSize: number,
  defines = '',
): WebGLParticles {
  let config = initial;
  let store = generateParticles(effect, 'webgl', config);
  const trail = effect.trail?.count ?? 1;
  const material = new ShaderMaterial({
    vertexShader: vertexShader(effectGlsl, defines),
    fragmentShader,
    uniforms: {
      uTimeBase: { value: 0 },
      uTrailDt: { value: effect.trail?.spacing ?? 0 },
      uTrailCount: { value: trail },
      uResolution: { value: new Vector2(1, 1) },
      uPixelRatio: { value: 1 },
      uMaxPointSize: { value: maxPointSize },
      uSize: { value: config.size },
      uBrightness: { value: config.brightness },
      uGlow: { value: config.glow },
      uReveal: { value: 1 },
      uPointer: { value: new Vector4() },
      uPointerMode: { value: 0 },
      uMotion: { value: new Vector3() },
      uPalette: { value: paletteUniform(store) },
      uPaletteSize: { value: store.palette.colors.length },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneFactor,
  });
  const u = material.uniforms as Record<string, { value: unknown }>;
  const points = new Points(buildGeometry(store, trail), material);
  points.frustumCulled = false;
  const haze = createHazeLayer(effect, store.palette);
  const group = new Group();
  group.add(haze.mesh, points);
  let view = { width: 1, height: 1 };

  return {
    object: group,
    points,

    resize(width, height, pixelRatio) {
      view = { width: Math.max(1, width), height: Math.max(1, height) };
      (u['uResolution']!.value as Vector2).set(view.width, view.height);
      u['uPixelRatio']!.value = pixelRatio;
      haze.resize(view.width, view.height, pixelRatio);
    },

    setHazeWeight(value) {
      haze.setWeight(value);
    },

    update(next) {
      if (needsRegenerate(config, next)) {
        store = generateParticles(effect, 'webgl', next);
        points.geometry.dispose();
        points.geometry = buildGeometry(store, trail);
        u['uPalette']!.value = paletteUniform(store);
        u['uPaletteSize']!.value = store.palette.colors.length;
        haze.setPalette(store.palette);
      }
      u['uSize']!.value = next.size;
      u['uBrightness']!.value = next.brightness;
      u['uGlow']!.value = next.glow;
      config = next;
    },

    frame({ time, pointer, motion, direction = 1 }) {
      u['uTimeBase']!.value = time;
      // Trails sample the real-time past: backwards in effect time normally, forwards in reverse.
      u['uTrailDt']!.value = (effect.trail?.spacing ?? 0) * direction;
      setGlobals(u, pointer, motion);
      haze.frame(view, time, config);
    },

    setReveal(value) {
      u['uReveal']!.value = value;
    },

    get store() {
      return store;
    },

    get config() {
      return config;
    },

    glsl: effectGlsl,
    defines,

    dispose() {
      points.geometry.dispose();
      material.dispose();
      haze.dispose();
    },
  };
}

// ---- Morph: one draw evaluating both effects per particle -----------------------------

/** Rename the standard inputs of an effect's GLSL so a second effect can live in the same shader. */
export function renameEffectGlsl(glsl: string, suffix: string): string {
  return glsl
    .replace(/\bsampleParticle\b/g, `sampleParticle${suffix}`)
    .replace(/\bposition\b/g, `position${suffix}`)
    .replace(/\baV\b/g, `aV${suffix}`)
    .replace(/\baShape\b/g, `aShape${suffix}`)
    .replace(/\baTime\b/g, `aTime${suffix}`)
    // Each side of a morph has its own palette.
    .replace(/\buPaletteSize\b/g, `uPaletteSize${suffix}`);
}

const morphVertexShader = (glslA: string, glslB: string, defines: string) => /* glsl */ `
precision highp float;
${defines}

attribute vec3 positionA; attribute vec4 aVA; attribute vec4 aShapeA; attribute vec4 aTimeA;
attribute vec3 positionB; attribute vec4 aVB; attribute vec4 aShapeB; attribute vec4 aTimeB;
attribute vec2 aPresent; // particle exists in A, in B

uniform float uTime;
uniform vec2 uResolution;
uniform float uPixelRatio;
uniform float uMaxPointSize;
uniform float uSize;
uniform float uBrightness;
uniform float uGlow;
uniform float uMorph;
uniform vec4 uPointer;
uniform float uPointerMode;
uniform vec3 uMotion;
uniform vec3 uPaletteA[${MAX_PALETTE}];
uniform float uPaletteSizeA;
uniform vec3 uPaletteB[${MAX_PALETTE}];
uniform float uPaletteSizeB;

varying vec3 vColor;
varying float vAlpha;
varying float vCore;
varying float vFlare;

${COMMON_GLSL}
${renameEffectGlsl(glslA, 'A')}
${renameEffectGlsl(glslB, 'B')}

vec3 paletteA(float x) {
  float i = clamp(x, 0.0, uPaletteSizeA - 1.0);
  int a = int(floor(i));
  return mix(uPaletteA[a], uPaletteA[min(a + 1, int(uPaletteSizeA) - 1)], fract(i));
}
vec3 paletteB(float x) {
  float i = clamp(x, 0.0, uPaletteSizeB - 1.0);
  int a = int(floor(i));
  return mix(uPaletteB[a], uPaletteB[min(a + 1, int(uPaletteSizeB) - 1)], fract(i));
}

${EMIT_GLSL}

void main() {
  vec2 pa, pb;
  float ra, aa, ca, fa, sa, rb, ab, cb, fb, sb;
  bool va = aPresent.x > 0.5 && sampleParticleA(pa, ra, aa, ca, fa, sa);
  bool vb = aPresent.y > 0.5 && sampleParticleB(pb, rb, ab, cb, fb, sb);
  // Staggered by hash so the morph ripples (mirror of Canvas morphWeight).
  float h = aPresent.x > 0.5 ? aVA.w : aVB.w;
  float w = smoothstep(0.0, 1.0, clamp((uMorph - h * 0.4) / 0.6, 0.0, 1.0));
  if (va && vb) {
    emitPoint(true, mix(pa, pb, w), mix(ra, rb, w), mix(aa, ab, w) * uBrightness,
      mix(paletteA(ca), paletteB(cb), w), w < 0.5 ? fa : fb, mix(sa, sb, w), h);
  } else if (va) {
    emitPoint(true, pa, ra, aa * uBrightness * (1.0 - w), paletteA(ca), fa, sa, h);
  } else {
    emitPoint(vb, pb, rb, ab * uBrightness * w, paletteB(cb), fb, sb, h);
  }
}
`;

function padded(source: Float32Array, length: number): Float32Array {
  if (source.length === length) return source;
  const out = new Float32Array(length);
  out.set(source.subarray(0, Math.min(source.length, length)));
  return out;
}

export function buildMorphGeometry(a: ParticleStore, b: ParticleStore): BufferGeometry {
  const n = Math.max(a.count, b.count);
  const geometry = new BufferGeometry();
  // Three uses `position` for the draw count.
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
  for (const [store, k] of [[a, 'A'], [b, 'B']] as const) {
    geometry.setAttribute(`position${k}`, new BufferAttribute(padded(store.p, n * 3), 3));
    geometry.setAttribute(`aV${k}`, new BufferAttribute(padded(store.v, n * 4), 4));
    geometry.setAttribute(`aShape${k}`, new BufferAttribute(padded(store.shape, n * 4), 4));
    geometry.setAttribute(`aTime${k}`, new BufferAttribute(padded(store.time, n * 4), 4));
  }
  const present = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    present[i * 2] = i < a.count ? 1 : 0;
    present[i * 2 + 1] = i < b.count ? 1 : 0;
  }
  geometry.setAttribute('aPresent', new BufferAttribute(present, 2));
  return geometry;
}

export interface MorphLayer {
  readonly object: Points;
  resize(width: number, height: number, pixelRatio: number): void;
  frame(frame: FrameTime, progress: number): void;
  dispose(): void;
}

export function createMorphLayer(
  a: { store: ParticleStore; glsl: string; config: GlitterFXConfig; defines: string },
  b: { store: ParticleStore; glsl: string; config: GlitterFXConfig; defines: string },
  maxPointSize: number,
): MorphLayer {
  const material = new ShaderMaterial({
    vertexShader: morphVertexShader(a.glsl, b.glsl, a.defines || b.defines),
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new Vector2(1, 1) },
      uPixelRatio: { value: 1 },
      uMaxPointSize: { value: maxPointSize },
      uSize: { value: b.config.size },
      uBrightness: { value: b.config.brightness },
      uGlow: { value: b.config.glow },
      uMorph: { value: 0 },
      uPointer: { value: new Vector4() },
      uPointerMode: { value: 0 },
      uMotion: { value: new Vector3() },
      uPaletteA: { value: paletteUniform(a.store) },
      uPaletteSizeA: { value: a.store.palette.colors.length },
      uPaletteB: { value: paletteUniform(b.store) },
      uPaletteSizeB: { value: b.store.palette.colors.length },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneFactor,
  });
  const u = material.uniforms as Record<string, { value: unknown }>;
  const points = new Points(buildMorphGeometry(a.store, b.store), material);
  points.frustumCulled = false;
  return {
    object: points,
    resize(width, height, pixelRatio) {
      (u['uResolution']!.value as Vector2).set(Math.max(1, width), Math.max(1, height));
      u['uPixelRatio']!.value = pixelRatio;
    },
    frame({ time, pointer, motion }, progress) {
      u['uTime']!.value = time;
      setGlobals(u, pointer, motion);
      u['uMorph']!.value = progress;
      // Appearance eases from A's settings to B's.
      u['uSize']!.value = a.config.size + (b.config.size - a.config.size) * progress;
      u['uBrightness']!.value = a.config.brightness + (b.config.brightness - a.config.brightness) * progress;
      u['uGlow']!.value = a.config.glow + (b.config.glow - a.config.glow) * progress;
    },
    dispose() {
      points.geometry.dispose();
      material.dispose();
    },
  };
}
