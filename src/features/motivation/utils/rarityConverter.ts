import { Rarity } from '../../../domain/valueObjects/Rarity';
import { RarityTierData } from '../components/RarityPreview/types';

export function convertRarityToTierData(rarity: Rarity): RarityTierData {
  const rarityType = rarity.getType().toLowerCase() as 'common' | 'rare' | 'epic' | 'legendary';
  
  const tierData: RarityTierData = {
    rarity: rarityType,
    label: rarity.getLabel(),
    probability: rarity.getProbability(),
    color: rarity.getDisplayColor()
  };

  // エフェクトがあるレアリティの場合、エフェクト設定を追加
  if (rarity.hasSpecialEffects()) {
    tierData.effects = {
      glow: true,
      sparkle: true
    };

    // LEGENDARYの場合、追加のアニメーション
    if (rarityType === 'legendary') {
      tierData.effects.animation = 'pulse';
    }
  }

  return tierData;
}

export function convertRaritiesToTierData(rarities: Rarity[]): RarityTierData[] {
  return rarities.map(convertRarityToTierData);
}