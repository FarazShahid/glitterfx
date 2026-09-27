import {
  GlitterFX,
  NUMERIC_RANGES,
  registerBackend,
  type GlitterFXUpdate,
  type Quality,
  type RendererId,
  type RendererPreference,
  type TransitionType,
  type PointerMode,
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

/** Playground baseline; `Reset to defaults` returns here (keeping the chosen effect and backend). */
const baseline = () => ({
  quality: 'balanced' as Quality,
  density: 1,
  speed: 1,
  size: 1,
  brightness: 1,
  glow: 0.5,
  haze: 0.4,
  opacity: 1,
  seed: 42,
  params: {} as Record<string, number>,
  interaction: { pointer: 'none', radius: 140, strength: 0.8 } as { pointer: PointerMode; radius: number; strength: number },
  motion: { x: 0, y: 0, z: 0, reverse: false },
});

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
    palette: effects[0]?.defaultPalette ?? 'starlight',
    seed: 42,
    params: {} as Record<string, number>,
    interaction: { pointer: 'none', radius: 140, strength: 0.8 } as { pointer: PointerMode; radius: number; strength: number },
    motion: { x: 0, y: 0, z: 0, reverse: false },
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
      <label class="field slider"><span>Horizontal flow<output id="motion-x-out"></output></span>
        <input id="motion-x" type="range" min="-1" max="1" step="0.01" /></label>
      <label class="field slider"><span>Vertical flow<output id="motion-y-out"></output></span>
        <input id="motion-y" type="range" min="-1" max="1" step="0.01" /></label>
      <label class="field slider"><span>Depth flow<output id="motion-z-out"></output></span>
        <input id="motion-z" type="range" min="-1" max="1" step="0.01" /></label>
      <div class="field"><span>Direction</span>
        <div class="seg" id="motion-dir"><button type="button" data-v="forward">Forward</button><button type="button" data-v="reverse">Reverse</button></div>
      </div>
      <div class="field"><span>Pointer</span>
        <div class="seg" id="pointer">${(['none', 'repel', 'attract', 'vortex'] as const).map((m) => `<button type="button" data-v="${m}">${label(m)}</button>`).join('')}</div>
      </div>
      <label class="field slider"><span>Pointer radius<output id="pointer-radius-out"></output></span>
        <input id="pointer-radius" type="range" min="40" max="400" step="5" /></label>
      <label class="field slider"><span>Pointer strength<output id="pointer-strength-out"></output></span>
        <input id="pointer-strength" type="range" min="0" max="2" step="0.05" /></label>
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
        <button type="button" id="reset" class="btn">Reset to defaults</button>
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
  const mo = state.options.motion;
  for (const axis of ['x', 'y', 'z'] as const) {
    $<HTMLInputElement>(`#motion-${axis}`).value = String(mo[axis]);
    $<HTMLOutputElement>(`#motion-${axis}-out`).textContent = mo[axis].toFixed(2);
  }
  for (const b of $('#motion-dir').querySelectorAll<HTMLButtonElement>('button')) b.setAttribute('aria-pressed', String((b.dataset['v'] === 'reverse') === mo.reverse));
  const it = state.options.interaction;
  for (const b of $('#pointer').querySelectorAll<HTMLButtonElement>('button')) b.setAttribute('aria-pressed', String(b.dataset['v'] === it.pointer));
  $<HTMLInputElement>('#pointer-radius').value = String(it.radius);
  $<HTMLInputElement>('#pointer-strength').value = String(it.strength);
  $<HTMLOutputElement>('#pointer-radius-out').textContent = `${it.radius}px`;
  $<HTMLOutputElement>('#pointer-strength-out').textContent = it.strength.toFixed(2);
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
// Motion applies live; flows integrate in core, so dragging never makes particles jump.
for (const axis of ['x', 'y', 'z'] as const) {
  $<HTMLInputElement>(`#motion-${axis}`).addEventListener('input', (e) => {
    state.options.motion = { ...state.options.motion, [axis]: Number((e.target as HTMLInputElement).value) };
    apply({ motion: state.options.motion });
  });
}
$('#motion-dir').addEventListener('click', (e) => {
  const v = (e.target as HTMLElement).closest<HTMLButtonElement>('button')?.dataset['v'];
  if (!v) return;
  state.options.motion = { ...state.options.motion, reverse: v === 'reverse' };
  apply({ motion: state.options.motion });
});

// Pointer interaction applies live (no regeneration), like any other option.
$('#pointer').addEventListener('click', (e) => {
  const v = (e.target as HTMLElement).closest<HTMLButtonElement>('button')?.dataset['v'];
  if (!v) return;
  state.options.interaction = { ...state.options.interaction, pointer: v as PointerMode };
  apply({ interaction: state.options.interaction });
});
for (const key of ['radius', 'strength'] as const) {
  $<HTMLInputElement>(`#pointer-${key}`).addEventListener('input', (e) => {
    state.options.interaction = { ...state.options.interaction, [key]: Number((e.target as HTMLInputElement).value) };
    apply({ interaction: state.options.interaction });
  });
}
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

$('#reset').addEventListener('click', () => {
  const effect = state.options.effect;
  const palette = effects.find((e) => e.id === effect)?.defaultPalette ?? state.options.palette;
  state.options = { ...state.options, ...baseline(), effect, palette };
  const { effect: _keep, ...visual } = state.options;
  for (const p of panes) {
    // reset() also clears accumulated motion offsets, then the playground baseline is applied.
    p.fx?.reset();
    p.fx?.update(visual);
  }
  if (state.paused) togglePause();
  renderParams();
  syncControls();
  showStatus('Reset to defaults.');
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
