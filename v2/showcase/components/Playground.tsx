'use client';

import { useState } from 'react';
import GlitterStage from './GlitterStage';
import Slider from './ui/Slider';
import Segmented from './ui/Segmented';
import type { EffectKind, PointerKind, QualityKind, RendererKind, TransitionKind } from '../lib/glitterEngine';

const effects: { id: EffectKind; label: string }[] = [
  { id: 'star-field', label: 'star-field' },
  { id: 'galaxy', label: 'galaxy' },
  { id: 'glitter-shimmer', label: 'glitter-shimmer' },
  { id: 'warp-speed', label: 'warp-speed' },
  { id: 'aurora-veil', label: 'aurora-veil' },
  { id: 'ember-storm', label: 'ember-storm' },
  { id: 'meteor-shower', label: 'meteor-shower' },
  { id: 'bioluminescent-ocean', label: 'bioluminescent-ocean' },
  { id: 'snow-storm', label: 'snow-storm' },
  { id: 'supernova', label: 'supernova' },
  { id: 'plasma-storm', label: 'plasma-storm' },
  { id: 'cosmic-dust', label: 'cosmic-dust' },
  { id: 'confetti-drop', label: 'confetti-drop' },
];

const DEFAULTS = {
  effect: 'star-field' as EffectKind,
  renderer: 'auto' as RendererKind,
  quality: 'balanced' as QualityKind,
  pointer: 'repel' as PointerKind,
  transition: 'morph' as TransitionKind,
  density: 1,
  speed: 1,
  size: 1,
  brightness: 1,
  glow: 0.55,
  haze: 0.18,
};

