/**
 * 統合運勢抽選機能
 *
 * 総合運勢抽選とカテゴリアドバイス選択を統合し、
 * 伝統的なおみくじ形式の結果を提供します。
 * 既存のfortune-typesシステムと統合し、純粋関数として実装されています。
 */

import { FortuneLevel } from './fortune-data';
import { selectRandomFortune } from './fortune-selector';
import { getOverallFortuneMessage } from './overall-fortune-data';
import { categories } from './category-data';
import { selectCategoryAdvice } from './category-selector';

/**
 * カテゴリ別アドバイスを表すインターフェース
 *
 * 6つのカテゴリに対するアドバイスメッセージを保持します。
 */
export interface CategoryAdvice {
  coding: string; // コーディング運
  review: string; // レビュー運
  deploy: string; // デプロイ運
  waiting: string; // 待ち人
  conflict: string; // 争い事
  growth: string; // 成長運
}

/**
 * 統合運勢結果を表すインターフェース
 *
 * 伝統的なおみくじ形式の結果を表現します。
 * 総合運勢レベル、総合運勢メッセージ、6カテゴリのアドバイスを含みます。
 */
export interface IntegratedFortuneResult {
  level: FortuneLevel; // 総合運勢レベル（大吉、吉、中吉、小吉、末吉、凶、大凶）
  overallMessage: string; // 総合運勢メッセージ（古風な言い回し、100文字程度）
  categoryAdvice: CategoryAdvice; // 6カテゴリのアドバイス（各3-10文字）
}

/**
 * 統合運勢を抽選し、総合運勢とカテゴリアドバイスを返す
 *
 * 以下の処理を統合して実行します：
 * 1. 既存のselectRandomFortune()で総合運勢レベルを抽選
 * 2. getOverallFortuneMessage()で総合運勢メッセージを取得（5パターンからランダム）
 * 3. 6カテゴリそれぞれにselectCategoryAdvice()でアドバイスを選択
 *
 * すべての処理は純粋関数として実装され、副作用はありません。
 * 各カテゴリのアドバイス選択は独立して行われます。
 *
 * @returns 総合運勢レベル、メッセージ、6カテゴリアドバイスを含む結果
 *
 * @example
 * const result = drawIntegratedFortune();
 * console.log(result.level.name); // '大吉', '吉', '中吉', etc.
 * console.log(result.overallMessage); // '大いなる吉兆なり。今日の業務、すべて順調に運び...'
 * console.log(result.categoryAdvice.coding); // 'スムーズに進む' など
 */
export function drawIntegratedFortune(): IntegratedFortuneResult {
  // 1. 総合運勢レベルを抽選（既存システムを再利用）
  const fortuneLevel = selectRandomFortune();

  // 2. 総合運勢メッセージを取得（5パターンからランダム選択）
  const overallMessage = getOverallFortuneMessage(fortuneLevel.id);

  // 3. 6カテゴリのアドバイスを選択
  // 各カテゴリのアドバイスを個別に取得
  const codingCategory = categories.find((c) => c.id === 'coding')!;
  const reviewCategory = categories.find((c) => c.id === 'review')!;
  const deployCategory = categories.find((c) => c.id === 'deploy')!;
  const waitingCategory = categories.find((c) => c.id === 'waiting')!;
  const conflictCategory = categories.find((c) => c.id === 'conflict')!;
  const growthCategory = categories.find((c) => c.id === 'growth')!;

  const categoryAdvice: CategoryAdvice = {
    coding: selectCategoryAdvice(fortuneLevel, codingCategory),
    review: selectCategoryAdvice(fortuneLevel, reviewCategory),
    deploy: selectCategoryAdvice(fortuneLevel, deployCategory),
    waiting: selectCategoryAdvice(fortuneLevel, waitingCategory),
    conflict: selectCategoryAdvice(fortuneLevel, conflictCategory),
    growth: selectCategoryAdvice(fortuneLevel, growthCategory),
  };

  // 4. 統合結果を返す
  return {
    level: fortuneLevel,
    overallMessage: overallMessage,
    categoryAdvice: categoryAdvice,
  };
}
