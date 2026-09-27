/** Canonical GlitterFX V2 effect ids used by the showcase. */
export type EffectKind =
  | 'glitter-shimmer'
  | 'star-field'
  | 'galaxy'
  | 'supernova'
  | 'cosmic-dust'
  | 'warp-speed'
  | 'accretion-disk'
  | 'planetary-rings'
  | 'curl-flow'
  | 'plasma-storm'
  | 'ray-burst'
  | 'bending-chaos'
  | 'wave-particles'
  | 'dancing-waves'
  | 'quantum-field'
  | 'heartbeat-pulse'
  | 'spiral-drift'
  | 'cherry-blossom'
  | 'firefly-meadow'
  | 'snow-storm'
  | 'bubble-rise'
  | 'falling-leaves'
  | 'underwater'
  | 'sand-storm'
  | 'pollen-drift'
  | 'falling-ash'
  | 'dust-motes'
  | 'dandelion-seeds'
  | 'bioluminescent-ocean'
  | 'ember-storm'
  | 'lava-eruption'
  | 'emerald-shimmer'
  | 'confetti-drop'
  | 'meteor-shower'
  | 'petal-burst'
  | 'rising-lanterns'
  | 'aurora-veil';

export type RendererKind = 'auto' | 'canvas' | 'webgl';
export type QualityKind = 'eco' | 'balanced' | 'high';
export type PointerKind = 'none' | 'repel' | 'attract' | 'vortex';
export type TransitionKind = 'crossfade' | 'morph' | 'dissolve';

export const FEATURED_EFFECTS: { id: EffectKind; label: string; category: string }[] = [
  { id: 'star-field', label: 'Star Field', category: 'Cosmic' },
  { id: 'galaxy', label: 'Galaxy', category: 'Cosmic' },
  { id: 'glitter-shimmer', label: 'Glitter Shimmer', category: 'Decorative' },
  { id: 'warp-speed', label: 'Warp Speed', category: 'Cosmic' },
  { id: 'aurora-veil', label: 'Aurora Veil', category: 'Atmospheric' },
  { id: 'bioluminescent-ocean', label: 'Bioluminescent Ocean', category: 'Nature' },
  { id: 'meteor-shower', label: 'Meteor Shower', category: 'Cosmic' },
  { id: 'ember-storm', label: 'Ember Storm', category: 'Fire' },
  { id: 'supernova', label: 'Supernova', category: 'Cosmic' },
  { id: 'quantum-field', label: 'Quantum Field', category: 'Energy' },
  { id: 'plasma-storm', label: 'Plasma Storm', category: 'Energy' },
  { id: 'cosmic-dust', label: 'Cosmic Dust', category: 'Atmospheric' },
  { id: 'confetti-drop', label: 'Confetti Drop', category: 'Celebration' },
  { id: 'snow-storm', label: 'Snow Storm', category: 'Nature' },
  { id: 'falling-leaves', label: 'Falling Leaves', category: 'Nature' },
  { id: 'cherry-blossom', label: 'Cherry Blossom', category: 'Nature' },
];
