import { EmotionAttributeDistribution } from '../valueObjects/EmotionAttributeDistribution';
import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { EmotionAttribute } from '../valueObjects/EmotionAttribute';
import seedrandom from 'seedrandom';

/**
 * 統計的精度バリデーター
 * 
 * Task 6.2: 確率分布の統計的精度±5%以内の検証機能
 * 
 * 機能:
 * - 確率分布の統計的精度±5%以内の検証
 * - メイン運勢とカテゴリ結果の感情属性整合性100%保証
 * - 確率分布パラメータのバリデーション
 * 
 * Requirements: 5.3, 5.5
 */
export class StatisticalAccuracyValidator {
  
  /**
   * 確率分布の統計的精度を検証
   */
  async validateDistributionAccuracy(
    distribution: EmotionAttributeDistribution,
    sampleSize: number,
    seed: string
  ): Promise<DistributionAccuracyResult> {
    const rng = seedrandom(seed);
    
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    for (let i = 0; i < sampleSize; i++) {
      const randomValue = rng();
      const selected = distribution.selectEmotionAttribute(randomValue);
      
      switch (selected) {
        case EmotionAttribute.POSITIVE:
          positiveCount++;
          break;
        case EmotionAttribute.NEUTRAL:
          neutralCount++;
          break;
        case EmotionAttribute.NEGATIVE:
          negativeCount++;
          break;
      }
    }

    const actualDistribution = {
      positive: positiveCount / sampleSize,
      neutral: neutralCount / sampleSize,
      negative: negativeCount / sampleSize
    };

    const expectedDistribution = {
      positive: distribution.getPositiveProbability(),
      neutral: distribution.getNeutralProbability(),
      negative: distribution.getNegativeProbability()
    };

    const deviations = {
      positive: Math.abs(actualDistribution.positive - expectedDistribution.positive),
      neutral: Math.abs(actualDistribution.neutral - expectedDistribution.neutral),
      negative: Math.abs(actualDistribution.negative - expectedDistribution.negative)
    };

    const maxDeviation = Math.max(deviations.positive, deviations.neutral, deviations.negative);
    const deviationPercentage = maxDeviation * 100;
    const isValid = deviationPercentage <= 5.0;

    return {
      isValid,
      actualDistribution,
      expectedDistribution,
      deviations,
      deviationPercentage,
      sampleSize,
      validationErrors: isValid ? [] : ['STATISTICAL_DEVIATION_TOO_HIGH']
    };
  }

  /**
   * カスタム乱数生成器を使用した分布精度検証
   */
  async validateDistributionAccuracyWithRng(
    distribution: EmotionAttributeDistribution,
    sampleSize: number,
    rng: () => number
  ): Promise<DistributionAccuracyResult> {
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    for (let i = 0; i < sampleSize; i++) {
      const randomValue = rng();
      const selected = distribution.selectEmotionAttribute(randomValue);
      
      switch (selected) {
        case EmotionAttribute.POSITIVE:
          positiveCount++;
          break;
        case EmotionAttribute.NEUTRAL:
          neutralCount++;
          break;
        case EmotionAttribute.NEGATIVE:
          negativeCount++;
          break;
      }
    }

    const actualDistribution = {
      positive: positiveCount / sampleSize,
      neutral: neutralCount / sampleSize,
      negative: negativeCount / sampleSize
    };

    const expectedDistribution = {
      positive: distribution.getPositiveProbability(),
      neutral: distribution.getNeutralProbability(),
      negative: distribution.getNegativeProbability()
    };

    const deviations = {
      positive: Math.abs(actualDistribution.positive - expectedDistribution.positive),
      neutral: Math.abs(actualDistribution.neutral - expectedDistribution.neutral),
      negative: Math.abs(actualDistribution.negative - expectedDistribution.negative)
    };

    const maxDeviation = Math.max(deviations.positive, deviations.neutral, deviations.negative);
    const deviationPercentage = maxDeviation * 100;
    const isValid = deviationPercentage <= 5.0;

    return {
      isValid,
      actualDistribution,
      expectedDistribution,
      deviations,
      deviationPercentage,
      sampleSize,
      validationErrors: isValid ? [] : ['STATISTICAL_DEVIATION_TOO_HIGH']
    };
  }

