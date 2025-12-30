'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * おみくじカードのProps定義
 *
 * @property id - おみくじID（URLスラッグとして使用）
 * @property name - おみくじ名称（表示用）
 * @property description - おみくじ説明（表示用）
 */
export interface OmikujiCardProps {
  id: string;
  name: string;
  description: string;
}

/**
 * おみくじカードコンポーネント
 *
 * Client Componentとして実装し、ホバーエフェクトとナビゲーション機能を提供します。
 * - ホバー時の視覚的フィードバック（背景色変化、影、トランジション）
 * - クリック時のおみくじ詳細ページへのナビゲーション
 * - キーボード操作（Tab、Enter）のアクセシビリティサポート
 * - レスポンシブなカードレイアウト
 *
 * @param props - OmikujiCardProps
 */
export default function OmikujiCard({ id, name, description }: OmikujiCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={`/omikuji/${id}`}
      className={`
        block p-6 rounded-lg border-2 transition-all duration-200
        ${
          isHovered
            ? 'bg-gray-50 dark:bg-gray-800 border-blue-500 shadow-lg scale-105'
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-md'
        }
        hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`${name}のおみくじを引く`}
    >
      <article>
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          {name}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </article>
    </Link>
  );
}
