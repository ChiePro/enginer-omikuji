/**
 * FortuneResultCard コンポーネント
 *
 * 運勢結果を視覚的に表示するカードコンポーネント。
 * 運勢レベルに応じた配色、アイコン、タイムスタンプ表示、アニメーション、
 * アクセシビリティ対応を提供します。
 */

'use client';

import React from 'react';
import {
  FortuneResultCardProps,
  getFortuneLevelColorMapping,
} from './fortune-result-card.types';

/**
 * ISO 8601形式のタイムスタンプを日本語の人間可読形式に変換
 *
 * @param isoString - ISO 8601形式のタイムスタンプ
 * @returns 日本語の人間可読形式（例: 2025年12月31日 21:34）
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);

  // 日本時間 (UTC+9) に変換
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  const year = jstDate.getUTCFullYear();
  const month = jstDate.getUTCMonth() + 1;
  const day = jstDate.getUTCDate();
  const hours = jstDate.getUTCHours().toString().padStart(2, '0');
  const minutes = jstDate.getUTCMinutes().toString().padStart(2, '0');

  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

/**
 * FortuneResultCard コンポーネント
 *
 * 運勢結果を美しく表示するカード型UIコンポーネント。
 * レスポンシブデザイン、アニメーション、アクセシビリティに対応。
 */
export function FortuneResultCard({
  level,
  message,
  omikujiName,
  drawnAt,
  enableAnimation = true,
}: FortuneResultCardProps): React.ReactElement {
  const colorMapping = getFortuneLevelColorMapping(level.id);

  // アニメーションクラス
  const animationClasses = enableAnimation
    ? 'transition-all duration-500 ease-in-out motion-reduce:transition-none motion-reduce:animate-none'
    : '';

  return (
    <article
      role="article"
      aria-label={`${colorMapping.ariaLabel}: ${omikujiName}`}
      className={`
        ${colorMapping.bgGradient}
        ${colorMapping.borderColor}
        ${animationClasses}
        rounded-xl
        border-2
        shadow-lg
        p-6 md:p-8
        w-full
        max-w-2xl
        mx-auto
      `}
    >
      {/* ヘッダー部分: おみくじ名称と日時 */}
      <header className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            {omikujiName}
          </h2>
          <time
            dateTime={drawnAt}
            className="text-xs md:text-sm text-gray-500 dark:text-gray-500"
          >
            {formatTimestamp(drawnAt)}
          </time>
        </div>
      </header>

      {/* メイン部分: 運勢レベルとアイコン */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span
            className="text-4xl md:text-5xl"
            role="img"
            aria-label={colorMapping.ariaLabel}
          >
            {colorMapping.icon}
          </span>
          <h1
            className={`
              ${colorMapping.textColor}
              text-4xl md:text-5xl
              font-bold
            `}
          >
            {level.name}
          </h1>
        </div>
      </div>

      {/* メッセージ部分 */}
      <div
        className={`
          ${colorMapping.textColor}
          text-base md:text-lg
          leading-relaxed
          text-center
          bg-white/50 dark:bg-black/20
          rounded-lg
          p-4 md:p-6
        `}
      >
        <p>{message}</p>
      </div>
    </article>
  );
}
