import { describe, it, expect } from 'vitest';
import { SaisenEffectCalculatorService } from './SaisenEffectCalculatorService';
import { Saisen } from '../valueObjects/Saisen';
import { Rarity } from '../valueObjects/Rarity';

describe('SaisenEffectCalculatorService', () => {
  describe('レアリティ確率の調整', () => {
    it('5円（ご縁）では元の確率のまま', () => {
      // Arrange
      const originalProbabilities = [0.6, 0.9, 0.98, 1.0]; // COMMON, RARE, EPIC, LEGENDARY累積確率

      // Act
      const adjustedProbabilities = SaisenEffectCalculatorService.adjustRarityProbabilities(
        originalProbabilities, 
        Saisen.GOEN
      );

      // Assert
      expect(adjustedProbabilities).toEqual(originalProbabilities);
    });

    it('50円では小吉以上確率が +5% される', () => {
      // Arrange
      const originalProbabilities = [0.6, 0.9, 0.98, 1.0];

      // Act
      const adjustedProbabilities = SaisenEffectCalculatorService.adjustRarityProbabilities(
        originalProbabilities, 
        Saisen.FIFTY_YEN
      );

      // Assert
      // COMMONの確率が5%減り、RARE以上の確率が5%増える
      expect(adjustedProbabilities[0]).toBeCloseTo(0.55); // COMMON: 55%
      expect(adjustedProbabilities[1]).toBeCloseTo(0.9);  // RARE: 変わらず
      expect(adjustedProbabilities[2]).toBeCloseTo(0.98); // EPIC: 変わらず
      expect(adjustedProbabilities[3]).toBeCloseTo(1.0);  // LEGENDARY: 変わらず
    });

    it('100円ではレア以上確率が +10% される', () => {
      // Arrange
      const originalProbabilities = [0.6, 0.9, 0.98, 1.0];

      // Act
      const adjustedProbabilities = SaisenEffectCalculatorService.adjustRarityProbabilities(
        originalProbabilities, 
        Saisen.HUNDRED_YEN
      );

      // Assert
      // COMMONの確率が10%減り、RARE以上が増える
      expect(adjustedProbabilities[0]).toBeCloseTo(0.5); // COMMON: 50%
      expect(adjustedProbabilities[1]).toBeCloseTo(0.9); // RARE: 変わらず
    });

    it('500円ではエピック以上確率が +15% される', () => {
      // Arrange
      const originalProbabilities = [0.6, 0.9, 0.98, 1.0];

      // Act
      const adjustedProbabilities = SaisenEffectCalculatorService.adjustRarityProbabilities(
        originalProbabilities, 
        Saisen.FIVE_HUNDRED_YEN
      );

      // Assert
      // COMMON, RAREの確率が減り、EPIC以上が増える
      expect(adjustedProbabilities[0]).toBeCloseTo(0.45); // COMMON: 45%
      expect(adjustedProbabilities[1]).toBeCloseTo(0.825); // RARE: 82.5%
    });

    it('バグ投げ込みでは特別な確率分布になる', () => {
      // Arrange
      const originalProbabilities = [0.6, 0.9, 0.98, 1.0];

      // Act
      const adjustedProbabilities = SaisenEffectCalculatorService.adjustRarityProbabilities(
        originalProbabilities, 
        Saisen.DEBUG_BUG
      );

      // Assert
      // バグ効果では特殊な分布になる（実装詳細はあとで決める）
      expect(adjustedProbabilities).not.toEqual(originalProbabilities);
      expect(adjustedProbabilities[3]).toBe(1.0); // 最後は必ず1.0
    });
  });

  describe('レアリティ決定', () => {
    it('調整された確率でレアリティを決定する', () => {
      // Arrange
      const randomValue = 0.55; // COMMON範囲（通常）だがお賽銭効果でRAREになるケース

      // Act
      const rarity = SaisenEffectCalculatorService.determineRarityWithSaisen(
        randomValue, 
        Saisen.HUNDRED_YEN
      );

      // Assert
      expect(rarity).toBe(Rarity.RARE);
    });

    it('通常のケース（効果なし）では元のロジックと同じ', () => {
      // Arrange
      const randomValue = 0.55;

      // Act
      const rarity = SaisenEffectCalculatorService.determineRarityWithSaisen(
        randomValue, 
        Saisen.GOEN
      );

      // Assert
      expect(rarity).toBe(Rarity.COMMON);
    });

    it('バグ効果では特殊なロジックが適用される', () => {
      // Arrange
      const randomValue = 0.5;

      // Act
      const rarity = SaisenEffectCalculatorService.determineRarityWithSaisen(
        randomValue, 
        Saisen.DEBUG_BUG
      );

      // Assert
      // バグ効果では予想外のレアリティが出る可能性がある
      expect([Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY]).toContain(rarity);
    });
  });

  describe('お賽銭効果の適用可否', () => {
    it('効果ありお賽銭では適用される', () => {
      // Act & Assert
      expect(SaisenEffectCalculatorService.canApplyEffect(Saisen.FIFTY_YEN)).toBe(true);
      expect(SaisenEffectCalculatorService.canApplyEffect(Saisen.HUNDRED_YEN)).toBe(true);
      expect(SaisenEffectCalculatorService.canApplyEffect(Saisen.FIVE_HUNDRED_YEN)).toBe(true);
      expect(SaisenEffectCalculatorService.canApplyEffect(Saisen.DEBUG_BUG)).toBe(true);
    });

    it('効果なしお賽銭では適用されない', () => {
      // Act & Assert
      expect(SaisenEffectCalculatorService.canApplyEffect(Saisen.GOEN)).toBe(false);
    });
  });

  describe('効果の説明文取得', () => {
    it('各お賽銭の効果説明を取得できる', () => {
      // Act & Assert
      expect(SaisenEffectCalculatorService.getEffectDescription(Saisen.GOEN))
        .toBe('効果なし');
      expect(SaisenEffectCalculatorService.getEffectDescription(Saisen.FIFTY_YEN))
        .toBe('小吉以上の確率が5%アップ');
      expect(SaisenEffectCalculatorService.getEffectDescription(Saisen.HUNDRED_YEN))
        .toBe('レア以上の確率が10%アップ');
      expect(SaisenEffectCalculatorService.getEffectDescription(Saisen.FIVE_HUNDRED_YEN))
        .toBe('エピック以上の確率が15%アップ');
      expect(SaisenEffectCalculatorService.getEffectDescription(Saisen.DEBUG_BUG))
        .toBe('特殊なレアリティ分布が適用される');
    });
  });

  describe('確率境界の正規化', () => {
    it('確率合計が1.0を超えた場合、正規化される', () => {
      // Arrange
      const overLimitProbabilities = [0.7, 1.0, 1.1, 1.2];

      // Act
      const normalizedProbabilities = SaisenEffectCalculatorService.normalizeProbabilities(
        overLimitProbabilities
      );

      // Assert
      expect(normalizedProbabilities[3]).toBeCloseTo(1.0);
      normalizedProbabilities.forEach((prob, index) => {
        if (index > 0) {
          expect(prob).toBeGreaterThanOrEqual(normalizedProbabilities[index - 1]);
        }
        expect(prob).toBeGreaterThanOrEqual(0);
        expect(prob).toBeLessThanOrEqual(1);
      });
    });
  });
});