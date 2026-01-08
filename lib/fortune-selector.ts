/**
 * 運勢選択ロジック
 *
 * 重み付き確率分布を使用して運勢レベルをランダムに選択します。
 * 純粋関数として実装され、副作用がなく、テスト可能です。
 */

import { fortuneLevels, FortuneLevel } from './fortune-data';

/**
 * 累積確率配列を生成する
 *
 * 運勢レベルの重みから累積確率を計算します。
 * 例: weights [16, 23, 34, 12, 8, 4, 3] → cumulative [16, 39, 73, 85, 93, 97, 100]
 *
 * @returns 累積確率の配列
 */
function buildCumulativeWeights(): number[] {
  const cumulative: number[] = [];
  let sum = 0;

  for (const fortune of fortuneLevels) {
    sum += fortune.weight;
    cumulative.push(sum);
  }

  return cumulative;
}

// 累積確率配列を事前に生成（パフォーマンス最適化）
const cumulativeWeights = buildCumulativeWeights();

/**
 * 重み付き確率分布を使用して運勢レベルをランダムに選択する
 *
 * 累積確率配列を使用した二分探索により、
 * 各運勢の重みに応じた確率で選択を行います。
 *
 * @returns 選択された運勢レベル
 *
 * @example
 * const fortune = selectRandomFortune();
 * console.log(fortune.name); // '大吉', '吉', '中吉', etc.
 */
export function selectRandomFortune(): FortuneLevel {
  // 0から総重みまでの乱数を生成
  const totalWeight = cumulativeWeights[cumulativeWeights.length - 1];
  const random = Math.random() * totalWeight;

  // 累積確率配列から適切な運勢を選択（線形探索）
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (random < cumulativeWeights[i]) {
      return fortuneLevels[i];
    }
  }

  // フォールバック: 最後の運勢を返す（理論上は到達しない）
  return fortuneLevels[fortuneLevels.length - 1];
}
