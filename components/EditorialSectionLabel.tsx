import React from 'react';

interface Props {
  number: string;
  label: string;
  /** Use dark (sage) palette when section background is dark */
  dark?: boolean;
  className?: string;
}

export const EditorialSectionLabel: React.FC<Props> = ({ number, label, dark = false, className = '' }) => {
  const numColor = dark ? 'text-sage-400' : 'text-stone-400';
  const lineColor = dark ? 'bg-sage-700' : 'bg-stone-300';
  const labelColor = dark ? 'text-sage-400' : 'text-stone-400';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className={`font-sans text-xs uppercase tracking-[0.3em] ${numColor}`}>{number}</span>
      <div className={`h-px w-8 shrink-0 ${lineColor}`} />
      <span className={`font-sans text-xs uppercase tracking-[0.3em] ${labelColor}`}>{label}</span>
    </div>
  );
};
