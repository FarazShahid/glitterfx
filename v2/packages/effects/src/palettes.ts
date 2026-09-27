/** Linear 0..1 sRGB triplet. */
export type RGB = readonly [number, number, number];

export interface Palette {
  readonly colors: readonly RGB[];
  /** Relative frequency of each color. */
  readonly weights: readonly number[];
}

const hex = (value: string): RGB => {
  const n = Number.parseInt(value.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const palette = (entries: readonly (readonly [string, number])[]): Palette => ({
  colors: entries.map(([c]) => hex(c)),
  weights: entries.map(([, w]) => w),
});

export const palettes = {
  starlight: palette([['#ffffff', 30], ['#d6e4ff', 28], ['#a9c4ff', 18], ['#ffe6c2', 14], ['#ffc48f', 10]]),
  aurora: palette([['#e9fffb', 26], ['#8ff7e0', 26], ['#7cc8ff', 22], ['#c3a4ff', 18], ['#ff9ed8', 8]]),
  ember: palette([['#fff3e0', 24], ['#ffd29a', 28], ['#ffab66', 24], ['#ff7a45', 16], ['#ff4f3a', 8]]),
  /** Ordered core -> rim for galaxy-like effects. */
  galaxy: palette([['#fff1d6', 20], ['#ffd9a8', 16], ['#fff8f0', 20], ['#b9d3ff', 26], ['#7fa6ff', 12], ['#ff9fd0', 6]]),
  /** Ordered hot -> cool for burst effects. */
  nova: palette([['#ffffff', 20], ['#cfe3ff', 20], ['#ffe2a0', 20], ['#ff9a4d', 20], ['#e8453c', 12], ['#8a3cff', 8]]),
  // V1 catalog palettes (colors and weights carried over).
  'emerald-gold': palette([['#f5d76e', 32], ['#e8c547', 22], ['#fff4b8', 10], ['#b8d96a', 12], ['#6dd5b3', 8], ['#4ec9d6', 6], ['#9ed4e8', 4], ['#d4a847', 6]]),
  'cobalt-cyan': palette([['#1e3aff', 28], ['#3b6dff', 24], ['#3affff', 20], ['#7ce8ff', 14], ['#0a1e80', 8], ['#a4faff', 6]]),
  magma: palette([['#ffffff', 10], ['#ffce5c', 18], ['#ffa050', 8], ['#ff7a3a', 26], ['#ff3a1d', 28], ['#8a1a05', 10]]),
  confetti: palette([['#ffd84a', 30], ['#ff5e3a', 18], ['#ffffff', 20], ['#ffb14a', 15], ['#e8e2c8', 12], ['#3a90ff', 5]]),
  'mono-white': palette([['#ffffff', 60], ['#f0f0f0', 30], ['#cfd8dc', 10]]),
  sakura: palette([['#ffb3d1', 30], ['#ff7eb6', 22], ['#ffd9e8', 18], ['#ff5e9c', 14], ['#ffe4ee', 10], ['#c8729e', 6]]),
  firefly: palette([['#d4ff5a', 36], ['#a8d860', 26], ['#fff89e', 18], ['#7ad44a', 12], ['#cce86a', 8]]),
  cosmic: palette([['#7a8aff', 30], ['#b89fff', 22], ['#fff4d6', 16], ['#5fa9ff', 14], ['#3a5cff', 10], ['#ffc8e8', 8]]),
  plasma: palette([['#9a4dff', 26], ['#3affff', 22], ['#ff4dde', 18], ['#ff8a3a', 14], ['#ffffff', 12], ['#5a3aff', 8]]),
  aqua: palette([['#3aa8d4', 32], ['#7fd8e8', 26], ['#a4faff', 20], ['#1c6a8a', 12], ['#dff5ff', 10]]),
  autumn: palette([['#d4762a', 28], ['#b04030', 22], ['#e8a04a', 18], ['#8a2818', 14], ['#f0c878', 10], ['#642010', 8]]),
  desert: palette([['#c8985a', 30], ['#a0703a', 24], ['#e8c890', 18], ['#704818', 12], ['#d8a868', 10], ['#fff0c4', 6]]),
  love: palette([['#ff3a6a', 32], ['#ff8aac', 22], ['#ff5e8a', 20], ['#ffffff', 16], ['#c8204a', 10]]),
  /** V1 aurora colors ordered green (low) -> violet (high) for banded curtains. */
  borealis: palette([['#1bff97', 10], ['#5cffb3', 26], ['#7affde', 22], ['#3aaeff', 20], ['#a64dff', 14], ['#d4a8ff', 8]]),
  quantum: palette([['#3affc4', 30], ['#5cffec', 26], ['#a4ffd8', 20], ['#1cb098', 14], ['#dffff5', 10]]),
  frost: palette([['#ffffff', 34], ['#e2f1ff', 30], ['#b8dcff', 22], ['#8fb8ff', 14]]),
} as const satisfies Record<string, Palette>;

export type PaletteName = keyof typeof palettes;

export function resolvePalette(name: string | undefined, fallback: string): Palette {
  const key = name ?? fallback;
  if (!Object.hasOwn(palettes, key)) {
    throw new TypeError(`GlitterFX: unknown palette "${key}". Expected one of: ${Object.keys(palettes).join(', ')}.`);
  }
  return palettes[key as PaletteName];
}
