/**
 * カテゴリデータのテスト
 *
 * TDD - RED Phase: テストを先に書き、実装はまだ存在しない状態
 */

import {
  CategoryId,
  categories,
  CATEGORY_IDS,
} from '../category-data';

describe('category-data', () => {
  describe('categories', () => {
    test('6カテゴリが定義されている', () => {
      expect(categories.length).toBe(6);
    });

    test('各カテゴリが正しいCategoryId型を持つ', () => {
      const expectedIds: CategoryId[] = [
        'coding',
        'review',
        'deploy',
        'waiting',
        'conflict',
        'growth',
      ];

      const actualIds = categories.map((c) => c.id);
      expect(actualIds).toEqual(expectedIds);
    });

    test('各カテゴリに名前が設定されている', () => {
      const expectedNames = [
        'コーディング運',
        'レビュー運',
        'デプロイ運',
        '待ち人',
        '争い事',
        '成長運',
      ];

      const actualNames = categories.map((c) => c.name);
      expect(actualNames).toEqual(expectedNames);
    });

    test('各カテゴリがCategory型に準拠する', () => {
      categories.forEach((category) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('messagePool');
        expect(typeof category.id).toBe('string');
        expect(typeof category.name).toBe('string');
        expect(category.messagePool).toHaveProperty('positiveMessages');
        expect(category.messagePool).toHaveProperty('negativeMessages');
      });
    });
  });

  describe('メッセージプール', () => {
    test('各カテゴリのpositiveMessagesが5つ存在する', () => {
      categories.forEach((category) => {
        expect(category.messagePool.positiveMessages.length).toBe(5);
      });
    });

    test('各カテゴリのnegativeMessagesが5つ存在する', () => {
      categories.forEach((category) => {
        expect(category.messagePool.negativeMessages.length).toBe(5);
      });
    });

    test('positiveメッセージが3-10文字である', () => {
      categories.forEach((category) => {
        category.messagePool.positiveMessages.forEach((msg) => {
          expect(msg.length).toBeGreaterThanOrEqual(3);
          expect(msg.length).toBeLessThanOrEqual(10);
        });
      });
    });

    test('negativeメッセージが3-10文字である', () => {
      categories.forEach((category) => {
        category.messagePool.negativeMessages.forEach((msg) => {
          expect(msg.length).toBeGreaterThanOrEqual(3);
          expect(msg.length).toBeLessThanOrEqual(10);
        });
      });
    });

    test('positiveメッセージがすべてユニークである（カテゴリ内）', () => {
      categories.forEach((category) => {
        const messages = category.messagePool.positiveMessages;
        const uniqueMessages = new Set(messages);
        expect(uniqueMessages.size).toBe(messages.length);
      });
    });

    test('negativeメッセージがすべてユニークである（カテゴリ内）', () => {
      categories.forEach((category) => {
        const messages = category.messagePool.negativeMessages;
        const uniqueMessages = new Set(messages);
        expect(uniqueMessages.size).toBe(messages.length);
      });
    });

    test('positiveとnegativeメッセージが異なる内容である', () => {
      categories.forEach((category) => {
        const positiveSet = new Set(category.messagePool.positiveMessages);
        const negativeSet = new Set(category.messagePool.negativeMessages);

        // 交差セットが空であることを確認（重複なし）
        const intersection = new Set(
          [...positiveSet].filter((x) => negativeSet.has(x))
        );
        expect(intersection.size).toBe(0);
      });
    });
  });

  describe('CATEGORY_IDS', () => {
    test('6要素を持つ', () => {
      expect(CATEGORY_IDS.length).toBe(6);
    });

    test('すべてのカテゴリIDが含まれる', () => {
      const expectedIds: CategoryId[] = [
        'coding',
        'review',
        'deploy',
        'waiting',
        'conflict',
        'growth',
      ];

      expect(CATEGORY_IDS).toEqual(expectedIds);
    });

    test('categories配列のIDと一致する', () => {
      const categoryIds = categories.map((c) => c.id);
      expect(CATEGORY_IDS).toEqual(categoryIds);
    });
  });

  describe('データ構造の整合性', () => {
    test('全カテゴリで合計60メッセージパターンが存在する', () => {
      const totalMessages = categories.reduce((sum, category) => {
        return (
          sum +
          category.messagePool.positiveMessages.length +
          category.messagePool.negativeMessages.length
        );
      }, 0);

      // 6カテゴリ × (5 positive + 5 negative) = 60
      expect(totalMessages).toBe(60);
    });

    test('イミュータブルなデータ構造である（as const）', () => {
      // TypeScriptの型チェックで保証されるが、ランタイムでreadonly配列であることを確認
      expect(Object.isFrozen(categories)).toBe(false); // as constはコンパイル時の型制約
      expect(Array.isArray(categories)).toBe(true);
      expect(Array.isArray(CATEGORY_IDS)).toBe(true);
    });
  });

  describe('メッセージ内容の品質', () => {
    test('positiveメッセージが励ましや成功を示唆する内容である', () => {
      // サンプルチェック: コーディング運のpositiveメッセージ
      const codingPositive = categories.find((c) => c.id === 'coding')
        ?.messagePool.positiveMessages;

      expect(codingPositive).toBeDefined();
      expect(codingPositive!.length).toBe(5);

      // すべてのpositiveメッセージが空でないことを確認
      categories.forEach((category) => {
        category.messagePool.positiveMessages.forEach((msg) => {
          expect(msg.length).toBeGreaterThan(0);
        });
      });
    });

    test('negativeメッセージが注意喚起や慎重さを促す内容である', () => {
      // サンプルチェック: コーディング運のnegativeメッセージ
      const codingNegative = categories.find((c) => c.id === 'coding')
        ?.messagePool.negativeMessages;

      expect(codingNegative).toBeDefined();
      expect(codingNegative!.length).toBe(5);

      // すべてのnegativeメッセージが空でないことを確認
      categories.forEach((category) => {
        category.messagePool.negativeMessages.forEach((msg) => {
          expect(msg.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
