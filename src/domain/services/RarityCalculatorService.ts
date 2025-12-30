import { Rarity } from '../valueObjects/Rarity';

export class RarityCalculatorService {
  static calculateDisplayRarities(): { rarity: Rarity; percentage: string }[] {
    return [
      { rarity: Rarity.COMMON, percentage: '60%' },
      { rarity: Rarity.RARE, percentage: '30%' },
      { rarity: Rarity.EPIC, percentage: '8%' },
      { rarity: Rarity.LEGENDARY, percentage: '2%' }
    ];
  }

  static isRareResult(rarity: Rarity): boolean {
    return rarity.isMoreValuableThan(Rarity.COMMON);
  }

  static determineRarity(randomValue: number): Rarity {
    // 累積確率で判定
    // COMMON: 0.0 - 0.6
    // RARE: 0.6 - 0.9  
    // EPIC: 0.9 - 0.98
    // LEGENDARY: 0.98 - 1.0

    if (randomValue < 0.6) {
      return Rarity.COMMON;
    } else if (randomValue < 0.9) {
      return Rarity.RARE;
    } else if (randomValue < 0.98) {
      return Rarity.EPIC;
    } else {
      return Rarity.LEGENDARY;
    }
  }

  static getCumulativeProbabilities(): number[] {
    const rarities = [Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY];
    const cumulativeProbabilities: number[] = [];
    let cumulative = 0;

    for (const rarity of rarities) {
      cumulative += rarity.getProbability();
      cumulativeProbabilities.push(cumulative);
    }

    return cumulativeProbabilities;
  }
}