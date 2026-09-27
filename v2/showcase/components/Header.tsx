'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const links = [
  { href: '#gallery', label: 'Effects' },
  { href: '#playground', label: 'Playground' },
  { href: '#samples', label: 'Samples' },
  { href: '#developers', label: 'Developers' },
  { href: '#legacy', label: 'Legacy' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-white/10 bg-[#05060f]/80 backdrop-blur-xl' : 'border-b border-transparent'}`}>
      <div className="flex h-16 w-full items-center justify-between px-6 lg:px-10">
        <Link href="#top" className="flex items-center gap-2.5"><span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 shadow-[0_0_24px_-4px_rgba(56,189,248,0.9)]"><i className="ri-sparkling-2-fill text-[16px] text-white" /></span><span className="font-[family-name:var(--font-space)] text-lg font-semibold tracking-tight text-white">Glitter<span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">FX</span></span><span className="ml-1 hidden rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">v2.0.0-alpha</span></Link>
        <nav className="hidden items-center gap-1 lg:flex">{links.map((l)=><a key={l.href} href={l.href} className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:text-white">{l.label}</a>)}</nav>
        <div className="flex items-center gap-3"><a href="#playground" className="hidden cursor-pointer whitespace-nowrap rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-[#05060f] shadow-[0_10px_30px_-10px_rgba(56,189,248,0.9)] transition-transform hover:scale-[1.03] sm:block">Explore V2</a><button type="button" onClick={()=>setOpen(v=>!v)} aria-label="Toggle menu" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white lg:hidden"><i className={open?'ri-close-line text-lg':'ri-menu-line text-lg'} /></button></div>
      </div>
      {open?<div className="border-t border-white/10 bg-[#05060f]/95 px-6 py-3 backdrop-blur-xl lg:hidden">{links.map((l)=><a key={l.href} href={l.href} onClick={()=>setOpen(false)} className="block cursor-pointer rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">{l.label}</a>)}</div>:null}
    </header>
  );
}