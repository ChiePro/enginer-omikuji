import { describe, it, expect } from 'vitest';
import { FortuneCategory } from './FortuneCategory';

describe('FortuneCategory', () => {
  describe('基本的な作成と検証', () => {
    it('有効なカテゴリIDでインスタンスを作成できる', () => {
      // Given
      const categoryId = 'love';
      const displayName = '恋愛運';
      const description = 'あなたの恋愛に関する運勢';

      // When
      const result = FortuneCategory.create(categoryId, displayName, description);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.getId()).toBe(categoryId);
      expect(result.value.getDisplayName()).toBe(displayName);
      expect(result.value.getDescription()).toBe(description);
    });

    it('必須カテゴリ(恋愛運)が正しく作成される', () => {
      // Given & When
      const loveCategory = FortuneCategory.createLove();

      // Then
      expect(loveCategory.getId()).toBe('love');
      expect(loveCategory.getDisplayName()).toBe('恋愛運');
      expect(loveCategory.isRequired()).toBe(true);
    });

    it('必須カテゴリ(仕事運)が正しく作成される', () => {
      // Given & When
      const workCategory = FortuneCategory.createWork();

      // Then
      expect(workCategory.getId()).toBe('work');
      expect(workCategory.getDisplayName()).toBe('仕事運');
      expect(workCategory.isRequired()).toBe(true);
    });

    it('必須カテゴリ(健康運)が正しく作成される', () => {
      // Given & When
      const healthCategory = FortuneCategory.createHealth();

      // Then
      expect(healthCategory.getId()).toBe('health');
      expect(healthCategory.getDisplayName()).toBe('健康運');
      expect(healthCategory.isRequired()).toBe(true);
    });

    it('必須カテゴリ(金運)が正しく作成される', () => {
      // Given & When
      const moneyCategory = FortuneCategory.createMoney();

      // Then
      expect(moneyCategory.getId()).toBe('money');
      expect(moneyCategory.getDisplayName()).toBe('金運');
      expect(moneyCategory.isRequired()).toBe(true);
    });

    it('必須カテゴリ(学業運)が正しく作成される', () => {
      // Given & When
      const studyCategory = FortuneCategory.createStudy();

      // Then
      expect(studyCategory.getId()).toBe('study');
      expect(studyCategory.getDisplayName()).toBe('学業運');
      expect(studyCategory.isRequired()).toBe(true);
    });
  });

  describe('バリデーション', () => {
    it('空のカテゴリIDは拒否される', () => {
      // Given
      const emptyId = '';
      const displayName = '恋愛運';
      const description = 'あなたの恋愛に関する運勢';

      // When
      const result = FortuneCategory.create(emptyId, displayName, description);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('FORTUNE_CATEGORY_INVALID_ID');
    });

    it('無効な文字を含むカテゴリIDは拒否される', () => {
      // Given
      const invalidId = 'love-運!';
      const displayName = '恋愛運';
      const description = 'あなたの恋愛に関する運勢';

      // When
      const result = FortuneCategory.create(invalidId, displayName, description);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('FORTUNE_CATEGORY_INVALID_ID');
    });

    it('空の表示名は拒否される', () => {
      // Given
      const categoryId = 'love';
      const emptyDisplayName = '   ';
      const description = 'あなたの恋愛に関する運勢';

      // When
      const result = FortuneCategory.create(categoryId, emptyDisplayName, description);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('FORTUNE_CATEGORY_INVALID_DISPLAY_NAME');
    });

    it('空の説明文は拒否される', () => {
      // Given
      const categoryId = 'love';
      const displayName = '恋愛運';
      const emptyDescription = '';

      // When
      const result = FortuneCategory.create(categoryId, displayName, emptyDescription);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('FORTUNE_CATEGORY_INVALID_DESCRIPTION');
    });
  });

  describe('運勢レベル設定', () => {
    it('運勢レベルが正しく設定・取得される', () => {
      // Given
      const category = FortuneCategory.createWork();
      const fortuneLevel = 'good'; // 良好

      // When
      const categoryWithLevel = category.withFortuneLevel(fortuneLevel);

      // Then
      expect(categoryWithLevel.getFortuneLevel()).toBe(fortuneLevel);
      expect(categoryWithLevel.hasFortuneLevel()).toBe(true);
    });

    it('運勢レベルなしでもhasFortuneLevel()がfalseを返す', () => {
      // Given
      const category = FortuneCategory.createHealth();

      // When & Then
      expect(category.hasFortuneLevel()).toBe(false);
    });
  });

  describe('同一性判定', () => {
    it('同じIDのカテゴリは等しい', () => {
      // Given
      const category1 = FortuneCategory.createLove();
      const category2 = FortuneCategory.createLove();

      // When & Then
      expect(category1.equals(category2)).toBe(true);
    });

    it('異なるIDのカテゴリは等しくない', () => {
      // Given
      const category1 = FortuneCategory.createLove();
      const category2 = FortuneCategory.createWork();

      // When & Then
      expect(category1.equals(category2)).toBe(false);
    });
  });

  describe('ファクトリメソッドの網羅性', () => {
    it('全必須カテゴリのファクトリメソッドが存在する', () => {
      // When
      const allRequired = FortuneCategory.getAllRequiredCategories();

      // Then
      expect(allRequired).toHaveLength(5);
      expect(allRequired.map(c => c.getId())).toEqual(['love', 'work', 'health', 'money', 'study']);
      expect(allRequired.every(c => c.isRequired())).toBe(true);
    });
  });
});