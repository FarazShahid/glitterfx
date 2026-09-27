/**
 * Full-screen haze pass: soft elliptical blobs from the effect's `haze()` layout, textured with
 * procedural noise wisps (the Canvas path uses smooth cached gradients). Additive, drawn behind particles.
 */
import type { GlitterFXConfig } from '@glitterfx/core';
import { MAX_HAZE_BLOBS, type ParticleEffect, type Palette } from '@glitterfx/effects';
import { BufferAttribute, BufferGeometry, CustomBlending, Mesh, OneFactor, ShaderMaterial, Vector2, Vector4 } from 'three';
import { paletteUniform } from './particles.js';

const vertexShader = /* glsl */ `
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const fragmentShader = /* glsl */ `
precision highp float;
uniform vec2 uResolution;
uniform float uPixelRatio;
uniform float uTime;
uniform float uAmount;
uniform vec4 uShape[${MAX_HAZE_BLOBS}];  // x, y, rx, ry (CSS px)
uniform vec4 uLook[${MAX_HAZE_BLOBS}];   // angle, palette position, intensity, unused
uniform int uCount;
uniform vec3 uPalette[8];
uniform float uPaletteSize;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { return 0.55 * noise(p) + 0.3 * noise(p * 2.03 + 7.1) + 0.15 * noise(p * 4.01 + 3.3); }

vec3 palette(float x) {
  float i = clamp(x, 0.0, uPaletteSize - 1.0);
  int a = int(floor(i));
  return mix(uPalette[a], uPalette[min(a + 1, int(uPaletteSize) - 1)], fract(i));
}

void main() {
  vec2 css = vec2(gl_FragCoord.x, uResolution.y * uPixelRatio - gl_FragCoord.y) / uPixelRatio;
  vec3 col = vec3(0.0);
  for (int i = 0; i < ${MAX_HAZE_BLOBS}; i++) {
    if (i >= uCount) break;
    vec4 s = uShape[i];
    vec4 l = uLook[i];
    vec2 d = css - s.xy;
    float c = cos(l.x), sn = sin(l.x);
    vec2 q = vec2(d.x * c + d.y * sn, -d.x * sn + d.y * c) / s.zw;
    float d2 = dot(q, q);
    if (d2 >= 1.0) continue;
    // Mirror of hazeFalloff(d2 * 1.4) * (1 - d2), shaped by slowly drifting wisps.
    float w = exp(-3.0 * d2 * 1.4) * (1.0 - d2);
    float n = fbm(q * 2.6 + vec2(uTime * 0.015, -uTime * 0.011) + float(i) * 13.7);
    col += palette(l.y) * l.z * w * (0.45 + 1.1 * n);
  }
  col *= uAmount;
  gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
}
`;

export interface HazeLayer {
  readonly mesh: Mesh;
  resize(width: number, height: number, pixelRatio: number): void;
  setPalette(palette: Palette): void;
  setWeight(value: number): void;
  frame(view: { width: number; height: number }, time: number, config: GlitterFXConfig): void;
  dispose(): void;
}

export function createHazeLayer(effect: ParticleEffect, palette: Palette): HazeLayer {
  const geometry = new BufferGeometry();
  // One oversized triangle covers the viewport.
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uResolution: { value: new Vector2(1, 1) },
      uPixelRatio: { value: 1 },
      uTime: { value: 0 },
      uAmount: { value: 0 },
      uShape: { value: Array.from({ length: MAX_HAZE_BLOBS }, () => new Vector4()) },
      uLook: { value: Array.from({ length: MAX_HAZE_BLOBS }, () => new Vector4()) },
      uCount: { value: 0 },
      uPalette: { value: paletteUniform({ palette }) },
      uPaletteSize: { value: palette.colors.length },
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
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.visible = false;
  let weight = 1;

  return {
    mesh,
    resize(width, height, pixelRatio) {
      (u['uResolution']!.value as Vector2).set(width, height);
      u['uPixelRatio']!.value = pixelRatio;
    },
    setPalette(next) {
      u['uPalette']!.value = paletteUniform({ palette: next });
      u['uPaletteSize']!.value = next.colors.length;
    },
    setWeight(value) {
      weight = value;
    },
    frame(view, time, config) {
      const amount = config.haze * config.brightness * weight;
      mesh.visible = amount > 0 && effect.haze !== undefined;
      if (!mesh.visible || !effect.haze) return;
      const blobs = effect.haze(view, time, config).slice(0, MAX_HAZE_BLOBS);
      const shape = u['uShape']!.value as Vector4[];
      const look = u['uLook']!.value as Vector4[];
      blobs.forEach((b, i) => {
        shape[i]!.set(b.x, b.y, Math.max(1, b.rx), Math.max(1, b.ry));
        look[i]!.set(b.angle, b.color, b.intensity, 0);
      });
      u['uCount']!.value = blobs.length;
      u['uTime']!.value = time;
      u['uAmount']!.value = amount;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
