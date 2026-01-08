/**
 * CategoryAdviceItem コンポーネント
 *
 * 個別カテゴリアドバイスを表示するカード型コンポーネント。
 * positive/negativeトーンに応じた配色、アイコン表示、
 * アクセシビリティ対応を提供します。
 */

'use client';

import React from 'react';
import {
  CategoryAdviceItemProps,
  getCategoryMetadata,
  getToneColorMapping,
} from './category-advice.types';

/**
 * CategoryAdviceItem コンポーネント
 *
 * カテゴリアドバイスを個別に表示するカードコンポーネント。
 * トーン（positive/negative）に応じた配色でユーザーに視覚的なフィードバックを提供。
 */
export function CategoryAdviceItem({
  categoryId,
  categoryName,
  advice,
  tone,
  enableAnimation = true,
}: CategoryAdviceItemProps): React.ReactElement {
  const metadata = getCategoryMetadata(categoryId);
  const colorMapping = getToneColorMapping(tone);

  // アニメーションクラス
  const animationClasses = enableAnimation
    ? 'transition-all duration-300 ease-in-out motion-reduce:transition-none motion-reduce:animate-none'
    : '';

  return (
    <article
      role="article"
      aria-label={`${metadata.ariaLabel}: ${advice}`}
      className={`
        ${colorMapping.bgGradient}
        ${colorMapping.borderColor}
        ${animationClasses}
        rounded-lg
        border
        shadow-sm
        p-4
        hover:shadow-md
      `}
    >
      {/* ヘッダー: カテゴリ名とアイコン */}
      <header className="flex items-center gap-2 mb-2">
        <span
          className="text-2xl"
          role="img"
          aria-label={metadata.ariaLabel}
        >
          {metadata.icon}
        </span>
        <h3 className={`${colorMapping.accentColor} text-sm font-medium`}>
          {categoryName}
        </h3>
      </header>

      {/* アドバイスメッセージ */}
      <div className={`${colorMapping.textColor} text-base font-normal`}>
        <p>{advice}</p>
      </div>
    </article>
  );
}
