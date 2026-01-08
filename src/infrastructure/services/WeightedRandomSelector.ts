import seedrandom from 'seedrandom';

/**
 * Alias Methodを使用した高性能加重ランダム選択器
 * 
 * O(n)の前処理でO(1)の選択処理を実現する
 */
export class WeightedRandomSelector<T> {
  private items: T[] = [];
  private weights: number[] = [];
  private prob: number[] = [];
  private alias: number[] = [];
  private isBuilt: boolean = false;
  private random: () => number;

  constructor(seed?: string) {
    this.random = seed ? seedrandom(seed) : Math.random;
  }

  /**
   * 加重アイテム配列からAlias Methodのデータ構造を構築
   */
  build(weightedItems: Array<{ item: T; weight: number }>): Result<void, SelectorError> {
    // バリデーション
    if (weightedItems.length === 0) {
      return {
        success: false,
        error: { type: 'EMPTY_ITEMS' }
      };
    }

    // 重みの検証
    for (const weightedItem of weightedItems) {
      if (weightedItem.weight <= 0) {
        return {
          success: false,
          error: { 
            type: 'INVALID_WEIGHT',
            item: weightedItem.item
          }
        };
      }
    }

    const n = weightedItems.length;
    this.items = weightedItems.map(wi => wi.item);
    this.weights = weightedItems.map(wi => wi.weight);
    this.prob = new Array(n);
    this.alias = new Array(n);

    // 重みの正規化
    const totalWeight = weightedItems.reduce((sum, wi) => sum + wi.weight, 0);
    const normalizedWeights = weightedItems.map(wi => wi.weight / totalWeight * n);

    // Alias Methodアルゴリズム
    const small: number[] = [];
    const large: number[] = [];

    // 正規化された重みを small/large に分類
    for (let i = 0; i < n; i++) {
      if (normalizedWeights[i] < 1.0) {
        small.push(i);
      } else {
        large.push(i);
      }
    }

    // Alias tableの構築
    while (small.length > 0 && large.length > 0) {
      const less = small.pop()!;
      const more = large.pop()!;

      this.prob[less] = normalizedWeights[less];
      this.alias[less] = more;

      normalizedWeights[more] = (normalizedWeights[more] + normalizedWeights[less]) - 1.0;

      if (normalizedWeights[more] < 1.0) {
        small.push(more);
      } else {
        large.push(more);
      }
    }

    // 残りの処理（浮動小数点誤差の対応）
    while (large.length > 0) {
      this.prob[large.pop()!] = 1.0;
    }
    
    while (small.length > 0) {
      this.prob[small.pop()!] = 1.0;
    }

    this.isBuilt = true;
    return { success: true, data: undefined };
  }

  /**
   * O(1)で加重ランダム選択を実行
   */
  select(): Result<T, SelectorError> {
    if (!this.isBuilt) {
      return {
        success: false,
        error: { type: 'NOT_BUILT' }
      };
    }

    const n = this.items.length;
    const i = Math.floor(this.random() * n);
    
    if (this.random() < this.prob[i]) {
      return { success: true, data: this.items[i] };
    } else {
      return { success: true, data: this.items[this.alias[i]] };
    }
  }

  /**
   * 統計的精度を検証（指定されたサンプル数で分布をテスト）
   */
  validateDistribution(
    sampleCount: number, 
    tolerance: number = 0.05
  ): Result<ValidationResult, SelectorError> {
    if (!this.isBuilt) {
      return {
        success: false,
        error: { type: 'NOT_BUILT' }
      };
    }

    const counts: { [key: string]: number } = {};
    
    // サンプリング
    for (let i = 0; i < sampleCount; i++) {
      const result = this.select();
      if (result.success) {
        const key = String(result.data);
        counts[key] = (counts[key] || 0) + 1;
      }
    }

    // 実際の重みベースの期待確率を計算
    const totalWeight = this.weights.reduce((sum, w) => sum + w, 0);
    const deviations: { [key: string]: number } = {};

    // 偏差の計算
    for (let i = 0; i < this.items.length; i++) {
      const key = String(this.items[i]);
      const expectedProbability = this.weights[i] / totalWeight;
      const actualProbability = (counts[key] || 0) / sampleCount;
      deviations[key] = actualProbability - expectedProbability;
    }

    return {
      success: true,
      data: {
        totalSamples: sampleCount,
        tolerance,
        deviations,
        isWithinTolerance: Object.values(deviations).every(
          deviation => Math.abs(deviation) <= tolerance
        )
      }
    };
  }

  /**
   * カスタム期待確率分布での統計的精度検証
   */
  validateCustomDistribution(
    expectedProbabilities: { [key: string]: number },
    sampleCount: number,
    tolerance: number = 0.05
  ): Result<ValidationResult, SelectorError> {
    if (!this.isBuilt) {
      return {
        success: false,
        error: { type: 'NOT_BUILT' }
      };
    }

    const counts: { [key: string]: number } = {};
    
    // サンプリング
    for (let i = 0; i < sampleCount; i++) {
      const result = this.select();
      if (result.success) {
        const key = String(result.data);
        counts[key] = (counts[key] || 0) + 1;
      }
    }

    // 偏差の計算
    const deviations: { [key: string]: number } = {};
    for (const [key, expectedProb] of Object.entries(expectedProbabilities)) {
      const actualProbability = (counts[key] || 0) / sampleCount;
      deviations[key] = actualProbability - expectedProb;
    }

    return {
      success: true,
      data: {
        totalSamples: sampleCount,
        tolerance,
        deviations,
        isWithinTolerance: Object.values(deviations).every(
          deviation => Math.abs(deviation) <= tolerance
        )
      }
    };
  }

  /**
   * 現在の状態をリセット
   */
  reset(): void {
    this.items = [];
    this.weights = [];
    this.prob = [];
    this.alias = [];
    this.isBuilt = false;
  }

  /**
   * 構築済みかどうかを確認
   */
  isReady(): boolean {
    return this.isBuilt;
  }

  /**
   * アイテム数を取得
   */
  getItemCount(): number {
    return this.items.length;
  }
}

// Type definitions
export type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

export type SelectorError = 
  | { type: 'EMPTY_ITEMS' }
  | { type: 'INVALID_WEIGHT'; item?: any }
  | { type: 'NOT_BUILT' };

export interface ValidationResult {
  totalSamples: number;
  tolerance: number;
  deviations: { [key: string]: number };
  isWithinTolerance: boolean;
}