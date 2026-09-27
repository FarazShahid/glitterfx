/**
 * GLSL/CPU parity check for the shared motion helpers. Each case runs the real COMMON_GLSL on the GPU
 * for N deterministic inputs (float32 render target), reads the results back and compares them with
 * the TypeScript behaviors. Result: document.body.dataset.result = JSON { case: maxAbsError }.
 */
import { curlVelocity, glintPulse, turbulence, twinkle } from '@glitterfx/effects';
import { COMMON_GLSL } from '@glitterfx/backend-webgl';

const SIDE = 32;
const N = SIDE * SIDE;
const frac = (x: number) => x - Math.floor(x);
/** Deterministic inputs: phase, rate, time (up to 5 minutes), shape parameter. */
const inputs = Array.from({ length: N }, (_, k) => [
  frac(k * 0.6180339887) * 6.2831853,
  0.3 + frac(k * 0.7548776662) * 4,
  frac(k * 0.5698402910) * 300,
  4 + (k % 8) * 8,
]);

interface Case {
  name: string;
  /** GLSL expression of `a` (vec4 input) returning vec2. */
  glsl: string;
  cpu: (a: number[]) => [number, number];
}

const cases: Case[] = [
  { name: 'glintPulse', glsl: 'glintPulse(a.x, a.y, a.z, a.w)', cpu: (a) => glintPulse(a[0]!, a[1]!, a[2]!, a[3]!, [0, 0]) },
  { name: 'twinkle', glsl: 'vec2(twinkle(a.x, a.y, 0.6, a.z), 0.0)', cpu: (a) => [twinkle(a[0]!, a[1]!, 0.6, a[2]!), 0] },
  { name: 'turbulence', glsl: 'turbulence(vec2(a.x, a.y), a.z * 0.1)', cpu: (a) => turbulence(a[0]!, a[1]!, a[2]! * 0.1, [0, 0]) },
  { name: 'curlVelocity', glsl: 'curlVelocity(vec2(a.x * 0.3, a.y), a.z * 0.05)', cpu: (a) => curlVelocity(a[0]! * 0.3, a[1]!, a[2]! * 0.05, [0, 0]) },
];

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'compile failed');
  return shader;
}

function runCase(gl: WebGL2RenderingContext, c: Case): number {
  const vs = `#version 300 es
precision highp float;
in vec4 aIn;
in float aIndex;
out vec2 vOut;
${COMMON_GLSL}
void main() {
  vec4 a = aIn;
  vOut = ${c.glsl};
  vec2 cell = vec2(mod(aIndex, ${SIDE}.0), floor(aIndex / ${SIDE}.0)) + 0.5;
  gl_Position = vec4(cell / ${SIDE}.0 * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}`;
  const fs = `#version 300 es
precision highp float;
in vec2 vOut;
out vec4 color;
void main() { color = vec4(vOut, 0.0, 1.0); }`;
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link failed');
  gl.useProgram(program);

  const bind = (name: string, data: Float32Array, size: number) => {
    const loc = gl.getAttribLocation(program, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  bind('aIn', new Float32Array(inputs.flat()), 4);
  bind('aIndex', Float32Array.from({ length: N }, (_, i) => i), 1);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, N);
  const out = new Float32Array(N * 4);
  gl.readPixels(0, 0, SIDE, SIDE, gl.RGBA, gl.FLOAT, out);

  let maxErr = 0;
  inputs.forEach((a, k) => {
    // CPU sees the same float32-rounded inputs the GPU received.
    const cpu = c.cpu(a.map((v) => Math.fround(v)));
    maxErr = Math.max(maxErr, Math.abs(cpu[0] - out[k * 4]!), Math.abs(cpu[1] - out[k * 4 + 1]!));
  });
  return maxErr;
}

const pre = document.getElementById('out')!;
try {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) throw new Error('WebGL2 unavailable');
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float unavailable');
  const target = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, target);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, SIDE, SIDE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, gl.createFramebuffer());
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
  gl.viewport(0, 0, SIDE, SIDE);

  const result = Object.fromEntries(cases.map((c) => [c.name, runCase(gl, c)]));
  pre.textContent = Object.entries(result).map(([k, v]) => `${k.padEnd(14)} max |GPU - CPU| = ${v.toExponential(2)}`).join('\n');
  document.body.dataset['result'] = JSON.stringify(result);
} catch (error) {
  pre.textContent = String(error);
  document.body.dataset['result'] = JSON.stringify({ error: String(error) });
}
