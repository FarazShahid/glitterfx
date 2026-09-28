export const V2_BUNDLE =
  'https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/cdn/glitterfx.js';
export const V1_BUNDLE =
  'https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/legacy/glitterfx.v1.js';
export const THREE_R128 =
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

export interface GlitterFXRuntime {
  renderer?: 'canvas' | 'webgl';
  update?: (changes: Record<string, unknown>) => void;
  transitionTo?: (
    target: string | Record<string, unknown>,
    options?: { type?: 'crossfade' | 'morph' | 'dissolve'; duration?: number },
  ) => Promise<boolean>;
  start?: () => void;
  stop?: () => void;
  destroy?: () => void;
}

export interface GlitterFXModule {
  GlitterFX: new (container: HTMLElement, options: Record<string, unknown>) => GlitterFXRuntime;
  effects?: readonly {
    id: string;
    renderers: readonly ('canvas' | 'webgl')[];
    defaultPalette: string;
    params: Readonly<Record<string, unknown>>;
  }[];
  palettes?: Readonly<Record<string, unknown>>;
}

let pending: Promise<GlitterFXModule | null> | null = null;

/**
 * Load the published V2 browser module directly from jsDelivr.
 *
 * webpackIgnore keeps the URL as a native browser ESM import. Do not replace this with
 * eval/new Function: browser CSPs and security products can legitimately block eval-like code.
 */
export function loadGlitterFX(): Promise<GlitterFXModule | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (pending) return pending;

  pending = (async () => {
    try {
      const mod = (await import(/* webpackIgnore: true */ V2_BUNDLE)) as GlitterFXModule;
      if (typeof mod?.GlitterFX !== 'function') {
        console.error('GlitterFX V2 CDN module loaded without a GlitterFX export.');
        return null;
      }
      return mod;
    } catch (error) {
      console.error('Unable to load GlitterFX V2 CDN bundle.', error);
      return null;
    }
  })();

  return pending;
}

function loadClassicScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[data-glitterfx-script="${id}"]`,
    ) as HTMLScriptElement | null;

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.glitterfxScript = id;
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve();
      },
      { once: true },
    );
    script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
      once: true,
    });
    document.head.appendChild(script);
  });
}

export async function loadGlitterFXV1(): Promise<
  (new (container: HTMLElement, options: Record<string, unknown>) => GlitterFXRuntime) | null
> {
  if (typeof window === 'undefined') return null;

  const w = window as typeof window & {
    GlitterFX?: new (container: HTMLElement, options: Record<string, unknown>) => GlitterFXRuntime;
  };

  if (w.GlitterFX) return w.GlitterFX;

  try {
    await loadClassicScript(THREE_R128, 'three-r128');
    await loadClassicScript(V1_BUNDLE, 'v1-runtime');
    return w.GlitterFX ?? null;
  } catch (error) {
    console.error('Unable to load GlitterFX V1 legacy runtime.', error);
    return null;
  }
}
