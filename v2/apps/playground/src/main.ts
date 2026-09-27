import {
  GlitterFX,
  NUMERIC_RANGES,
  registerBackend,
  type GlitterFXUpdate,
  type Quality,
  type RendererId,
  type RendererPreference,
  type TransitionType,
} from '@glitterfx/core';
import { canvasBackend } from '@glitterfx/backend-canvas';
import { effects, palettes } from '@glitterfx/effects';
import './style.css';

type Mode = RendererPreference | 'compare';
type NumericKey = keyof typeof NUMERIC_RANGES;

const MODES: readonly Mode[] = ['auto', 'canvas', 'webgl', 'compare'];
const QUALITIES: readonly Quality[] = ['eco', 'balanced', 'high'];
const SLIDERS: readonly NumericKey[] = ['density', 'speed', 'size', 'brightness', 'glow', 'haze', 'opacity'];

const TRANSITIONS: readonly TransitionType[] = ['crossfade', 'morph', 'dissolve'];

const state = {
  mode: 'auto' as Mode,
  transition: 'morph' as TransitionType,
  paused: false,
  options: {
    effect: effects[0]?.id ?? 'star-field',
    quality: 'balanced' as Quality,
    density: 1,
    speed: 1,
    size: 1,
    brightness: 1,
    glow: 0.5,
    haze: 0.4,
    opacity: 1,
    palette: 'starlight',
    seed: 42,
    params: {} as Record<string, number>,
  },
};

registerBackend(canvasBackend);

