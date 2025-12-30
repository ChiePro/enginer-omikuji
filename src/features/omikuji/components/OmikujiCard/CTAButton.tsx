'use client';

import React from 'react';

export interface CTAButtonProps {
  children: React.ReactNode;
  isDisabled?: boolean;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  className?: string;
}

export const CTAButton: React.FC<CTAButtonProps> = ({
  children,
  isDisabled = false,
  variant = 'primary',
  onClick,
  className = ''
}) => {
  const baseStyles = `
    inline-block px-4 py-2 rounded-md text-sm font-medium
    transition-all duration-300 ease-out
    border
  `;

  const variantStyles = {
    primary: `
      bg-white bg-opacity-20 border-white border-opacity-30
      hover:bg-opacity-30 hover:border-opacity-50 hover:shadow-sm
      ${!isDisabled ? 'hover:scale-105' : ''}
    `,
    secondary: `
      bg-transparent border-current opacity-80
      hover:opacity-100 hover:bg-white hover:bg-opacity-10
      ${!isDisabled ? 'hover:scale-105' : ''}
    `
  };

  const disabledStyles = isDisabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer';

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${disabledStyles} ${className}`}
      onClick={!isDisabled ? onClick : undefined}
    >
      {children}
    </div>
  );
};