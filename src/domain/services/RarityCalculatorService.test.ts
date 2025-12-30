import { describe, it, expect } from 'vitest';
import { RarityCalculatorService } from './RarityCalculatorService';
import { Rarity } from '../valueObjects/Rarity';

describe('RarityCalculatorService', () => {
  describe('表示用レアリティ情報の計算', () => {
    it('4段階のレアリティ情報を正しい順序で返す', () => {
      // Act
      const displayRarities = RarityCalculatorService.calculateDisplayRarities();

      // Assert
      expect(displayRarities).toHaveLength(4);
      expect(displayRarities[0].rarity).toBe(Rarity.COMMON);
      expect(displayRarities[1].rarity).toBe(Rarity.RARE);
      expect(displayRarities[2].rarity).toBe(Rarity.EPIC);
      expect(displayRarities[3].rarity).toBe(Rarity.LEGENDARY);
    });

    it('各レアリティの確率をパーセンテージ文字列で返す', () => {
      // Act
      const displayRarities = RarityCalculatorService.calculateDisplayRarities();

      // Assert
      expect(displayRarities[0].percentage).toBe('60%');
      expect(displayRarities[1].percentage).toBe('30%');
      expect(displayRarities[2].percentage).toBe('8%');
      expect(displayRarities[3].percentage).toBe('2%');
    });

    it('レアリティオブジェクトが正しく含まれている', () => {
      // Act
      const displayRarities = RarityCalculatorService.calculateDisplayRarities();

      // Assert
      displayRarities.forEach(({ rarity, percentage }) => {
        expect(rarity).toBeInstanceOf(Rarity);
        expect(typeof percentage).toBe('string');
        expect(percentage).toMatch(/^\d+%$/);
      });
    });
  });

  describe('レア結果の判定', () => {
    it('COMMONはレアではないと判定される', () => {
      // Act & Assert
      expect(RarityCalculatorService.isRareResult(Rarity.COMMON)).toBe(false);
    });

    it('RAREはレアと判定される', () => {
      // Act & Assert
      expect(RarityCalculatorService.isRareResult(Rarity.RARE)).toBe(true);
    });

    it('EPICはレアと判定される', () => {
      // Act & Assert
      expect(RarityCalculatorService.isRareResult(Rarity.EPIC)).toBe(true);
    });

    it('LEGENDARYはレアと判定される', () => {
      // Act & Assert
      expect(RarityCalculatorService.isRareResult(Rarity.LEGENDARY)).toBe(true);
    });
  });

  describe('ランダムレアリティ生成', () => {
    it('0.0-1.0の範囲の乱数値でレアリティを決定できる', () => {
      // Arrange - COMMON範囲のテスト
      const commonRandom = 0.5; // 0-0.6の範囲内

      // Act
      const commonResult = RarityCalculatorService.determineRarity(commonRandom);

      // Assert
      expect(commonResult).toBe(Rarity.COMMON);
    });

    it('RARE範囲の乱数でRAREを返す', () => {
      // Arrange - RARE範囲のテスト (0.6-0.9)
      const rareRandom = 0.75;

      // Act
      const rareResult = RarityCalculatorService.determineRarity(rareRandom);

      // Assert
      expect(rareResult).toBe(Rarity.RARE);
    });

    it('EPIC範囲の乱数でEPICを返す', () => {
      // Arrange - EPIC範囲のテスト (0.9-0.98)
      const epicRandom = 0.95;

      // Act
      const epicResult = RarityCalculatorService.determineRarity(epicRandom);

      // Assert
      expect(epicResult).toBe(Rarity.EPIC);
    });

    it('LEGENDARY範囲の乱数でLEGENDARYを返す', () => {
      // Arrange - LEGENDARY範囲のテスト (0.98-1.0)
      const legendaryRandom = 0.99;

      // Act
      const legendaryResult = RarityCalculatorService.determineRarity(legendaryRandom);

      // Assert
      expect(legendaryResult).toBe(Rarity.LEGENDARY);
    });

    it('境界値で正しくレアリティを決定する', () => {
      // Arrange & Act & Assert
      expect(RarityCalculatorService.determineRarity(0.0)).toBe(Rarity.COMMON);
      expect(RarityCalculatorService.determineRarity(0.6)).toBe(Rarity.RARE);
      expect(RarityCalculatorService.determineRarity(0.9)).toBe(Rarity.EPIC);
      expect(RarityCalculatorService.determineRarity(0.98)).toBe(Rarity.LEGENDARY);
      expect(RarityCalculatorService.determineRarity(1.0)).toBe(Rarity.LEGENDARY);
    });
  });

  describe('確率累積計算', () => {
    it('累積確率が正しく計算される', () => {
      // Act
      const cumulativeProbabilities = RarityCalculatorService.getCumulativeProbabilities();

      // Assert
      expect(cumulativeProbabilities).toHaveLength(4);
      expect(cumulativeProbabilities[0]).toBeCloseTo(0.6);
      expect(cumulativeProbabilities[1]).toBeCloseTo(0.9);
      expect(cumulativeProbabilities[2]).toBeCloseTo(0.98);
      expect(cumulativeProbabilities[3]).toBeCloseTo(1.0);
    });
  });
});