import { describe, expect, it, beforeEach, vi } from 'vitest';
import { WeightedRandomSelector } from './WeightedRandomSelector';

describe('WeightedRandomSelector', () => {
  let selector: WeightedRandomSelector<string>;

  beforeEach(() => {
    selector = new WeightedRandomSelector();
  });

  describe('Alias Method Implementation', () => {
    it('単一アイテムの場合、常に同じアイテムを返す', () => {
      const items = [{ item: 'single', weight: 1.0 }];
      selector.build(items);
      
      for (let i = 0; i < 10; i++) {
        const result = selector.select();
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('single');
        }
      }
    });

    it('等しい重みの場合、均等に選択される', () => {
      const items = [
        { item: 'A', weight: 1.0 },
        { item: 'B', weight: 1.0 },
        { item: 'C', weight: 1.0 }
      ];
      selector.build(items);
      
      const counts: { [key: string]: number } = {};
      const iterations = 3000;
      
      for (let i = 0; i < iterations; i++) {
        const result = selector.select();
        if (result.success) {
          counts[result.data] = (counts[result.data] || 0) + 1;
        }
      }
      
      // 各アイテムが約33%の確率で選択されることを確認（±5%の許容誤差）
      const expectedProbability = 1/3;
      const tolerance = 0.05;
      
      for (const item of ['A', 'B', 'C']) {
        const actualProbability = (counts[item] || 0) / iterations;
        expect(Math.abs(actualProbability - expectedProbability)).toBeLessThanOrEqual(tolerance);
      }
    });

    it('異なる重みの場合、重みに比例して選択される', () => {
      const items = [
        { item: 'Heavy', weight: 8.0 },
        { item: 'Light', weight: 2.0 }
      ];
      selector.build(items);
      
      const counts: { [key: string]: number } = {};
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        const result = selector.select();
        if (result.success) {
          counts[result.data] = (counts[result.data] || 0) + 1;
        }
      }
      
      // Heavy:Light = 8:2 = 4:1 の比率になることを確認
      const heavyRatio = counts['Heavy'] / iterations;
      const lightRatio = counts['Light'] / iterations;
      
      expect(heavyRatio).toBeCloseTo(0.8, 0.05); // 80% ±5%
      expect(lightRatio).toBeCloseTo(0.2, 0.05); // 20% ±5%
    });

    it('決定論的シードで再現可能な結果を提供する', () => {
      const items = [
        { item: 'A', weight: 3.0 },
        { item: 'B', weight: 2.0 },
        { item: 'C', weight: 1.0 }
      ];
      
      // 同じシードで複数回ビルドして同じ結果が得られることを確認
      const selector1 = new WeightedRandomSelector('test-seed-123');
      const selector2 = new WeightedRandomSelector('test-seed-123');
      
      selector1.build(items);
      selector2.build(items);
      
      for (let i = 0; i < 10; i++) {
        const result1 = selector1.select();
        const result2 = selector2.select();
        
        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        
        if (result1.success && result2.success) {
          expect(result1.data).toBe(result2.data);
        }
      }
    });

    it('空のアイテム配列の場合、エラーを返す', () => {
      const items: Array<{ item: string; weight: number }> = [];
      const result = selector.build(items);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('EMPTY_ITEMS');
      }
    });

    it('無効な重み（0以下）の場合、エラーを返す', () => {
      const items = [
        { item: 'Valid', weight: 1.0 },
        { item: 'Invalid', weight: 0 }
      ];
      const result = selector.build(items);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_WEIGHT');
        expect(result.error.item).toBe('Invalid');
      }
    });

    it('ビルド前に選択を試みる場合、エラーを返す', () => {
      const result = selector.select();
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NOT_BUILT');
      }
    });
  });

  describe('統計的精度検証', () => {
    it('複雑な重み分布で統計的精度±5%以内を保証する', () => {
      const items = [
        { item: 'A', weight: 5.7 },
        { item: 'B', weight: 12.3 },
        { item: 'C', weight: 2.8 },
        { item: 'D', weight: 9.1 },
        { item: 'E', weight: 0.1 }
      ];
      
      const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
      const expectedProbabilities = items.reduce((acc, item) => {
        acc[item.item] = item.weight / totalWeight;
        return acc;
      }, {} as { [key: string]: number });
      
      selector.build(items);
      
      const counts: { [key: string]: number } = {};
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        const result = selector.select();
        if (result.success) {
          counts[result.data] = (counts[result.data] || 0) + 1;
        }
      }
      
      // 各アイテムの実際の確率が期待確率の±5%以内であることを確認
      for (const item of items) {
        const actualProbability = (counts[item.item] || 0) / iterations;
        const expectedProbability = expectedProbabilities[item.item];
        const tolerance = 0.05; // ±5%
        
        expect(actualProbability).toBeCloseTo(expectedProbability, tolerance);
      }
    });

    it('統計的バリデーション関数が期待確率分布を検証する', () => {
      const items = [
        { item: 'Positive', weight: 0.8 },
        { item: 'Neutral', weight: 0.15 },
        { item: 'Negative', weight: 0.05 }
      ];
      
      selector.build(items);
      
      // カスタム期待確率分布での検証
      const totalWeight = 0.8 + 0.15 + 0.05;
      const expectedProbabilities = {
        'Positive': 0.8 / totalWeight,
        'Neutral': 0.15 / totalWeight,
        'Negative': 0.05 / totalWeight
      };
      
      const validationResult = selector.validateCustomDistribution(
        expectedProbabilities, 
        5000, 
        0.05
      );
      
      expect(validationResult.success).toBe(true);
      
      if (validationResult.success) {
        expect(validationResult.data.totalSamples).toBe(5000);
        expect(validationResult.data.tolerance).toBe(0.05);
        expect(validationResult.data.deviations).toBeDefined();
        
        // すべての偏差が許容範囲内であることを確認
        for (const deviation of Object.values(validationResult.data.deviations)) {
          expect(Math.abs(deviation)).toBeLessThanOrEqual(0.05);
        }
      }
    });
  });

  describe('パフォーマンス検証', () => {
    it('大量のアイテムに対してもO(1)で選択処理を実行する', () => {
      // 1000個のアイテムを生成
      const items = Array.from({ length: 1000 }, (_, i) => ({
        item: `item-${i}`,
        weight: Math.random() * 10 + 0.1
      }));
      
      selector.build(items);
      
      // 選択処理の実行時間を測定
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        selector.select();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / 1000;
      
      // 1回の選択が1ms未満で完了することを確認（O(1)性能）
      expect(averageTime).toBeLessThan(1.0);
    });

    it('ビルド処理も合理的な時間で完了する', () => {
      const items = Array.from({ length: 10000 }, (_, i) => ({
        item: `item-${i}`,
        weight: Math.random() * 10 + 0.1
      }));
      
      const startTime = performance.now();
      const buildResult = selector.build(items);
      const endTime = performance.now();
      
      expect(buildResult.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // 100ms未満でビルド完了
    });
  });
});