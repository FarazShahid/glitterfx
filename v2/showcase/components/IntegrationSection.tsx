'use client';

import { useState } from 'react';
import SectionHeading from './SectionHeading';
import CodeBlock from './CodeBlock';

const tabs = [
  {id:'v2',label:'V2 default',file:'glitterfx.v2.js',note:'Recommended. Full bundle with the WebGL renderer plus canvas fallback.',code:`import { GlitterFX } from 'https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/cdn/glitterfx.js';

const hero = document.querySelector('#hero');
const fx = new GlitterFX(hero, {
  effect: 'star-field',
  renderer: ['webgl', 'canvas']
});`},
  {id:'npm',label:'npm / ESM',file:'hero.js',note:'Install from npm and import the ESM package in your bundler. TypeScript declarations are included.',code:`npm install glitterfx@next

import { GlitterFX } from 'glitterfx';

const hero = document.querySelector('#hero');
const fx = new GlitterFX(hero, {
  effect: 'star-field',
  renderer: ['webgl', 'canvas']
});`},
  {id:'canvas',label:'V2 canvas-only',file:'glitterfx.canvas.js',note:'Lighter build for surfaces that only need the 2D canvas renderer.',code:`import { GlitterFX } from 'https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/cdn/glitterfx.canvas.js';

const hero = document.querySelector('#hero');
new GlitterFX(hero, { effect: 'galaxy', renderer: 'canvas' });`},
  {id:'adapter',label:'Legacy adapter',file:'glitterfx.legacy.js',note:'Migrate V1-style call sites to the V2 engine with minimal changes.',code:`import { GlitterFX } from 'https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/cdn/glitterfx.legacy.js';

const hero = document.querySelector('#hero');
new GlitterFX(hero, { effect: 'star-field' });`},
  {id:'v1',label:'Exact V1',file:'glitterfx.v1.html',note:'The original runtime, kept for historical parity. Available on demand only.',code:`<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/legacy/glitterfx.v1.js"></script>

<script>
  const hero = document.querySelector('#hero');
  new GlitterFX(hero, { effect: 'star-field' });
</script>`},
];
const usage=`new GlitterFX(element, {
  effect: 'star-field',
  renderer: ['webgl', 'canvas']
});`;
const effectsList=['star-field','galaxy','glitter-shimmer','warp-speed','bioluminescent-ocean'];
export default function IntegrationSection(){const[tab,setTab]=useState('v2');const current=tabs.find(t=>t.id===tab)??tabs[0];return <section id="developers" className="relative scroll-mt-24 border-t border-white/5 bg-[#05060f] py-24"><div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,rgba(56,189,248,0.12),transparent_70%)]"/><div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10"><SectionHeading eyebrow="Code & integration" title="CDN drop-in or npm — ship in minutes" desc="Import straight from a CDN with no build step, or install from npm for your bundler. Point it at an element and choose an effect, then swap to canvas-only or legacy whenever you need."/><div className="mt-14 grid gap-6 lg:grid-cols-[1.3fr_1fr]"><div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md sm:p-6"><div className="flex flex-wrap gap-1 rounded-full border border-white/10 bg-black/30 p-1">{tabs.map(t=><button key={t.id} type="button" onClick={()=>setTab(t.id)} className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${tab===t.id?'bg-white text-[#05060f]':'text-slate-300 hover:text-white'}`}>{t.label}</button>)}</div><p className="mt-4 text-sm leading-relaxed text-slate-400">{current.note}</p><div className="mt-5"><CodeBlock code={current.code} label={current.file}/></div></div><div className="flex flex-col gap-6"><div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md sm:p-6"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"><i className="ri-code-s-slash-line text-cyan-300"/>Minimal usage</div><div className="mt-4"><CodeBlock code={usage} label="usage.js" compact/></div><ul className="mt-5 space-y-2.5">{['Import straight from jsDelivr — no install required','Ordered WebGL → Canvas fallback with one V2 API','V2 is the default engine for all new projects'].map(tip=><li key={tip} className="flex items-start gap-2.5 text-sm text-slate-400"><i className="ri-check-line mt-0.5 text-cyan-300"/>{tip}</li>)}</ul></div><div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md sm:p-6"><div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Built-in effects</div><div className="mt-4 flex flex-wrap gap-2">{effectsList.map(e=><span key={e} className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-[11.5px] text-cyan-200">{e}</span>)}</div><p className="mt-4 text-xs leading-relaxed text-slate-500">Pass any canonical V2 effect id in the <span className="font-mono text-slate-400">effect</span> option and GlitterFX resolves the same semantic effect through Canvas or WebGL.</p></div></div></div></div></section>}