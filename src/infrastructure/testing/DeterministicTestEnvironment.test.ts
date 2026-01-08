import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { DeterministicTestEnvironment } from './DeterministicTestEnvironment';
import { CategoryRandomizationService } from '../../domain/services/CategoryRandomizationService';
import { Fortune } from '../../domain/valueObjects/Fortune';
import { FortuneCategory } from '../../domain/valueObjects/FortuneCategory';

describe('DeterministicTestEnvironment', () => {
  let testEnv: DeterministicTestEnvironment;

  beforeEach(() => {
    testEnv = new DeterministicTestEnvironment();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  // Helper to create fortune
  const createFortune = (id: string, japaneseName: string, value: number): Fortune => {
    return Fortune.fromData({
      id,
      englishName: id,
      japaneseName,
      description: `${japaneseName}の運勢`,
      probability: 0.1,
      value,
      color: { primary: '#000000', secondary: '#ffffff', background: '#f0f0f0' },
      effects: { glow: false, sparkle: false, animation: null }
    });
  };

  describe('シード管理機能', () => {
    it('テスト用シードを設定して再現可能な結果を生成する', async () => {
      const testSeed = 'test-seed-123';
      
      await testEnv.withSeed(testSeed, async (env) => {
        const rng1 = env.getRandom();
        const value1 = rng1();
        
        const rng2 = env.getRandom();
        const value2 = rng2();

        // 同じシードで実行すると同じ結果が得られる
        await testEnv.withSeed(testSeed, async (env2) => {
          const rng3 = env2.getRandom();
          expect(rng3()).toBe(value1);
          
          const rng4 = env2.getRandom();
          expect(rng4()).toBe(value2);
        });
      });
    });

    it('異なるシードは異なる結果を生成する', async () => {
      const seed1 = 'seed-1';
      const seed2 = 'seed-2';
      const results1: number[] = [];
      const results2: number[] = [];

      await testEnv.withSeed(seed1, async (env) => {
        const rng = env.getRandom();
        for (let i = 0; i < 5; i++) {
          results1.push(rng());
        }
      });

      await testEnv.withSeed(seed2, async (env) => {
        const rng = env.getRandom();
        for (let i = 0; i < 5; i++) {
          results2.push(rng());
        }
      });

      expect(results1).not.toEqual(results2);
    });

    it('ネストされたシード環境で適切に分離される', async () => {
      const outerSeed = 'outer-seed';
      const innerSeed = 'inner-seed';

      await testEnv.withSeed(outerSeed, async (outerEnv) => {
        const outerValue = outerEnv.getRandom()();

        await testEnv.withSeed(innerSeed, async (innerEnv) => {
          const innerValue = innerEnv.getRandom()();
          expect(innerValue).not.toBe(outerValue);
        });

        // 外側の環境は影響を受けない
        const nextOuterValue = outerEnv.getRandom()();
        expect(nextOuterValue).not.toBe(outerValue);
      });
    });
  });

  describe('テストアイソレーション機能', () => {
    it('各テストケースで独立した乱数状態を維持する', async () => {
      const testCase1Results: number[] = [];
      const testCase2Results: number[] = [];

      // テストケース1
      await testEnv.isolatedTest('test-case-1', async (env) => {
        const rng = env.getRandom();
        for (let i = 0; i < 3; i++) {
          testCase1Results.push(rng());
        }
      });

      // テストケース2（同じ名前で実行）
      await testEnv.isolatedTest('test-case-1', async (env) => {
        const rng = env.getRandom();
        for (let i = 0; i < 3; i++) {
          testCase2Results.push(rng());
        }
      });

      // 同じテストケース名なので同じ結果
      expect(testCase1Results).toEqual(testCase2Results);
    });

    it('異なるテストケース名では異なる結果を生成する', async () => {
      const testA: number[] = [];
      const testB: number[] = [];

      await testEnv.isolatedTest('test-a', async (env) => {
        const rng = env.getRandom();
        testA.push(rng(), rng(), rng());
      });

      await testEnv.isolatedTest('test-b', async (env) => {
        const rng = env.getRandom();
        testB.push(rng(), rng(), rng());
      });

      expect(testA).not.toEqual(testB);
    });

    it('グローバルMath.randomが影響しない', async () => {
      const originalMathRandom = Math.random;
      const mockMathRandom = vi.fn(() => 0.999);
      
      // Math.randomをモック
      global.Math.random = mockMathRandom;

      await testEnv.isolatedTest('math-random-test', async (env) => {
        const rng = env.getRandom();
        const value = rng();
        
        // 決定論的な値が得られる（モックされたMath.randomの影響を受けない）
        expect(value).not.toBe(0.999);
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      });

      // 後片付け
      global.Math.random = originalMathRandom;
    });
  });

  describe('統合テスト用再現可能結果セット', () => {
    it('ランダム化サービスの結果が再現可能である', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      
      // モックサービスを作成
      const mockRandomizationService = {
        randomizeCategories: vi.fn().mockResolvedValue({
          success: true,
          data: FortuneCategory.getAllRequiredCategories()
        })
      } as any;

      const results1 = await testEnv.reproducibleIntegrationTest(
        'randomization-test',
        async (env) => {
          // サービスにシードを提供
          const seed = env.generateSeed('randomization');
          
          return mockRandomizationService.randomizeCategories(fortune, undefined, seed);
        }
      );

      const results2 = await testEnv.reproducibleIntegrationTest(
        'randomization-test',
        async (env) => {
          const seed = env.generateSeed('randomization');
          
          return mockRandomizationService.randomizeCategories(fortune, undefined, seed);
        }
      );

      expect(results1).toEqual(results2);
    });

    it('複数のサービスを組み合わせた統合テストが再現可能である', async () => {
      const fortune = createFortune('daikichi', '大吉', 4);
      
      const scenario1 = await testEnv.reproducibleIntegrationTest(
        'multi-service-test',
        async (env) => {
          const randomSeed = env.generateSeed('random');
          const poolSeed = env.generateSeed('pool');
          const sessionSeed = env.generateSeed('session');

          return {
            randomResult: env.getRandom(randomSeed)(),
            poolResult: env.getRandom(poolSeed)(),
            sessionResult: env.getRandom(sessionSeed)(),
            timestamp: env.getTestTimestamp()
          };
        }
      );

      const scenario2 = await testEnv.reproducibleIntegrationTest(
        'multi-service-test',
        async (env) => {
          const randomSeed = env.generateSeed('random');
          const poolSeed = env.generateSeed('pool');
          const sessionSeed = env.generateSeed('session');

          return {
            randomResult: env.getRandom(randomSeed)(),
            poolResult: env.getRandom(poolSeed)(),
            sessionResult: env.getRandom(sessionSeed)(),
            timestamp: env.getTestTimestamp()
          };
        }
      );

      expect(scenario1).toEqual(scenario2);
    });

    it('時間依存のテストも再現可能にする', async () => {
      const baseTime = new Date('2024-01-01T00:00:00Z');

      const result1 = await testEnv.reproducibleIntegrationTest(
        'time-test',
        async (env) => {
          env.setTestTime(baseTime);
          
          return {
            now: env.getTestTimestamp(),
            future: env.addTime(3600000), // 1時間後
            sessionCreated: env.generateSessionId()
          };
        }
      );

      const result2 = await testEnv.reproducibleIntegrationTest(
        'time-test',
        async (env) => {
          env.setTestTime(baseTime);
          
          return {
            now: env.getTestTimestamp(),
            future: env.addTime(3600000),
            sessionCreated: env.generateSessionId()
          };
        }
      );

      expect(result1).toEqual(result2);
    });
  });

  describe('統計的精度検証', () => {
    it('大量のサンプルで統計的特性を検証できる', async () => {
      const sampleCount = 10000;
      const expectedMean = 0.5;
      const tolerance = 0.01;

      const result = await testEnv.reproducibleIntegrationTest(
        'statistical-test',
        async (env) => {
          const rng = env.getRandom();
          const samples: number[] = [];
          
          for (let i = 0; i < sampleCount; i++) {
            samples.push(rng());
          }
          
          const sum = samples.reduce((acc, val) => acc + val, 0);
          const mean = sum / samples.length;
          
          return { samples, mean, sampleCount };
        }
      );

      expect(result.mean).toBeCloseTo(expectedMean, 2);
      expect(result.sampleCount).toBe(sampleCount);
    });

    it('確率分布の検証が再現可能である', async () => {
      const weights = [0.1, 0.2, 0.3, 0.4];
      const items = ['A', 'B', 'C', 'D'];
      const sampleCount = 10000;

      const distribution1 = await testEnv.reproducibleIntegrationTest(
        'distribution-test',
        async (env) => {
          const rng = env.getRandom();
          const counts = { A: 0, B: 0, C: 0, D: 0 };
          
          for (let i = 0; i < sampleCount; i++) {
            const selected = env.weightedSelection(items, weights, rng());
            counts[selected as keyof typeof counts]++;
          }
          
          return counts;
        }
      );

      const distribution2 = await testEnv.reproducibleIntegrationTest(
        'distribution-test',
        async (env) => {
          const rng = env.getRandom();
          const counts = { A: 0, B: 0, C: 0, D: 0 };
          
          for (let i = 0; i < sampleCount; i++) {
            const selected = env.weightedSelection(items, weights, rng());
            counts[selected as keyof typeof counts]++;
          }
          
          return counts;
        }
      );

      expect(distribution1).toEqual(distribution2);
    });
  });
});