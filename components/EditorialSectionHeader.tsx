import React from 'react';
import { EditorialSectionLabel } from './EditorialSectionLabel';

interface Props {
  number: string;
  label: string;
  heading: React.ReactNode;
  description?: React.ReactNode;
  /** Use dark (sage) palette when section background is dark */
  dark?: boolean;
  className?: string;
}

export const EditorialSectionHeader: React.FC<Props> = ({
  number,
  label,
  heading,
  description,
  dark = false,
  className = '',
}) => {
  const headingColor = dark ? 'text-white' : 'text-stone-900';
  const descColor = dark ? 'text-sage-300' : 'text-stone-500';

  return (
    <div className={className}>
      <EditorialSectionLabel number={number} label={label} dark={dark} className="mb-8 md:mb-12" />
      <div className="md:flex md:items-end gap-4 mb-10 md:mb-16">
        <h2
          className={`font-serif font-bold text-3xl md:text-5xl max-w-sm ${headingColor}`}
          style={{ fontWeight: 700 }}
        >
          {heading}
        </h2>
        {description && (
          <p className={`max-w-sm leading-relaxed text-sm md:text-base mt-4 md:mt-0 ${descColor}`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
