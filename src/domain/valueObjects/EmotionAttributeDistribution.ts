import { EmotionAttribute } from './EmotionAttribute';

export type ValidationError = {
  type: 'PROBABILITY_SUM_INVALID' | 'INVALID_PROBABILITY_RANGE';
  message: string;
};

export type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

export class EmotionAttributeDistribution {
  private constructor(
    private readonly positive: number,
    private readonly neutral: number,
    private readonly negative: number
  ) {}

  static create(
    positive: number,
    neutral: number,
    negative: number
  ): Result<EmotionAttributeDistribution, ValidationError> {
    // Validate probability range
    if (!this.isValidProbability(positive) || 
        !this.isValidProbability(neutral) || 
        !this.isValidProbability(negative)) {
      return {
        success: false,
        error: {
          type: 'INVALID_PROBABILITY_RANGE',
          message: '確率は0.0から1.0の範囲で指定してください'
        }
      };
    }

    // Validate probability sum (with floating point tolerance)
    const total = positive + neutral + negative;
    if (Math.abs(total - 1.0) > 0.0001) {
      return {
        success: false,
        error: {
          type: 'PROBABILITY_SUM_INVALID',
          message: `確率の合計は1.0である必要があります。現在の合計: ${total}`
        }
      };
    }

    return {
      success: true,
      data: new EmotionAttributeDistribution(positive, neutral, negative)
    };
  }

  static forFortuneLevel(fortuneValue: number): EmotionAttributeDistribution {
    if (fortuneValue >= 3) { // 大吉・中吉
      return this.create(0.80, 0.15, 0.05).data!;
    } else if (fortuneValue >= 1) { // 吉・小吉
      return this.create(0.60, 0.30, 0.10).data!;
    } else if (fortuneValue === 0) { // 末吉
      return this.create(0.30, 0.50, 0.20).data!;
    } else { // 凶・大凶
      return this.create(0.15, 0.25, 0.60).data!;
    }
  }

  selectEmotionAttribute(randomValue: number): EmotionAttribute {
    if (randomValue < this.positive) {
      return EmotionAttribute.POSITIVE;
    } else if (randomValue < this.positive + this.neutral) {
      return EmotionAttribute.NEUTRAL;
    } else {
      return EmotionAttribute.NEGATIVE;
    }
  }

  getPositiveProbability(): number {
    return this.positive;
  }

  getNeutralProbability(): number {
    return this.neutral;
  }

  getNegativeProbability(): number {
    return this.negative;
  }

  private static isValidProbability(value: number): boolean {
    return value >= 0.0 && value <= 1.0;
  }
}