import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'light' | 'icon' | 'icon-danger' | 'chip' | 'chip-selected';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
}

/**
 * Button component - Use this for ALL buttons in the application.
 * 
 * Variants:
 * - primary: Dark background, white text (CTAs, primary actions)
 * - secondary: Sage background (secondary actions)
 * - outline: Bordered, transparent background
 * - ghost: Text only, subtle hover (cancel buttons, tertiary actions)
 * - link: Inline text link style, sage green, no horizontal padding (inline nav actions)
 * - light: White background, dark text
 * - icon: Icon-only button with subtle hover (edit, preview actions)
 * - icon-danger: Icon-only button with red hover (delete actions)
 * - chip: Unselected selection chip (category filters, season selectors)
 * - chip-selected: Selected selection chip with sage background
 * 
 * Sizes:
 * - sm: Small text button
 * - md: Medium text button (default)
 * - lg: Large text button
 * - icon: Square icon button (use with icon/icon-danger variants)
 */
export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-stone-900 text-white hover:bg-sage-500",
    secondary: "bg-sage-100 text-sage-900 hover:bg-sage-200",
    outline: "border border-stone-200 bg-transparent hover:bg-stone-50 text-stone-900",
    ghost: "text-sage-600 hover:text-sage-700 hover:bg-sage-50",
    link: "text-sage-600 hover:text-sage-700 !px-0 !bg-transparent",
    light: "bg-white text-stone-900 hover:bg-sage-500 hover:text-white",
    icon: "bg-stone-100 text-stone-500 hover:text-sage-600 hover:bg-sage-50",
    'icon-danger': "bg-stone-100 text-stone-500 hover:text-red-600 hover:bg-red-50",
    chip: "bg-stone-100 text-stone-600 hover:bg-stone-200",
    'chip-selected': "bg-sage-500 text-white hover:bg-sage-600",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-9 px-4 py-2",
    lg: "h-10 px-8 text-lg",
    icon: "h-9 w-9 p-2",
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};