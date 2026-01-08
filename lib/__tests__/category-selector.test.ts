/**
 * 確率的カテゴリ選択ロジックのテスト
 *
 * TDD - RED Phase: テストを先に書き、実装はまだ存在しない状態
 */

import {
  getPositiveProbability,
  selectCategoryAdvice,
} from '../category-selector';
import { fortuneLevels } from '../fortune-data';
import { categories } from '../category-data';

describe('category-selector', () => {
  describe('getPositiveProbability', () => {
    test('大吉で95%の確率を返す', () => {
      const daikichi = fortuneLevels.find((f) => f.id === 'daikichi')!;
      expect(getPositiveProbability(daikichi)).toBe(0.95);
    });

    test('吉で80%の確率を返す', () => {
      const kichi = fortuneLevels.find((f) => f.id === 'kichi')!;
      expect(getPositiveProbability(kichi)).toBe(0.8);
    });

    test('中吉で65%の確率を返す', () => {
      const chukichi = fortuneLevels.find((f) => f.id === 'chukichi')!;
      expect(getPositiveProbability(chukichi)).toBe(0.65);
    });

    test('小吉で55%の確率を返す', () => {
      const shokichi = fortuneLevels.find((f) => f.id === 'shokichi')!;
      expect(getPositiveProbability(shokichi)).toBe(0.55);
    });

    test('末吉で50%の確率を返す（完全ランダム）', () => {
      const suekichi = fortuneLevels.find((f) => f.id === 'suekichi')!;
      expect(getPositiveProbability(suekichi)).toBe(0.5);
    });

    test('凶で20%の確率を返す', () => {
      const kyo = fortuneLevels.find((f) => f.id === 'kyo')!;
      expect(getPositiveProbability(kyo)).toBe(0.2);
    });

    test('大凶で5%の確率を返す', () => {
      const daikyo = fortuneLevels.find((f) => f.id === 'daikyo')!;
      expect(getPositiveProbability(daikyo)).toBe(0.05);
    });

    test('不正な運勢レベルでエラーをスローする', () => {
      const invalidLevel = { id: 'invalid', name: '不正', weight: 0, rank: 99 };
      expect(() => getPositiveProbability(invalidLevel)).toThrow(
        'Unknown fortune level ID: "invalid"'
      );
    });
  });

  describe('selectCategoryAdvice', () => {
    test('positiveまたはnegativeメッセージを返す', () => {
      const fortuneLevel = fortuneLevels[0]; // 大吉
      const category = categories[0]; // コーディング運

      const advice = selectCategoryAdvice(fortuneLevel, category);

      // positiveまたはnegativeのいずれかのメッセージであることを確認
      const allMessages = [
        ...category.messagePool.positiveMessages,
        ...category.messagePool.negativeMessages,
      ];
      expect(allMessages).toContain(advice);
    });

    test('返されるメッセージが文字列である', () => {
      const fortuneLevel = fortuneLevels[2]; // 中吉
      const category = categories[1]; // レビュー運

      const advice = selectCategoryAdvice(fortuneLevel, category);

      expect(typeof advice).toBe('string');
      expect(advice.length).toBeGreaterThan(0);
    });

    test('複数回呼び出してもエラーが発生しない', () => {
      const fortuneLevel = fortuneLevels[3]; // 小吉
      const category = categories[2]; // デプロイ運

      expect(() => {
        for (let i = 0; i < 100; i++) {
          selectCategoryAdvice(fortuneLevel, category);
        }
      }).not.toThrow();
    });

    test('すべての運勢レベルとカテゴリの組み合わせで動作する', () => {
      fortuneLevels.forEach((level) => {
        categories.forEach((category) => {
          const advice = selectCategoryAdvice(level, category);
          expect(typeof advice).toBe('string');
          expect(advice.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('統計的確率検証', () => {
    const iterations = 10000;
    const tolerance = 0.02; // ±2%の許容誤差

    test('大吉で約95%の確率でpositiveメッセージが選ばれる', () => {
      const daikichi = fortuneLevels.find((f) => f.id === 'daikichi')!;
      const category = categories[0];
      let positiveCount = 0;

      for (let i = 0; i < iterations; i++) {
        const advice = selectCategoryAdvice(daikichi, category);
        if (category.messagePool.positiveMessages.includes(advice)) {
          positiveCount++;
        }
      }

      const positiveRatio = positiveCount / iterations;
      expect(positiveRatio).toBeGreaterThanOrEqual(0.95 - tolerance);
      expect(positiveRatio).toBeLessThanOrEqual(0.95 + tolerance);
    });

    test('吉で約80%の確率でpositiveメッセージが選ばれる', () => {
      const kichi = fortuneLevels.find((f) => f.id === 'kichi')!;
      const category = categories[0];
      let positiveCount = 0;

      for (let i = 0; i < iterations; i++) {
        const advice = selectCategoryAdvice(kichi, category);
        if (category.messagePool.positiveMessages.includes(advice)) {
          positiveCount++;
        }
      }

      const positiveRatio = positiveCount / iterations;
      expect(positiveRatio).toBeGreaterThanOrEqual(0.8 - tolerance);
      expect(positiveRatio).toBeLessThanOrEqual(0.8 + tolerance);
    });

    test('中吉で約65%の確率でpositiveメッセージが選ばれる', () => {
      const chukichi = fortuneLevels.find((f) => f.id === 'chukichi')!;
      const category = categories[0];
      let positiveCount = 0;

      for (let i = 0; i < iterations; i++) {
        const advice = selectCategoryAdvice(chukichi, category);
        if (category.messagePool.positiveMessages.includes(advice)) {
          positiveCount++;
        }
      }

      const positiveRatio = positiveCount / iterations;
      expect(positiveRatio).toBeGreaterThanOrEqual(0.65 - tolerance);
      expect(positiveRatio).toBeLessThanOrEqual(0.65 + tolerance);
    });

    test('末吉で約50%の確率でpositiveメッセージが選ばれる（完全ランダム）', () => {
      const suekichi = fortuneLevels.find((f) => f.id === 'suekichi')!;
      const category = categories[0];
      let positiveCount = 0;

      for (let i = 0; i < iterations; i++) {
        const advice = selectCategoryAdvice(suekichi, category);
        if (category.messagePool.positiveMessages.includes(advice)) {
          positiveCount++;
        }
      }

      const positiveRatio = positiveCount / iterations;
      expect(positiveRatio).toBeGreaterThanOrEqual(0.5 - tolerance);
      expect(positiveRatio).toBeLessThanOrEqual(0.5 + tolerance);
    });

    test('凶で約20%の確率でpositiveメッセージが選ばれる', () => {
      const kyo = fortuneLevels.find((f) => f.id === 'kyo')!;
      const category = categories[0];
      let positiveCount = 0;

      for (let i = 0; i < iterations; i++) {
        const advice = selectCategoryAdvice(kyo, category);
        if (category.messagePool.positiveMessages.includes(advice)) {
          positiveCount++;
        }
      }

      const positiveRatio = positiveCount / iterations;
      expect(positiveRatio).toBeGreaterThanOrEqual(0.2 - tolerance);
      expect(positiveRatio).toBeLessThanOrEqual(0.2 + tolerance);
    });

    test('大凶で約5%の確率でpositiveメッセージが選ばれる', () => {
      const daikyo = fortuneLevels.find((f) => f.id === 'daikyo')!;
      const category = categories[0];
      let positiveCount = 0;

      for (let i = 0; i < iterations; i++) {
        const advice = selectCategoryAdvice(daikyo, category);
        if (category.messagePool.positiveMessages.includes(advice)) {
          positiveCount++;
        }
      }

      const positiveRatio = positiveCount / iterations;
      expect(positiveRatio).toBeGreaterThanOrEqual(0.05 - tolerance);
      expect(positiveRatio).toBeLessThanOrEqual(0.05 + tolerance);
    });
  });

  describe('カテゴリ間の独立性検証', () => {
    test('複数カテゴリで同時選択しても結果が独立している', () => {
      const daikichi = fortuneLevels.find((f) => f.id === 'daikichi')!;
      const iterations = 1000;
      const results: string[][] = [];

      // 1000回、6カテゴリ全部でアドバイスを選択
      for (let i = 0; i < iterations; i++) {
        const advices = categories.map((category) =>
          selectCategoryAdvice(daikichi, category)
        );
        results.push(advices);
      }

      // 各カテゴリで異なる組み合わせが出現することを確認
      // すべてのpositiveの組み合わせだけでなく、一部negativeの組み合わせも出現するはず
      const allPositiveCount = results.filter((advices) =>
        advices.every((advice, idx) =>
          categories[idx].messagePool.positiveMessages.includes(advice)
        )
      ).length;

      // 大吉でも全部positiveにならないケースが存在するはず（確率的に）
      // 95%の6乗 = 約73.5%なので、全部positiveは73.5%程度になるはず
      const allPositiveRatio = allPositiveCount / iterations;
      expect(allPositiveRatio).toBeLessThan(0.8); // 80%未満であることを確認
      expect(allPositiveRatio).toBeGreaterThan(0.65); // 65%以上であることを確認
    });

    test('異なるカテゴリで同じ運勢レベルを使用しても結果は独立', () => {
      const chukichi = fortuneLevels.find((f) => f.id === 'chukichi')!;
      const category1 = categories[0]; // コーディング運
      const category2 = categories[1]; // レビュー運

      const iterations = 100;
      let bothSameTypeCount = 0; // 両方positiveまたは両方negative

      for (let i = 0; i < iterations; i++) {
        const advice1 = selectCategoryAdvice(chukichi, category1);
        const advice2 = selectCategoryAdvice(chukichi, category2);

        const isAdvice1Positive =
          category1.messagePool.positiveMessages.includes(advice1);
        const isAdvice2Positive =
          category2.messagePool.positiveMessages.includes(advice2);

        if (isAdvice1Positive === isAdvice2Positive) {
          bothSameTypeCount++;
        }
      }

      // 完全に独立なら、両方同じタイプになる確率は約58%（0.65^2 + 0.35^2）
      // 依存関係があると100%または0%に近づくはず
      const sameTypeRatio = bothSameTypeCount / iterations;
      expect(sameTypeRatio).toBeGreaterThan(0.4);
      expect(sameTypeRatio).toBeLessThan(0.75);
    });
  });
});