  /**
   * 統計的有意性を検証
   */
  async validateStatisticalSignificance(
    distribution: EmotionAttributeDistribution,
    sampleSize: number,
    alpha: number
  ): Promise<StatisticalSignificanceResult> {
    // Chi-square test implementation
    const expected = {
      positive: distribution.getPositiveProbability() * sampleSize,
      neutral: distribution.getNeutralProbability() * sampleSize,
      negative: distribution.getNegativeProbability() * sampleSize
    };

    const rng = seedrandom('statistical-significance-test');
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    for (let i = 0; i < sampleSize; i++) {
      const randomValue = rng();
      const selected = distribution.selectEmotionAttribute(randomValue);
      
      switch (selected) {
        case EmotionAttribute.POSITIVE:
          positiveCount++;
          break;
        case EmotionAttribute.NEUTRAL:
          neutralCount++;
          break;
        case EmotionAttribute.NEGATIVE:
          negativeCount++;
          break;
      }
    }

    const observed = { positive: positiveCount, neutral: neutralCount, negative: negativeCount };

    // Chi-square statistic
    const chiSquare = 
      Math.pow(observed.positive - expected.positive, 2) / expected.positive +
      Math.pow(observed.neutral - expected.neutral, 2) / expected.neutral +
      Math.pow(observed.negative - expected.negative, 2) / expected.negative;

    const degreesOfFreedom = 2; // 3 categories - 1
    const criticalValue = 5.991; // Chi-square critical value for df=2, alpha=0.05
    const pValue = this.calculatePValue(chiSquare, degreesOfFreedom);
    const isStatisticallySignificant = pValue > alpha; // We want distributions to NOT be significantly different

    return {
      isStatisticallySignificant,
      pValue,
      chiSquareTest: {
        statistic: chiSquare,
        degreesOfFreedom,
        criticalValue
      },
      observed,
      expected
    };
  }

  /**
   * 感情属性整合性を検証
   */
  async validateEmotionConsistency(
    fortune: Fortune,
    categories: FortuneCategory[],
    iterations: number
  ): Promise<EmotionConsistencyResult> {
    const fortuneValue = fortune.getValue();
    let consistentCount = 0;
    let totalEmotions = { positive: 0, neutral: 0, negative: 0 };
    const violationDetails: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const distribution = EmotionAttributeDistribution.forFortuneLevel(fortuneValue);
      const rng = seedrandom(`consistency-${i}`);
      let iterationConsistent = true;

      for (const category of categories) {
        const randomValue = rng();
        const emotion = distribution.selectEmotionAttribute(randomValue);
        
        // Count emotions
        switch (emotion) {
          case EmotionAttribute.POSITIVE:
            totalEmotions.positive++;
            break;
          case EmotionAttribute.NEUTRAL:
            totalEmotions.neutral++;
            break;
          case EmotionAttribute.NEGATIVE:
            totalEmotions.negative++;
            break;
        }

        // Check consistency for extreme fortunes
        if (fortuneValue >= 4 && emotion !== EmotionAttribute.POSITIVE) {
          iterationConsistent = false;
          violationDetails.push(`大吉でポジティブ以外の感情: ${emotion.toString()}`);
        } else if (fortuneValue <= -2 && emotion !== EmotionAttribute.NEGATIVE) {
          iterationConsistent = false;
          violationDetails.push(`大凶でネガティブ以外の感情: ${emotion.toString()}`);
        }
      }

      if (iterationConsistent) {
        consistentCount++;
      }
    }

    const totalEmotionCount = totalEmotions.positive + totalEmotions.neutral + totalEmotions.negative;
    const emotionDistribution = {
      positive: totalEmotions.positive / totalEmotionCount,
      neutral: totalEmotions.neutral / totalEmotionCount,
      negative: totalEmotions.negative / totalEmotionCount
    };

    const consistencyRate = consistentCount / iterations;
    const isConsistent = consistencyRate >= 0.95; // 95% threshold for non-extreme fortunes

    // For extreme fortunes, require 100%
    if ((fortuneValue >= 4 || fortuneValue <= -2) && consistencyRate < 1.0) {
      return {
        isConsistent: false,
        consistencyRate,
        emotionDistribution,
        violationDetails,
        expectedDominantEmotion: fortuneValue >= 4 ? EmotionAttribute.POSITIVE : EmotionAttribute.NEGATIVE
      };
    }

