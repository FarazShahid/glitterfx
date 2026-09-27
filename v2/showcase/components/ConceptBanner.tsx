import ParticleField from './ParticleField';
import type { EffectKind } from '../lib/glitterEngine';

export interface ConceptData {
  kicker: string;
  title: string;
  desc: string;
  tags: string[];
  img: string;
  effect: EffectKind;
}

export default function ConceptBanner({ data, reverse = false }: { data: ConceptData; reverse?: boolean }) {
  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#070a16] sm:h-[440px]">
      <img src={data.img} alt="" className="absolute inset-0 h-full w-full object-cover object-top opacity-75" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#05060f] via-[#05060f]/70 to-[#05060f]/20" />
      {reverse ? <div className="absolute inset-0 bg-gradient-to-l from-[#05060f] via-transparent to-transparent" /> : null}
      <div className="absolute inset-0"><ParticleField effect={data.effect} density={1.1} speed={1} /></div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060f] via-transparent to-transparent" />
      <div className={`relative z-10 flex h-full w-full flex-col justify-end px-8 py-10 sm:px-12 ${reverse ? 'items-end text-right' : 'items-start text-left'}`}>
        <div className="max-w-xl">
          <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200 ${reverse ? 'justify-end' : ''}`}><span className="h-px w-8 bg-cyan-300/60" />{data.kicker}</div>
          <h3 className="mt-4 font-[family-name:var(--font-space)] text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl">{data.title}</h3>
          <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">{data.desc}</p>
          <div className={`mt-6 flex flex-wrap gap-2 ${reverse ? 'justify-end' : ''}`}>{data.tags.map((t)=><span key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] text-slate-300 backdrop-blur-md">{t}</span>)}</div>
          <button type="button" className={`mt-7 flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 ${reverse ? 'ml-auto' : ''}`}><i className="ri-external-link-line text-base text-cyan-200" />Explore concept</button>
        </div>
      </div>
    </div>
  );
}