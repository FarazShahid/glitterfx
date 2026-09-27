// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import type { BackendDescriptor, BackendInstance, GlitterFX, GlitterFXConfig } from '@glitterfx/core';
import { diffOptions, GlitterFXBackground, type GlitterFXBackgroundProps } from './index.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface Fake extends BackendInstance {
  config: GlitterFXConfig;
  destroyed: boolean;
}
const created: Fake[] = [];
const backend: BackendDescriptor = {
  id: 'canvas',
  isSupported: () => true,
  create(config) {
    const inst: Fake = {
      config,
      destroyed: false,
      element: document.createElement('canvas'),
      resize() {},
      update(c) {
        inst.config = c;
      },
      frame() {},
      destroy() {
        inst.destroyed = true;
      },
    };
    created.push(inst);
    return inst;
  },
};
const backends = [backend];

let host: HTMLElement;
let root: Root;
beforeEach(() => {
  created.length = 0;
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

const render = (props: Partial<GlitterFXBackgroundProps>) =>
  act(() => root.render(createElement(GlitterFXBackground, { effect: 'star-field', backends, ...props })));

describe('GlitterFXBackground', () => {
  it('mounts behind children, updates on prop changes, destroys on unmount', () => {
    let ready: GlitterFX | null = null;
    render({ className: 'hero', children: createElement('h1', null, 'Hi'), onReady: (fx) => (ready = fx) });
    const el = host.querySelector('.hero')!;
    expect(el.querySelector('canvas')).not.toBeNull();
    expect(el.querySelector('h1')!.textContent).toBe('Hi');
    expect(ready!.config.effect).toBe('star-field');

    render({ className: 'hero', glow: 0.9 });
    expect(created).toHaveLength(1);
    expect(created[0]!.config.glow).toBe(0.9);

    // Same values again: no update call.
    const update = vi.spyOn(ready!, 'update');
    render({ className: 'hero', glow: 0.9 });
    expect(update).not.toHaveBeenCalled();

    act(() => root.unmount());
    expect(created[0]!.destroyed).toBe(true);
    root = createRoot(host);
  });

  it('switches effects immediately, or transitions when `transition` is set', () => {
    let fx: GlitterFX | null = null;
    render({ onReady: (i) => (fx = i) });
    render({ effect: 'galaxy' });
    expect(fx!.config.effect).toBe('galaxy');
    expect(created).toHaveLength(2);

    const transitionTo = vi.spyOn(fx!, 'transitionTo');
    render({ effect: 'supernova', transition: { type: 'morph', duration: 500 } });
    expect(transitionTo).toHaveBeenCalledWith({ effect: 'supernova' }, { type: 'morph', duration: 500 });
  });

  it('survives StrictMode double effects and reports construction errors', () => {
    act(() => root.render(createElement(StrictMode, null, createElement(GlitterFXBackground, { effect: 'star-field', backends }))));
    expect(created.filter((c) => !c.destroyed)).toHaveLength(1);
    const onError = vi.fn();
    render({ backends: [], onError });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/no supported renderer/) }));
  });

  it('renders on the server without touching the DOM', () => {
    const html = renderToString(createElement(GlitterFXBackground, { effect: 'star-field', className: 'hero' }, 'content'));
    expect(html).toBe('<div class="hero">content</div>');
  });

  it('diffs arrays by value and treats removed keys as reset', () => {
    expect(diffOptions({ effect: 'a', renderer: ['webgl', 'canvas'] }, { effect: 'a', renderer: ['webgl', 'canvas'] })).toBeNull();
    expect(diffOptions({ effect: 'a', glow: 1 }, { effect: 'a' })).toEqual({ glow: undefined });
    // A fresh params object with the same values each render is not a change.
    expect(diffOptions({ effect: 'a', params: { arms: 4 } }, { effect: 'a', params: { arms: 4 } })).toBeNull();
    expect(diffOptions({ effect: 'a', params: { arms: 4 } }, { effect: 'a', params: { arms: 5 } })).toEqual({ params: { arms: 5 } });
  });
});
