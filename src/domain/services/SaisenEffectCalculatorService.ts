import { Saisen } from '../valueObjects/Saisen';
import { Rarity } from '../valueObjects/Rarity';
import { RarityCalculatorService } from './RarityCalculatorService';

export class SaisenEffectCalculatorService {
  static adjustRarityProbabilities(originalProbabilities: number[], saisen: Saisen): number[] {
    if (!saisen.hasEffect()) {
      return originalProbabilities;
    }

    // お賽銭による特殊効果（バグ）
    if (saisen.isSpecial()) {
      return this.applySpecialBugEffect(originalProbabilities);
    }

    // 通常のレアリティブースト効果
    const boostPercentage = saisen.getRarityBoost() / 100;
    return this.applyRarityBoost(originalProbabilities, boostPercentage, saisen);
  }

  private static applyRarityBoost(
    originalProbabilities: number[], 
    boostPercentage: number,
    saisen: Saisen
  ): number[] {
    const adjusted = [...originalProbabilities];

    if (saisen === Saisen.FIFTY_YEN) {
      // 50円: 小吉以上確率 +5% (RARE以上の確率を上げる)
      adjusted[0] = Math.max(0, originalProbabilities[0] - boostPercentage); // COMMON減少
    } else if (saisen === Saisen.HUNDRED_YEN) {
      // 100円: レア以上確率 +10%
      adjusted[0] = Math.max(0, originalProbabilities[0] - boostPercentage); // COMMON減少
    } else if (saisen === Saisen.FIVE_HUNDRED_YEN) {
      // 500円: エピック以上確率 +15%
      // COMMONを15%減らし、EPICとLEGENDARYの確率を上げる
      adjusted[0] = Math.max(0, originalProbabilities[0] - boostPercentage); // COMMON: 45%
      adjusted[1] = originalProbabilities[1] - boostPercentage * 0.5; // RARE: 75%
    }

    return this.normalizeProbabilities(adjusted);
  }

  private static applySpecialBugEffect(originalProbabilities: number[]): number[] {
    // バグ効果: 通常とは違う特殊な分布
    // LEGENDARYの確率を大幅に上げつつ、ランダム性も加える
    return [
      0.3,   // COMMON: 30%
      0.5,   // RARE: 20%
      0.8,   // EPIC: 30%
      1.0    // LEGENDARY: 20%
    ];
  }

  static normalizeProbabilities(probabilities: number[]): number[] {
    const normalized = [...probabilities];
    
    // 各要素を0以上1以下に制限
    for (let i = 0; i < normalized.length; i++) {
      normalized[i] = Math.max(0, Math.min(1, normalized[i]));
    }
    
    // 累積確率なので、各段階は前より大きくなければならない
    for (let i = 1; i < normalized.length; i++) {
      if (normalized[i] < normalized[i - 1]) {
        normalized[i] = normalized[i - 1];
      }
    }
    
    // 最後は必ず1.0
    normalized[normalized.length - 1] = 1.0;
    
    return normalized;
  }

  static determineRarityWithSaisen(randomValue: number, saisen: Saisen): Rarity {
    const originalProbabilities = RarityCalculatorService.getCumulativeProbabilities();
    const adjustedProbabilities = this.adjustRarityProbabilities(originalProbabilities, saisen);

    // 調整された確率に基づいてレアリティを決定
    if (randomValue < adjustedProbabilities[0]) {
      return Rarity.COMMON;
    } else if (randomValue < adjustedProbabilities[1]) {
      return Rarity.RARE;
    } else if (randomValue < adjustedProbabilities[2]) {
      return Rarity.EPIC;
    } else {
      return Rarity.LEGENDARY;
    }
  }

  static canApplyEffect(saisen: Saisen): boolean {
    return saisen.hasEffect();
  }

  static getEffectDescription(saisen: Saisen): string {
    if (!saisen.hasEffect()) {
      return '効果なし';
    }

    if (saisen.isSpecial()) {
      return '特殊なレアリティ分布が適用される';
    }

    const boostPercentage = saisen.getRarityBoost();
    if (saisen === Saisen.FIFTY_YEN) {
      return `小吉以上の確率が${boostPercentage}%アップ`;
    } else if (saisen === Saisen.HUNDRED_YEN) {
      return `レア以上の確率が${boostPercentage}%アップ`;
    } else if (saisen === Saisen.FIVE_HUNDRED_YEN) {
      return `エピック以上の確率が${boostPercentage}%アップ`;
    }

    return `レアリティ確率が${boostPercentage}%アップ`;
  }
}