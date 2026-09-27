'use client';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export default function Slider({ label, value, min, max, step, suffix = '', onChange }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
        <span className="font-mono text-[11px] text-cyan-200">
          {value.toFixed(1)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-2.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
      />
    </div>
  );
}