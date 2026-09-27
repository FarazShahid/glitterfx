import {
  GlitterFX,
  registerBackend,
  type GlitterFXUpdate,
  type Quality,
} from '@glitterfx/core';
import { canvasBackend } from '@glitterfx/backend-canvas';
import { effects } from '@glitterfx/effects';
import './phase2.css';

const PHASE2 = [
  'warp-speed',
  'bioluminescent-ocean',
  'pollen-drift',
  'falling-ash',
  'dust-motes',
  'dandelion-seeds',
  'rising-lanterns',
  'accretion-disk',
  'planetary-rings',
] as const;

const $ = <T extends HTMLElement>(selector: string): T => document.querySelector<T>(selector)!;
const title = (id: string) => id.split('-').map((x) => x[0]!.toUpperCase() + x.slice(1)).join(' ');

registerBackend(canvasBackend);

let webglReady: Promise<void> | null = null;
function ensureWebgl(): Promise<void> {
  webglReady ??= import('@glitterfx/backend-webgl').then((m) => registerBackend(m.webglBackend));
  return webglReady;
}

const state = {
  index: 0,
  quality: 'balanced' as Quality,
  density: 1,
  speed: 1,
  brightness: 1,
  glow: 0.75,
  haze: 0.5,
  seed: 42,
  autoplay: false,
};

document.querySelector('#app')!.innerHTML = `
  <div class="preview-shell">
    <header class="hero-bar">
      <div>
        <div class="eyebrow">GPT branch · V2 Phase 2</div>
        <h1>GlitterFX Effects Preview</h1>
        <p>Canvas and WebGL render the same effect, seed and configuration side by side.</p>
      </div>
      <div class="header-actions">
        <a href="./v2.html">Full V2 Playground</a>
        <button id="autoplay" type="button">Autoplay</button>
      </div>
    </header>

    <nav id="effects" class="effect-strip">
      ${PHASE2.map((id, i) => `<button type="button" data-index="${i}">
        <span class="number">${String(i + 1).padStart(2, '0')}</span>
        <span>${title(id)}</span>
      </button>`).join('')}
    </nav>

    <main class="compare-stage">
      <section class="pane">
        <div id="canvas-stage" class="fx-host"></div>
        <span class="backend-badge">Canvas / CPU</span>
      </section>
      <section class="pane">
        <div id="webgl-stage" class="fx-host"></div>
        <span class="backend-badge">WebGL / GPU</span>
      </section>
      <div class="effect-title">
        <span id="effect-kicker">Phase 2 effect</span>
        <strong id="effect-name"></strong>
      </div>
    </main>

    <section class="controls">
      <label>Quality
        <select id="quality">
          <option value="eco">Eco</option>
          <option value="balanced" selected>Balanced</option>
          <option value="high">High</option>
        </select>
      </label>
      <label>Density <output id="density-out"></output>
        <input id="density" type="range" min="0.2" max="2" step="0.05" value="1" />
      </label>
      <label>Speed <output id="speed-out"></output>
        <input id="speed" type="range" min="0" max="3" step="0.05" value="1" />
      </label>
      <label>Brightness <output id="brightness-out"></output>
        <input id="brightness" type="range" min="0.2" max="2" step="0.05" value="1" />
      </label>
      <label>Glow <output id="glow-out"></output>
        <input id="glow" type="range" min="0" max="1" step="0.05" value="0.75" />
      </label>
      <label>Haze <output id="haze-out"></output>
        <input id="haze" type="range" min="0" max="1" step="0.05" value="0.5" />
      </label>
      <label>Seed
        <div class="seed-row">
          <input id="seed" type="number" min="0" step="1" value="42" />
          <button id="randomize" type="button">Random</button>
        </div>
      </label>
    </section>
  </div>
`;

let canvasFx: GlitterFX | null = null;
let webglFx: GlitterFX | null = null;
let timer: number | null = null;

function currentEffect(): string {
  return PHASE2[state.index]!;
}

function defaultPalette(effect: string): string {
  return effects.find((x) => x.id === effect)?.defaultPalette ?? 'starlight';
}

function options(renderer: 'canvas' | 'webgl') {
  const effect = currentEffect();
  return {
    effect,
    renderer,
    quality: state.quality,
    density: state.density,
    speed: state.speed,
    brightness: state.brightness,
    glow: state.glow,
    haze: state.haze,
    seed: state.seed,
    palette: defaultPalette(effect),
    reducedMotion: 'ignore' as const,
  };
}

async function build(): Promise<void> {
  await ensureWebgl();
  canvasFx?.destroy();
  webglFx?.destroy();
  canvasFx = new GlitterFX($('#canvas-stage'), options('canvas'));
  try {
    webglFx = new GlitterFX($('#webgl-stage'), options('webgl'));
  } catch (error) {
    webglFx = null;
    $('#webgl-stage').innerHTML = `<div class="unsupported">${(error as Error).message}</div>`;
  }
  sync();
}

function sync(): void {
  $('#effect-name').textContent = title(currentEffect());
  for (const b of $('#effects').querySelectorAll<HTMLButtonElement>('button')) {
    b.setAttribute('aria-pressed', String(Number(b.dataset['index']) === state.index));
  }
  for (const key of ['density', 'speed', 'brightness', 'glow', 'haze'] as const) {
    $<HTMLOutputElement>(`#${key}-out`).textContent = state[key].toFixed(2);
  }
  $<HTMLButtonElement>('#autoplay').textContent = state.autoplay ? 'Stop autoplay' : 'Autoplay';
}

function patch(changes: GlitterFXUpdate): void {
  Object.assign(state, changes);
  canvasFx?.update(changes);
  webglFx?.update(changes);
  sync();
}

async function select(index: number): Promise<void> {
  state.index = (index + PHASE2.length) % PHASE2.length;
  const effect = currentEffect();
  const changes = { effect, palette: defaultPalette(effect) };
  const transition = { type: 'morph' as const, duration: 1200 };
  await Promise.all([
    canvasFx?.transitionTo(changes, transition),
    webglFx?.transitionTo(changes, transition),
  ]);
  sync();
}

$('#effects').addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-index]');
  if (button) void select(Number(button.dataset['index']));
});

for (const key of ['density', 'speed', 'brightness', 'glow', 'haze'] as const) {
  $<HTMLInputElement>(`#${key}`).addEventListener('input', (event) => {
    patch({ [key]: Number((event.target as HTMLInputElement).value) });
  });
}

$<HTMLSelectElement>('#quality').addEventListener('change', (event) => {
  patch({ quality: (event.target as HTMLSelectElement).value as Quality });
});

$<HTMLInputElement>('#seed').addEventListener('change', (event) => {
  const seed = Math.max(0, Math.trunc(Number((event.target as HTMLInputElement).value)) || 0);
  state.seed = seed;
  patch({ seed });
});

$('#randomize').addEventListener('click', () => {
  const seed = Math.floor(Math.random() * 1_000_000);
  state.seed = seed;
  $<HTMLInputElement>('#seed').value = String(seed);
  patch({ seed });
});

function stopAutoplay(): void {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  state.autoplay = false;
  sync();
}

function startAutoplay(): void {
  stopAutoplay();
  state.autoplay = true;
  timer = window.setInterval(() => void select(state.index + 1), 6500);
  sync();
}

$('#autoplay').addEventListener('click', () => state.autoplay ? stopAutoplay() : startAutoplay());

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') void select(state.index + 1);
  if (event.key === 'ArrowLeft') void select(state.index - 1);
});

window.addEventListener('beforeunload', () => {
  stopAutoplay();
  canvasFx?.destroy();
  webglFx?.destroy();
});

void build();
