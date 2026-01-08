import { describe, expect, it, beforeEach, vi } from 'vitest';
import { FortuneCategoryCompatibility } from './FortuneCategoryCompatibility';
import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { OmikujiResult } from '../entities/OmikujiResult';
import { OmikujiType } from '../entities/OmikujiType';
import { Fortune } from '../valueObjects/Fortune';

describe('FortuneCategoryCompatibility', () => {
  let compatibility: FortuneCategoryCompatibility;

  beforeEach(() => {
    compatibility = new FortuneCategoryCompatibility();
  });

  // Helper functions
  const createFortune = (id: string, japaneseName: string, value: number): Fortune => {
    return Fortune.fromData({
      id,
      englishName: id,
      japaneseName,
      description: `${japaneseName}の運勢`,
      probability: 0.1,
      value,
      color: { primary: '#000000', secondary: '#ffffff', background: '#f0f0f0' },
      effects: { glow: false, sparkle: false, animation: null }
    });
  };

  const createOmikujiType = (id: string): OmikujiType => {
    return OmikujiType.create({
      id,
      name: 'Test Omikuji',
      description: 'Test description',
      icon: '🎯',
      color: { primary: '#000000', secondary: '#ffffff' },
      sortOrder: 1
    });
  };

  const createOmikujiResult = (typeId: string, fortune: Fortune): OmikujiResult => {
    return OmikujiResult.create({
      omikujiType: createOmikujiType(typeId),
      fortune: fortune
    });
  };

  describe('既存FortuneCategory構造の維持', () => {
    it('FortuneCategory値オブジェクトの既存インターフェースが変更されていない', () => {
      const categories = FortuneCategory.getAllRequiredCategories();
      
      // 既存のメソッドが利用可能
      categories.forEach(category => {
        expect(category.getId()).toBeDefined();
        expect(category.getDisplayName()).toBeDefined();
        expect(category.getDescription()).toBeDefined();
        expect(category.isRequired()).toBeDefined();
        expect(category.getCssClassName()).toBeDefined();
      });
    });

    it('withFortuneLevel()メソッドが既存の動作を保持している', () => {
      const originalCategory = FortuneCategory.createLove();
      const randomizedCategory = originalCategory.withFortuneLevel('今日は特別な出会いが待っています');

      // 元のカテゴリは変更されない
      expect(originalCategory.hasFortuneLevel()).toBe(false);
      expect(originalCategory.getFortuneLevel()).toBeUndefined();

      // 新しいカテゴリは運勢レベルを持つ
      expect(randomizedCategory.hasFortuneLevel()).toBe(true);
      expect(randomizedCategory.getFortuneLevel()).toBe('今日は特別な出会いが待っています');

      // その他の属性は保持される
      expect(randomizedCategory.getId()).toBe(originalCategory.getId());
      expect(randomizedCategory.getDisplayName()).toBe(originalCategory.getDisplayName());
      expect(randomizedCategory.isRequired()).toBe(originalCategory.isRequired());
    });

    it('ランダム化されたカテゴリが既存の型システムと互換性を持つ', () => {
      const categories = FortuneCategory.getAllRequiredCategories();
      const randomizedCategories = categories.map(cat => 
        cat.withFortuneLevel('ランダム化されたコンテンツ')
      );

      // 型の互換性を確認
      randomizedCategories.forEach((category, index) => {
        expect(category).toBeInstanceOf(FortuneCategory);
        expect(category.equals(categories[index])).toBe(true); // IDベースの同一性
        expect(category.toString()).toContain(categories[index].getId());
      });
    });
  });

  describe('既存OmikujiResultエンティティ形式での結果返却', () => {
    it('ランダム化機能を使用してもOmikujiResultの既存形式が保持される', () => {
      const fortune = createFortune('kichi', '吉', 2);
      const omikujiResult = createOmikujiResult('engineer-fortune', fortune);
      const randomizedCategories = FortuneCategory.getAllRequiredCategories()
        .map(cat => cat.withFortuneLevel('ランダムコンテンツ'));

      const extendedResult = compatibility.createCompatibleResult(
        omikujiResult,
        randomizedCategories
      );

      // 既存のOmikujiResultインターフェースが保持される
      expect(extendedResult.getId()).toBeDefined();
      expect(extendedResult.getOmikujiType()).toBeDefined();
      expect(extendedResult.getFortune()).toBe(fortune);
      expect(extendedResult.getCreatedAt()).toBeDefined();
      expect(extendedResult.getDisplaySummary()).toBeDefined();
    });

    it('ランダム化されたカテゴリが適切に統合される', () => {
      const fortune = createFortune('daikichi', '大吉', 4);
      const omikujiResult = createOmikujiResult('engineer-fortune', fortune);
      const randomizedCategories = FortuneCategory.getAllRequiredCategories()
        .map(cat => cat.withFortuneLevel(`${cat.getDisplayName()}のランダム結果`));

      const extendedResult = compatibility.createCompatibleResult(
        omikujiResult,
        randomizedCategories
      );

      // 拡張機能が利用可能
      const categories = compatibility.getRandomizedCategories(extendedResult);
      expect(categories).toHaveLength(5);
      expect(categories.every(cat => cat.hasFortuneLevel())).toBe(true);
    });

    it('カテゴリ無しでも既存の動作が保持される', () => {
      const fortune = createFortune('suekichi', '末吉', 0);
      const omikujiResult = createOmikujiResult('engineer-fortune', fortune);

      const extendedResult = compatibility.createCompatibleResult(
        omikujiResult,
        null // カテゴリなし
      );

      // 既存の動作が保持される
      expect(extendedResult.getFortune()).toBe(fortune);
      
      // カテゴリが存在しない場合の適切な処理
      const categories = compatibility.getRandomizedCategories(extendedResult);
      expect(categories).toBe(null);
    });
  });

  describe('ドメイン境界とトランザクション整合性の維持', () => {
    it('ドメインエンティティの不変条件が維持される', () => {
      const fortune = createFortune('chuukichi', '中吉', 3);
      const omikujiResult = createOmikujiResult('engineer-fortune', fortune);
      const categories = FortuneCategory.getAllRequiredCategories();

      const extendedResult = compatibility.createCompatibleResult(
        omikujiResult,
        categories
      );

      // エンティティの不変条件
      expect(extendedResult.getId()).toBeTruthy();
      expect(extendedResult.getFortune()).toBe(fortune);
      expect(extendedResult.getCreatedAt()).toBeInstanceOf(Date);
      
      // 値オブジェクトの不変条件
      const retrievedCategories = compatibility.getRandomizedCategories(extendedResult);
      expect(retrievedCategories?.every(cat => cat.getId().length > 0)).toBe(true);
      expect(retrievedCategories?.every(cat => cat.getDisplayName().length > 0)).toBe(true);
    });

    it('トランザクション境界内での整合性が保たれる', () => {
      const fortune = createFortune('kyo', '凶', -1);
      const omikujiResult = createOmikujiResult('engineer-fortune', fortune);
      const categories = FortuneCategory.getAllRequiredCategories()
        .map(cat => cat.withFortuneLevel('凶運勢のコンテンツ'));

      // 単一トランザクション内での操作をシミュレート
      const transactionResult = compatibility.executeWithinTransaction(() => {
        const extended = compatibility.createCompatibleResult(omikujiResult, categories);
        const retrieved = compatibility.getRandomizedCategories(extended);
        
        return {
          originalResult: omikujiResult,
          extendedResult: extended,
          categories: retrieved
        };
      });

      // 一貫性の検証
      expect(transactionResult.originalResult.getFortune()).toBe(
        transactionResult.extendedResult.getFortune()
      );
      expect(transactionResult.categories).toHaveLength(5);
    });

    it('同時アクセス時の整合性が保たれる', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      const omikujiResult = createOmikujiResult('engineer-fortune', fortune);
      const categories = FortuneCategory.getAllRequiredCategories();

      // 複数の並行操作をシミュレート
      const operations = Array.from({ length: 10 }, (_, i) => 
        compatibility.createCompatibleResult(
          omikujiResult,
          categories.map(cat => cat.withFortuneLevel(`並行処理${i}`))
        )
      );

      // すべての操作が同じベース結果を持つ
      operations.forEach(result => {
        expect(result.getFortune()).toBe(fortune);
        expect(result.getOmikujiType()).toBe(omikujiResult.getOmikujiType());
      });

      // カテゴリの整合性
      const allCategories = operations.map(result => 
        compatibility.getRandomizedCategories(result)
      );
      
      allCategories.forEach(cats => {
        expect(cats).toHaveLength(5);
        expect(cats?.every(cat => cat.hasFortuneLevel())).toBe(true);
      });
    });
  });

  describe('下位互換性の検証', () => {
    it('ランダム化機能を使用しない場合でも既存コードが動作する', () => {
      const fortune = createFortune('kichi', '吉', 2);
      const omikujiResult = createOmikujiResult('engineer-fortune', fortune);

      // 既存のコードパターンが動作することを確認
      expect(() => {
        const id = omikujiResult.getId();
        const type = omikujiResult.getOmikujiType();
        const fortuneValue = omikujiResult.getFortune();
        const summary = omikujiResult.getDisplaySummary();
        
        // これらの操作が例外なく実行される
        expect(id).toBeTruthy();
        expect(type).toBeDefined();
        expect(fortuneValue).toBe(fortune);
        expect(summary).toContain('Test Omikuji');
      }).not.toThrow();
    });

    it('既存のシリアライゼーション・デシリアライゼーションが動作する', () => {
      const fortune = createFortune('daikichi', '大吉', 4);
      const omikujiResult = createOmikujiResult('engineer-fortune', fortune);
      const categories = FortuneCategory.getAllRequiredCategories();

      const extendedResult = compatibility.createCompatibleResult(
        omikujiResult,
        categories
      );

      // JSONシリアライゼーション
      const serialized = compatibility.toSerializableFormat(extendedResult);
      expect(serialized).toBeDefined();
      expect(serialized.fortune).toBeDefined();
      expect(serialized.omikujiType).toBeDefined();

      // デシリアライゼーション
      const deserialized = compatibility.fromSerializableFormat(serialized);
      expect(deserialized.getFortune().getId()).toBe(fortune.getId());
    });
  });
});