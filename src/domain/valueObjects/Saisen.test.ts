import { describe, it, expect } from 'vitest';
import { Saisen } from './Saisen';
import { InvalidSaisenAmountError } from '../errors/ApplicationErrors';

describe('Saisen', () => {
  describe('お賽銭の種類と定義', () => {
    it('5種類のお賽銭が定義されている', () => {
      // Assert
      expect(Saisen.GOEN).toBeDefined();
      expect(Saisen.FIFTY_YEN).toBeDefined();
      expect(Saisen.HUNDRED_YEN).toBeDefined();
      expect(Saisen.FIVE_HUNDRED_YEN).toBeDefined();
      expect(Saisen.DEBUG_BUG).toBeDefined();
    });

    it('正しい金額が設定されている', () => {
      // Assert
      expect(Saisen.GOEN.getAmount()).toBe(5);
      expect(Saisen.FIFTY_YEN.getAmount()).toBe(50);
      expect(Saisen.HUNDRED_YEN.getAmount()).toBe(100);
      expect(Saisen.FIVE_HUNDRED_YEN.getAmount()).toBe(500);
      expect(Saisen.DEBUG_BUG.getAmount()).toBe(0); // バグは無料
    });

    it('正しい名前が設定されている', () => {
      // Assert
      expect(Saisen.GOEN.getName()).toBe('5円（ご縁）');
      expect(Saisen.FIFTY_YEN.getName()).toBe('50円');
      expect(Saisen.HUNDRED_YEN.getName()).toBe('100円');
      expect(Saisen.FIVE_HUNDRED_YEN.getName()).toBe('500円');
      expect(Saisen.DEBUG_BUG.getName()).toBe('賽銭箱にバグを投げ込む');
    });

    it('正しい説明が設定されている', () => {
      // Assert
      expect(Saisen.GOEN.getDescription()).toBe('効果なし（通常確率）');
      expect(Saisen.FIFTY_YEN.getDescription()).toBe('ちょっとだけ運気アップ');
      expect(Saisen.HUNDRED_YEN.getDescription()).toBe('運気アップ');
      expect(Saisen.FIVE_HUNDRED_YEN.getDescription()).toBe('大幅運気アップ');
      expect(Saisen.DEBUG_BUG.getDescription()).toBe('特殊な結果が出る可能性');
    });
  });

  describe('効果の取得', () => {
    it('5円（ご縁）は効果なし', () => {
      // Act & Assert
      expect(Saisen.GOEN.hasEffect()).toBe(false);
      expect(Saisen.GOEN.getRarityBoost()).toBe(0);
    });

    it('50円は小吉以上確率 +5%', () => {
      // Act & Assert
      expect(Saisen.FIFTY_YEN.hasEffect()).toBe(true);
      expect(Saisen.FIFTY_YEN.getRarityBoost()).toBe(5);
    });

    it('100円はレア以上確率 +10%', () => {
      // Act & Assert
      expect(Saisen.HUNDRED_YEN.hasEffect()).toBe(true);
      expect(Saisen.HUNDRED_YEN.getRarityBoost()).toBe(10);
    });

    it('500円はエピック以上確率 +15%', () => {
      // Act & Assert
      expect(Saisen.FIVE_HUNDRED_YEN.hasEffect()).toBe(true);
      expect(Saisen.FIVE_HUNDRED_YEN.getRarityBoost()).toBe(15);
    });

    it('バグは特殊効果あり', () => {
      // Act & Assert
      expect(Saisen.DEBUG_BUG.hasEffect()).toBe(true);
      expect(Saisen.DEBUG_BUG.isSpecial()).toBe(true);
    });
  });

  describe('アニメーションとエフェクト', () => {
    it('500円は特別なアニメーションを持つ', () => {
      // Act & Assert
      expect(Saisen.FIVE_HUNDRED_YEN.hasSpecialAnimation()).toBe(true);
    });

    it('他の金額は通常アニメーション', () => {
      // Act & Assert
      expect(Saisen.GOEN.hasSpecialAnimation()).toBe(false);
      expect(Saisen.FIFTY_YEN.hasSpecialAnimation()).toBe(false);
      expect(Saisen.HUNDRED_YEN.hasSpecialAnimation()).toBe(false);
    });

    it('バグは特別なエフェクトを持つ', () => {
      // Act & Assert
      expect(Saisen.DEBUG_BUG.hasSpecialAnimation()).toBe(true);
    });
  });

  describe('カスタムお賽銭の作成', () => {
    it('有効な金額でお賽銭を作成できる', () => {
      // Arrange & Act
      const customSaisen = Saisen.create(10, 'カスタム10円', '10円効果', { rarityBoost: 1 });

      // Assert
      expect(customSaisen.getAmount()).toBe(10);
      expect(customSaisen.getName()).toBe('カスタム10円');
      expect(customSaisen.getRarityBoost()).toBe(1);
    });

    it('負の金額でInvalidSaisenAmountErrorを投げる', () => {
      // Act & Assert
      expect(() => Saisen.create(-10, 'ダメ', '', {}))
        .toThrow(InvalidSaisenAmountError);
    });

    it('効果なしのお賽銭を作成できる', () => {
      // Arrange & Act
      const noEffectSaisen = Saisen.create(1, '1円', '何も起こらない', {});

      // Assert
      expect(noEffectSaisen.hasEffect()).toBe(false);
      expect(noEffectSaisen.getRarityBoost()).toBe(0);
    });
  });

  describe('お賽銭の比較', () => {
    it('金額で比較できる', () => {
      // Act & Assert
      expect(Saisen.HUNDRED_YEN.isMoreExpensiveThan(Saisen.FIFTY_YEN)).toBe(true);
      expect(Saisen.FIFTY_YEN.isMoreExpensiveThan(Saisen.HUNDRED_YEN)).toBe(false);
      expect(Saisen.GOEN.isMoreExpensiveThan(Saisen.GOEN)).toBe(false);
    });

    it('効果の強さで比較できる', () => {
      // Act & Assert
      expect(Saisen.FIVE_HUNDRED_YEN.isMoreEffectiveThan(Saisen.HUNDRED_YEN)).toBe(true);
      expect(Saisen.HUNDRED_YEN.isMoreEffectiveThan(Saisen.FIFTY_YEN)).toBe(true);
      expect(Saisen.FIFTY_YEN.isMoreEffectiveThan(Saisen.GOEN)).toBe(true);
    });
  });

  describe('すべてのお賽銭取得', () => {
    it('定義済みお賽銭をすべて取得できる', () => {
      // Act
      const allSaisen = Saisen.getAllPredefinedSaisen();

      // Assert
      expect(allSaisen).toHaveLength(5);
      expect(allSaisen).toContain(Saisen.GOEN);
      expect(allSaisen).toContain(Saisen.FIFTY_YEN);
      expect(allSaisen).toContain(Saisen.HUNDRED_YEN);
      expect(allSaisen).toContain(Saisen.FIVE_HUNDRED_YEN);
      expect(allSaisen).toContain(Saisen.DEBUG_BUG);
    });

    it('金額順で並べて取得できる', () => {
      // Act
      const sortedSaisen = Saisen.getAllSortedByAmount();

      // Assert
      expect(sortedSaisen[0]).toBe(Saisen.DEBUG_BUG); // 0円
      expect(sortedSaisen[1]).toBe(Saisen.GOEN); // 5円
      expect(sortedSaisen[2]).toBe(Saisen.FIFTY_YEN); // 50円
      expect(sortedSaisen[3]).toBe(Saisen.HUNDRED_YEN); // 100円
      expect(sortedSaisen[4]).toBe(Saisen.FIVE_HUNDRED_YEN); // 500円
    });
  });
});