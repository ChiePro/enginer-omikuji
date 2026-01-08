/**
 * 運勢選択ロジックのテスト
 *
 * タスク2.1の要件をテストする:
 * - 運勢レベルの重みに基づいた累積確率配列が生成されること
 * - ランダムに運勢を選択する関数が正しく動作すること
 * - 大吉・吉・中吉が高確率で選ばれること
 * - 純粋関数として実装され、テスト可能であること
 * - 選択された運勢レベルが返されること
 */

import { selectRandomFortune } from '../fortune-selector';
import { fortuneLevels } from '../fortune-data';

describe('運勢ランダム選択ロジック', () => {
  describe('基本動作の検証', () => {
    test('運勢を選択する関数が存在すること', () => {
      expect(selectRandomFortune).toBeDefined();
      expect(typeof selectRandomFortune).toBe('function');
    });

    test('運勢を選択すると運勢レベルが返されること', () => {
      const result = selectRandomFortune();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('weight');
      expect(result).toHaveProperty('rank');
    });

    test('返される運勢が7種類のいずれかであること', () => {
      const result = selectRandomFortune();
      const fortuneIds = fortuneLevels.map((f) => f.id);

      expect(fortuneIds).toContain(result.id);
    });

    test('複数回実行しても運勢が選択されること', () => {
      for (let i = 0; i < 10; i++) {
        const result = selectRandomFortune();
        expect(result).toBeDefined();
        expect(result.id).toBeTruthy();
      }
    });
  });

  describe('確率分布の検証', () => {
    test('1,000回の抽選で全ての運勢が少なくとも1回は選ばれること', () => {
      const results = new Set<string>();

      for (let i = 0; i < 1000; i++) {
        const result = selectRandomFortune();
        results.add(result.id);
      }

      // 7種類全ての運勢が選ばれることを確認
      expect(results.size).toBe(7);
    });

    test('10,000回の抽選で各運勢の出現率が重みに近いこと（許容誤差±7%）', () => {
      const counts: Record<string, number> = {};
      const iterations = 10000;

      // 初期化
      fortuneLevels.forEach((fortune) => {
        counts[fortune.id] = 0;
      });

      // 10,000回抽選
      for (let i = 0; i < iterations; i++) {
        const result = selectRandomFortune();
        counts[result.id]++;
      }

      // 各運勢の出現率が期待値に近いことを確認（許容誤差±7%）
      fortuneLevels.forEach((fortune) => {
        const actualRate = (counts[fortune.id] / iterations) * 100;
        const expectedRate = fortune.weight;
        const tolerance = 7; // 許容誤差

        expect(actualRate).toBeGreaterThanOrEqual(expectedRate - tolerance);
        expect(actualRate).toBeLessThanOrEqual(expectedRate + tolerance);
      });
    });

    test('大吉・吉・中吉の合計出現率が高いこと（70%前後、許容誤差±10%）', () => {
      const counts = { high: 0, medium: 0, low: 0 };
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const result = selectRandomFortune();

        if (['daikichi', 'kichi', 'chukichi'].includes(result.id)) {
          counts.high++;
        } else if (['shokichi', 'suekichi'].includes(result.id)) {
          counts.medium++;
        } else {
          counts.low++;
        }
      }

      const highRate = (counts.high / iterations) * 100;

      // 大吉・吉・中吉の合計が73%前後（許容誤差±10%）
      expect(highRate).toBeGreaterThanOrEqual(63);
      expect(highRate).toBeLessThanOrEqual(83);
    });

    test('凶・大凶の合計出現率が低いこと（7%前後、許容誤差±5%）', () => {
      const counts = { bad: 0 };
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const result = selectRandomFortune();

        if (['kyo', 'daikyo'].includes(result.id)) {
          counts.bad++;
        }
      }

      const badRate = (counts.bad / iterations) * 100;

      // 凶・大凶の合計が7%前後（許容誤差±5%）
      expect(badRate).toBeGreaterThanOrEqual(2);
      expect(badRate).toBeLessThanOrEqual(12);
    });
  });

  describe('純粋関数性の検証', () => {
    test('関数が副作用を持たないこと（同じ入力で実行しても元のデータが変わらない）', () => {
      const originalLevels = [...fortuneLevels];

      // 複数回実行
      for (let i = 0; i < 100; i++) {
        selectRandomFortune();
      }

      // fortuneLevelsが変更されていないことを確認
      expect(fortuneLevels).toEqual(originalLevels);
    });

    test('関数が常に有効な運勢レベルオブジェクトを返すこと', () => {
      for (let i = 0; i < 100; i++) {
        const result = selectRandomFortune();

        // 運勢レベルオブジェクトの構造を確認
        expect(typeof result.id).toBe('string');
        expect(typeof result.name).toBe('string');
        expect(typeof result.weight).toBe('number');
        expect(typeof result.rank).toBe('number');

        // 値が有効であることを確認
        expect(result.id.length).toBeGreaterThan(0);
        expect(result.name.length).toBeGreaterThan(0);
        expect(result.weight).toBeGreaterThan(0);
        expect(result.rank).toBeGreaterThanOrEqual(1);
        expect(result.rank).toBeLessThanOrEqual(7);
      }
    });
  });

  describe('エッジケースの検証', () => {
    test('0に近い乱数でも正しく運勢が選択されること', () => {
      // Math.randomをモック化して0に近い値を返す
      const originalRandom = Math.random;
      Math.random = () => 0.001;

      const result = selectRandomFortune();
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();

      Math.random = originalRandom;
    });

    test('1に近い乱数でも正しく運勢が選択されること', () => {
      // Math.randomをモック化して1に近い値を返す
      const originalRandom = Math.random;
      Math.random = () => 0.999;

      const result = selectRandomFortune();
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();

      Math.random = originalRandom;
    });
  });
});
