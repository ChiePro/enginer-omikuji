import { describe, it, expect } from 'vitest';
import { convertRarityToTierData, convertRaritiesToTierData } from './rarityConverter';
import { Rarity } from '../../../domain/valueObjects/Rarity';

describe('rarityConverter', () => {
  describe('convertRarityToTierData', () => {
    it('COMMONレアリティを正しくTierDataに変換する', () => {
      // Act
      const tierData = convertRarityToTierData(Rarity.COMMON);

      // Assert
      expect(tierData.rarity).toBe('common');
      expect(tierData.label).toBe('コモン');
      expect(tierData.probability).toBe(0.6);
      expect(tierData.color).toBe('#9CA3AF');
      expect(tierData.effects).toBeUndefined();
    });

    it('RAREレアリティを正しくTierDataに変換する', () => {
      // Act
      const tierData = convertRarityToTierData(Rarity.RARE);

      // Assert
      expect(tierData.rarity).toBe('rare');
      expect(tierData.label).toBe('レア');
      expect(tierData.probability).toBe(0.3);
      expect(tierData.color).toBe('#3B82F6');
      expect(tierData.effects).toBeUndefined();
    });

    it('EPICレアリティを正しくTierDataに変換し、エフェクトが付与される', () => {
      // Act
      const tierData = convertRarityToTierData(Rarity.EPIC);

      // Assert
      expect(tierData.rarity).toBe('epic');
      expect(tierData.label).toBe('エピック');
      expect(tierData.probability).toBe(0.08);
      expect(tierData.color).toBe('#8B5CF6');
      expect(tierData.effects).toEqual({
        glow: true,
        sparkle: true
      });
    });

    it('LEGENDARYレアリティを正しくTierDataに変換し、全エフェクトが付与される', () => {
      // Act
      const tierData = convertRarityToTierData(Rarity.LEGENDARY);

      // Assert
      expect(tierData.rarity).toBe('legendary');
      expect(tierData.label).toBe('レジェンダリー');
      expect(tierData.probability).toBe(0.02);
      expect(tierData.color).toBe('#F59E0B');
      expect(tierData.effects).toEqual({
        glow: true,
        sparkle: true,
        animation: 'pulse'
      });
    });
  });

  describe('convertRaritiesToTierData', () => {
    it('すべてのレアリティを正しく変換する', () => {
      // Arrange
      const rarities = [Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY];

      // Act
      const tierDataList = convertRaritiesToTierData(rarities);

      // Assert
      expect(tierDataList).toHaveLength(4);
      expect(tierDataList[0].rarity).toBe('common');
      expect(tierDataList[1].rarity).toBe('rare');
      expect(tierDataList[2].rarity).toBe('epic');
      expect(tierDataList[3].rarity).toBe('legendary');
    });

    it('変換後の順序が保持される', () => {
      // Arrange
      const rarities = [Rarity.LEGENDARY, Rarity.COMMON];

      // Act
      const tierDataList = convertRaritiesToTierData(rarities);

      // Assert
      expect(tierDataList[0].rarity).toBe('legendary');
      expect(tierDataList[1].rarity).toBe('common');
    });
  });
});