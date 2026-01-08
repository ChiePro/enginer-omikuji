/**
 * 確率的カテゴリ選択ロジック
 *
 * 運勢レベルに応じた確率分布を使用して、各カテゴリのpositive/negativeメッセージを
 * ランダムに選択します。純粋関数として実装され、副作用がなく、テスト可能です。
 */

import { FortuneLevel } from './fortune-data';
import { Category } from './category-data';

/**
 * 運勢レベルごとのpositive確率マッピング
 *
 * 各運勢レベルに対して、positiveメッセージが選ばれる確率を定義します。
 * - 大吉: 95% - ほとんどpositive
 * - 吉: 80% - 高確率でpositive
 * - 中吉: 65% - やや高確率でpositive
 * - 小吉: 55% - わずかにpositiveが多い
 * - 末吉: 50% - 完全ランダム
 * - 凶: 20% - 低確率でpositive
 * - 大凶: 5% - ほとんどnegative
 */
const POSITIVE_PROBABILITY_MAP: Record<string, number> = {
  daikichi: 0.95, // 大吉
  kichi: 0.8, // 吉
  chukichi: 0.65, // 中吉
  shokichi: 0.55, // 小吉
  suekichi: 0.5, // 末吉（完全ランダム）
  kyo: 0.2, // 凶
  daikyo: 0.05, // 大凶
} as const;

/**
 * 運勢レベルに応じたpositive確率を取得する
 *
 * 指定された運勢レベルに対応するpositiveメッセージの選択確率を返します。
 *
 * @param fortuneLevel - 運勢レベル
 * @returns positive確率（0.0 - 1.0）
 * @throws {Error} fortuneLevelのIDが不正な場合
 *
 * @example
 * const daikichi = { id: 'daikichi', name: '大吉', weight: 16, rank: 1 };
 * const probability = getPositiveProbability(daikichi);
 * console.log(probability); // 0.95
 */
export function getPositiveProbability(fortuneLevel: FortuneLevel): number {
  const probability = POSITIVE_PROBABILITY_MAP[fortuneLevel.id];

  if (probability === undefined) {
    throw new Error(`Unknown fortune level ID: "${fortuneLevel.id}"`);
  }

  return probability;
}

/**
 * 運勢レベルとカテゴリから確率的にアドバイスを選択する
 *
 * 以下の3段階で処理を行います：
 * 1. 運勢レベルからpositive確率を取得
 * 2. Math.random()でpositive/negativeを確率的に判定
 * 3. 選択されたプール（5メッセージ）からランダムに1つを選択
 *
 * 各カテゴリの選択は独立して行われます。
 *
 * @param fortuneLevel - 運勢レベル
 * @param category - カテゴリ定義
 * @returns 選択されたアドバイスメッセージ（3-10文字）
 *
 * @example
 * const daikichi = { id: 'daikichi', name: '大吉', weight: 16, rank: 1 };
 * const codingCategory = {
 *   id: 'coding',
 *   name: 'コーディング運',
 *   messagePool: {
 *     positiveMessages: ['スムーズに進む', ...],
 *     negativeMessages: ['要件を注意深く', ...]
 *   }
 * };
 *
 * const advice = selectCategoryAdvice(daikichi, codingCategory);
 * console.log(advice); // 'スムーズに進む' など（95%の確率でpositiveから選択）
 */
export function selectCategoryAdvice(
  fortuneLevel: FortuneLevel,
  category: Category
): string {
  // 1. 運勢レベルに応じたpositive確率を取得
  const positiveProbability = getPositiveProbability(fortuneLevel);

  // 2. 確率判定: Math.random()がpositive確率未満ならpositive、以上ならnegative
  const isPositive = Math.random() < positiveProbability;

  // 3. 該当するメッセージプールを選択
  const messagePool = isPositive
    ? category.messagePool.positiveMessages
    : category.messagePool.negativeMessages;

  // 4. プール内からランダムに1つを選択
  const randomIndex = Math.floor(Math.random() * messagePool.length);
  return messagePool[randomIndex];
}
