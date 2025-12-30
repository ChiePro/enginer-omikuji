/**
 * 運勢メッセージ取得機能のテスト
 *
 * タスク2.2の要件をテストする:
 * - おみくじIDと運勢IDの組み合わせからメッセージを取得すること
 * - メッセージが見つからない場合は明確なエラーをスローすること
 * - 線形探索で実装すること（データ量が7件と少ないため十分）
 */

import { getFortuneMessage } from '../fortune-message-getter';
import { omikujiList } from '../omikuji-data';
import { fortuneLevels } from '../fortune-data';

// 従来のfortuneMessagesシステムを使用するおみくじのみをフィルタ
const legacyOmikujiList = omikujiList.filter((o) => o.usesLegacySystem !== false);

describe('運勢メッセージ取得機能', () => {
  describe('基本動作の検証', () => {
    test('関数が存在すること', () => {
      expect(getFortuneMessage).toBeDefined();
      expect(typeof getFortuneMessage).toBe('function');
    });

    test('有効なおみくじIDと運勢IDでメッセージが取得できること', () => {
      const message = getFortuneMessage('daily-luck', 'daikichi');

      expect(message).toBeDefined();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    test('取得されたメッセージが空文字列ではないこと', () => {
      const message = getFortuneMessage('daily-luck', 'kichi');

      expect(message.trim()).not.toBe('');
    });

    test('異なる組み合わせで異なるメッセージが返されること', () => {
      const message1 = getFortuneMessage('daily-luck', 'daikichi');
      const message2 = getFortuneMessage('daily-luck', 'kichi');
      const message3 = getFortuneMessage('daily-luck', 'chukichi');

      expect(message1).not.toBe(message2);
      expect(message1).not.toBe(message3);
      expect(message2).not.toBe(message3);
    });
  });

  describe('全てのパターンでの動作検証', () => {
    test('全てのおみくじIDと運勢IDの組み合わせ（7パターン）でメッセージが取得できること', () => {
      legacyOmikujiList.forEach((omikuji) => {
        fortuneLevels.forEach((fortune) => {
          const message = getFortuneMessage(omikuji.id, fortune.id);

          expect(message).toBeDefined();
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);
        });
      });
    });

    test('全7パターンのメッセージがユニークであること', () => {
      const messages = new Set<string>();

      legacyOmikujiList.forEach((omikuji) => {
        fortuneLevels.forEach((fortune) => {
          const message = getFortuneMessage(omikuji.id, fortune.id);
          messages.add(message);
        });
      });

      // 全7パターンが異なるメッセージであることを確認
      expect(messages.size).toBe(7);
    });
  });

  describe('エラーハンドリングの検証', () => {
    test('存在しないおみくじIDでエラーがスローされること', () => {
      expect(() => {
        getFortuneMessage('invalid-omikuji', 'daikichi');
      }).toThrow();
    });

    test('存在しない運勢IDでエラーがスローされること', () => {
      expect(() => {
        getFortuneMessage('daily-luck', 'invalid-fortune');
      }).toThrow();
    });

    test('両方とも存在しないIDでエラーがスローされること', () => {
      expect(() => {
        getFortuneMessage('invalid-omikuji', 'invalid-fortune');
      }).toThrow();
    });

    test('エラーメッセージが明確であること（おみくじIDが不正）', () => {
      expect(() => {
        getFortuneMessage('invalid-omikuji', 'daikichi');
      }).toThrow(/message not found/i);
    });

    test('エラーメッセージが明確であること（運勢IDが不正）', () => {
      expect(() => {
        getFortuneMessage('daily-luck', 'invalid-fortune');
      }).toThrow(/message not found/i);
    });

    test('空文字列のIDでエラーがスローされること', () => {
      expect(() => {
        getFortuneMessage('', '');
      }).toThrow();
    });
  });

  describe('境界値の検証', () => {
    test('最初のおみくじIDと最初の運勢IDの組み合わせが正しく取得できること', () => {
      const firstOmikuji = legacyOmikujiList[0];
      const firstFortune = fortuneLevels[0];

      const message = getFortuneMessage(firstOmikuji.id, firstFortune.id);

      expect(message).toBeDefined();
      expect(message.length).toBeGreaterThan(0);
    });

    test('最後のおみくじIDと最後の運勢IDの組み合わせが正しく取得できること', () => {
      const lastOmikuji = legacyOmikujiList[legacyOmikujiList.length - 1];
      const lastFortune = fortuneLevels[fortuneLevels.length - 1];

      const message = getFortuneMessage(lastOmikuji.id, lastFortune.id);

      expect(message).toBeDefined();
      expect(message.length).toBeGreaterThan(0);
    });
  });

  describe('純粋関数性の検証', () => {
    test('同じ入力で複数回呼び出しても同じ結果が返されること', () => {
      const message1 = getFortuneMessage('daily-luck', 'daikichi');
      const message2 = getFortuneMessage('daily-luck', 'daikichi');
      const message3 = getFortuneMessage('daily-luck', 'daikichi');

      expect(message1).toBe(message2);
      expect(message2).toBe(message3);
    });

    test('関数が副作用を持たないこと（データが変更されない）', () => {
      // 初期データのコピーを保存
      const initialOmikujiList = [...omikujiList];
      const initialFortuneLevels = [...fortuneLevels];

      // 複数回実行
      for (let i = 0; i < 10; i++) {
        getFortuneMessage('daily-luck', 'chukichi');
      }

      // データが変更されていないことを確認
      expect(omikujiList).toEqual(initialOmikujiList);
      expect(fortuneLevels).toEqual(initialFortuneLevels);
    });
  });
});
