import seedrandom from 'seedrandom';

/**
 * 決定論的乱数生成サービス
 * テスト環境での再現可能な乱数生成を提供
 */
export class TestRandomSeedService {
  /**
   * シードベースの乱数生成器を作成
   * @param seed - 乱数生成のシード値
   * @returns 0以上1未満の乱数を生成する関数
   */
  seedableRandom(seed: string): () => number {
    return seedrandom(seed);
  }

  /**
   * 再現可能なテスト環境を提供
   * @param seed - テスト用シード
   * @param testFn - 乱数生成器を受け取るテスト関数
   * @returns テスト関数の実行結果
   */
  async reproducibleTest<T>(
    seed: string,
    testFn: (rng: () => number) => T | Promise<T>
  ): Promise<T> {
    const rng = this.seedableRandom(seed);
    return await testFn(rng);
  }

  /**
   * 重み付きランダム選択
   * @param items - 選択対象のアイテム配列
   * @param weights - 各アイテムの選択確率（合計が1.0になるように正規化される）
   * @param rng - 乱数生成器
   * @returns 選択されたアイテム
   */
  weightedRandom<T>(
    items: T[],
    weights: number[],
    rng: () => number = Math.random
  ): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights arrays must have the same length');
    }

    if (items.length === 0) {
      throw new Error('Items array must not be empty');
    }

    // 重みの合計を計算
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight <= 0) {
      throw new Error('Total weight must be positive');
    }

    // 正規化された累積確率を計算
    const normalizedWeights = weights.map(w => w / totalWeight);
    const cumulativeProbabilities: number[] = [];
    let cumulative = 0;
    
    for (const weight of normalizedWeights) {
      cumulative += weight;
      cumulativeProbabilities.push(cumulative);
    }

    // ランダム値を生成
    const randomValue = rng();

    // 該当するアイテムを選択
    for (let i = 0; i < cumulativeProbabilities.length; i++) {
      if (randomValue < cumulativeProbabilities[i]) {
        return items[i];
      }
    }

    // 浮動小数点の誤差対策として、最後のアイテムを返す
    return items[items.length - 1];
  }
}