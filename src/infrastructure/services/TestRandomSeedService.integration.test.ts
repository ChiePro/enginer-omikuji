import { describe, expect, it } from 'vitest';
import { TestRandomSeedService } from './TestRandomSeedService';

/**
 * 統合テスト: TestRandomSeedServiceの実際の使用シナリオを検証
 * おみくじシステムでの決定論的動作を保証
 */
describe('TestRandomSeedService Integration Tests', () => {
  const service = new TestRandomSeedService();

  describe('おみくじ運勢選択シミュレーション', () => {
    // 運勢の定義（実際のシステムに近い形）
    const fortunes = [
      { name: '大吉', value: 100, weight: 0.10 },  // 10%
      { name: '中吉', value: 80, weight: 0.20 },   // 20%
      { name: '吉', value: 60, weight: 0.25 },     // 25%
      { name: '小吉', value: 40, weight: 0.20 },   // 20%
      { name: '末吉', value: 20, weight: 0.15 },   // 15%
      { name: '凶', value: -20, weight: 0.08 },    // 8%
      { name: '大凶', value: -50, weight: 0.02 }   // 2%
    ];

    const fortuneNames = fortunes.map(f => f.name);
    const fortuneWeights = fortunes.map(f => f.weight);

    it('同一シードで完全に同じおみくじ結果シーケンスを生成する', async () => {
      const seed = 'omikuji-test-2024';
      const drawCount = 100;

      // 1回目の実行
      const results1 = await service.reproducibleTest(seed, (rng) => {
        return Array.from({ length: drawCount }, () =>
          service.weightedRandom(fortuneNames, fortuneWeights, rng)
        );
      });

      // 2回目の実行
      const results2 = await service.reproducibleTest(seed, (rng) => {
        return Array.from({ length: drawCount }, () =>
          service.weightedRandom(fortuneNames, fortuneWeights, rng)
        );
      });

      // 完全に同じ結果であることを検証
      expect(results1).toEqual(results2);
      expect(results1).toHaveLength(drawCount);
      expect(results2).toHaveLength(drawCount);
    });

    it('統計的分布が期待値に収束する（大数の法則）', async () => {
      const seed = 'statistics-test';
      const drawCount = 10000;

      const results = await service.reproducibleTest(seed, (rng) => {
        return Array.from({ length: drawCount }, () =>
          service.weightedRandom(fortuneNames, fortuneWeights, rng)
        );
      });

      // 各運勢の出現回数を集計
      const distribution = new Map<string, number>();
      results.forEach(fortune => {
        distribution.set(fortune, (distribution.get(fortune) || 0) + 1);
      });

      // 統計的精度を検証（±5%以内）
      fortunes.forEach(({ name, weight }) => {
        const actualCount = distribution.get(name) || 0;
        const actualPercentage = actualCount / drawCount;
        const expectedPercentage = weight;
        const tolerance = 0.05; // 5%の許容誤差

        expect(Math.abs(actualPercentage - expectedPercentage)).toBeLessThanOrEqual(tolerance);
      });
    });
  });

  describe('カテゴリコンテンツ選択シミュレーション', () => {
    // 感情属性の分布（メイン運勢に応じて変化）
    const emotionDistributions = {
      大吉: { positive: 1.0, neutral: 0.0, negative: 0.0 },
      中吉: { positive: 0.7, neutral: 0.2, negative: 0.1 },
      吉: { positive: 0.5, neutral: 0.3, negative: 0.2 },
      小吉: { positive: 0.4, neutral: 0.4, negative: 0.2 },
      末吉: { positive: 0.3, neutral: 0.4, negative: 0.3 },
      凶: { positive: 0.1, neutral: 0.3, negative: 0.6 },
      大凶: { positive: 0.0, neutral: 0.0, negative: 1.0 }
    };

    it('メイン運勢に応じた感情属性の分布を再現する', async () => {
      const seed = 'emotion-test';
      const categoryCount = 5; // 恋愛運、仕事運、健康運、金運、学業運
      
      for (const [fortuneName, emotionWeights] of Object.entries(emotionDistributions)) {
        const attributes = ['positive', 'neutral', 'negative'];
        const weights = [emotionWeights.positive, emotionWeights.neutral, emotionWeights.negative];

        // 各カテゴリの感情属性を選択
        const categoryResults = await service.reproducibleTest(`${seed}-${fortuneName}`, (rng) => {
          return Array.from({ length: categoryCount }, () =>
            service.weightedRandom(attributes, weights, rng)
          );
        });

        // 大吉は全てpositive、大凶は全てnegativeであることを検証
        if (fortuneName === '大吉') {
          expect(categoryResults.every(attr => attr === 'positive')).toBe(true);
        } else if (fortuneName === '大凶') {
          expect(categoryResults.every(attr => attr === 'negative')).toBe(true);
        }

        // 再現性を検証
        const categoryResults2 = await service.reproducibleTest(`${seed}-${fortuneName}`, (rng) => {
          return Array.from({ length: categoryCount }, () =>
            service.weightedRandom(attributes, weights, rng)
          );
        });

        expect(categoryResults).toEqual(categoryResults2);
      }
    });
  });

  describe('複数シード管理による並行テスト', () => {
    it('異なるシードが独立した結果を生成する', async () => {
      const seeds = ['test-user-1', 'test-user-2', 'test-user-3'];
      const results: string[][] = [];

      // 各シードで10回おみくじを引く
      for (const seed of seeds) {
        const userResults = await service.reproducibleTest(seed, (rng) => {
          const fortunes = ['大吉', '吉', '凶'];
          const weights = [0.3, 0.5, 0.2];
          return Array.from({ length: 10 }, () =>
            service.weightedRandom(fortunes, weights, rng)
          );
        });
        results.push(userResults);
      }

      // 異なるシードは異なる結果を生成することを検証
      expect(results[0]).not.toEqual(results[1]);
      expect(results[1]).not.toEqual(results[2]);
      expect(results[0]).not.toEqual(results[2]);

      // 同じシードで再実行すると同じ結果になることを検証
      const rerun = await service.reproducibleTest(seeds[0], (rng) => {
        const fortunes = ['大吉', '吉', '凶'];
        const weights = [0.3, 0.5, 0.2];
        return Array.from({ length: 10 }, () =>
          service.weightedRandom(fortunes, weights, rng)
        );
      });

      expect(rerun).toEqual(results[0]);
    });
  });

  describe('エッジケースとエラーハンドリング', () => {
    it('極端な重み配分でも正しく動作する', async () => {
      const seed = 'edge-case-test';

      // ほぼ確実に特定の項目が選ばれる配分
      const items = ['A', 'B', 'C'];
      const weights = [0.999, 0.0005, 0.0005];

      const results = await service.reproducibleTest(seed, (rng) => {
        return Array.from({ length: 1000 }, () =>
          service.weightedRandom(items, weights, rng)
        );
      });

      const aCount = results.filter(r => r === 'A').length;
      expect(aCount).toBeGreaterThan(990); // 99%以上がA
    });

    it('重みが0の項目は選択されない', async () => {
      const seed = 'zero-weight-test';
      const items = ['選択される', '選択されない'];
      const weights = [1.0, 0.0];

      const results = await service.reproducibleTest(seed, (rng) => {
        return Array.from({ length: 100 }, () =>
          service.weightedRandom(items, weights, rng)
        );
      });

      expect(results.every(r => r === '選択される')).toBe(true);
    });
  });
});