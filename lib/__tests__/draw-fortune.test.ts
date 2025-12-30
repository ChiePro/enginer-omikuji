/**
 * 運勢抽選統合機能のテスト
 *
 * タスク2.3の要件をテストする:
 * - おみくじIDを受け取り、運勢レベルとメッセージを含む結果オブジェクトを返すこと
 * - 不正なおみくじIDに対してはエラーハンドリングを実施すること
 * - 既存のOmikuji型定義と統合可能な設計であること
 */

import { drawFortune } from '../draw-fortune';
import { omikujiList } from '../omikuji-data';
import { fortuneLevels } from '../fortune-data';

// 従来のfortuneMessagesシステムを使用するおみくじのみをフィルタ
const legacyOmikujiList = omikujiList.filter((o) => o.usesLegacySystem !== false);

describe('運勢抽選統合機能', () => {
  describe('基本動作の検証', () => {
    test('関数が存在すること', () => {
      expect(drawFortune).toBeDefined();
      expect(typeof drawFortune).toBe('function');
    });

    test('有効なおみくじIDで運勢結果が返されること', () => {
      const result = drawFortune('daily-luck');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('message');
    });

    test('返される運勢レベルが正しい構造を持つこと', () => {
      const result = drawFortune('daily-luck');

      expect(result.level).toHaveProperty('id');
      expect(result.level).toHaveProperty('name');
      expect(result.level).toHaveProperty('weight');
      expect(result.level).toHaveProperty('rank');

      // 型の検証
      expect(typeof result.level.id).toBe('string');
      expect(typeof result.level.name).toBe('string');
      expect(typeof result.level.weight).toBe('number');
      expect(typeof result.level.rank).toBe('number');
    });

    test('返されるメッセージが文字列であること', () => {
      const result = drawFortune('daily-luck');

      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.message.trim()).not.toBe('');
    });

    test('運勢レベルが7種類のいずれかであること', () => {
      const result = drawFortune('daily-luck');
      const fortuneIds = fortuneLevels.map((f) => f.id);

      expect(fortuneIds).toContain(result.level.id);
    });
  });

  describe('全おみくじタイプでの動作検証', () => {
    test('全てのおみくじIDで運勢抽選が成功すること', () => {
      legacyOmikujiList.forEach((omikuji) => {
        const result = drawFortune(omikuji.id);

        expect(result).toBeDefined();
        expect(result.level).toBeDefined();
        expect(result.message).toBeDefined();
      });
    });

    test('各おみくじタイプで適切なメッセージが返されること', () => {
      legacyOmikujiList.forEach((omikuji) => {
        const result = drawFortune(omikuji.id);

        // メッセージが空ではないこと
        expect(result.message.length).toBeGreaterThan(20);
        expect(result.message.length).toBeLessThanOrEqual(150);
      });
    });
  });

  describe('エラーハンドリングの検証', () => {
    test('存在しないおみくじIDでエラーがスローされること', () => {
      expect(() => {
        drawFortune('invalid-omikuji-id');
      }).toThrow();
    });

    test('エラーメッセージが明確であること', () => {
      expect(() => {
        drawFortune('invalid-omikuji-id');
      }).toThrow(/invalid omikuji id/i);
    });

    test('空文字列のおみくじIDでエラーがスローされること', () => {
      expect(() => {
        drawFortune('');
      }).toThrow();
    });

    test('nullやundefinedでエラーがスローされること', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        drawFortune(null as any);
      }).toThrow();

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        drawFortune(undefined as any);
      }).toThrow();
    });
  });

  describe('ランダム性の検証', () => {
    test('複数回実行すると異なる運勢が選ばれる可能性があること', () => {
      const results = new Set<string>();

      // 100回実行して、少なくとも2種類以上の運勢が出ることを確認
      for (let i = 0; i < 100; i++) {
        const result = drawFortune('daily-luck');
        results.add(result.level.id);
      }

      // 100回の抽選で2種類以上の運勢が出ることを期待
      expect(results.size).toBeGreaterThanOrEqual(2);
    });

    test('同じおみくじIDで複数回実行しても正しい結果が返されること', () => {
      for (let i = 0; i < 10; i++) {
        const result = drawFortune('daily-luck');

        expect(result).toBeDefined();
        expect(result.level).toBeDefined();
        expect(result.message).toBeDefined();

        // 運勢レベルとメッセージの整合性を確認
        const fortuneIds = fortuneLevels.map((f) => f.id);
        expect(fortuneIds).toContain(result.level.id);
      }
    });
  });

  describe('統合性の検証', () => {
    test('運勢レベルとメッセージが整合していること', () => {
      // 複数回実行して、運勢レベルとメッセージの組み合わせが正しいことを確認
      for (let i = 0; i < 50; i++) {
        const result = drawFortune('daily-luck');

        // メッセージが空でないこと
        expect(result.message.length).toBeGreaterThan(0);

        // 運勢レベルが有効であること
        const fortuneIds = fortuneLevels.map((f) => f.id);
        expect(fortuneIds).toContain(result.level.id);
      }
    });

    test('結果オブジェクトが既存のOmikuji型と統合可能な構造であること', () => {
      const result = drawFortune('daily-luck');

      // FortuneResultの構造を検証
      expect(result).toMatchObject({
        level: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          weight: expect.any(Number),
          rank: expect.any(Number),
        }),
        message: expect.any(String),
      });
    });
  });

  describe('パフォーマンスの検証', () => {
    test('1,000回連続実行しても正常に動作すること', () => {
      for (let i = 0; i < 1000; i++) {
        const result = drawFortune('daily-luck');
        expect(result).toBeDefined();
      }
    });

    test('実行時間が十分に速いこと（1,000回で合計1秒以内）', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        drawFortune('daily-luck');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 1,000回の実行が1秒以内に完了することを確認
      expect(duration).toBeLessThan(1000);
    });
  });
});
