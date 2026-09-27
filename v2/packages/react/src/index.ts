/**
 * <GlitterFXBackground>: mounts a GlitterFX instance behind its children.
 * Creates on mount, destroys on unmount, applies option changes with `update()` (or
 * `transitionTo()` for effect changes when `transition` is set). Renders a plain element on the
 * server; the effect starts after hydration. Register backends (or pass `backends`) as usual.
 */
import {
  GlitterFX,
  type BackendDescriptor,
  type GlitterFXOptions,
  type GlitterFXUpdate,
  type TransitionOptions,
} from '@glitterfx/core';
import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

export interface GlitterFXBackgroundProps extends GlitterFXOptions {
  /** Element to render. Default 'div'. */
  as?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Animate effect changes with this transition instead of switching immediately. */
  transition?: TransitionOptions;
  onReady?: (fx: GlitterFX) => void;
  onError?: (error: Error) => void;
}

type VisualOptions = GlitterFXUpdate & { effect: string };

const isPlain = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Arrays (renderer lists) and plain objects (params) compare by value, one level deep. */
function same(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => v === b[i]);
  if (isPlain(a) && isPlain(b)) {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
  }
  return a === b;
}

/** Changed keys between two option objects (removed keys map to undefined = default). */
export function diffOptions(prev: VisualOptions, next: VisualOptions): GlitterFXUpdate | null {
  const changes: Record<string, unknown> = {};
  let changed = false;
  for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    const a = (prev as Record<string, unknown>)[key];
    const b = (next as Record<string, unknown>)[key];
    if (!same(a, b)) {
      changes[key] = b;
      changed = true;
    }
  }
  return changed ? (changes as GlitterFXUpdate) : null;
}

const backendKey = (backends: readonly BackendDescriptor[] | undefined): string =>
  backends ? backends.map((b) => b.id).join(',') : '';

export function GlitterFXBackground(props: GlitterFXBackgroundProps) {
  const { as = 'div', className, style, children, transition, onReady, onError, backends, pauseWhenHidden, reducedMotion, ...options } = props;
  const ref = useRef<HTMLElement | null>(null);
  const fx = useRef<GlitterFX | null>(null);
  const applied = useRef<VisualOptions>(options);
  // Latest values for effects that must not re-run on every render.
  const latest = useRef({ options, backends, onReady, onError });
  latest.current = { options, backends, onReady, onError };

  // Create once per runtime configuration; visual options flow through update().
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { options: current, backends: list, onReady: ready, onError: fail } = latest.current;
    let instance: GlitterFX;
    try {
      instance = new GlitterFX(el, { ...current, ...(list ? { backends: list } : {}), ...(pauseWhenHidden !== undefined ? { pauseWhenHidden } : {}), ...(reducedMotion ? { reducedMotion } : {}) });
    } catch (error) {
      fail?.(error as Error);
      return;
    }
    fx.current = instance;
    applied.current = current;
    ready?.(instance);
    return () => {
      instance.destroy();
      fx.current = null;
    };
  }, [backendKey(backends), pauseWhenHidden, reducedMotion]);

  // Apply visual option changes after each render (shallow diff, so unchanged props cost nothing).
  useEffect(() => {
    const instance = fx.current;
    if (!instance) return;
    const changes = diffOptions(applied.current, options);
    if (!changes) return;
    applied.current = options;
    try {
      if (transition && changes.effect !== undefined) {
        void instance.transitionTo(changes, transition);
      } else {
        instance.update(changes);
      }
    } catch (error) {
      latest.current.onError?.(error as Error);
    }
  });

  return createElement(as, { ref, className, style }, children);
}
