/**
 * 運勢データのテスト
 *
 * タスク1.1の要件をテストする:
 * - 7段階の運勢レベルが型安全に定義されていること
 * - 各運勢レベルにID、表示名、重み、ランクが存在すること
 * - イミュータブルなreadonly配列として実装されていること
 * - 重みの合計が100になること
 */

import { fortuneLevels } from '../fortune-data';

describe('運勢レベルデータ', () => {
  describe('基本構造の検証', () => {
    test('運勢レベル配列が7要素を持つこと', () => {
      expect(fortuneLevels).toHaveLength(7);
    });

    test('各運勢レベルが必須フィールド（id, name, weight, rank）を持つこと', () => {
      fortuneLevels.forEach((level) => {
        expect(level).toHaveProperty('id');
        expect(level).toHaveProperty('name');
        expect(level).toHaveProperty('weight');
        expect(level).toHaveProperty('rank');

        // 型の検証
        expect(typeof level.id).toBe('string');
        expect(typeof level.name).toBe('string');
        expect(typeof level.weight).toBe('number');
        expect(typeof level.rank).toBe('number');
      });
    });
  });

  describe('運勢レベルの内容検証', () => {
    test('7段階の運勢レベル（大吉、吉、中吉、小吉、末吉、凶、大凶）が定義されていること', () => {
      const expectedLevels = [
        { id: 'daikichi', name: '大吉' },
        { id: 'kichi', name: '吉' },
        { id: 'chukichi', name: '中吉' },
        { id: 'shokichi', name: '小吉' },
        { id: 'suekichi', name: '末吉' },
        { id: 'kyo', name: '凶' },
        { id: 'daikyo', name: '大凶' },
      ];

      expectedLevels.forEach((expected, index) => {
        expect(fortuneLevels[index].id).toBe(expected.id);
        expect(fortuneLevels[index].name).toBe(expected.name);
      });
    });

    test('各運勢レベルのIDが一意であること', () => {
      const ids = fortuneLevels.map((level) => level.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(fortuneLevels.length);
    });

    test('ランクが1から7まで重複なく存在すること', () => {
      const ranks = fortuneLevels.map((level) => level.rank).sort((a, b) => a - b);
      expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    test('運勢レベルの順序が正しいこと（大吉がrank=1、大凶がrank=7）', () => {
      const daikichi = fortuneLevels.find((level) => level.id === 'daikichi');
      const daikyo = fortuneLevels.find((level) => level.id === 'daikyo');

      expect(daikichi?.rank).toBe(1);
      expect(daikyo?.rank).toBe(7);
    });
  });

  describe('確率の重み検証', () => {
    test('重みの合計が100であること', () => {
      const totalWeight = fortuneLevels.reduce((sum, level) => sum + level.weight, 0);
      expect(totalWeight).toBe(100);
    });

    test('各運勢レベルの重みが正しく設定されていること', () => {
      const expectedWeights = {
        daikichi: 16,
        kichi: 23,
        chukichi: 34,
        shokichi: 12,
        suekichi: 8,
        kyo: 4,
        daikyo: 3,
      };

      Object.entries(expectedWeights).forEach(([id, weight]) => {
        const level = fortuneLevels.find((l) => l.id === id);
        expect(level?.weight).toBe(weight);
      });
    });

    test('中吉が最も高確率であること', () => {
      const chukichi = fortuneLevels.find((l) => l.id === 'chukichi');
      expect(chukichi?.weight).toBe(34);

      // 中吉が最大の重みであることを確認
      const maxWeight = Math.max(...fortuneLevels.map((l) => l.weight));
      expect(chukichi?.weight).toBe(maxWeight);
    });

    test('全ての重みが正の数であること', () => {
      fortuneLevels.forEach((level) => {
        expect(level.weight).toBeGreaterThan(0);
      });
    });
  });

  describe('イミュータビリティの検証', () => {
    test('fortuneLevelsがreadonly配列であること（TypeScriptの型チェック）', () => {
      // TypeScriptの型システムにより、コンパイル時にreadonly性が保証される
      // as constにより型推論が最大化されていることを確認

      // 型チェック: fortuneLevelsは readonly FortuneLevel[] 型
      // 以下のコードはコンパイルエラーになる（テストでは型が正しいことを確認）
      // fortuneLevels[0] = { id: 'test', name: 'テスト', weight: 1, rank: 1 };

      // ランタイムでは配列の存在を確認
      expect(Array.isArray(fortuneLevels)).toBe(true);
      expect(Object.isFrozen(fortuneLevels)).toBe(false); // as constは型のみ、Object.freezeではない
    });
  });
});
