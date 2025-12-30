/**
 * パフォーマンステスト
 *
 * タスク5.2の要件をテストする:
 * - 運勢選択処理が1ms以下で完了すること
 * - メッセージ取得処理が0.5ms以下で完了すること
 * - 1,000回連続呼び出しでメモリリークがないこと
 */

import { drawFortune } from '../draw-fortune';
import { getFortuneMessage } from '../fortune-message-getter';
import { selectRandomFortune } from '../fortune-selector';

describe('パフォーマンス検証', () => {
  describe('運勢選択処理のパフォーマンス', () => {
    test('運勢選択処理が1ms以下で完了すること', () => {
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        selectRandomFortune();
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;

      // 平均実行時間が1ms以下であることを確認
      expect(averageTime).toBeLessThan(1);
    });

    test('運勢抽選（統合処理）が適切なパフォーマンスで動作すること', () => {
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        drawFortune('daily-luck');
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;

      // 統合処理（選択+メッセージ取得）が2ms以下であることを確認
      expect(averageTime).toBeLessThan(2);
    });
  });

  describe('メッセージ取得処理のパフォーマンス', () => {
    test('メッセージ取得処理が0.5ms以下で完了すること', () => {
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        getFortuneMessage('daily-luck', 'daikichi');
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;

      // 平均実行時間が0.5ms以下であることを確認
      expect(averageTime).toBeLessThan(0.5);
    });

    test('異なる組み合わせでも一貫したパフォーマンスであること', () => {
      const testCases = [
        { omikujiId: 'daily-luck', fortuneId: 'daikichi' },
        { omikujiId: 'daily-luck', fortuneId: 'kichi' },
        { omikujiId: 'daily-luck', fortuneId: 'chukichi' },
        { omikujiId: 'daily-luck', fortuneId: 'daikyo' },
      ];

      const executionTimes: number[] = [];

      testCases.forEach(({ omikujiId, fortuneId }) => {
        const iterations = 100;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
          getFortuneMessage(omikujiId, fortuneId);
        }

        const endTime = performance.now();
        const averageTime = (endTime - startTime) / iterations;
        executionTimes.push(averageTime);
      });

      // 全てのケースで0.5ms以下であることを確認
      executionTimes.forEach((time) => {
        expect(time).toBeLessThan(0.5);
      });
    });
  });

  describe('メモリリークの検証', () => {
    test('1,000回連続呼び出しでメモリリークがないこと', () => {
      // メモリ使用量の基準値を取得（ガベージコレクション後）
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage().heapUsed;

      // 1,000回連続で運勢抽選を実行
      for (let i = 0; i < 1000; i++) {
        drawFortune('daily-luck');
      }

      // ガベージコレクションを実行（利用可能な場合）
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // メモリ増加が2MB以下であることを確認（合理的な閾値）
      // 注: Node.jsの実装により、完全に0にはならない場合がある
      expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024);
    });

    test('連続呼び出ししても問題ないこと', () => {
      // 1,000回実行
      for (let i = 0; i < 1000; i++) {
        const result = drawFortune('daily-luck');
        expect(result).toBeDefined();
      }

      // エラーなく完了することを確認（暗黙的な検証）
      expect(true).toBe(true);
    });
  });

  describe('大量データ処理の検証', () => {
    test('10,000回の抽選が10秒以内に完了すること', () => {
      const iterations = 10000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        drawFortune('daily-luck');
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 10,000回の処理が10秒（10,000ms）以内に完了することを確認
      expect(totalTime).toBeLessThan(10000);

      // 平均実行時間が1ms以下であることも確認
      const averageTime = totalTime / iterations;
      expect(averageTime).toBeLessThan(1);
    });
  });
});
