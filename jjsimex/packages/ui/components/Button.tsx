import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-[#F97316] hover:bg-[#ea6c0d] text-white',
  secondary: 'bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white border border-[#3A3A3A]',
  danger: 'bg-transparent hover:bg-red-500/10 text-[#EF4444] border border-[#EF4444]',
  ghost: 'bg-transparent hover:bg-[#1A1A1A] text-[#9CA3AF]',
};

const SIZES: Record<string, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-6 py-3',
};

export default function Button({
  label,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-semibold rounded-btn
        transition-colors duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
    >
      {label}
    </button>
  );
}
