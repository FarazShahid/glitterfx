/**
 * Deterministic render fixture for visual review and regression checks.
 * Renders each effect/renderer pair once at a fixed time, without the frame loop.
 * Example: fixtures.html?effects=star-field&renderers=canvas,webgl&t=5&seed=42&glow=0.8
 */
import { normalizeConfig, type BackendDescriptor, type GlitterFXOptions, type RendererId } from '@glitterfx/core';
import { canvasBackend } from '@glitterfx/backend-canvas';
import { webglBackend } from '@glitterfx/backend-webgl';

const q = new URLSearchParams(location.search);
const list = (key: string, fallback: string) => (q.get(key) ?? fallback).split(',').filter(Boolean);
const effects = list('effects', 'star-field');
const renderers = list('renderers', 'canvas,webgl') as RendererId[];
const time = Number(q.get('t') ?? 5);
const backends: Record<RendererId, BackendDescriptor> = { canvas: canvasBackend, webgl: webglBackend };

const overrides: Partial<GlitterFXOptions> = {};
for (const key of ['density', 'speed', 'size', 'brightness', 'glow', 'seed', 'haze', 'opacity'] as const) {
  if (q.has(key)) (overrides as Record<string, number>)[key] = Number(q.get(key));
}
// Effect params: &params=arms:5,twist:3
if (q.has('params')) {
  overrides.params = Object.fromEntries(q.get('params')!.split(',').map((kv) => { const [k, v] = kv.split(':'); return [k!, Number(v)]; }));
}
for (const key of ['quality', 'palette'] as const) {
  if (q.has(key)) (overrides as Record<string, string>)[key] = q.get(key)!;
}

const grid = document.getElementById('grid')!;
grid.style.setProperty('--cols', String(renderers.length));
const pixelRatio = Number(q.get('dpr') ?? 1);

const to = q.get('to');
for (const effect of effects) {
  for (const renderer of renderers) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    grid.append(cell);
    const { width, height } = cell.getBoundingClientRect();
    const instance = backends[renderer].create(normalizeConfig({ effect, seed: 42, ...overrides, renderer }));
    Object.assign(instance.element.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
    cell.prepend(instance.element);
    instance.resize({ width, height, pixelRatio });
    // Optional mid-transition render: &to=galaxy&type=morph&p=0.5
    if (to) {
      instance.beginTransition?.(normalizeConfig({ effect: to, seed: 42, ...overrides, renderer }), (q.get('type') ?? 'morph') as 'morph');
      instance.setTransition?.(Number(q.get('p') ?? 0.5));
    }
    instance.frame({ time, delta: 0 });
    cell.insertAdjacentHTML('beforeend', `<span>${effect}${to ? ` → ${to} ${q.get('type') ?? 'morph'} ${q.get('p') ?? 0.5}` : ''} / ${renderer}</span>`);
  }
}
document.body.dataset['ready'] = 'true';
