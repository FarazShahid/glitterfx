interface Props {
  eyebrow?: string;
  title: string;
  desc?: string;
  align?: 'left' | 'center';
}

export default function SectionHeading({ eyebrow, title, desc, align = 'left' }: Props) {
  const isCenter = align === 'center';
  return (
    <div className={`${isCenter ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}>
      {eyebrow ? (
        <div
          className={`mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/90 ${
            isCenter ? 'mx-auto' : ''
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
          {eyebrow}
        </div>
      ) : null}
      <h2 className="font-[family-name:var(--font-space)] text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {desc ? <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">{desc}</p> : null}
    </div>
  );
}