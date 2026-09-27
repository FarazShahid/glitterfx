const items = [
  { icon: 'ri-sparkling-2-fill', label: '37 Effects' },
  { icon: 'ri-stack-fill', label: 'WebGL + Canvas' },
  { icon: 'ri-shuffle-line', label: 'Runtime Transitions' },
  { icon: 'ri-cursor-line', label: 'Pointer Interaction' },
  { icon: 'ri-equalizer-line', label: 'Motion Controls' },
  { icon: 'ri-cloud-line', label: 'CDN Ready' },
];

export default function CapabilityStrip() {
  return (
    <section className="relative z-20 border-y border-white/10 bg-[#070a16]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-6 py-5 lg:px-10">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">Engine status</span>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center text-cyan-300">
                <i className={`${item.icon} text-[15px]`} />
              </span>
              <span className="font-mono text-[12px] text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}