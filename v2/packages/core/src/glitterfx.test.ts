// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { capabilities, registerBackend, registeredBackends, unregisterBackend, type BackendDescriptor, type BackendInstance, type FrameTime } from './backend.js';
import type { GlitterFXConfig, RendererId } from './config.js';
import { GlitterFX } from './glitterfx.js';

// --- deterministic frame loop -------------------------------------------------
let frameQueue = new Map<number, FrameRequestCallback>();
let nextId = 1;
function flushFrame(now: number): void {
  const callbacks = [...frameQueue.values()];
  frameQueue = new Map();
  for (const cb of callbacks) cb(now);
}

// --- fake ResizeObserver ------------------------------------------------------
const observers: FakeResizeObserver[] = [];
class FakeResizeObserver {
  disconnected = false;
  constructor(readonly callback: () => void) {
    observers.push(this);
  }
  observe(): void {}
  disconnect(): void {
    this.disconnected = true;
  }
}

// --- fake backend -------------------------------------------------------------
interface FakeInstance extends BackendInstance {
  frames: FrameTime[];
  sizes: unknown[];
  configs: GlitterFXConfig[];
  destroyed: boolean;
}

function fakeBackend(id: RendererId, supported = true) {
  const instances: FakeInstance[] = [];
  const descriptor: BackendDescriptor = {
    id,
    isSupported: () => supported,
    create(config) {
      const instance: FakeInstance = {
        element: document.createElement('canvas'),
        frames: [],
        sizes: [],
        configs: [config],
        destroyed: false,
        resize(size) { this.sizes.push(size); },
        update(next) { this.configs.push(next); },
        frame(time) { this.frames.push(time); },
        destroy() { this.destroyed = true; },
      };
      instances.push(instance);
      return instance;
    },
  };
  return { descriptor, instances };
}

let container: HTMLElement;

beforeEach(() => {
  frameQueue = new Map();
  observers.length = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = nextId++;
    frameQueue.set(id, cb);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frameQueue.delete(id));
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.stubGlobal('devicePixelRatio', 3);
  container = document.createElement('section');
  container.innerHTML = '<h1>Hero</h1>';
  container.getBoundingClientRect = () => ({ width: 800, height: 400 }) as DOMRect;
  document.body.append(container);
});

afterEach(() => {
  for (const b of registeredBackends()) unregisterBackend(b.id);
  container.remove();
  vi.unstubAllGlobals();
});

describe('GlitterFX lifecycle', () => {
  it('runs a backend through start, stop, resize, update and destroy', () => {
    const canvas = fakeBackend('canvas');
    const fx = new GlitterFX(container, { effect: 'star-field', renderer: 'canvas', quality: 'balanced', backends: [canvas.descriptor] });
    const inst = canvas.instances[0]!;

    // mounted behind existing content, sized with quality-capped DPR
    expect(container.firstChild).toBe(inst.element);
    expect(container.querySelector('h1')).not.toBeNull();
    expect(container.style.position).toBe('relative');
    expect(inst.sizes).toEqual([{ width: 800, height: 400, pixelRatio: 1.5 }]);
    expect(fx.running).toBe(true);

    // frames: first frame has zero delta, deltas are clamped and scaled by speed
    flushFrame(1000);
    flushFrame(1016);
    flushFrame(5000); // long pause (hidden tab) clamps to 0.1s
    expect(inst.frames.map((f) => f.delta)).toEqual([0, 0.016, 0.1]);

    // stop freezes time; start resumes without a jump
    fx.stop();
    expect(frameQueue.size).toBe(0);
    flushFrame(6000);
    expect(inst.frames).toHaveLength(3);
    fx.start();
    flushFrame(9000);
    flushFrame(9010);
    expect(inst.frames.at(-2)?.delta).toBe(0);
    expect(inst.frames.at(-1)?.time).toBeCloseTo(0.126);

    // update passes normalized config; speed scales time
    fx.update({ speed: 2, density: 5 });
    expect(inst.configs.at(-1)).toMatchObject({ speed: 2, density: 2 });
    flushFrame(9020);
    expect(inst.frames.at(-1)?.delta).toBeCloseTo(0.02);

    // quality change re-applies the pixel-ratio cap
    fx.update({ quality: 'high' });
    expect(inst.sizes.at(-1)).toEqual({ width: 800, height: 400, pixelRatio: 2 });

    // resize() only notifies the backend when something changed
    const before = inst.sizes.length;
    fx.resize();
    expect(inst.sizes).toHaveLength(before);
    container.getBoundingClientRect = () => ({ width: 1000, height: 500 }) as DOMRect;
    observers[0]!.callback();
    expect(inst.sizes.at(-1)).toEqual({ width: 1000, height: 500, pixelRatio: 2 });

    // destroy releases everything and restores the container
    fx.destroy();
    expect(inst.destroyed).toBe(true);
    expect(inst.element.isConnected).toBe(false);
    expect(frameQueue.size).toBe(0);
    expect(observers[0]!.disconnected).toBe(true);
    expect(container.style.position).toBe('');
    expect(container.style.isolation).toBe('');
    expect(fx.running).toBe(false);

    // calls after destroy are no-ops
    fx.start();
    fx.update({ speed: 1 });
    expect(frameQueue.size).toBe(0);
    expect(canvas.instances).toHaveLength(1);
  });

  it('keeps an existing positioned container untouched on destroy', () => {
    container.style.position = 'absolute';
    const fx = new GlitterFX(container, { effect: 'x', backends: [fakeBackend('canvas').descriptor] });
    fx.destroy();
    expect(container.style.position).toBe('absolute');
  });
});