/** Three.js only loads when a WebGL-capable mode is used. */
let webglLoading: Promise<void> | null = null;
function ensureWebgl(): Promise<void> {
  webglLoading ??= import('@glitterfx/backend-webgl').then((m) => registerBackend(m.webglBackend));
  return webglLoading;
}

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!;
const NAMES: Record<string, string> = { webgl: 'WebGL' };
const label = (s: string) => NAMES[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

document.querySelector('#app')!.innerHTML = `
  <div class="shell">
    <header class="bar">
      <div class="brand"><span class="mark"></span>GlitterFX <b>V2</b> playground</div>
      <a class="bar-link" href="./index.html">V1 Effect Lab</a>
    </header>
    <main class="stage" id="stage"></main>
    <aside class="panel">
      <label class="field"><span>Effect</span>
        <select id="effect">${effects.map((e) => `<option>${e.id}</option>`).join('')}</select>
      </label>
      <div id="params"></div>
      <div class="field"><span>Transition</span>
        <div class="seg" id="transition">${TRANSITIONS.map((t) => `<button type="button" data-v="${t}">${label(t)}</button>`).join('')}</div>
      </div>
      <label class="field"><span>Palette</span>
        <select id="palette">${Object.keys(palettes).map((p) => `<option value="${p}">${label(p)}</option>`).join('')}</select>
      </label>
      <div class="field"><span>Backend</span>
        <div class="seg" id="mode">${MODES.map((m) => `<button type="button" data-v="${m}">${label(m)}</button>`).join('')}</div>
      </div>
      <div class="field"><span>Quality</span>
        <div class="seg" id="quality">${QUALITIES.map((q) => `<button type="button" data-v="${q}">${label(q)}</button>`).join('')}</div>
      </div>
      ${SLIDERS.map((key) => {
        const [min, max] = NUMERIC_RANGES[key];
        return `<label class="field slider"><span>${label(key)}<output id="${key}-out"></output></span>
          <input id="${key}" type="range" min="${min}" max="${max}" step="0.01" /></label>`;
      }).join('')}
      <div class="field"><span>Seed</span>
        <div class="row">
          <input id="seed" type="number" min="0" step="1" inputmode="numeric" />
          <button type="button" id="reseed" class="btn">Randomize</button>
        </div>
      </div>
      <div class="row actions">
        <button type="button" id="pause" class="btn">Pause</button>
        <button type="button" id="copy" class="btn">Copy config</button>
      </div>
      <p class="status" id="status" role="status"></p>
    </aside>
  </div>`;

const stage = $<HTMLElement>('#stage');
const status = $<HTMLElement>('#status');

interface Pane {
  el: HTMLElement;
  badge: HTMLElement;
  fx: GlitterFX | null;
}
let panes: Pane[] = [];

function showStatus(message: string, isError = false): void {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function paneRenderers(): RendererPreference[] {
  return state.mode === 'compare' ? ['canvas', 'webgl'] : [state.mode];
}

async function build(): Promise<void> {
  if (state.mode !== 'canvas') await ensureWebgl();
  for (const p of panes) p.fx?.destroy();
  stage.replaceChildren();
  stage.classList.toggle('split', state.mode === 'compare');

  panes = paneRenderers().map((renderer) => {
    const el = document.createElement('section');
    el.className = 'pane';
    el.innerHTML = `<div class="hud"><span class="badge"></span></div>`;
    stage.append(el);
    const pane: Pane = { el, badge: el.querySelector('.badge')!, fx: null };
    try {
      pane.fx = new GlitterFX(el, { ...state.options, renderer });
      if (state.paused) pane.fx.stop();
    } catch (error) {
      el.insertAdjacentHTML('beforeend', `<p class="pane-error">${(error as Error).message}</p>`);
    }
    return pane;
  });
  refreshBadges();
}

function refreshBadges(): void {
  for (const p of panes) {
    const resolved: RendererId | undefined = p.fx?.renderer;
    p.badge.textContent = resolved ? `${label(resolved)}${state.mode === 'auto' ? ' (auto)' : ''}` : 'Unavailable';
  }
}

function apply(changes: GlitterFXUpdate): void {
  Object.assign(state.options, changes);
  for (const p of panes) {
    try {
      p.fx?.update(changes);
    } catch (error) {
      showStatus((error as Error).message, true);
    }
  }
  syncControls();
}

async function setMode(mode: Mode): Promise<void> {
  const wasCompare = state.mode === 'compare';
  state.mode = mode;
  syncControls();
  if (mode === 'compare' || wasCompare || panes.some((p) => !p.fx)) {
    await build();
    return;
  }
  if (mode !== 'canvas') await ensureWebgl();
  try {
    panes[0]?.fx?.update({ renderer: mode });
    showStatus('');
  } catch (error) {
    showStatus((error as Error).message, true);
  }
  refreshBadges();
}

/** Sliders for the selected effect's own settings (e.g. galaxy arms). Applied on release, with the chosen transition. */
function renderParams(): void {
  const defs = Object.entries(effects.find((e) => e.id === state.options.effect)?.params ?? {});
  $('#params').innerHTML = defs
    .map(([key, p]) => `<label class="field slider"><span>${p.label ?? label(key)}<output id="param-${key}-out"></output></span>
      <input id="param-${key}" data-param="${key}" type="range" min="${p.min}" max="${p.max}" step="${p.step ?? 0.01}" /></label>`)
    .join('');
}

function paramValue(key: string): number {
  const def = effects.find((e) => e.id === state.options.effect)?.params[key];
  return state.options.params[key] ?? def?.default ?? 0;
}

function syncControls(): void {
  for (const input of $('#params').querySelectorAll<HTMLInputElement>('input[data-param]')) {
    const key = input.dataset['param']!;
    const value = paramValue(key);
    if (document.activeElement !== input) input.value = String(value);
    $<HTMLOutputElement>(`#param-${key}-out`).textContent = Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  for (const b of $('#mode').querySelectorAll<HTMLButtonElement>('button')) b.setAttribute('aria-pressed', String(b.dataset['v'] === state.mode));
  for (const b of $('#transition').querySelectorAll<HTMLButtonElement>('button')) b.setAttribute('aria-pressed', String(b.dataset['v'] === state.transition));
  $<HTMLSelectElement>('#palette').value = state.options.palette;
  $<HTMLSelectElement>('#effect').value = state.options.effect;
  for (const b of $('#quality').querySelectorAll<HTMLButtonElement>('button')) b.setAttribute('aria-pressed', String(b.dataset['v'] === state.options.quality));
  for (const key of SLIDERS) {
    const input = $<HTMLInputElement>(`#${key}`);
    const value = state.options[key];
    if (document.activeElement !== input) input.value = String(value);
    $<HTMLOutputElement>(`#${key}-out`).textContent = value.toFixed(2);
  }
  const seed = $<HTMLInputElement>('#seed');
  if (document.activeElement !== seed) seed.value = String(state.options.seed);
  $('#pause').textContent = state.paused ? 'Resume' : 'Pause';
}

// --- wiring ---------------------------------------------------------------------
$('#mode').addEventListener('click', (e) => {
  const v = (e.target as HTMLElement).closest<HTMLButtonElement>('button')?.dataset['v'];
  if (v && v !== state.mode) void setMode(v as Mode);
});
$('#quality').addEventListener('click', (e) => {
  const v = (e.target as HTMLElement).closest<HTMLButtonElement>('button')?.dataset['v'];
  if (v) apply({ quality: v as Quality });
});
for (const key of SLIDERS) {
  $<HTMLInputElement>(`#${key}`).addEventListener('input', (e) => apply({ [key]: Number((e.target as HTMLInputElement).value) }));
}
$<HTMLInputElement>('#seed').addEventListener('change', (e) => apply({ seed: Math.max(0, Math.trunc(Number((e.target as HTMLInputElement).value)) || 0) }));
$('#reseed').addEventListener('click', () => apply({ seed: Math.floor(Math.random() * 1e6) }));
$<HTMLSelectElement>('#palette').addEventListener('change', (e) => apply({ palette: (e.target as HTMLSelectElement).value }));
$<HTMLSelectElement>('#effect').addEventListener('change', (e) => {
  const effect = (e.target as HTMLSelectElement).value;
  state.options.effect = effect;
  // Each effect has its own default palette; let it apply.
  const palette = effects.find((x) => x.id === effect)?.defaultPalette ?? state.options.palette;
  state.options.palette = palette;
  // Settings belong to an effect: start the new one from its defaults.
  state.options.params = {};
  renderParams();
  for (const p of panes) {
    void p.fx?.transitionTo({ effect, palette, params: {} }, { type: state.transition, duration: 1600 }).catch((error: Error) => showStatus(error.message, true));
  }
  syncControls();
});
$('#params').addEventListener('input', (e) => {
  const input = e.target as HTMLInputElement;
  const key = input.dataset['param'];
  if (key) $<HTMLOutputElement>(`#param-${key}-out`).textContent = Number(input.value) % 1 === 0 ? input.value : Number(input.value).toFixed(2);
});
$('#params').addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  const key = input.dataset['param'];
  if (!key) return;
  // Settings regenerate particles, so animate the change with the selected transition.
  state.options.params = { ...state.options.params, [key]: Number(input.value) };
  for (const p of panes) {
    void p.fx?.transitionTo({ params: state.options.params }, { type: state.transition, duration: 1400 }).catch((error: Error) => showStatus(error.message, true));
  }
  syncControls();
});
$('#transition').addEventListener('click', (e) => {
  const v = (e.target as HTMLElement).closest<HTMLButtonElement>('button')?.dataset['v'];
  if (v) {
    state.transition = v as TransitionType;
    syncControls();
  }
});

function togglePause(): void {
  state.paused = !state.paused;
  for (const p of panes) (state.paused ? p.fx?.stop() : p.fx?.start());
  syncControls();
}
$('#pause').addEventListener('click', togglePause);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLButtonElement)) {
    e.preventDefault();
    togglePause();
  }
});

$('#copy').addEventListener('click', () => {
  const renderer = state.mode === 'compare' ? 'auto' : state.mode;
  const code = `new GlitterFX(element, ${JSON.stringify({ ...state.options, renderer }, null, 2)});`;
  void navigator.clipboard.writeText(code).then(
    () => showStatus('Config copied.'),
    () => showStatus('Clipboard unavailable.', true),
  );
});

renderParams();
syncControls();
void build();

// Exposed for browser smoke tests.
Object.assign(window, { __playground: { state, panes: () => panes } });
