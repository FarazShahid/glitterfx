'use client';

import GlitterStage from './GlitterStage';
import type { EffectKind } from '../lib/glitterEngine';

interface Props {
  effect?: EffectKind;
  className?: string;
  density?: number;
  speed?: number;
  size?: number;
  brightness?: number;
  interactive?: boolean;
}

/**
 * Lightweight showcase surface backed by the real GlitterFX V2 Canvas renderer.
 * The large hero and playground use auto/WebGL-first; thumbnail-heavy grids stay on Canvas so the
 * page can show many live effects without exhausting browser WebGL contexts.
 */
export default function ParticleField({
  effect = 'star-field',
  className = '',
  density = 1,
  speed = 1,
  size = 1,
  brightness = 1,
  interactive = false,
}: Props) {
  return (
    <GlitterStage
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      effect={effect}
      density={density}
      speed={speed}
      size={size}
      brightness={brightness}
      renderer="canvas"
      quality="eco"
      interactive={interactive}
      pointer={interactive ? 'repel' : 'none'}
      glow={0.55}
      haze={0.15}
      transition="crossfade"
      transitionDuration={700}
    />
  );
}
