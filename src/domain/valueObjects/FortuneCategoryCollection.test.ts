import { describe, it, expect } from 'vitest';
import { FortuneCategoryCollection } from './FortuneCategoryCollection';
import { FortuneCategory } from './FortuneCategory';

describe('FortuneCategoryCollection', () => {
  describe('基本的なコレクション作成', () => {
    it('空のコレクションから開始できる', () => {
      // Given & When
      const collection = FortuneCategoryCollection.empty();

      // Then
      expect(collection.size()).toBe(0);
      expect(collection.isEmpty()).toBe(true);
    });

    it('必須カテゴリで初期化されたコレクションを作成できる', () => {
      // Given & When
      const collection = FortuneCategoryCollection.withRequiredCategories();

      // Then
      expect(collection.size()).toBe(5);
      expect(collection.hasAllRequiredCategories()).toBe(true);
      expect(collection.isEmpty()).toBe(false);
    });

    it('カテゴリ配列からコレクションを作成できる', () => {
      // Given
      const categories = [
        FortuneCategory.createLove(),
        FortuneCategory.createWork()
      ];

      // When
      const result = FortuneCategoryCollection.fromCategories(categories);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.size()).toBe(2);
    });
  });

  describe('バリデーション', () => {
    it('重複するカテゴリIDは拒否される', () => {
      // Given
      const categories = [
        FortuneCategory.createLove(),
        FortuneCategory.createLove() // 重複
      ];

      // When
      const result = FortuneCategoryCollection.fromCategories(categories);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('FORTUNE_CATEGORY_COLLECTION_DUPLICATE');
    });

    it('必須カテゴリが不足している場合を検出する', () => {
      // Given
      const incompleteCategories = [
        FortuneCategory.createLove(),
        FortuneCategory.createWork()
        // 健康運、金運、学業運が不足
      ];

      // When
      const result = FortuneCategoryCollection.fromCategories(incompleteCategories);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.hasAllRequiredCategories()).toBe(false);
      expect(result.value.getMissingRequiredCategories()).toHaveLength(3);
    });
  });

  describe('カテゴリの操作', () => {
    it('カテゴリを追加できる', () => {
      // Given
      const collection = FortuneCategoryCollection.empty();
      const category = FortuneCategory.createLove();

      // When
      const result = collection.add(category);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.size()).toBe(1);
      expect(result.value.contains(category.getId())).toBe(true);
    });

    it('重複するカテゴリの追加は拒否される', () => {
      // Given
      const collection = FortuneCategoryCollection.empty();
      const category = FortuneCategory.createLove();
      const collectionWithCategory = collection.add(category).value;

      // When
      const result = collectionWithCategory.add(category);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('FORTUNE_CATEGORY_COLLECTION_DUPLICATE');
    });

    it('カテゴリを削除できる', () => {
      // Given
      const collection = FortuneCategoryCollection.withRequiredCategories();

      // When
      const result = collection.remove('love');

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.size()).toBe(4);
      expect(result.value.contains('love')).toBe(false);
    });

    it('存在しないカテゴリの削除はエラーとなる', () => {
      // Given
      const collection = FortuneCategoryCollection.empty();

      // When
      const result = collection.remove('nonexistent');

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('FORTUNE_CATEGORY_COLLECTION_NOT_FOUND');
    });
  });

  describe('カテゴリの検索と取得', () => {
    it('IDでカテゴリを取得できる', () => {
      // Given
      const collection = FortuneCategoryCollection.withRequiredCategories();

      // When
      const loveCategory = collection.findById('love');

      // Then
      expect(loveCategory).toBeDefined();
      expect(loveCategory?.getId()).toBe('love');
      expect(loveCategory?.getDisplayName()).toBe('恋愛運');
    });

    it('存在しないIDの場合はundefinedを返す', () => {
      // Given
      const collection = FortuneCategoryCollection.withRequiredCategories();

      // When
      const notFound = collection.findById('nonexistent');

      // Then
      expect(notFound).toBeUndefined();
    });

    it('必須カテゴリのみを取得できる', () => {
      // Given
      const collection = FortuneCategoryCollection.withRequiredCategories();

      // When
      const requiredCategories = collection.getRequiredCategories();

      // Then
      expect(requiredCategories).toHaveLength(5);
      expect(requiredCategories.every(c => c.isRequired())).toBe(true);
    });

    it('すべてのカテゴリを配列として取得できる', () => {
      // Given
      const collection = FortuneCategoryCollection.withRequiredCategories();

      // When
      const allCategories = collection.toArray();

      // Then
      expect(allCategories).toHaveLength(5);
    });
  });

  describe('運勢レベルの一括設定', () => {
    it('全カテゴリに運勢レベルを設定できる', () => {
      // Given
      const collection = FortuneCategoryCollection.withRequiredCategories();
      const levels = {
        love: 'excellent',
        work: 'good',
        health: 'average',
        money: 'poor',
        study: 'excellent'
      };

      // When
      const result = collection.withFortuneLevels(levels);

      // Then
      expect(result.isSuccess()).toBe(true);
      const updatedCollection = result.value;
      expect(updatedCollection.findById('love')?.getFortuneLevel()).toBe('excellent');
      expect(updatedCollection.findById('work')?.getFortuneLevel()).toBe('good');
    });

    it('存在しないカテゴリへの運勢レベル設定はエラーとなる', () => {
      // Given
      const collection = FortuneCategoryCollection.empty();
      const levels = {
        nonexistent: 'excellent'
      };

      // When
      const result = collection.withFortuneLevels(levels);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('FORTUNE_CATEGORY_COLLECTION_NOT_FOUND');
    });
  });

  describe('コレクションの状態検証', () => {
    it('コレクションが完全(必須カテゴリすべて含む)かチェックできる', () => {
      // Given
      const fullCollection = FortuneCategoryCollection.withRequiredCategories();
      const partialCollection = FortuneCategoryCollection.empty()
        .add(FortuneCategory.createLove()).value
        .add(FortuneCategory.createWork()).value;

      // When & Then
      expect(fullCollection.isComplete()).toBe(true);
      expect(partialCollection.isComplete()).toBe(false);
    });

    it('必須カテゴリの充足状況を取得できる', () => {
      // Given
      const partialCollection = FortuneCategoryCollection.empty()
        .add(FortuneCategory.createLove()).value
        .add(FortuneCategory.createWork()).value;

      // When
      const missing = partialCollection.getMissingRequiredCategories();

      // Then
      expect(missing).toHaveLength(3);
      expect(missing).toEqual(['health', 'money', 'study']);
    });
  });
});