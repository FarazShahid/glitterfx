'use client';

import { useState } from 'react';

function highlight(code: string) {
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(
    /(\/\/[^\n]*)|('[^']*'|"[^"]*")|\b(import|from|new|const|let|var|await|async|function|return|document|window)\b/g,
    (match, comment, str, keyword) => {
      if (comment) return `<span class="text-slate-500">${comment}</span>`;
      if (str) return `<span class="text-emerald-300">${str}</span>`;
      if (keyword) return `<span class="text-violet-300">${keyword}</span>`;
      return match;
    }
  );
}

interface Props {
  code: string;
  label?: string;
  compact?: boolean;
  className?: string;
}

export default function CodeBlock({ code, label, compact = false, className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-[#070a16]/90 shadow-[0_20px_60px_-25px_rgba(56,189,248,0.35)] backdrop-blur-xl ${className}`}>
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></div>
          {label ? <span className="font-mono text-xs text-slate-400">{label}</span> : null}
        </div>
        <button type="button" onClick={copy} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-slate-300 transition-colors hover:border-cyan-300/40 hover:text-cyan-200">
          <span className={`flex h-3.5 w-3.5 items-center justify-center ${copied ? 'text-emerald-300' : 'text-slate-400'}`}><i className={copied ? 'ri-check-line text-[13px]' : 'ri-file-copy-line text-[13px]'} /></span>{copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className={`overflow-x-auto px-4 ${compact ? 'py-3.5' : 'py-5'}`}><code className={`font-mono ${compact ? 'text-[12.5px]' : 'text-[13.5px]'} leading-relaxed text-slate-200`} dangerouslySetInnerHTML={{ __html: highlight(code) }} /></pre>
    </div>
  );
}