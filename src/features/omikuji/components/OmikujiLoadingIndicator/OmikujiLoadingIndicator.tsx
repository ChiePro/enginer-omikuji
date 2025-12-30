'use client';

import React from 'react';

export interface OmikujiLoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'loading' | 'error' | 'success';
}

export const OmikujiLoadingIndicator: React.FC<OmikujiLoadingIndicatorProps> = ({
  message = 'おみくじを準備中...',
  size = 'medium',
  variant = 'loading'
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8', 
    large: 'h-12 w-12'
  };

  const spinnerColorClasses = {
    loading: 'text-shrine-red',
    error: 'text-red-500',
    success: 'text-green-500'
  };

  const getDefaultMessage = () => {
    if (variant === 'error') return 'エラーが発生しました';
    if (variant === 'success') return '完了しました';
    return 'おみくじを準備中...';
  };

  const displayMessage = message || getDefaultMessage();
  const role = variant === 'error' ? 'alert' : 'status';

  return (
    <div
      role={role}
      aria-live="polite"
      aria-label="ローディング中"
      className="shrine-loading animate-fadeIn p-4 sm:p-6 flex flex-col items-center justify-center"
    >
      <div
        data-testid="loading-spinner"
        className={`
          animate-spin rounded-full border-2 border-gray-300 border-t-current
          ${sizeClasses[size]}
          ${spinnerColorClasses[variant]}
        `}
      />
      
      <p className="font-japanese animate-pulse text-sm sm:text-base mt-4 text-center">
        {displayMessage}
      </p>
      
      <span className="sr-only">
        読み込み中です。しばらくお待ちください。
      </span>
    </div>
  );
};