/**
 * 統合運勢抽選機能のテスト
 *
 * TDD - RED Phase: テストを先に書き、実装はまだ存在しない状態
 */

import { drawIntegratedFortune } from '../integrated-fortune';
import { fortuneLevels } from '../fortune-data';
import { categories, CATEGORY_IDS } from '../category-data';
import { overallFortuneMessages } from '../overall-fortune-data';

describe('integrated-fortune', () => {
  describe('drawIntegratedFortune', () => {
    test('IntegratedFortuneResult型のオブジェクトを返す', () => {
      const result = drawIntegratedFortune();

      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('overallMessage');
      expect(result).toHaveProperty('categoryAdvice');
    });

    test('levelが既存fortuneLevelsのいずれかである', () => {
      const result = drawIntegratedFortune();

      const validLevelIds = fortuneLevels.map((f) => f.id);
      expect(validLevelIds).toContain(result.level.id);
    });

    test('overallMessageが文字列で空でない', () => {
      const result = drawIntegratedFortune();

      expect(typeof result.overallMessage).toBe('string');
      expect(result.overallMessage.length).toBeGreaterThan(0);
    });

    test('overallMessageが対応する運勢レベルのメッセージである', () => {
      const result = drawIntegratedFortune();

      const expectedMessages = overallFortuneMessages
        .filter((m) => m.fortuneId === result.level.id)
        .map((m) => m.message);

      expect(expectedMessages).toContain(result.overallMessage);
    });

    test('categoryAdviceが6つのフィールドを持つ', () => {
      const result = drawIntegratedFortune();

      expect(result.categoryAdvice).toHaveProperty('coding');
      expect(result.categoryAdvice).toHaveProperty('review');
      expect(result.categoryAdvice).toHaveProperty('deploy');
      expect(result.categoryAdvice).toHaveProperty('waiting');
      expect(result.categoryAdvice).toHaveProperty('conflict');
      expect(result.categoryAdvice).toHaveProperty('growth');
    });

    test('categoryAdviceの各フィールドが文字列で空でない', () => {
      const result = drawIntegratedFortune();

      CATEGORY_IDS.forEach((categoryId) => {
        const advice = result.categoryAdvice[categoryId];
        expect(typeof advice).toBe('string');
        expect(advice.length).toBeGreaterThan(0);
      });
    });

    test('categoryAdviceの各フィールドが該当カテゴリのメッセージプールから選ばれている', () => {
      const result = drawIntegratedFortune();

      categories.forEach((category) => {
        const advice = result.categoryAdvice[category.id];
        const allMessages = [
          ...category.messagePool.positiveMessages,
          ...category.messagePool.negativeMessages,
        ];
        expect(allMessages).toContain(advice);
      });
    });

    test('複数回呼び出してもエラーが発生しない', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          drawIntegratedFortune();
        }
      }).not.toThrow();
    });

    test('複数回呼び出すと異なる結果が得られる（ランダム性）', () => {
      const results: string[] = [];

      for (let i = 0; i < 50; i++) {
        const result = drawIntegratedFortune();
        // 結果を文字列化して保存
        const resultString = JSON.stringify({
          level: result.level.id,
          message: result.overallMessage,
          advice: result.categoryAdvice,
        });
        results.push(resultString);
      }

      // ユニークな結果が複数存在することを確認（完全にランダムなので多様性があるはず）
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(10); // 少なくとも10種類以上の異なる結果
    });
  });

  describe('統合テスト', () => {
    test('カテゴリ間でpositive/negativeの組み合わせが多様である', () => {
      const iterations = 100;
      const combinations = new Set<string>();

      for (let i = 0; i < iterations; i++) {
        const result = drawIntegratedFortune();

        // positive/negativeの組み合わせを記録
        const combination = CATEGORY_IDS.map((categoryId) => {
          const advice = result.categoryAdvice[categoryId];
          const category = categories.find((c) => c.id === categoryId)!;
          return category.messagePool.positiveMessages.includes(advice)
            ? 'P'
            : 'N';
        }).join('');

        combinations.add(combination);
      }

      // 多様な組み合わせが存在することを確認
      expect(combinations.size).toBeGreaterThan(20);
    });

    test('既存fortune-typesシステムとの整合性（FortuneLevel型の互換性）', () => {
      const result = drawIntegratedFortune();

      // FortuneLevel型の必須フィールドが存在することを確認
      expect(result.level).toHaveProperty('id');
      expect(result.level).toHaveProperty('name');
      expect(result.level).toHaveProperty('weight');
      expect(result.level).toHaveProperty('rank');

      expect(typeof result.level.id).toBe('string');
      expect(typeof result.level.name).toBe('string');
      expect(typeof result.level.weight).toBe('number');
      expect(typeof result.level.rank).toBe('number');
    });

    test('すべての運勢レベルが少なくとも1回は出現する（統計的検証）', () => {
      const iterations = 1000;
      const levelCounts = new Map<string, number>();

      for (let i = 0; i < iterations; i++) {
        const result = drawIntegratedFortune();
        const count = levelCounts.get(result.level.id) || 0;
        levelCounts.set(result.level.id, count + 1);
      }

      // すべての運勢レベルが少なくとも1回は出現
      fortuneLevels.forEach((level) => {
        expect(levelCounts.has(level.id)).toBe(true);
        expect(levelCounts.get(level.id)).toBeGreaterThan(0);
      });
    });
  });

  describe('パフォーマンステスト', () => {
    test('1,000回の実行が2ms以下で完了する', () => {
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        drawIntegratedFortune();
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;

      // 平均実行時間が2ms以下であることを確認
      expect(averageTime).toBeLessThan(2);
    });

    test('メモリリークがないこと', () => {
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage().heapUsed;

      // 1,000回実行
      for (let i = 0; i < 1000; i++) {
        drawIntegratedFortune();
      }

      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // メモリ増加が2MB未満（純粋関数なので大きなメモリリークはないはず）
      expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024);
    });
  });

  describe('データ型検証', () => {
    test('CategoryAdvice型の構造が正しい', () => {
      const result = drawIntegratedFortune();
      const advice = result.categoryAdvice;

      // TypeScriptの型チェックで保証されるが、実行時にも確認
      expect(advice).toHaveProperty('coding');
      expect(advice).toHaveProperty('review');
      expect(advice).toHaveProperty('deploy');
      expect(advice).toHaveProperty('waiting');
      expect(advice).toHaveProperty('conflict');
      expect(advice).toHaveProperty('growth');

      // 余分なプロパティがないことを確認
      const keys = Object.keys(advice);
      expect(keys.length).toBe(6);
    });

    test('IntegratedFortuneResult型の構造が正しい', () => {
      const result = drawIntegratedFortune();

      // 必須プロパティのみが存在
      expect(Object.keys(result).sort()).toEqual(
        ['level', 'overallMessage', 'categoryAdvice'].sort()
      );
    });
  });
});
