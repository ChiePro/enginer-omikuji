/**
 * FortuneResultCard コンポーネントの型定義
 *
 * 運勢結果カードの型定義とカラーマッピング定数を提供します。
 * 7段階の運勢レベルに対応した配色とアイコンのマッピングを含みます。
 */

import { FortuneLevel } from '@/lib/fortune-data';

/**
 * 運勢結果カードのProps
 */
export interface FortuneResultCardProps {
  /** 運勢レベル（大吉〜大凶） */
  level: FortuneLevel;

  /** メッセージ */
  message: string;

  /** おみくじ名称 */
  omikujiName: string;

  /** 引いた日時（ISO 8601形式） */
  drawnAt: string;

  /** アニメーション有効/無効（デフォルト: true） */
  enableAnimation?: boolean;
}

/**
 * 運勢レベル別のカラーマッピング
 *
 * 各運勢レベルに対応するTailwind CSSクラスとアイコンを定義します。
 * ダークモード対応の配色を含みます。
 */
export interface FortuneLevelColorMapping {
  /** 背景グラデーションクラス */
  bgGradient: string;

  /** テキストカラークラス */
  textColor: string;

  /** ボーダーカラークラス */
  borderColor: string;

  /** アイコン絵文字 */
  icon: string;

  /** アクセシビリティ用の説明 */
  ariaLabel: string;
}

/**
 * 運勢レベルIDからカラーマッピングへの対応表
 *
 * WCAG 2.1 AAコントラスト比（4.5:1以上）を考慮した配色設計
 * ダークモードではdark:プレフィックスで個別定義
 */
export const fortuneLevelColorMap: Record<string, FortuneLevelColorMapping> = {
  daikichi: {
    bgGradient: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30',
    textColor: 'text-yellow-900 dark:text-yellow-100',
    borderColor: 'border-yellow-400 dark:border-yellow-600',
    icon: '🌟',
    ariaLabel: '大吉 - 最高の運勢',
  },
  kichi: {
    bgGradient: 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30',
    textColor: 'text-green-900 dark:text-green-100',
    borderColor: 'border-green-400 dark:border-green-600',
    icon: '✨',
    ariaLabel: '吉 - 良い運勢',
  },
  chukichi: {
    bgGradient: 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30',
    textColor: 'text-blue-900 dark:text-blue-100',
    borderColor: 'border-blue-400 dark:border-blue-600',
    icon: '🌈',
    ariaLabel: '中吉 - やや良い運勢',
  },
  shokichi: {
    bgGradient: 'bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30',
    textColor: 'text-indigo-900 dark:text-indigo-100',
    borderColor: 'border-indigo-400 dark:border-indigo-600',
    icon: '🎋',
    ariaLabel: '小吉 - 普通の運勢',
  },
  suekichi: {
    bgGradient: 'bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-900/30 dark:to-gray-900/30',
    textColor: 'text-slate-900 dark:text-slate-100',
    borderColor: 'border-slate-400 dark:border-slate-600',
    icon: '🍃',
    ariaLabel: '末吉 - やや控えめな運勢',
  },
  kyo: {
    bgGradient: 'bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30',
    textColor: 'text-orange-900 dark:text-orange-100',
    borderColor: 'border-orange-400 dark:border-orange-600',
    icon: '☁️',
    ariaLabel: '凶 - 注意が必要な運勢',
  },
  daikyo: {
    bgGradient: 'bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30',
    textColor: 'text-red-900 dark:text-red-100',
    borderColor: 'border-red-400 dark:border-red-600',
    icon: '⚠️',
    ariaLabel: '大凶 - 慎重な行動が必要な運勢',
  },
};

/**
 * 運勢レベルIDからカラーマッピングを取得する
 *
 * @param fortuneLevelId - 運勢レベルID
 * @returns カラーマッピング（見つからない場合はデフォルト値）
 */
export function getFortuneLevelColorMapping(
  fortuneLevelId: string
): FortuneLevelColorMapping {
  return (
    fortuneLevelColorMap[fortuneLevelId] || {
      bgGradient: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900',
      textColor: 'text-gray-900 dark:text-gray-100',
      borderColor: 'border-gray-400 dark:border-gray-600',
      icon: '🎴',
      ariaLabel: '不明な運勢',
    }
  );
}
