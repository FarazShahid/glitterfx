'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGlitterFXV1, type GlitterFXRuntime } from '../lib/loadGlitterFX';

export default function LegacyV1Stage() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading');

  useEffect(() => {
    let disposed = false;
    let instance: GlitterFXRuntime | null = null;
    const host = ref.current;
    if (!host) return;

    loadGlitterFXV1().then((Ctor) => {
      if (disposed || !Ctor) {
        if (!disposed) setStatus('error');
        return;
      }
      try {
        instance = new Ctor(host, {
          effect: 'star-field',
          density: 0.7,
          speed: 0.7,
          brightness: 0.9,
          palette: 'starlight',
        });
        setStatus('live');
      } catch (error) {
        console.error('Unable to start GlitterFX V1 legacy demo.', error);
        setStatus('error');
      }
    });

    return () => {
      disposed = true;
      try {
        instance?.destroy?.();
      } catch {
        // no-op
      }
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <div ref={ref} className="absolute inset-0" aria-hidden="true" />
      {status === 'loading' ? (
        <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-slate-500">
          Loading exact V1 runtime…
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-slate-500">
          The legacy runtime could not be loaded. V2 remains available above.
        </div>
      ) : null}
    </div>
  );
}