describe('renderer selection', () => {
  it('respects an explicit renderer even when auto would pick another', () => {
    const webgl = fakeBackend('webgl');
    const canvas = fakeBackend('canvas');
    const fx = new GlitterFX(container, { effect: 'x', renderer: 'canvas', backends: [webgl.descriptor, canvas.descriptor] });
    expect(fx.renderer).toBe('canvas');
    expect(webgl.instances).toHaveLength(0);
    fx.destroy();
  });

  it('auto prefers webgl, then canvas, independent of registration order', () => {
    const canvas = fakeBackend('canvas');
    const webgl = fakeBackend('webgl');
    const a = new GlitterFX(container, { effect: 'x', backends: [canvas.descriptor, webgl.descriptor] });
    expect(a.renderer).toBe('webgl');
    a.destroy();

    const b = new GlitterFX(container, { effect: 'x', backends: [canvas.descriptor, fakeBackend('webgl', false).descriptor] });
    expect(b.renderer).toBe('canvas');
    b.destroy();
  });

  it('fails clearly and leaves the container untouched', () => {
    const snapshot = container.outerHTML;
    expect(() => new GlitterFX(container, { effect: 'x', renderer: 'webgl', backends: [fakeBackend('canvas').descriptor] }))
      .toThrow(/"webgl" is not registered/);
    expect(() => new GlitterFX(container, { effect: 'x', renderer: 'webgl', backends: [fakeBackend('webgl', false).descriptor] }))
      .toThrow(/"webgl" is not supported/);
    expect(() => new GlitterFX(container, { effect: 'x', backends: [] })).toThrow(/no supported renderer/);
    expect(container.outerHTML).toBe(snapshot);
  });

  it('switches backend on update without stopping the loop', () => {
    const webgl = fakeBackend('webgl');
    const canvas = fakeBackend('canvas');
    const fx = new GlitterFX(container, { effect: 'x', renderer: 'webgl', backends: [webgl.descriptor, canvas.descriptor] });
    fx.update({ renderer: 'canvas', seed: 7 });

    expect(fx.renderer).toBe('canvas');
    expect(webgl.instances[0]!.destroyed).toBe(true);
    expect(webgl.instances[0]!.element.isConnected).toBe(false);
    expect(canvas.instances[0]!.configs[0]).toMatchObject({ renderer: 'canvas', seed: 7 });
    expect(container.querySelectorAll('canvas')).toHaveLength(1);

    flushFrame(100);
    expect(canvas.instances[0]!.frames).toHaveLength(1);
    fx.destroy();
  });

  it('keeps the live instance when the preference changes but resolves to the same backend', () => {
    const webgl = fakeBackend('webgl');
    const fx = new GlitterFX(container, { effect: 'x', renderer: 'webgl', backends: [webgl.descriptor] });
    fx.update({ renderer: 'auto' });
    expect(webgl.instances).toHaveLength(1);
    expect(webgl.instances[0]!.configs.at(-1)?.renderer).toBe('auto');
    fx.destroy();
  });

  it('a failed backend switch keeps the current instance running', () => {
    const webgl = fakeBackend('webgl');
    const fx = new GlitterFX(container, { effect: 'x', backends: [webgl.descriptor] });
    expect(() => fx.update({ renderer: 'canvas' })).toThrow(/not registered/);
    expect(fx.renderer).toBe('webgl');
    expect(fx.config.renderer).toBe('auto');
    expect(webgl.instances[0]!.destroyed).toBe(false);
    fx.destroy();
  });

  it('a failing backend create leaves the container and current instance untouched', () => {
    const snapshot = container.outerHTML;
    const broken: BackendDescriptor = { id: 'canvas', isSupported: () => true, create: () => { throw new Error('boom'); } };
    expect(() => new GlitterFX(container, { effect: 'x', backends: [broken] })).toThrow('boom');
    expect(container.outerHTML).toBe(snapshot);

    const webgl = fakeBackend('webgl');
    const fx = new GlitterFX(container, { effect: 'x', renderer: 'webgl', backends: [webgl.descriptor, broken] });
    expect(() => fx.update({ renderer: 'canvas' })).toThrow('boom');
    expect(fx.renderer).toBe('webgl');
    expect(webgl.instances[0]!.element.isConnected).toBe(true);
    fx.destroy();
  });

  it('sees backends registered after construction', () => {
    registerBackend(fakeBackend('canvas').descriptor);
    const fx = new GlitterFX(container, { effect: 'x', renderer: 'canvas' });
    const late = fakeBackend('webgl');
    registerBackend(late.descriptor);
    fx.update({ renderer: 'webgl' });
    expect(fx.renderer).toBe('webgl');
    expect(late.instances).toHaveLength(1);
    fx.destroy();
  });

  it('uses globally registered backends when none are passed', () => {
    const canvas = fakeBackend('canvas');
    registerBackend(canvas.descriptor);
    const fx = new GlitterFX(container, { effect: 'x' });
    expect(fx.renderer).toBe('canvas');
    fx.destroy();
  });
});

