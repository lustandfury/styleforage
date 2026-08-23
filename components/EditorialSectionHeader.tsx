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
  /** Heading tag to render (default h2). Use h1 for a page's single primary heading. */
  level?: 'h1' | 'h2';
}

export const EditorialSectionHeader: React.FC<Props> = ({
  number,
  label,
  heading,
  description,
  dark = false,
  className = '',
  level = 'h2',
}) => {
  const headingColor = dark ? 'text-white' : 'text-stone-900';
  const descColor = dark ? 'text-sage-300' : 'text-stone-500';
  const HeadingTag = level;

  return (
    <div className={className}>
      <EditorialSectionLabel number={number} label={label} dark={dark} className="mb-8 md:mb-12" />
      <div className="md:flex md:items-end gap-4 mb-10 md:mb-16">
        <HeadingTag
          className={`font-serif font-bold text-3xl md:text-5xl max-w-sm ${headingColor}`}
          style={{ fontWeight: 700 }}
        >
          {heading}
        </HeadingTag>
        {description && (
          <p className={`max-w-sm leading-relaxed text-sm md:text-base mt-4 md:mt-0 ${descColor}`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
