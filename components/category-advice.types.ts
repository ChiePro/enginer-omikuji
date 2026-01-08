/**
 * CategoryAdviceGrid/Item コンポーネントの型定義
 *
 * カテゴリアドバイスグリッドとアイテムの型定義、
 * カテゴリ名とアイコンのマッピング、トーン別配色定数を提供します。
 */

import { CategoryAdvice } from '@/lib/integrated-fortune';
import { FortuneLevel } from '@/lib/fortune-data';
import { CategoryId } from '@/lib/category-data';

/**
 * カテゴリアドバイスグリッドのProps
 */
export interface CategoryAdviceGridProps {
  /** カテゴリアドバイス（6カテゴリ） */
  categoryAdvice: CategoryAdvice;

  /** 総合運勢レベル（配色決定に使用） */
  fortuneLevel: FortuneLevel;

  /** アニメーション有効/無効（デフォルト: true） */
  enableAnimation?: boolean;
}

/**
 * 個別カテゴリアドバイスアイテムのProps
 */
export interface CategoryAdviceItemProps {
  /** カテゴリID（'coding', 'review' など） */
  categoryId: CategoryId;

  /** カテゴリ名（'コーディング運' など） */
  categoryName: string;

  /** アドバイスメッセージ */
  advice: string;

  /** トーン（positive/negative） */
  tone: 'positive' | 'negative';

  /** アニメーション有効/無効（デフォルト: true） */
  enableAnimation?: boolean;
}

/**
 * カテゴリメタデータ（アイコンと表示名）
 */
export interface CategoryMetadata {
  /** カテゴリ名 */
  name: string;

  /** アイコン絵文字 */
  icon: string;

  /** アクセシビリティ用の説明 */
  ariaLabel: string;
}

/**
 * カテゴリIDからメタデータへのマッピング
 *
 * 6カテゴリそれぞれにアイコンと表示名を定義します。
 */
export const categoryMetadataMap: Record<CategoryId, CategoryMetadata> = {
  coding: {
    name: 'コーディング運',
    icon: '💻',
    ariaLabel: 'コーディング運のアドバイス',
  },
  review: {
    name: 'レビュー運',
    icon: '👀',
    ariaLabel: 'レビュー運のアドバイス',
  },
  deploy: {
    name: 'デプロイ運',
    icon: '🚀',
    ariaLabel: 'デプロイ運のアドバイス',
  },
  waiting: {
    name: '待ち人',
    icon: '⏰',
    ariaLabel: '待ち人についてのアドバイス',
  },
  conflict: {
    name: '争い事',
    icon: '⚔️',
    ariaLabel: '争い事についてのアドバイス',
  },
  growth: {
    name: '成長運',
    icon: '🌱',
    ariaLabel: '成長運のアドバイス',
  },
};

/**
 * トーン別配色定義
 */
export interface ToneColorMapping {
  /** 背景グラデーションクラス */
  bgGradient: string;

  /** テキストカラークラス */
  textColor: string;

  /** ボーダーカラークラス */
  borderColor: string;

  /** アクセント カラークラス */
  accentColor: string;
}

/**
 * positive/negativeトーンに応じた配色マッピング
 *
 * positive: 緑系（励まし、成功）
 * negative: オレンジ系（注意、慎重）
 */
export const toneColorMap: Record<'positive' | 'negative', ToneColorMapping> = {
  positive: {
    bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    textColor: 'text-green-900 dark:text-green-100',
    borderColor: 'border-green-300 dark:border-green-700',
    accentColor: 'text-green-600 dark:text-green-400',
  },
  negative: {
    bgGradient: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    textColor: 'text-orange-900 dark:text-orange-100',
    borderColor: 'border-orange-300 dark:border-orange-700',
    accentColor: 'text-orange-600 dark:text-orange-400',
  },
};

/**
 * カテゴリIDからメタデータを取得する
 *
 * @param categoryId - カテゴリID
 * @returns カテゴリメタデータ
 */
export function getCategoryMetadata(categoryId: CategoryId): CategoryMetadata {
  return categoryMetadataMap[categoryId];
}

/**
 * トーンから配色マッピングを取得する
 *
 * @param tone - トーン（positive/negative）
 * @returns トーン別配色
 */
export function getToneColorMapping(tone: 'positive' | 'negative'): ToneColorMapping {
  return toneColorMap[tone];
}
