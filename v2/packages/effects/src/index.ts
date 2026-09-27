import type { RendererId } from '@glitterfx/core';
import type { EffectParam, ParticleEffect } from './engine/effect.js';
import { catalog, V1_ALIASES } from './catalog.js';
import { pack } from './pack.js';
import { curlFlow } from './curl-flow.js';
import { emberStorm } from './ember-storm.js';
import { galaxy } from './galaxy.js';
import { glitterShimmer } from './glitter-shimmer.js';
import { supernova } from './supernova.js';
import { starField } from './star-field.js';

export { createRandom } from './random.js';
export { palettes, resolvePalette, type Palette, type PaletteName, type RGB } from './palettes.js';
export * from './engine/behaviors.js';
export * from './engine/emitters.js';
export { applyMotion, applyPointer, MOTION_MARGIN, POINTER_REACH, Z_NEAR } from './engine/interaction.js';
export { haloScale, hazeFalloff, particleProfile, softness } from './engine/appearance.js';
export { createParticleStore, particleCounts, type Budget, type ParticleStore } from './engine/store.js';
export { MAX_HAZE_BLOBS, emptySample, generateParticles, needsRegenerate, resolveParams, type EffectParam, type ParamValues, type HazeBlob, type ParticleEffect, type ParticleSample, type View } from './engine/effect.js';
export { STAR_DRIFT, STAR_EDGE_MARGIN, starField } from './star-field.js';
export { ARM, BULGE, DISK, GALAXY, GALAXY_FULL_EXPOSURE, GLOW, KNOT, galaxy } from './galaxy.js';
export { GLITTER, glitterShimmer } from './glitter-shimmer.js';
export { SUPERNOVA, supernova } from './supernova.js';
export { emberStorm } from './ember-storm.js';
export { CURL_FLOW, curlFlow } from './curl-flow.js';
export { catalog, V1_ALIASES } from './catalog.js';
export { pack } from './pack.js';
export { createDriftEffect, gustProfile, type DriftParams } from './archetypes/drift.js';
export { createRadialEffect, radialCurve, type RadialCurve, type RadialParams } from './archetypes/radial.js';
export { createWaveEffect, type WaveParams } from './archetypes/wave.js';
export { createFountainEffect, type FountainParams } from './archetypes/fountain.js';
export { createQuantumEffect, type QuantumParams } from './archetypes/quantum.js';
export { createCurlEffect, type CurlParams } from './archetypes/curl.js';
export { WRAP_MARGIN, budgetFrom, pickWeighted, type ArchetypeBase, type HazeSpec } from './archetypes/common.js';

/** Every V2 particle effect, by its own id. */
const ownEffects: Readonly<Record<string, ParticleEffect<never>>> = {
  [glitterShimmer.id]: glitterShimmer as ParticleEffect<never>,
  [starField.id]: starField as ParticleEffect<never>,
  [galaxy.id]: galaxy as ParticleEffect<never>,
  [supernova.id]: supernova as ParticleEffect<never>,
  [emberStorm.id]: emberStorm as ParticleEffect<never>,
  [curlFlow.id]: curlFlow as ParticleEffect<never>,
  ...Object.fromEntries(catalog.map((e) => [e.id, e as ParticleEffect<never>])),
  ...Object.fromEntries(pack.map((e) => [e.id, e as ParticleEffect<never>])),
};

/** Lookup by id, accepting V1 names that were renamed in V2. */
export const particleEffects: Readonly<Record<string, ParticleEffect<never>>> = {
  ...ownEffects,
  ...Object.fromEntries(Object.entries(V1_ALIASES).map(([v1, v2]) => [v1, ownEffects[v2]!])),
};

/** Backend-independent identity of an effect and the renderers that implement it. */
export interface EffectDefinition {
  readonly id: string;
  readonly renderers: readonly RendererId[];
  readonly defaultPalette: string;
  /** Effect-specific settings accepted in `params`. */
  readonly params: Readonly<Record<string, EffectParam>>;
}

export const effects: readonly EffectDefinition[] = Object.values(ownEffects).map((e) => ({
  id: e.id,
  renderers: ['canvas', 'webgl'] as const,
  defaultPalette: e.defaultPalette,
  params: e.params ?? {},
}));
