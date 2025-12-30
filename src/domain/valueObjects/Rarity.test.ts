import { describe, it, expect } from 'vitest';
import { Rarity } from './Rarity';

describe('Rarity', () => {
  describe('レアリティ定義', () => {
    it('4段階のレアリティが定義されている', () => {
      // Assert
      expect(Rarity.COMMON).toBeDefined();
      expect(Rarity.RARE).toBeDefined();
      expect(Rarity.EPIC).toBeDefined();
      expect(Rarity.LEGENDARY).toBeDefined();
    });

    it('正しい確率分布が設定されている', () => {
      // Assert
      expect(Rarity.COMMON.getProbability()).toBe(0.6); // 60%
      expect(Rarity.RARE.getProbability()).toBe(0.3); // 30%
      expect(Rarity.EPIC.getProbability()).toBe(0.08); // 8%
      expect(Rarity.LEGENDARY.getProbability()).toBe(0.02); // 2%
    });

    it('正しい日本語ラベルが設定されている', () => {
      // Assert
      expect(Rarity.COMMON.getLabel()).toBe('コモン');
      expect(Rarity.RARE.getLabel()).toBe('レア');
      expect(Rarity.EPIC.getLabel()).toBe('エピック');
      expect(Rarity.LEGENDARY.getLabel()).toBe('レジェンダリー');
    });

    it('正しい表示色が設定されている', () => {
      // Assert
      expect(Rarity.COMMON.getDisplayColor()).toBe('#9CA3AF');
      expect(Rarity.RARE.getDisplayColor()).toBe('#3B82F6');
      expect(Rarity.EPIC.getDisplayColor()).toBe('#8B5CF6');
      expect(Rarity.LEGENDARY.getDisplayColor()).toBe('#F59E0B');
    });
  });

  describe('価値の比較', () => {
    it('LEGENDARYはEPICより価値が高い', () => {
      // Act & Assert
      expect(Rarity.LEGENDARY.isMoreValuableThan(Rarity.EPIC)).toBe(true);
    });

    it('EPICはRAREより価値が高い', () => {
      // Act & Assert
      expect(Rarity.EPIC.isMoreValuableThan(Rarity.RARE)).toBe(true);
    });

    it('RAREはCOMMONより価値が高い', () => {
      // Act & Assert
      expect(Rarity.RARE.isMoreValuableThan(Rarity.COMMON)).toBe(true);
    });

    it('COMMONはRAREより価値が低い', () => {
      // Act & Assert
      expect(Rarity.COMMON.isMoreValuableThan(Rarity.RARE)).toBe(false);
    });

    it('同じレアリティは等価値である', () => {
      // Act & Assert
      expect(Rarity.COMMON.isMoreValuableThan(Rarity.COMMON)).toBe(false);
      expect(Rarity.LEGENDARY.isMoreValuableThan(Rarity.LEGENDARY)).toBe(false);
    });
  });

  describe('エフェクト判定', () => {
    it('EPICとLEGENDARYは特別エフェクトを持つ', () => {
      // Act & Assert
      expect(Rarity.EPIC.hasSpecialEffects()).toBe(true);
      expect(Rarity.LEGENDARY.hasSpecialEffects()).toBe(true);
    });

    it('COMMONとRAREは特別エフェクトを持たない', () => {
      // Act & Assert
      expect(Rarity.COMMON.hasSpecialEffects()).toBe(false);
      expect(Rarity.RARE.hasSpecialEffects()).toBe(false);
    });
  });

  describe('確率システム', () => {
    it('すべてのレアリティの確率の合計が100%になる', () => {
      // Arrange
      const rarities = [Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY];

      // Act
      const totalProbability = rarities.reduce((sum, rarity) => 
        sum + rarity.getProbability(), 0
      );

      // Assert
      expect(totalProbability).toBeCloseTo(1.0); // 100%
    });

    it('レアリティの順番で価値が昇順になっている', () => {
      // Arrange
      const rarities = [Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY];

      // Act & Assert
      for (let i = 0; i < rarities.length - 1; i++) {
        expect(rarities[i + 1].isMoreValuableThan(rarities[i])).toBe(true);
      }
    });
  });

  describe('バリューの取得', () => {
    it('内部的な価値数値を取得できる', () => {
      // Act & Assert
      expect(Rarity.COMMON.getValue()).toBe(1);
      expect(Rarity.RARE.getValue()).toBe(2);
      expect(Rarity.EPIC.getValue()).toBe(3);
      expect(Rarity.LEGENDARY.getValue()).toBe(4);
    });
  });

  describe('レアリティタイプ文字列の取得', () => {
    it('レアリティタイプの文字列表現を取得できる', () => {
      // Act & Assert
      expect(Rarity.COMMON.getType()).toBe('COMMON');
      expect(Rarity.RARE.getType()).toBe('RARE');
      expect(Rarity.EPIC.getType()).toBe('EPIC');
      expect(Rarity.LEGENDARY.getType()).toBe('LEGENDARY');
    });
  });
});