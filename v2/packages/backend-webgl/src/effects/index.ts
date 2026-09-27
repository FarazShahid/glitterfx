import type { ParticleEffect } from '@glitterfx/effects';
import { archetypeGlsl } from '../archetypes.js';
import { EMBER_STORM_GLSL } from './ember-storm.js';
import { GALAXY_GLSL } from './galaxy.js';
import { STAR_FIELD_GLSL } from './star-field.js';
import { SUPERNOVA_GLSL } from './supernova.js';

/** Hand-written GLSL `sampleParticle` implementations, by effect id. */
export const EFFECT_GLSL: Readonly<Record<string, string>> = {
  'star-field': STAR_FIELD_GLSL,
  galaxy: GALAXY_GLSL,
  supernova: SUPERNOVA_GLSL,
  'ember-storm': EMBER_STORM_GLSL,
};

/** GLSL for any effect: hand-written, or generated from its archetype. */
export function glslFor(effect: ParticleEffect): { glsl: string; defines: string } | null {
  const hand = EFFECT_GLSL[effect.id];
  return hand ? { glsl: hand, defines: '' } : archetypeGlsl(effect);
}
