'use client';

interface Option {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function Segmented({ label, options, value, onChange, className = '' }: Props) {
  return (
    <div className={className}>
      {label ? <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div> : null}
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              value === o.value ? 'bg-white text-[#05060f]' : 'text-slate-300 hover:text-white'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}