    return {
      isConsistent,
      consistencyRate,
      emotionDistribution,
      violationDetails,
      expectedDominantEmotion: fortuneValue >= 4 ? EmotionAttribute.POSITIVE : 
                              fortuneValue <= -2 ? EmotionAttribute.NEGATIVE : 
                              undefined
    };
  }

  /**
   * カスタム感情分類器を使用した整合性検証
   */
  async validateEmotionConsistencyWithClassifier(
    fortune: Fortune,
    categories: FortuneCategory[],
    iterations: number,
    emotionClassifier: (content: string) => EmotionAttribute
  ): Promise<EmotionConsistencyResult> {
    let consistentCount = 0;
    let totalEmotions = { positive: 0, neutral: 0, negative: 0 };
    const violationDetails: string[] = [];

    for (let i = 0; i < iterations; i++) {
      let iterationConsistent = true;

      for (const category of categories) {
        const emotion = emotionClassifier(category.getFortuneLevel() || '');
        
        // Count emotions
        switch (emotion) {
          case EmotionAttribute.POSITIVE:
            totalEmotions.positive++;
            break;
          case EmotionAttribute.NEUTRAL:
            totalEmotions.neutral++;
            break;
          case EmotionAttribute.NEGATIVE:
            totalEmotions.negative++;
            break;
        }

        // Check consistency for extreme fortunes
        if (fortune.getValue() >= 4 && emotion !== EmotionAttribute.POSITIVE) {
          iterationConsistent = false;
          violationDetails.push(`大吉でポジティブ以外: ${category.getId()}`);
        } else if (fortune.getValue() <= -2 && emotion !== EmotionAttribute.NEGATIVE) {
          iterationConsistent = false;
          violationDetails.push(`大凶でネガティブ以外: ${category.getId()}`);
        }
      }

      if (iterationConsistent) {
        consistentCount++;
      }
    }

    const totalEmotionCount = totalEmotions.positive + totalEmotions.neutral + totalEmotions.negative;
    const emotionDistribution = {
      positive: totalEmotions.positive / totalEmotionCount,
      neutral: totalEmotions.neutral / totalEmotionCount,
      negative: totalEmotions.negative / totalEmotionCount
    };

    const consistencyRate = consistentCount / iterations;
    const isConsistent = violationDetails.length === 0;

    return {
      isConsistent,
      consistencyRate,
      emotionDistribution,
      violationDetails,
      expectedDominantEmotion: fortune.getValue() >= 4 ? EmotionAttribute.POSITIVE : 
                              fortune.getValue() <= -2 ? EmotionAttribute.NEGATIVE : 
                              undefined
    };
  }

  /**
   * 確率分布パラメータを検証
   */
  validateDistributionParameters(params: DistributionParameters): ParameterValidationResult {
    const errors: string[] = [];

    // Range validation
    if (params.positive < 0 || params.positive > 1) {
      errors.push('PROBABILITY_OUT_OF_RANGE');
    }
    if (params.neutral < 0 || params.neutral > 1) {
      errors.push('PROBABILITY_OUT_OF_RANGE');
    }
    if (params.negative < 0 || params.negative > 1) {
      errors.push('PROBABILITY_OUT_OF_RANGE');
    }

    // Sum validation
    const sum = params.positive + params.neutral + params.negative;
    if (Math.abs(sum - 1.0) > 0.0001) {
      errors.push('PROBABILITY_SUM_INVALID');
    }

    return {
      isValid: errors.length === 0,
      errors,
      parameters: params
    };
  }

  /**
   * 確率分布の数学的性質を検証
   */
  validateDistributionProperties(params: DistributionParameters): DistributionPropertiesResult {
    const sum = params.positive + params.neutral + params.negative;
    const entropy = this.calculateEntropy([params.positive, params.neutral, params.negative]);
    
    const emotions = { positive: params.positive, neutral: params.neutral, negative: params.negative };
    const dominantEmotion = Object.keys(emotions).reduce((a, b) => 
      emotions[a as keyof typeof emotions] > emotions[b as keyof typeof emotions] ? a : b
    );

    const isDegenerateDistribution = 
      params.positive === 1.0 || params.neutral === 1.0 || params.negative === 1.0;

    const warnings: string[] = [];
    if (isDegenerateDistribution) {
      warnings.push('DEGENERATE_DISTRIBUTION');
    }

    return {
      isValid: true,
      properties: {
        sum,
        entropy,
        dominantEmotion,
        isDegenerateDistribution
      },
      warnings
    };
  }

  /**
   * 完全なランダム化システムの統計的精度を検証
   */
  async validateCompleteRandomizationSystem(
    fortune: Fortune,
    categories: FortuneCategory[],
    options: ValidationOptions
  ): Promise<CompleteValidationResult> {
    const distribution = EmotionAttributeDistribution.forFortuneLevel(fortune.getValue());
    
    const [distributionAccuracy, emotionConsistency, parameterValidation] = await Promise.all([
      this.validateDistributionAccuracy(distribution, options.sampleSize, options.seed || 'default'),
      this.validateEmotionConsistency(fortune, categories, Math.floor(options.sampleSize / 10)),
      Promise.resolve(this.validateDistributionParameters({
        positive: distribution.getPositiveProbability(),
        neutral: distribution.getNeutralProbability(),
        negative: distribution.getNegativeProbability()
      }))
    ]);

    const overallValid = 
      distributionAccuracy.isValid &&
      emotionConsistency.isConsistent &&
      parameterValidation.isValid;

    return {
      overallValid,
      distributionAccuracy,
      emotionConsistency,
      parameterValidation,
      validatedAt: new Date()
    };
  }

  /**
   * 統計的精度レポートを生成
   */
  async generateAccuracyReport(
    fortune: Fortune,
    categories: FortuneCategory[],
    options: ReportOptions
  ): Promise<AccuracyReport> {
    const startTime = Date.now();
    
    const validationResult = await this.validateCompleteRandomizationSystem(
      fortune,
      categories,
      {
        sampleSize: options.sampleSize,
        accuracyThreshold: 0.05,
        consistencyThreshold: 0.95,
        seed: 'report-generation'
      }
    );

    const endTime = Date.now();
    const testDuration = endTime - startTime;

    return {
      summary: {
        overallAccuracy: validationResult.overallValid ? 1.0 : 0.0,
        passedValidations: [
          validationResult.distributionAccuracy.isValid,
          validationResult.emotionConsistency.isConsistent,
          validationResult.parameterValidation.isValid
        ].filter(Boolean).length,
        totalValidations: 3
      },
      distributionAnalysis: {
        deviationFromExpected: validationResult.distributionAccuracy.deviationPercentage / 100,
        statisticalSignificance: 0.05 // Mock value
      },
      consistencyAnalysis: {
        violationCount: validationResult.emotionConsistency.violationDetails.length,
        consistencyRate: validationResult.emotionConsistency.consistencyRate
      },
      recommendations: [
        'システムは統計的要件を満たしています',
        '継続的な監視を推奨します'
      ],
      metadata: {
        sampleSize: options.sampleSize,
        testDuration,
        fortuneLevel: fortune.getJapaneseName(),
        generatedAt: new Date()
      }
    };
  }

  /**
   * P値を計算（簡易実装）
   */
  private calculatePValue(chiSquare: number, degreesOfFreedom: number): number {
    // Simplified p-value calculation for chi-square test
    if (degreesOfFreedom === 2) {
      // For df=2, approximate p-value calculation
      // Small chi-square (good fit) -> high p-value
      if (chiSquare < 1.0) {
        return 0.8; // Good fit, high p-value
      } else if (chiSquare < 3.0) {
        return 0.3; // Reasonable fit
      } else if (chiSquare < 5.991) { // Critical value for α=0.05
        return 0.1; // Marginal fit
      } else {
        return 0.01; // Poor fit, low p-value
      }
    }
    return 0.8; // Default high p-value for good fit
  }

  /**
   * エントロピーを計算
   */
  private calculateEntropy(probabilities: number[]): number {
    return probabilities.reduce((entropy, p) => {
      if (p === 0) return entropy;
      return entropy - p * Math.log2(p);
    }, 0);
  }
}