describe('transitions', () => {
  function transitionBackend(id: RendererId, withInstanceTransitions: boolean) {
    const log: string[] = [];
    const fake = fakeBackend(id);
    const descriptor: BackendDescriptor = {
      ...fake.descriptor,
      create(config) {
        const instance = fake.descriptor.create(config) as FakeInstance;
        if (withInstanceTransitions) {
          instance.beginTransition = (next, type) => (log.push(`begin:${next.effect}:${type}`), true);
          instance.setTransition = (p) => void log.push(`p:${p.toFixed(2)}`);
          instance.endTransition = (commit) => void log.push(`end:${commit}`);
        }
        return instance;
      },
    };
    return { descriptor, instances: fake.instances, log };
  }

  it('runs an in-instance morph, eased by real time, and commits the new config', async () => {
    const b = transitionBackend('canvas', true);
    const fx = new GlitterFX(container, { effect: 'a', speed: 0, backends: [b.descriptor] });
    const done = fx.transitionTo('b', { type: 'morph', duration: 100 });
    expect(fx.transitioning).toBe(true);
    flushFrame(0);
    flushFrame(50);
    expect(fx.config.effect).toBe('a');
    flushFrame(100);
    await expect(done).resolves.toBe(true);
    expect(fx.config.effect).toBe('b');
    expect(fx.transitioning).toBe(false);
    expect(b.log).toEqual(['begin:b:morph', 'p:0.00', 'p:0.50', 'p:1.00', 'end:true']);
    // same instance, no rebuild
    expect(b.instances).toHaveLength(1);
    fx.destroy();
  });

  it('falls back to a crossfade of two instances and cleans up the outgoing one', async () => {
    const b = transitionBackend('canvas', false);
    const fx = new GlitterFX(container, { effect: 'a', backends: [b.descriptor] });
    const done = fx.transitionTo({ effect: 'b', glow: 0.9 }, { type: 'morph', duration: 100 });
    const [outgoing, incoming] = b.instances;
    expect(container.querySelectorAll('canvas')).toHaveLength(2);
    expect(incoming!.element.style.opacity).toBe('0');
    flushFrame(0);
    flushFrame(50);
    expect(Number(incoming!.element.style.opacity)).toBeCloseTo(0.5);
    expect(incoming!.frames).toHaveLength(2);
    flushFrame(100);
    await expect(done).resolves.toBe(true);
    expect(outgoing!.destroyed).toBe(true);
    expect(container.querySelectorAll('canvas')).toHaveLength(1);
    expect(incoming!.element.style.opacity).toBe('');
    expect(fx.config).toMatchObject({ effect: 'b', glow: 0.9 });
    fx.destroy();
    expect(incoming!.destroyed).toBe(true);
  });

  it('cancel reverts, a new transition supersedes, update completes the running one', async () => {
    const b = transitionBackend('canvas', false);
    const fx = new GlitterFX(container, { effect: 'a', backends: [b.descriptor] });

    const first = fx.transitionTo('b', { duration: 1000 });
    flushFrame(0);
    fx.cancelTransition();
    await expect(first).resolves.toBe(false);
    expect(fx.config.effect).toBe('a');
    expect(b.instances[1]!.destroyed).toBe(true);
    expect(container.querySelectorAll('canvas')).toHaveLength(1);

    const second = fx.transitionTo('b', { duration: 1000 });
    const third = fx.transitionTo('c', { duration: 1000 });
    await expect(second).resolves.toBe(false);
    expect(fx.config.effect).toBe('b');
    fx.update({ speed: 2 });
    await expect(third).resolves.toBe(false);
    expect(fx.config).toMatchObject({ effect: 'c', speed: 2 });
    expect(container.querySelectorAll('canvas')).toHaveLength(1);
    fx.destroy();
  });

  it('freezes while stopped and completes immediately with duration 0', async () => {
    const b = transitionBackend('canvas', true);
    const fx = new GlitterFX(container, { effect: 'a', backends: [b.descriptor] });
    fx.stop();
    void fx.transitionTo('b', { type: 'dissolve', duration: 100 });
    flushFrame(500);
    expect(fx.transitioning).toBe(true);
    fx.cancelTransition();
    await expect(fx.transitionTo('b', { duration: 0, type: 'dissolve' })).resolves.toBe(true);
    expect(fx.config.effect).toBe('b');
    fx.destroy();
  });
});

