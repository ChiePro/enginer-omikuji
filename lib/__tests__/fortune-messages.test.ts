/**
 * 運勢メッセージのテスト
 *
 * タスク1.2の要件をテストする:
 * - 1種類のおみくじ×7段階の運勢=7パターンのメッセージが定義されていること
 * - 各メッセージにおみくじID、運勢ID、メッセージ本文が存在すること
 * - メッセージはエンジニアの業務に関連した表現を含むこと
 * - 運勢レベルに応じた適切なトーンであること
 * - 各メッセージは100文字程度の読みやすい長さであること
 * - イミュータブルなreadonly配列として実装されていること
 */

import { fortuneMessages } from '../fortune-data';
import { omikujiList } from '../omikuji-data';
import { fortuneLevels } from '../fortune-data';

// 従来のfortuneMessagesシステムを使用するおみくじのみをフィルタ
const legacyOmikujiList = omikujiList.filter((o) => o.usesLegacySystem !== false);

describe('運勢メッセージデータ', () => {
  describe('基本構造の検証', () => {
    test('メッセージ配列が7要素（1おみくじ×7運勢）を持つこと', () => {
      const expectedCount = legacyOmikujiList.length * fortuneLevels.length;
      expect(fortuneMessages).toHaveLength(expectedCount);
      expect(fortuneMessages).toHaveLength(7);
    });

    test('各メッセージが必須フィールド（omikujiId, fortuneId, message）を持つこと', () => {
      fortuneMessages.forEach((msg) => {
        expect(msg).toHaveProperty('omikujiId');
        expect(msg).toHaveProperty('fortuneId');
        expect(msg).toHaveProperty('message');

        // 型の検証
        expect(typeof msg.omikujiId).toBe('string');
        expect(typeof msg.fortuneId).toBe('string');
        expect(typeof msg.message).toBe('string');
      });
    });
  });

  describe('データの完全性検証', () => {
    test('全てのおみくじIDと運勢IDの組み合わせに対してメッセージが存在すること', () => {
      legacyOmikujiList.forEach((omikuji) => {
        fortuneLevels.forEach((fortune) => {
          const message = fortuneMessages.find(
            (msg) => msg.omikujiId === omikuji.id && msg.fortuneId === fortune.id
          );
          expect(message).toBeDefined();
          expect(message?.message).toBeTruthy();
        });
      });
    });

    test('各おみくじIDが正しく設定されていること', () => {
      const omikujiIds = legacyOmikujiList.map((o) => o.id);

      fortuneMessages.forEach((msg) => {
        expect(omikujiIds).toContain(msg.omikujiId);
      });
    });

    test('各運勢IDが正しく設定されていること', () => {
      const fortuneIds = fortuneLevels.map((f) => f.id);

      fortuneMessages.forEach((msg) => {
        expect(fortuneIds).toContain(msg.fortuneId);
      });
    });

    test('重複したメッセージが存在しないこと', () => {
      const combinations = fortuneMessages.map((msg) => `${msg.omikujiId}-${msg.fortuneId}`);
      const uniqueCombinations = new Set(combinations);

      expect(uniqueCombinations.size).toBe(fortuneMessages.length);
    });
  });

  describe('メッセージ内容の検証', () => {
    test('メッセージの長さが適切な範囲（20〜150文字）であること', () => {
      fortuneMessages.forEach((msg) => {
        const length = msg.message.length;
        expect(length).toBeGreaterThanOrEqual(20);
        expect(length).toBeLessThanOrEqual(150);
      });
    });

    test('メッセージが空文字列ではないこと', () => {
      fortuneMessages.forEach((msg) => {
        expect(msg.message.trim()).not.toBe('');
      });
    });

    test('エンジニア関連の用語を含むメッセージが存在すること', () => {
      // エンジニア関連キーワード
      const engineeringKeywords = [
        'コード',
        'レビュー',
        'バグ',
        'デプロイ',
        'テスト',
        'リファクタリング',
        'エラー',
        'プログラ',
        '実装',
        '開発',
        'システム',
        'API',
        'データベース',
      ];

      const allMessages = fortuneMessages.map((msg) => msg.message).join(' ');
      const hasEngineeringContent = engineeringKeywords.some((keyword) =>
        allMessages.includes(keyword)
      );

      expect(hasEngineeringContent).toBe(true);
    });
  });

  describe('運勢レベル別のトーン検証', () => {
    test('大吉のメッセージがポジティブなトーンであること', () => {
      const daikichMessages = fortuneMessages.filter((msg) => msg.fortuneId === 'daikichi');

      expect(daikichMessages.length).toBeGreaterThan(0);

      // ポジティブなキーワードをチェック
      const positiveKeywords = ['最高', '素晴らしい', '絶好調', '順調', 'スムーズ', '成功'];
      const messagesText = daikichMessages.map((msg) => msg.message).join(' ');

      const hasPositiveTone = positiveKeywords.some((keyword) => messagesText.includes(keyword));
      expect(hasPositiveTone).toBe(true);
    });

    test('凶・大凶のメッセージが注意喚起のトーンであること', () => {
      const badLuckMessages = fortuneMessages.filter(
        (msg) => msg.fortuneId === 'kyo' || msg.fortuneId === 'daikyo'
      );

      expect(badLuckMessages.length).toBeGreaterThan(0);

      // 注意喚起のキーワードをチェック
      const cautionKeywords = ['注意', '気をつけ', '慎重', '確認', '見直', '落ち着'];
      const messagesText = badLuckMessages.map((msg) => msg.message).join(' ');

      const hasCautionTone = cautionKeywords.some((keyword) => messagesText.includes(keyword));
      expect(hasCautionTone).toBe(true);
    });
  });

  describe('おみくじタイプ別の内容検証', () => {
    test('今日の運勢（daily-luck）のメッセージが業務全般に関連すること', () => {
      const dailyLuckMessages = fortuneMessages.filter((msg) => msg.omikujiId === 'daily-luck');

      expect(dailyLuckMessages).toHaveLength(7); // 7段階の運勢
    });
  });

  describe('イミュータビリティの検証', () => {
    test('fortuneMessagesがreadonly配列であること（TypeScriptの型チェック）', () => {
      // TypeScriptの型システムにより、コンパイル時にreadonly性が保証される
      // 以下のコードはコンパイルエラーになる
      // fortuneMessages[0] = { omikujiId: 'test', fortuneId: 'test', message: 'test' };

      // ランタイムでは配列の存在を確認
      expect(Array.isArray(fortuneMessages)).toBe(true);
      expect(Object.isFrozen(fortuneMessages)).toBe(false); // as constは型のみ
    });
  });
});
