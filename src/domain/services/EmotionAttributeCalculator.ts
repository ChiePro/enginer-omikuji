import { EmotionAttribute } from '../valueObjects/EmotionAttribute';
import { EmotionAttributeDistribution } from '../valueObjects/EmotionAttributeDistribution';
import { OmikujiResult } from '../entities/OmikujiResult';
import { Fortune } from '../valueObjects/Fortune';

export type SelectionError = 
  | { type: 'NO_RESULTS_PROVIDED'; resultsCount: number }
  | { type: 'INVALID_EMOTION_DISTRIBUTION'; distribution: EmotionDistribution }
  | { type: 'NO_MATCHING_EMOTION_RESULTS'; emotion: EmotionAttribute };

export type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface EmotionDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

export class EmotionAttributeCalculator {
  
  selectByEmotionAttribute(
    results: OmikujiResult[], 
    fortune: Fortune
  ): Result<OmikujiResult, SelectionError> {
    // Validate input
    if (results.length === 0) {
      return {
        success: false,
        error: {
          type: 'NO_RESULTS_PROVIDED',
          resultsCount: 0
        }
      };
    }

    // Get emotion distribution for this fortune
    const distribution = EmotionAttributeDistribution.forFortuneLevel(fortune.getValue());
    
    // Select emotion attribute based on probability
    const randomValue = Math.random();
    const selectedEmotion = distribution.selectEmotionAttribute(randomValue);

    // Try to find results matching the selected emotion
    const matchingResults = this.filterResultsByEmotion(results, selectedEmotion);
    
    if (matchingResults.length > 0) {
      // Randomly select from matching results
      const randomIndex = Math.floor(Math.random() * matchingResults.length);
      return {
        success: true,
        data: matchingResults[randomIndex]
      };
    }
    
    // Fallback: return any available result
    const randomIndex = Math.floor(Math.random() * results.length);
    return {
      success: true,
      data: results[randomIndex]
    };
  }

  getEmotionDistribution(fortuneValue: number): EmotionDistribution {
    const distribution = EmotionAttributeDistribution.forFortuneLevel(fortuneValue);
    return {
      positive: distribution.getPositiveProbability(),
      neutral: distribution.getNeutralProbability(),
      negative: distribution.getNegativeProbability()
    };
  }

  private filterResultsByEmotion(results: OmikujiResult[], emotion: EmotionAttribute): OmikujiResult[] {
    // For now, since OmikujiResult doesn't have emotion attribute property yet,
    // we'll simulate emotion classification based on fortune value
    return results.filter(result => {
      const simulatedEmotion = this.classifyResultEmotion(result);
      return simulatedEmotion === emotion;
    });
  }

  private classifyResultEmotion(result: OmikujiResult): EmotionAttribute {
    // Simulate emotion classification based on fortune value
    const fortuneValue = result.getFortune().getValue();
    
    if (fortuneValue >= 2) {
      return EmotionAttribute.POSITIVE;
    } else if (fortuneValue >= 0) {
      return EmotionAttribute.NEUTRAL;
    } else {
      return EmotionAttribute.NEGATIVE;
    }
  }
}