/**
 * ResetButton コンポーネント
 *
 * おみくじ結果をリセットしてトップページに戻るボタンコンポーネント。
 * アクセシビリティ対応、キーボード操作対応を提供します。
 */

'use client';

import React from 'react';

/**
 * ResetButton コンポーネントのProps
 */
export interface ResetButtonProps {
  /** クリックハンドラー */
  onClick: () => void;

  /** ボタンの無効化状態（デフォルト: false） */
  disabled?: boolean;
}

/**
 * ResetButton コンポーネント
 *
 * シンプルなボタンコンポーネント。
 * クリック時にストレージクリアとトップページ遷移を実行します。
 */
export function ResetButton({ onClick, disabled = false }: ResetButtonProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="もう一度引く"
      className={`
        px-8 py-3
        bg-white dark:bg-gray-800
        border-2 border-indigo-600 dark:border-indigo-400
        text-indigo-600 dark:text-indigo-400
        hover:bg-indigo-50 dark:hover:bg-gray-700
        disabled:opacity-50 disabled:cursor-not-allowed
        rounded-lg
        transition-colors duration-200
        font-medium
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
      `}
    >
      もう一度引く
    </button>
  );
}
