/**
 * 境界値テストケース
 * 
 * タスク13: 追加テストカバレッジの実装 - 境界値テスト
 * TDD Red Phase: システムの境界条件で失敗するテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Rarity } from '@/domain/valueObjects/Rarity';
import { Saisen } from '@/domain/valueObjects/Saisen';
import { OmikujiTypeId } from '@/domain/valueObjects/OmikujiTypeId';
import { OmikujiColorScheme } from '@/domain/valueObjects/OmikujiColorScheme';
import { RarityCalculatorService } from '@/domain/services/RarityCalculatorService';

describe('境界値テスト', () => {
  describe('Rarity値オブジェクトの境界値', () => {
    it('確率の境界値: すべてのレアリティの確率合計が100%ちょうどである', () => {
      // Arrange
      const rarities = [Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY];
      
      // Act
      const totalProbability = rarities.reduce((sum, rarity) => 
        sum + rarity.getProbability(), 0
      );
      
      // Assert - 浮動小数点の精度を考慮して1.0に十分に近い
      expect(totalProbability).toBeCloseTo(1.0, 10);
    });

    it('確率の下限境界値: LEGENDARY確率が0%を超える', () => {
      // Act & Assert - 最小確率が0より大きい
      expect(Rarity.LEGENDARY.getProbability()).toBeGreaterThan(0);
      expect(Rarity.LEGENDARY.getProbability()).toBeGreaterThanOrEqual(0.01); // 最低1%
    });

    it('確率の上限境界値: COMMON確率が100%未満である', () => {
      // Act & Assert - 最大確率が1.0未満
      expect(Rarity.COMMON.getProbability()).toBeLessThan(1.0);
      expect(Rarity.COMMON.getProbability()).toBeLessThanOrEqual(0.7); // 最大70%
    });

    it('確率の精度境界値: 小数点以下2桁まで正確である', () => {
      // Act
      const legendaryProb = Rarity.LEGENDARY.getProbability();
      const epicProb = Rarity.EPIC.getProbability();
      
      // Assert - 小数点以下2桁の精度
      expect(legendaryProb * 100 % 1).toBeCloseTo(0, 1);
      expect(epicProb * 100 % 1).toBeCloseTo(0, 1);
    });
  });

  describe('Saisen値オブジェクトの境界値', () => {
    it('最小金額境界値: 0円は無効である', () => {
      // Act & Assert
      expect(() => Saisen.create(0)).toThrow('お賽銭は1円以上である必要があります');
    });

    it('最小金額境界値: 1円は有効である', () => {
      // Act & Assert
      expect(() => Saisen.create(1)).not.toThrow();
      const saisen = Saisen.create(1);
      expect(saisen.getValue()).toBe(1);
    });

    it('負数境界値: マイナス金額は無効である', () => {
      // Act & Assert
      expect(() => Saisen.create(-1)).toThrow();
      expect(() => Saisen.create(-100)).toThrow();
    });

    it('最大金額境界値: 極大値でも有効である', () => {
      // Arrange
      const maxSafeInteger = Number.MAX_SAFE_INTEGER;
      
      // Act & Assert
      expect(() => Saisen.create(maxSafeInteger)).not.toThrow();
      const saisen = Saisen.create(maxSafeInteger);
      expect(saisen.getValue()).toBe(maxSafeInteger);
    });

    it('浮動小数点境界値: 小数点付き金額は無効である', () => {
      // Act & Assert
      expect(() => Saisen.create(5.5)).toThrow('お賽銭は整数である必要があります');
      expect(() => Saisen.create(100.01)).toThrow();
    });

    it('無限大境界値: Infinityは無効である', () => {
      // Act & Assert
      expect(() => Saisen.create(Infinity)).toThrow();
      expect(() => Saisen.create(-Infinity)).toThrow();
    });

    it('NaN境界値: NaNは無効である', () => {
      // Act & Assert
      expect(() => Saisen.create(NaN)).toThrow();
    });
  });

  describe('OmikujiTypeId値オブジェクトの境界値', () => {
    it('最小長境界値: 1文字のIDは有効である', () => {
      // Act & Assert
      expect(() => OmikujiTypeId.create('a')).not.toThrow();
      const id = OmikujiTypeId.create('a');
      expect(id.getValue()).toBe('a');
    });

    it('空文字境界値: 空文字列は無効である', () => {
      // Act & Assert
      expect(() => OmikujiTypeId.create('')).toThrow('おみくじタイプIDは必須です');
    });

    it('空白境界値: 空白のみは無効である', () => {
      // Act & Assert
      expect(() => OmikujiTypeId.create('   ')).toThrow('おみくじタイプIDは必須です');
      expect(() => OmikujiTypeId.create('\t')).toThrow();
      expect(() => OmikujiTypeId.create('\n')).toThrow();
    });

    it('最大長境界値: 極端に長いIDでも有効である', () => {
      // Arrange
      const longId = 'a'.repeat(1000);
      
      // Act & Assert
      expect(() => OmikujiTypeId.create(longId)).not.toThrow();
      const id = OmikujiTypeId.create(longId);
      expect(id.getValue().length).toBe(1000);
    });

    it('文字種境界値: 許可された文字のみ有効である', () => {
      // Act & Assert - 有効な文字
      expect(() => OmikujiTypeId.create('abc-123')).not.toThrow();
      expect(() => OmikujiTypeId.create('omikuji-type-01')).not.toThrow();
      
      // 無効な文字
      expect(() => OmikujiTypeId.create('ABC')).toThrow(); // 大文字
      expect(() => OmikujiTypeId.create('test_id')).toThrow(); // アンダースコア
      expect(() => OmikujiTypeId.create('test id')).toThrow(); // スペース
      expect(() => OmikujiTypeId.create('test@id')).toThrow(); // 特殊文字
    });

    it('Unicode境界値: 非ASCII文字は無効である', () => {
      // Act & Assert
      expect(() => OmikujiTypeId.create('おみくじ')).toThrow();
      expect(() => OmikujiTypeId.create('test-🎲')).toThrow();
      expect(() => OmikujiTypeId.create('café')).toThrow();
    });
  });

  describe('OmikujiColorScheme値オブジェクトの境界値', () => {
    it('カラーコード境界値: #000000 (最小値) は有効である', () => {
      // Act & Assert
      expect(() => OmikujiColorScheme.create({
        primary: '#000000',
        secondary: '#FFFFFF'
      })).not.toThrow();
    });

    it('カラーコード境界値: #FFFFFF (最大値) は有効である', () => {
      // Act & Assert
      expect(() => OmikujiColorScheme.create({
        primary: '#FFFFFF',
        secondary: '#000000'
      })).not.toThrow();
    });

    it('カラーコード境界値: 3文字短縮形式は有効である', () => {
      // Act & Assert
      expect(() => OmikujiColorScheme.create({
        primary: '#000',
        secondary: '#FFF'
      })).not.toThrow();
    });

    it('カラーコード境界値: #記号なしは無効である', () => {
      // Act & Assert
      expect(() => OmikujiColorScheme.create({
        primary: '000000',
        secondary: '#FFFFFF'
      })).toThrow('無効なカラーコードです');
    });

    it('カラーコード境界値: 不正な文字を含む場合は無効である', () => {
      // Act & Assert
      expect(() => OmikujiColorScheme.create({
        primary: '#GGGGGG',
        secondary: '#FFFFFF'
      })).toThrow('無効なカラーコードです');
      expect(() => OmikujiColorScheme.create({
        primary: '#12345Z',
        secondary: '#FFFFFF'
      })).toThrow();
    });

    it('カラーコード境界値: 長さが不正な場合は無効である', () => {
      // Act & Assert
      expect(() => OmikujiColorScheme.create({
        primary: '#00',
        secondary: '#FFFFFF'
      })).toThrow();
      expect(() => OmikujiColorScheme.create({
        primary: '#0000000',
        secondary: '#FFFFFF'
      })).toThrow();
    });

    it('コントラスト境界値: WCAG AA基準ぎりぎりのコントラスト比4.5:1', () => {
      // この部分は実装が完了していないため失敗する（RED phase）
      expect(() => OmikujiColorScheme.create({
        primary: '#767676', // コントラスト比4.5:1に相当
        secondary: '#FFFFFF'
      })).not.toThrow();
    });

    it('コントラスト境界値: WCAG AA基準を満たさない4.49:1は無効', () => {
      // この部分は実装が完了していないため失敗する（RED phase）
      expect(() => OmikujiColorScheme.create({
        primary: '#777777', // コントラスト比4.49:1に相当
        secondary: '#FFFFFF'
      })).toThrow('WCAG AAのコントラスト比を満たしていません');
    });
  });

  describe('RarityCalculatorService境界値', () => {
    it('確率計算境界値: 累積確率が1.0を超えない', () => {
      // Act
      const rarityDistribution = RarityCalculatorService.calculateDisplayRarities();
      
      // Assert
      const totalPercentage = rarityDistribution.reduce((sum, item) => {
        const numericPercentage = parseFloat(item.percentage.replace('%', ''));
        return sum + numericPercentage;
      }, 0);
      
      expect(totalPercentage).toBeLessThanOrEqual(100);
      expect(totalPercentage).toBe(100); // 厳密に100%
    });

    it('レア度判定境界値: COMMON自体はレアではない', () => {
      // Act & Assert
      expect(RarityCalculatorService.isRareResult(Rarity.COMMON)).toBe(false);
    });

    it('レア度判定境界値: COMMON以外はすべてレア', () => {
      // Act & Assert
      expect(RarityCalculatorService.isRareResult(Rarity.RARE)).toBe(true);
      expect(RarityCalculatorService.isRareResult(Rarity.EPIC)).toBe(true);
      expect(RarityCalculatorService.isRareResult(Rarity.LEGENDARY)).toBe(true);
    });
  });

  describe('数値演算の境界値', () => {
    it('JavaScript数値精度境界値: 安全な整数の範囲内', () => {
      // Arrange
      const maxSafeInt = Number.MAX_SAFE_INTEGER;
      const minSafeInt = Number.MIN_SAFE_INTEGER;
      
      // Act & Assert
      expect(Number.isSafeInteger(maxSafeInt)).toBe(true);
      expect(Number.isSafeInteger(minSafeInt)).toBe(true);
      expect(Number.isSafeInteger(maxSafeInt + 1)).toBe(false);
    });

    it('浮動小数点精度境界値: 確率計算の精度保証', () => {
      // Arrange
      const prob1 = 0.1;
      const prob2 = 0.2;
      const prob3 = 0.7;
      
      // Act
      const sum = prob1 + prob2 + prob3;
      
      // Assert - 浮動小数点の精度問題を考慮
      expect(sum).toBeCloseTo(1.0, 10);
    });
  });
});