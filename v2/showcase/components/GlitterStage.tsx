'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGlitterFX, type GlitterFXRuntime } from '../lib/loadGlitterFX';
import type {
  EffectKind,
  PointerKind,
  QualityKind,
  RendererKind,
  TransitionKind,
} from '../lib/glitterEngine';

interface Props {
  effect?: EffectKind;
  className?: string;
  density?: number;
  speed?: number;
  size?: number;
  brightness?: number;
  glow?: number;
  haze?: number;
  opacity?: number;
  palette?: string;
  interactive?: boolean;
  pointer?: PointerKind;
  pointerRadius?: number;
  pointerStrength?: number;
  renderer?: RendererKind;
  quality?: QualityKind;
  transition?: TransitionKind;
  transitionDuration?: number;
  paused?: boolean;
  motion?: { x?: number; y?: number; z?: number; reverse?: boolean };
  params?: Record<string, number>;
  showErrors?: boolean;
  onRendererChange?: (renderer: 'canvas' | 'webgl' | null) => void;
}

export default function GlitterStage({
  effect = 'star-field',
  className = '',
  density = 1,
  speed = 1,
  size = 1,
  brightness = 1,
  glow = 0.5,
  haze = 0,
  opacity = 1,
  palette,
  interactive = true,
  pointer = 'none',
  pointerRadius = 160,
  pointerStrength = 0.8,
  renderer = 'auto',
  quality = 'balanced',
  transition = 'morph',
  transitionDuration = 1200,
  paused = false,
  motion,
  params,
  showErrors = false,
  onRendererChange,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<GlitterFXRuntime | null>(null);
  const defaultsRef = useRef<Map<string, string>>(new Map());
  const effectRef = useRef<EffectKind>(effect);
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading');

  useEffect(() => {
    let disposed = false;
    const host = hostRef.current;
    if (!host) return;

    setStatus('loading');

    loadGlitterFX().then((pkg) => {
      if (disposed || !pkg) {
        if (!disposed) setStatus('error');
        return;
      }

      try {
        defaultsRef.current = new Map(
          (pkg.effects ?? []).map((item) => [item.id, item.defaultPalette]),
        );

        const instance = new pkg.GlitterFX(host, {
          effect,
          renderer: renderer === 'auto' ? ['webgl', 'canvas'] : renderer,
          quality,
          density,
          speed,
          size,
          brightness,
          glow,
          haze,
          opacity,
          ...(palette ? { palette } : {}),
          ...(params ? { params } : {}),
          ...(motion ? { motion } : {}),
          interaction: {
            pointer: interactive ? pointer : 'none',
            radius: pointerRadius,
            strength: pointerStrength,
          },
          pauseWhenHidden: true,
          reducedMotion: 'auto',
        });

        instanceRef.current = instance;
        effectRef.current = effect;

        if (paused) instance.stop?.();
        onRendererChange?.(instance.renderer ?? null);
        setStatus('live');
      } catch (error) {
        console.error('Unable to create GlitterFX V2 instance.', error);
        setStatus('error');
      }
    });

    return () => {
      disposed = true;
      try {
        instanceRef.current?.destroy?.();
      } catch {
        // no-op
      }
      instanceRef.current = null;
      onRendererChange?.(null);
    };
  }, [renderer]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;

    const visual = {
      quality,
      density,
      speed,
      size,
      brightness,
      glow,
      haze,
      opacity,
      ...(palette ? { palette } : {}),
      ...(params ? { params } : {}),
      ...(motion ? { motion } : {}),
      interaction: {
        pointer: interactive ? pointer : 'none',
        radius: pointerRadius,
        strength: pointerStrength,
      },
    };

    try {
      if (effectRef.current !== effect && instance.transitionTo) {
        effectRef.current = effect;
        const nextPalette = palette ?? defaultsRef.current.get(effect);
        void instance
          .transitionTo(
            { effect, ...visual, ...(nextPalette ? { palette: nextPalette } : {}) },
            { type: transition, duration: transitionDuration },
          )
          .catch((error) => console.error('GlitterFX transition failed.', error));
      } else {
        instance.update?.(visual);
      }
    } catch (error) {
      console.error('GlitterFX live update failed.', error);
    }
  }, [
    effect,
    quality,
    density,
    speed,
    size,
    brightness,
    glow,
    haze,
    opacity,
    palette,
    interactive,
    pointer,
    pointerRadius,
    pointerStrength,
    transition,
    transitionDuration,
    motion,
    params,
  ]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;

    try {
      if (paused) instance.stop?.();
      else instance.start?.();
    } catch {
      // no-op
    }
  }, [paused]);

  return (
    <div className={className}>
      <div ref={hostRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />

      {status !== 'live' ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(91,124,255,0.13),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.10),transparent_32%)]"
        />
      ) : null}

      {status === 'error' && showErrors ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-8">
          <div className="max-w-md rounded-2xl border border-red-300/20 bg-black/70 px-5 py-4 text-center backdrop-blur-md">
            <div className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-red-200">
              GlitterFX V2 failed to initialize
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              The published CDN module could not start in this browser. Reload once, then check
              browser content blockers or try the Canvas renderer.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
