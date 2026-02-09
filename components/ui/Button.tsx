import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'light';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

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
    ghost: "hover:bg-stone-100 text-stone-700",
    light: "bg-white text-stone-900 hover:bg-sage-500 hover:text-white",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-9 px-4 py-2",
    lg: "h-10 px-8 text-lg",
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