describe('website behavior', () => {
  class FakeIO {
    static last: FakeIO | null = null;
    disconnected = false;
    constructor(readonly callback: (entries: { isIntersecting: boolean }[]) => void) {
      FakeIO.last = this;
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  }
  const media = { matches: false, listeners: new Set<() => void>() };

  beforeEach(() => {
    media.matches = false;
    media.listeners.clear();
    vi.stubGlobal('IntersectionObserver', FakeIO);
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return media.matches;
      },
      addEventListener: (_: string, l: () => void) => media.listeners.add(l),
      removeEventListener: (_: string, l: () => void) => media.listeners.delete(l),
    }));
  });

  it('selects from an ordered fallback list and validates it', () => {
    const canvas = fakeBackend('canvas');
    const webgl = fakeBackend('webgl', false);
    const fx = new GlitterFX(container, { effect: 'a', renderer: ['webgl', 'canvas'], backends: [canvas.descriptor, webgl.descriptor] });
    expect(fx.renderer).toBe('canvas');
    fx.destroy();
    expect(() => new GlitterFX(container, { effect: 'a', renderer: [], backends: [canvas.descriptor] })).toThrow(/must not be empty/);
    expect(() => new GlitterFX(container, { effect: 'a', renderer: ['webgl'], backends: [canvas.descriptor, webgl.descriptor] })).toThrow(/none of the renderers \[webgl\]/);
  });

  it('reports capabilities', () => {
    const caps = capabilities([fakeBackend('canvas').descriptor, fakeBackend('webgl', false).descriptor]);
    expect(caps).toEqual({ renderers: { canvas: true, webgl: false }, auto: 'canvas', reducedMotion: false });
    media.matches = true;
    expect(capabilities([]).reducedMotion).toBe(true);
    expect(capabilities([]).auto).toBeNull();
  });

  it('pauses while offscreen or the tab is hidden, then resumes', () => {
    const b = fakeBackend('canvas');
    const fx = new GlitterFX(container, { effect: 'a', backends: [b.descriptor] });
    const inst = b.instances[0]!;
    flushFrame(0);
    expect(fx.animating).toBe(true);
    FakeIO.last!.callback([{ isIntersecting: false }]);
    expect(fx.animating).toBe(false);
    const frames = inst.frames.length;
    flushFrame(16);
    expect(inst.frames).toHaveLength(frames);
    FakeIO.last!.callback([{ isIntersecting: true }]);
    expect(fx.animating).toBe(true);

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(fx.animating).toBe(false);
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(fx.animating).toBe(true);
    expect(fx.running).toBe(true);
    fx.destroy();
    expect(FakeIO.last!.disconnected).toBe(true);
  });

  it('keeps animating when hidden if pauseWhenHidden is false', () => {
    const b = fakeBackend('canvas');
    const fx = new GlitterFX(container, { effect: 'a', pauseWhenHidden: false, backends: [b.descriptor] });
    FakeIO.last!.callback([{ isIntersecting: false }]);
    expect(fx.animating).toBe(true);
    fx.destroy();
  });

  it('respects prefers-reduced-motion with still frames and instant transitions', async () => {
    media.matches = true;
    const b = fakeBackend('canvas');
    const fx = new GlitterFX(container, { effect: 'a', backends: [b.descriptor] });
    const inst = b.instances[0]!;
    expect(fx.animating).toBe(false);
    expect(inst.frames.length).toBeGreaterThan(0);
    const still = inst.frames.length;
    flushFrame(16);
    expect(inst.frames).toHaveLength(still);
    fx.update({ glow: 0.9 });
    expect(inst.frames).toHaveLength(still + 1);
    await expect(fx.transitionTo('b', { duration: 5000 })).resolves.toBe(true);
    expect(fx.config.effect).toBe('b');
    expect(b.instances.at(-1)!.frames.length).toBeGreaterThan(0);

    // The preference can change at runtime.
    media.matches = false;
    for (const l of media.listeners) l();
    expect(fx.animating).toBe(true);
    fx.destroy();
    expect(media.listeners.size).toBe(0);
  });

  it("'ignore' animates regardless and 'static' never animates", () => {
    media.matches = true;
    const b = fakeBackend('canvas');
    const a = new GlitterFX(container, { effect: 'a', reducedMotion: 'ignore', backends: [b.descriptor] });
    expect(a.animating).toBe(true);
    a.destroy();
    media.matches = false;
    const s = new GlitterFX(container, { effect: 'a', reducedMotion: 'static', backends: [b.descriptor] });
    expect(s.animating).toBe(false);
    s.destroy();
  });
});

