/**
 * ResultPage コンポーネントの型定義
 *
 * おみくじ結果ページの状態管理とロジックの型定義を提供します。
 */

import { FortuneResult } from '@/lib/draw-fortune';
import { IntegratedFortuneResult } from '@/lib/integrated-fortune';

/**
 * 結果ページの状態管理
 */
export interface ResultPageState {
  /** 抽選結果（基本運勢） */
  fortuneResult: FortuneResult | null;

  /** 抽選結果（統合運勢） */
  integratedResult: IntegratedFortuneResult | null;

  /** ローディング状態 */
  isLoading: boolean;

  /** エラー状態 */
  error: string | null;

  /** おみくじタイプ */
  omikujiType: 'basic' | 'integrated';
}

/**
 * おみくじIDからタイプを判定する
 *
 * @param omikujiId - おみくじID
 * @returns おみくじタイプ（'basic' | 'integrated'）
 */
export function determineOmikujiType(omikujiId: string): 'basic' | 'integrated' {
  // 'daily-luck' も統合運勢として扱う（6つのカテゴリを表示）
  if (omikujiId === 'daily-luck' || omikujiId.includes('integrated')) {
    return 'integrated';
  }

  // デフォルトは基本運勢
  return 'basic';
}
