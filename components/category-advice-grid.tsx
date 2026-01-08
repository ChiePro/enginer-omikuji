/**
 * CategoryAdviceGrid コンポーネント
 *
 * 6カテゴリのアドバイスをグリッドレイアウトで表示するコンポーネント。
 * レスポンシブデザイン（モバイル1列、デスクトップ2列）、
 * アニメーション、アクセシビリティ対応を提供します。
 */

'use client';

import React from 'react';
import { CategoryAdviceGridProps, getCategoryMetadata } from './category-advice.types';
import { CategoryAdviceItem } from './category-advice-item';
import { categories, CategoryId } from '@/lib/category-data';

/**
 * メッセージがpositiveかnegativeかを判定する
 *
 * カテゴリデータのpositiveMessages/negativeMessagesプールを参照して判定します。
 *
 * @param categoryId - カテゴリID
 * @param advice - アドバイスメッセージ
 * @returns トーン（positive/negative）
 */
function determineTone(
  categoryId: CategoryId,
  advice: string
): 'positive' | 'negative' {
  const category = categories.find((c) => c.id === categoryId);

  if (!category) {
    // フォールバック: カテゴリが見つからない場合はpositive
    return 'positive';
  }

  // positiveMessagesに含まれるかチェック
  if (category.messagePool.positiveMessages.includes(advice)) {
    return 'positive';
  }

  // negativeMessagesに含まれるかチェック
  if (category.messagePool.negativeMessages.includes(advice)) {
    return 'negative';
  }

  // どちらにも含まれない場合はpositive（フォールバック）
  return 'positive';
}

/**
 * CategoryAdviceGrid コンポーネント
 *
 * 6カテゴリのアドバイスをレスポンシブグリッドで表示。
 * モバイル: 1列、デスクトップ: 2列のレイアウト。
 */
export function CategoryAdviceGrid({
  categoryAdvice,
  fortuneLevel, // 将来の拡張用（現在は未使用）
  enableAnimation = true,
}: CategoryAdviceGridProps): React.ReactElement {
  // fortuneLevelは将来の配色調整用に予約（現在は各カテゴリのトーンで配色決定）
  void fortuneLevel;

  // 6カテゴリのIDと表示順序を定義
  const categoryOrder: CategoryId[] = [
    'coding',
    'review',
    'deploy',
    'waiting',
    'conflict',
    'growth',
  ];

  return (
    <section
      aria-label="カテゴリ別アドバイス"
      className="w-full max-w-4xl mx-auto"
    >
      {/* グリッドレイアウト: モバイル1列、デスクトップ2列 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryOrder.map((categoryId) => {
          const advice = categoryAdvice[categoryId];
          const metadata = getCategoryMetadata(categoryId);
          const tone = determineTone(categoryId, advice);

          return (
            <CategoryAdviceItem
              key={categoryId}
              categoryId={categoryId}
              categoryName={metadata.name}
              advice={advice}
              tone={tone}
              enableAnimation={enableAnimation}
            />
          );
        })}
      </div>
    </section>
  );
}