export default function Playground() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resolvedRenderer, setResolvedRenderer] = useState<'canvas' | 'webgl' | null>(null);

  const set = <K extends keyof typeof DEFAULTS>(key: K, value: (typeof DEFAULTS)[K]) =>
    setCfg((c) => ({ ...c, [key]: value }));

  const config = `const preview = document.querySelector('#preview');
new GlitterFX(preview, {
  effect: '${cfg.effect}',
  renderer: ${cfg.renderer === 'auto' ? "['webgl', 'canvas']" : `'${cfg.renderer}'`},
  quality: '${cfg.quality}',
  interaction: { pointer: '${cfg.pointer}', radius: 180, strength: 0.9 },
  density: ${cfg.density},
  speed: ${cfg.speed},
  size: ${cfg.size},
  brightness: ${cfg.brightness},
  glow: ${cfg.glow},
  haze: ${cfg.haze}
});`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(config);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const rendererBadge = cfg.renderer === 'auto'
    ? resolvedRenderer ? `${resolvedRenderer.toUpperCase()} (AUTO)` : 'AUTO · WEBGL → CANVAS'
    : cfg.renderer.toUpperCase();

  return (
    <section id="playground" className="relative scroll-mt-24 border-t border-white/5 bg-[#05060f] py-24">
      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Live playground
            </div>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              Build the atmosphere live.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">
              Every effect is configurable at runtime. Switch renderers, tune density, pointer behavior, glow and transition
              between visual environments without rebuilding the page.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur-md lg:self-auto">
            <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
            Powered by GlitterFX V2
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="relative h-[440px] overflow-hidden rounded-3xl border border-white/10 bg-[#070a16] shadow-[0_40px_120px_-40px_rgba(56,189,248,0.5)] lg:h-[660px]">
            <GlitterStage
              className="pointer-events-none absolute inset-0 h-full w-full"
              effect={cfg.effect}
              density={cfg.density}
              speed={cfg.speed}
              size={cfg.size}
              brightness={cfg.brightness}
              glow={cfg.glow}
              haze={cfg.haze}
              renderer={cfg.renderer}
              quality={cfg.quality}
              pointer={cfg.pointer}
              pointerRadius={180}
              pointerStrength={0.9}
              transition={cfg.transition}
              paused={paused}
              onRendererChange={setResolvedRenderer}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_10%,rgba(56,189,248,0.12),transparent_70%)]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060f] via-transparent to-transparent" />

            <div className="absolute left-6 top-6 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-cyan-200 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                GlitterFX V2
              </span>
              <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-slate-300 backdrop-blur-md">
                {rendererBadge}
              </span>
              {paused ? (
                <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-amber-200 backdrop-blur-md">
                  Paused
                </span>
              ) : null}
            </div>

            <div className="pointer-events-none absolute inset-x-6 bottom-6">
              <h3 className="font-[family-name:var(--font-space)] text-2xl font-semibold text-white sm:text-3xl">
                {cfg.effect.replace(/-/g, ' ')}
              </h3>
              <p className="mt-2 font-mono text-xs text-slate-400">
                renderer: {rendererBadge.toLowerCase()} · {cfg.quality} · speed {cfg.speed.toFixed(1)}x · density {cfg.density.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <i className="ri-magic-line text-cyan-300" />
                Effect
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {effects.map((e) => {
                  const isActive = e.id === cfg.effect;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => set('effect', e.id)}
                      className={`cursor-pointer truncate rounded-xl border px-3 py-2 text-left font-mono text-[12px] transition-colors ${
                        isActive
                          ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-200'
                          : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      {e.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-md">
              <Segmented
                label="Renderer"
                value={cfg.renderer}
                onChange={(v) => set('renderer', v as RendererKind)}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'canvas', label: 'Canvas' },
                  { value: 'webgl', label: 'WebGL' },
                ]}
              />
              <div className="mt-5">
                <Segmented
                  label="Quality"
                  value={cfg.quality}
                  onChange={(v) => set('quality', v as QualityKind)}
                  options={[
                    { value: 'eco', label: 'Eco' },
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'high', label: 'High' },
                  ]}
                />
              </div>
              <div className="mt-5">
                <Segmented
                  label="Pointer interaction"
                  value={cfg.pointer}
                  onChange={(v) => set('pointer', v as PointerKind)}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'repel', label: 'Repel' },
                    { value: 'attract', label: 'Attract' },
                    { value: 'vortex', label: 'Vortex' },
                  ]}
                />
              </div>
              <div className="mt-5">
                <Segmented
                  label="Effect transition"
                  value={cfg.transition}
                  onChange={(v) => set('transition', v as TransitionKind)}
                  options={[
                    { value: 'morph', label: 'Morph' },
                    { value: 'crossfade', label: 'Crossfade' },
                    { value: 'dissolve', label: 'Dissolve' },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-md">
              <Slider label="Density" value={cfg.density} min={0.4} max={1.8} step={0.1} onChange={(v) => set('density', v)} />
              <Slider label="Speed" value={cfg.speed} min={0.2} max={2} step={0.1} suffix="x" onChange={(v) => set('speed', v)} />
              <Slider label="Size" value={cfg.size} min={0.7} max={1.6} step={0.1} onChange={(v) => set('size', v)} />
              <Slider label="Brightness" value={cfg.brightness} min={0.5} max={1.4} step={0.1} onChange={(v) => set('brightness', v)} />
              <Slider label="Glow" value={cfg.glow} min={0} max={1} step={0.05} onChange={(v) => set('glow', v)} />
              <Slider label="Haze" value={cfg.haze} min={0} max={1} step={0.05} onChange={(v) => set('haze', v)} />

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <i className={paused ? 'ri-play-line text-base' : 'ri-pause-line text-base'} />
                  {paused ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCfg(DEFAULTS);
                    setPaused(false);
                  }}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <i className="ri-refresh-line text-base" />
                  Reset
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#070a16]/90">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
                <span className="font-mono text-[11px] text-slate-500">config</span>
                <button
                  type="button"
                  onClick={copy}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-slate-300 transition-colors hover:border-cyan-300/40 hover:text-cyan-200"
                >
                  <i className={copied ? 'ri-check-line text-[13px] text-emerald-300' : 'ri-file-copy-line text-[13px]'} />
                  {copied ? 'Copied' : 'Copy config'}
                </button>
              </div>
              <pre className="overflow-x-auto px-4 py-3.5">
                <code className="font-mono text-[11.5px] leading-relaxed text-slate-300">{config}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}