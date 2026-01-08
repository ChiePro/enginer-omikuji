import { describe, expect, it, beforeEach, vi } from 'vitest';
import { TestRandomSeedService } from './TestRandomSeedService';

describe('TestRandomSeedService', () => {
  let service: TestRandomSeedService;

  beforeEach(() => {
    service = new TestRandomSeedService();
  });

  describe('seedableRandom', () => {
    it('同じシードで同じ乱数列を生成する', () => {
      const seed = 'test-seed-123';
      
      // 最初のシーケンス
      const rng1 = service.seedableRandom(seed);
      const sequence1 = Array.from({ length: 10 }, () => rng1());
      
      // 同じシードで新しいジェネレータを作成
      const rng2 = service.seedableRandom(seed);
      const sequence2 = Array.from({ length: 10 }, () => rng2());
      
      // 同じシーケンスを生成することを検証
      expect(sequence1).toEqual(sequence2);
    });

    it('異なるシードで異なる乱数列を生成する', () => {
      const seed1 = 'test-seed-123';
      const seed2 = 'test-seed-456';
      
      const rng1 = service.seedableRandom(seed1);
      const rng2 = service.seedableRandom(seed2);
      
      const sequence1 = Array.from({ length: 10 }, () => rng1());
      const sequence2 = Array.from({ length: 10 }, () => rng2());
      
      // 異なるシーケンスを生成することを検証
      expect(sequence1).not.toEqual(sequence2);
    });

    it('生成される値が0以上1未満の範囲内である', () => {
      const seed = 'test-seed-789';
      const rng = service.seedableRandom(seed);
      
      const values = Array.from({ length: 1000 }, () => rng());
      
      values.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      });
    });
  });

  describe('reproducibleTest', () => {
    it('再現可能なテスト環境を提供する', async () => {
      const seed = 'reproducible-test';
      const testFn = vi.fn((rng: () => number) => {
        return Array.from({ length: 5 }, () => Math.floor(rng() * 100));
      });
      
      // 最初の実行
      const result1 = await service.reproducibleTest(seed, testFn);
      
      // 2回目の実行
      const result2 = await service.reproducibleTest(seed, testFn);
      
      // 同じ結果を返すことを検証
      expect(result1).toEqual(result2);
      expect(testFn).toHaveBeenCalledTimes(2);
    });

    it('異なるシードで異なる結果を返す', async () => {
      const testFn = (rng: () => number) => {
        return Array.from({ length: 5 }, () => Math.floor(rng() * 100));
      };
      
      const result1 = await service.reproducibleTest('seed1', testFn);
      const result2 = await service.reproducibleTest('seed2', testFn);
      
      expect(result1).not.toEqual(result2);
    });
  });

  describe('weightedRandom', () => {
    it('重み付きランダム選択が期待通り動作する', () => {
      const seed = 'weighted-test';
      const rng = service.seedableRandom(seed);
      
      const items = ['A', 'B', 'C'];
      const weights = [0.5, 0.3, 0.2]; // A: 50%, B: 30%, C: 20%
      
      const results = new Map<string, number>();
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        const selected = service.weightedRandom(items, weights, rng);
        results.set(selected, (results.get(selected) || 0) + 1);
      }
      
      // 統計的精度を検証（±5%の許容範囲）
      const aPercentage = (results.get('A') || 0) / iterations;
      const bPercentage = (results.get('B') || 0) / iterations;
      const cPercentage = (results.get('C') || 0) / iterations;
      
      expect(aPercentage).toBeCloseTo(0.5, 1);
      expect(bPercentage).toBeCloseTo(0.3, 1);
      expect(cPercentage).toBeCloseTo(0.2, 1);
    });

    it('決定論的な動作を保証する', () => {
      const seed = 'deterministic-weighted';
      const items = ['大吉', '吉', '凶'];
      const weights = [0.4, 0.4, 0.2];
      
      // 同じシードで2回実行
      const rng1 = service.seedableRandom(seed);
      const results1 = Array.from({ length: 20 }, () => 
        service.weightedRandom(items, weights, rng1)
      );
      
      const rng2 = service.seedableRandom(seed);
      const results2 = Array.from({ length: 20 }, () => 
        service.weightedRandom(items, weights, rng2)
      );
      
      expect(results1).toEqual(results2);
    });
  });
});