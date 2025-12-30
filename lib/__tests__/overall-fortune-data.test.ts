/**
 * 総合運勢メッセージデータのテスト
 *
 * TDD - RED Phase: テストを先に書き、実装はまだ存在しない状態
 */

import {
  overallFortuneMessages,
  getOverallFortuneMessage,
} from '../overall-fortune-data';
import { fortuneLevels } from '../fortune-data';

describe('overall-fortune-data', () => {
  describe('overallFortuneMessages', () => {
    test('7運勢レベル×5パターン=35メッセージすべてが存在する', () => {
      // 全メッセージ数の検証
      expect(overallFortuneMessages.length).toBe(35);

      // 各運勢レベルに対して5パターンずつ存在することを検証
      fortuneLevels.forEach((level) => {
        const messagesForLevel = overallFortuneMessages.filter(
          (m) => m.fortuneId === level.id
        );
        expect(messagesForLevel.length).toBe(5);
      });
    });

    test('各メッセージがOverallFortuneMessage型に準拠する', () => {
      overallFortuneMessages.forEach((msg) => {
        expect(msg).toHaveProperty('fortuneId');
        expect(msg).toHaveProperty('message');
        expect(typeof msg.fortuneId).toBe('string');
        expect(typeof msg.message).toBe('string');
      });
    });

    test('各メッセージが100文字程度である', () => {
      overallFortuneMessages.forEach((msg) => {
        // 50-150文字の範囲を許容（100文字程度）
        expect(msg.message.length).toBeGreaterThanOrEqual(50);
        expect(msg.message.length).toBeLessThanOrEqual(150);
      });
    });

    test('fortuneIdが既存のfortuneLevelsに対応する', () => {
      const validFortuneIds = fortuneLevels.map((level) => level.id);

      overallFortuneMessages.forEach((msg) => {
        expect(validFortuneIds).toContain(msg.fortuneId);
      });
    });
  });

  describe('getOverallFortuneMessage', () => {
    test('有効なfortuneIdで正常にメッセージを返す', () => {
      fortuneLevels.forEach((level) => {
        const message = getOverallFortuneMessage(level.id);
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    test('不正なfortuneIdでエラーをスローする', () => {
      expect(() => getOverallFortuneMessage('invalid-id')).toThrow(
        'No overall fortune message found for fortuneId: "invalid-id"'
      );
    });

    test('空文字列のfortuneIdでエラーをスローする', () => {
      expect(() => getOverallFortuneMessage('')).toThrow();
    });

    test('ランダム選択が5パターンから選ばれる（統計的検証）', () => {
      const fortuneId = 'daikichi'; // 大吉で検証
      const results = new Set<string>();
      const iterations = 100;

      // 100回実行して異なるメッセージが選ばれることを確認
      for (let i = 0; i < iterations; i++) {
        const message = getOverallFortuneMessage(fortuneId);
        results.add(message);
      }

      // 5パターンすべてが少なくとも1回は選ばれることを期待
      // （確率的に稀に失敗する可能性があるが、100回なら十分）
      // 最低でも3パターン以上は選ばれるはず
      expect(results.size).toBeGreaterThanOrEqual(3);

      // すべてのメッセージが大吉用のものであることを確認
      const daikikiMessages = overallFortuneMessages
        .filter((m) => m.fortuneId === 'daikichi')
        .map((m) => m.message);

      results.forEach((msg) => {
        expect(daikikiMessages).toContain(msg);
      });
    });

    test('返されるメッセージが対応するfortuneIdのものである', () => {
      fortuneLevels.forEach((level) => {
        const message = getOverallFortuneMessage(level.id);
        const expectedMessages = overallFortuneMessages
          .filter((m) => m.fortuneId === level.id)
          .map((m) => m.message);

        expect(expectedMessages).toContain(message);
      });
    });
  });
});
