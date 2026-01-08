/**
 * カテゴリ選択のパフォーマンステスト
 */

import { selectCategoryAdvice } from '../category-selector';
import { fortuneLevels } from '../fortune-data';
import { categories } from '../category-data';

describe('category-selector パフォーマンス', () => {
  describe('selectCategoryAdvice パフォーマンス', () => {
    test('1,000回の実行が1ms以下で完了する', () => {
      const fortuneLevel = fortuneLevels[0]; // 大吉
      const category = categories[0]; // コーディング運
      const iterations = 1000;

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        selectCategoryAdvice(fortuneLevel, category);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;

      // 平均実行時間が1ms以下であることを確認
      expect(averageTime).toBeLessThan(1);
    });

    test('異なる運勢レベルでも一貫したパフォーマンス', () => {
      const category = categories[0];
      const results: number[] = [];

      fortuneLevels.forEach((level) => {
        const startTime = performance.now();

        for (let i = 0; i < 1000; i++) {
          selectCategoryAdvice(level, category);
        }

        const endTime = performance.now();
        const averageTime = (endTime - startTime) / 1000;
        results.push(averageTime);
      });

      // すべての運勢レベルで1ms以下
      results.forEach((time) => {
        expect(time).toBeLessThan(1);
      });
    });

    test('異なるカテゴリでも一貫したパフォーマンス', () => {
      const fortuneLevel = fortuneLevels[2]; // 中吉
      const results: number[] = [];

      categories.forEach((category) => {
        const startTime = performance.now();

        for (let i = 0; i < 1000; i++) {
          selectCategoryAdvice(fortuneLevel, category);
        }

        const endTime = performance.now();
        const averageTime = (endTime - startTime) / 1000;
        results.push(averageTime);
      });

      // すべてのカテゴリで1ms以下
      results.forEach((time) => {
        expect(time).toBeLessThan(1);
      });
    });
  });

  describe('メモリリーク検証', () => {
    test('1,000回連続実行でメモリリークがないこと', () => {
      const fortuneLevel = fortuneLevels[0];
      const category = categories[0];

      // ガベージコレクションを促す（Node.jsの場合）
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage().heapUsed;

      // 1,000回実行
      for (let i = 0; i < 1000; i++) {
        selectCategoryAdvice(fortuneLevel, category);
      }

      // ガベージコレクションを促す
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // メモリ増加が1MB未満であることを確認（純粋関数なのでほぼ増加しないはず）
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });

    test('全運勢レベル×全カテゴリの組み合わせでメモリリークなし', () => {
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage().heapUsed;

      // 全組み合わせで100回ずつ実行（7運勢 × 6カテゴリ × 100回 = 4,200回）
      for (let i = 0; i < 100; i++) {
        fortuneLevels.forEach((level) => {
          categories.forEach((category) => {
            selectCategoryAdvice(level, category);
          });
        });
      }

      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // メモリ増加が2MB未満であることを確認
      expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024);
    });
  });
});