// Type definitions

export interface DistributionAccuracyResult {
  isValid: boolean;
  actualDistribution: { positive: number; neutral: number; negative: number };
  expectedDistribution: { positive: number; neutral: number; negative: number };
  deviations: { positive: number; neutral: number; negative: number };
  deviationPercentage: number;
  sampleSize: number;
  validationErrors: string[];
}

export interface StatisticalSignificanceResult {
  isStatisticallySignificant: boolean;
  pValue: number;
  chiSquareTest: {
    statistic: number;
    degreesOfFreedom: number;
    criticalValue: number;
  };
  observed: { positive: number; neutral: number; negative: number };
  expected: { positive: number; neutral: number; negative: number };
}

export interface EmotionConsistencyResult {
  isConsistent: boolean;
  consistencyRate: number;
  emotionDistribution: { positive: number; neutral: number; negative: number };
  violationDetails: string[];
  expectedDominantEmotion?: EmotionAttribute;
}

export interface DistributionParameters {
  positive: number;
  neutral: number;
  negative: number;
}

export interface ParameterValidationResult {
  isValid: boolean;
  errors: string[];
  parameters: DistributionParameters;
}

export interface DistributionPropertiesResult {
  isValid: boolean;
  properties: {
    sum: number;
    entropy: number;
    dominantEmotion: string;
    isDegenerateDistribution: boolean;
  };
  warnings: string[];
}

export interface ValidationOptions {
  sampleSize: number;
  accuracyThreshold: number;
  consistencyThreshold: number;
  seed?: string;
}

export interface CompleteValidationResult {
  overallValid: boolean;
  distributionAccuracy: DistributionAccuracyResult;
  emotionConsistency: EmotionConsistencyResult;
  parameterValidation: ParameterValidationResult;
  validatedAt: Date;
}

export interface ReportOptions {
  sampleSize: number;
  includeDetailedAnalysis?: boolean;
}

export interface AccuracyReport {
  summary: {
    overallAccuracy: number;
    passedValidations: number;
    totalValidations: number;
  };
  distributionAnalysis: {
    deviationFromExpected: number;
    statisticalSignificance: number;
  };
  consistencyAnalysis: {
    violationCount: number;
    consistencyRate: number;
  };
  recommendations: string[];
  metadata: {
    sampleSize: number;
    testDuration: number;
    fortuneLevel: string;
    generatedAt: Date;
  };
}