describe('transition timing', () => {
  it('finishes on the real clock even when frames are slower than the simulation clamp', async () => {
    const b = fakeBackend('canvas');
    const fx = new GlitterFX(container, { effect: 'a', backends: [b.descriptor] });
    const done = fx.transitionTo('b', { duration: 1000 });
    flushFrame(0);
    flushFrame(600); // 600 ms frame: simulation clamps to 100 ms, the transition does not
    expect(fx.transitioning).toBe(true);
    flushFrame(1000);
    await expect(done).resolves.toBe(true);
    fx.destroy();
  });
});

describe('opacity', () => {
  const opacityOf = (inst: FakeInstance) => inst.element.style.opacity;

  it('applies to the surface, updates live and interpolates through transitions', async () => {
    const b = fakeBackend('canvas');
    const fx = new GlitterFX(container, { effect: 'a', opacity: 0.5, backends: [b.descriptor] });
    const first = b.instances[0]!;
    expect(opacityOf(first)).toBe('0.5');
    fx.update({ opacity: 1 });
    expect(opacityOf(first)).toBe('');
    fx.update({ opacity: 0.4 });

    // Crossfade: outgoing fades from its opacity, incoming towards its own.
    const done = fx.transitionTo({ effect: 'b', opacity: 0.8 }, { duration: 100 });
    const second = b.instances[1]!;
    flushFrame(0);
    flushFrame(50);
    expect(Number(opacityOf(first))).toBeCloseTo(0.2);
    expect(Number(opacityOf(second))).toBeCloseTo(0.4);
    flushFrame(100);
    await done;
    expect(opacityOf(second)).toBe('0.8');

    fx.cancelTransition();
    const reverted = fx.transitionTo({ opacity: 0.2 }, { duration: 100 });
    fx.cancelTransition();
    await reverted;
    expect(Number(opacityOf(b.instances.at(-2)!))).toBeCloseTo(0.8);
    fx.destroy();
  });

  it('interpolates on in-instance transitions and validates params', () => {
    const b = fakeBackend('canvas');
    const descriptor: BackendDescriptor = {
      ...b.descriptor,
      create(config) {
        const inst = b.descriptor.create(config);
        inst.beginTransition = () => true;
        inst.setTransition = () => {};
        inst.endTransition = () => {};
        return inst;
      },
    };
    const fx = new GlitterFX(container, { effect: 'a', opacity: 1, backends: [descriptor] });
    void fx.transitionTo({ params: { arms: 4 }, opacity: 0 }, { type: 'morph', duration: 100 });
    flushFrame(0);
    flushFrame(50);
    expect(Number(opacityOf(b.instances[0]!))).toBeCloseTo(0.5);
    flushFrame(100);
    expect(fx.config.params).toEqual({ arms: 4 });
    expect(() => fx.update({ params: { arms: Number.NaN } })).toThrow(/params.arms must be a finite number/);
    fx.destroy();
  });
});
