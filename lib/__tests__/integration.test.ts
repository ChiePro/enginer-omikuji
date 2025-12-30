/**
 * 統合テスト
 *
 * タスク5.1の要件をテストする:
 * - 既存のomikujiListの全てのIDに対して運勢抽選が成功すること
 * - 全7パターン（1おみくじ×7運勢）のメッセージが取得可能であること
 * - 不正なおみくじIDに対して適切にエラーハンドリングされること
 */

import { drawFortune } from '../draw-fortune';
import { getFortuneMessage } from '../fortune-message-getter';
import { omikujiList } from '../omikuji-data';
import { fortuneLevels } from '../fortune-data';

// 従来のfortuneMessagesシステムを使用するおみくじのみをフィルタ
const legacyOmikujiList = omikujiList.filter((o) => o.usesLegacySystem !== false);

describe('既存システムとの統合検証', () => {
  describe('既存のOmikuji型との統合', () => {
    test('既存のomikujiListの全てのIDに対して運勢抽選が成功すること', () => {
      // 全てのおみくじIDで運勢抽選を実行
      legacyOmikujiList.forEach((omikuji) => {
        expect(() => {
          const result = drawFortune(omikuji.id);
          expect(result).toBeDefined();
          expect(result.level).toBeDefined();
          expect(result.message).toBeDefined();
        }).not.toThrow();
      });
    });

    test('全7パターン（1おみくじ×7運勢）のメッセージが取得可能であること', () => {
      const retrievedMessages = new Set<string>();

      // 全ての組み合わせでメッセージを取得
      legacyOmikujiList.forEach((omikuji) => {
        fortuneLevels.forEach((fortune) => {
          expect(() => {
            const message = getFortuneMessage(omikuji.id, fortune.id);
            expect(message).toBeDefined();
            expect(message.length).toBeGreaterThan(0);
            retrievedMessages.add(`${omikuji.id}:${fortune.id}`);
          }).not.toThrow();
        });
      });

      // 全7パターンが取得できたことを確認
      expect(retrievedMessages.size).toBe(7);
    });

    test('不正なおみくじIDに対して適切にエラーハンドリングされること', () => {
      const invalidIds = ['invalid-id', 'nonexistent', '', 'daily-luck-typo'];

      invalidIds.forEach((invalidId) => {
        expect(() => {
          drawFortune(invalidId);
        }).toThrow(/invalid omikuji id/i);
      });
    });

    test('全てのおみくじIDで全ての運勢レベルが選択可能であること', () => {
      // 各おみくじIDに対して、全ての運勢レベルのメッセージが取得できることを確認
      legacyOmikujiList.forEach((omikuji) => {
        const fortuneIdsForOmikuji = new Set<string>();

        // 全ての運勢レベルでメッセージ取得を試行
        fortuneLevels.forEach((fortune) => {
          const message = getFortuneMessage(omikuji.id, fortune.id);
          expect(message).toBeDefined();
          fortuneIdsForOmikuji.add(fortune.id);
        });

        // 7つ全ての運勢レベルが対応していることを確認
        expect(fortuneIdsForOmikuji.size).toBe(7);
      });
    });
  });

  describe('データ整合性の検証', () => {
    test('omikujiListの件数が正しいこと', () => {
      expect(omikujiList).toHaveLength(1); // 今日の運勢のみ
      expect(legacyOmikujiList).toHaveLength(1); // 従来システムも1つ
    });

    test('fortuneLevelsの件数が正しいこと', () => {
      expect(fortuneLevels).toHaveLength(7);
    });

    test('組み合わせの総数が7パターンであること', () => {
      const totalPatterns = legacyOmikujiList.length * fortuneLevels.length;
      expect(totalPatterns).toBe(7);
    });
  });

  describe('エンドツーエンドのシナリオ検証', () => {
    test('典型的なユースケース: おみくじを引いて結果を表示', () => {
      // ユーザーが「今日の運勢」を引く
      const result = drawFortune('daily-luck');

      // 結果が適切な構造を持つことを確認
      expect(result).toMatchObject({
        level: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          weight: expect.any(Number),
          rank: expect.any(Number),
        }),
        message: expect.any(String),
      });

      // 運勢レベルが7種類のいずれかであることを確認
      const validFortuneIds = fortuneLevels.map((f) => f.id);
      expect(validFortuneIds).toContain(result.level.id);

      // メッセージが適切な長さであることを確認
      expect(result.message.length).toBeGreaterThan(20);
      expect(result.message.length).toBeLessThanOrEqual(150);
    });

    test('おみくじを引くシナリオ', () => {
      const results: Array<{ omikujiId: string; fortuneId: string }> = [];

      // おみくじを引く
      legacyOmikujiList.forEach((omikuji) => {
        const result = drawFortune(omikuji.id);
        results.push({ omikujiId: omikuji.id, fortuneId: result.level.id });

        // 各結果が有効であることを確認
        expect(result.level).toBeDefined();
        expect(result.message).toBeDefined();
      });

      // 結果が取得できたことを確認
      expect(results).toHaveLength(1);
    });
  });
});
