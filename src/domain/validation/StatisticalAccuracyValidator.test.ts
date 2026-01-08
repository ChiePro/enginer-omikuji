import { describe, expect, it, beforeEach, vi } from 'vitest';
import { StatisticalAccuracyValidator } from './StatisticalAccuracyValidator';
import { EmotionAttributeDistribution } from '../valueObjects/EmotionAttributeDistribution';
import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { EmotionAttribute } from '../valueObjects/EmotionAttribute';

describe('StatisticalAccuracyValidator', () => {
  let validator: StatisticalAccuracyValidator;

  beforeEach(() => {
    validator = new StatisticalAccuracyValidator();
  });

  // Helper to create Fortune
  const createFortune = (id: string, japaneseName: string, value: number): Fortune => {
    return Fortune.fromData({
      id,
      englishName: id,
      japaneseName,
      description: `${japaneseName}の運勢`,
      probability: 0.1,
      value,
      color: { primary: '#000000', secondary: '#ffffff', background: '#f0f0f0' },
      effects: { glow: false, sparkle: false, animation: null }
    });
  };

  describe('確率分布の統計的精度±5%以内の検証機能', () => {
    it('大量サンプルでの統計的精度が±5%以内であることを検証する', async () => {
      const distribution = EmotionAttributeDistribution.forFortuneLevel(2); // 吉 (60%, 30%, 10%)
      const sampleSize = 50000;

      const result = await validator.validateDistributionAccuracy(
        distribution,
        sampleSize,
        'test-seed-123'
      );

      expect(result.isValid).toBe(true);
      expect(result.actualDistribution.positive).toBeGreaterThan(0.55); // 60% - 5%
      expect(result.actualDistribution.positive).toBeLessThan(0.65); // 60% + 5%
      expect(result.actualDistribution.neutral).toBeGreaterThan(0.25); // 30% - 5%
      expect(result.actualDistribution.neutral).toBeLessThan(0.35); // 30% + 5%
      expect(result.deviationPercentage).toBeLessThan(5.0);
    });

    it('期待値から大きく外れた分布は無効と判定する', async () => {
      // Mock a biased distribution
      const biasedDistribution = EmotionAttributeDistribution.create(0.95, 0.03, 0.02).data!;
      
      // モックした乱数生成器で偏った結果を生成
      const mockRng = vi.fn()
        .mockImplementation(() => 0.1); // 常にポジティブ側を返す

      const result = await validator.validateDistributionAccuracyWithRng(
        biasedDistribution,
        1000,
        mockRng
      );

      expect(result.isValid).toBe(false);
      expect(result.deviationPercentage).toBeGreaterThan(5.0);
      expect(result.validationErrors).toContain('STATISTICAL_DEVIATION_TOO_HIGH');
    });

    it('異なる運勢レベルで適切な分布精度を保持する', async () => {
      const testCases = [
        { fortuneValue: 4, expectedPositive: 1.0 }, // 大吉 - 100% positive per requirements
        { fortuneValue: 2, expectedPositive: 0.60 }, // 吉
        { fortuneValue: 0, expectedPositive: 0.30 }, // 末吉
        { fortuneValue: -1, expectedPositive: 0.15 }, // 凶
        { fortuneValue: -3, expectedPositive: 0.0 } // 大凶 - 0% positive per requirements
      ];

      for (const testCase of testCases) {
        const distribution = EmotionAttributeDistribution.forFortuneLevel(testCase.fortuneValue);
        const result = await validator.validateDistributionAccuracy(
          distribution,
          10000,
          `test-${testCase.fortuneValue}`
        );

        expect(result.isValid).toBe(true);
        expect(result.actualDistribution.positive).toBeCloseTo(testCase.expectedPositive, 1);
      }
    });

    it('統計的有意性を検証する', async () => {
      const distribution = EmotionAttributeDistribution.forFortuneLevel(3); // 中吉
      
      const result = await validator.validateStatisticalSignificance(
        distribution,
        10000,
        0.05 // 5%有意水準
      );

      expect(result.isStatisticallySignificant).toBe(true);
      expect(result.pValue).toBeGreaterThan(0.05); // High p-value indicates distributions are not significantly different
      expect(result.chiSquareTest.statistic).toBeDefined();
      expect(result.chiSquareTest.degreesOfFreedom).toBe(2); // 3カテゴリ - 1
    });
  });

  describe('メイン運勢とカテゴリ結果の感情属性整合性100%保証', () => {
    it('大吉では全カテゴリがポジティブ感情属性を持つ', async () => {
      const daikichiFortune = createFortune('daikichi', '大吉', 4);
      const categories = FortuneCategory.getAllRequiredCategories();

      const result = await validator.validateEmotionConsistency(
        daikichiFortune,
        categories,
        1000 // 検証回数
      );

      expect(result.isConsistent).toBe(true);
      expect(result.consistencyRate).toBe(1.0); // 100%
      expect(result.violationDetails).toEqual([]);
    });

    it('大凶では全カテゴリがネガティブ感情属性を持つ', async () => {
      const daikyoFortune = createFortune('daikyo', '大凶', -3);
      const categories = FortuneCategory.getAllRequiredCategories();

      const result = await validator.validateEmotionConsistency(
        daikyoFortune,
        categories,
        1000
      );

      expect(result.isConsistent).toBe(true);
      expect(result.consistencyRate).toBe(1.0);
      expect(result.expectedDominantEmotion).toBe(EmotionAttribute.NEGATIVE);
    });

    it('中間運勢では適切な感情分布を維持する', async () => {
      const chuukichiFortune = createFortune('chuukichi', '中吉', 3);
      const categories = FortuneCategory.getAllRequiredCategories();

      const result = await validator.validateEmotionConsistency(
        chuukichiFortune,
        categories,
        5000
      );

      expect(result.isConsistent).toBe(true);
      expect(result.emotionDistribution.positive).toBeGreaterThan(0.75); // 中吉は主にポジティブ
      expect(result.emotionDistribution.negative).toBeLessThan(0.10);
    });

    it('整合性違反を正確に検出する', async () => {
      const daikichiFortune = createFortune('daikichi', '大吉', 4);
      
      // モックしたカテゴリでネガティブな内容を持つものを混入
      const mockCategories = [
        FortuneCategory.createLove().withFortuneLevel('ネガティブな恋愛内容'),
        FortuneCategory.createWork().withFortuneLevel('ポジティブな仕事内容'),
      ];

      // 感情判定をモック
      const mockEmotionClassifier = vi.fn()
        .mockReturnValueOnce(EmotionAttribute.NEGATIVE) // 最初のカテゴリ
        .mockReturnValueOnce(EmotionAttribute.POSITIVE); // 2番目のカテゴリ

      const result = await validator.validateEmotionConsistencyWithClassifier(
        daikichiFortune,
        mockCategories,
        100,
        mockEmotionClassifier
      );

      expect(result.isConsistent).toBe(false);
      expect(result.consistencyRate).toBeLessThan(1.0);
      expect(result.violationDetails.length).toBeGreaterThan(0);
    });
  });

  describe('確率分布パラメータのバリデーション機能', () => {
    it('有効な確率分布パラメータを検証する', () => {
      const validDistributions = [
        { positive: 0.8, neutral: 0.15, negative: 0.05 },
        { positive: 0.6, neutral: 0.3, negative: 0.1 },
        { positive: 0.3, neutral: 0.5, negative: 0.2 }
      ];

      validDistributions.forEach(params => {
        const result = validator.validateDistributionParameters(params);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('無効な確率分布パラメータを検出する', () => {
      const invalidCases = [
        { params: { positive: 1.1, neutral: 0.0, negative: 0.0 }, expected: 'PROBABILITY_OUT_OF_RANGE' },
        { params: { positive: 0.5, neutral: 0.3, negative: 0.3 }, expected: 'PROBABILITY_SUM_INVALID' },
        { params: { positive: -0.1, neutral: 0.6, negative: 0.5 }, expected: 'PROBABILITY_OUT_OF_RANGE' },
        { params: { positive: 0.4, neutral: 0.4, negative: 0.1 }, expected: 'PROBABILITY_SUM_INVALID' }
      ];

      invalidCases.forEach(({ params, expected }) => {
        const result = validator.validateDistributionParameters(params);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expected);
      });
    });

    it('確率分布の数学的性質を検証する', () => {
      const distribution = { positive: 0.6, neutral: 0.3, negative: 0.1 };
      
      const result = validator.validateDistributionProperties(distribution);

      expect(result.isValid).toBe(true);
      expect(result.properties.sum).toBeCloseTo(1.0, 10);
      expect(result.properties.entropy).toBeGreaterThan(0); // 情報エントロピー
      expect(result.properties.dominantEmotion).toBe('positive');
      expect(result.properties.isDegenerateDistribution).toBe(false);
    });

    it('退化した分布（一点集中）を検出する', () => {
      const degenerateDistribution = { positive: 1.0, neutral: 0.0, negative: 0.0 };
      
      const result = validator.validateDistributionProperties(degenerateDistribution);

      expect(result.isValid).toBe(true); // 数学的には有効
      expect(result.properties.isDegenerateDistribution).toBe(true);
      expect(result.properties.entropy).toBeCloseTo(0, 5);
      expect(result.warnings).toContain('DEGENERATE_DISTRIBUTION');
    });
  });

  describe('統合バリデーション機能', () => {
    it('完全なランダム化システムの統計的精度を検証する', async () => {
      const testScenarios = [
        { fortune: createFortune('daikichi', '大吉', 4), expectedConsistency: 1.0 },
        { fortune: createFortune('kichi', '吉', 2), expectedConsistency: 0.95 },
        { fortune: createFortune('kyo', '凶', -1), expectedConsistency: 0.95 }
      ];

      for (const scenario of testScenarios) {
        const result = await validator.validateCompleteRandomizationSystem(
          scenario.fortune,
          FortuneCategory.getAllRequiredCategories(),
          {
            sampleSize: 5000,
            accuracyThreshold: 0.05,
            consistencyThreshold: scenario.expectedConsistency,
            seed: `validation-${scenario.fortune.getId()}`
          }
        );

        expect(result.overallValid).toBe(true);
        expect(result.distributionAccuracy.isValid).toBe(true);
        expect(result.emotionConsistency.isConsistent).toBe(true);
        expect(result.parameterValidation.isValid).toBe(true);
      }
    });

    it('統計的精度レポートを生成する', async () => {
      const fortune = createFortune('chuukichi', '中吉', 3);
      const categories = FortuneCategory.getAllRequiredCategories();

      const report = await validator.generateAccuracyReport(
        fortune,
        categories,
        { sampleSize: 10000, includeDetailedAnalysis: true }
      );

      expect(report.summary.overallAccuracy).toBeGreaterThan(0.95);
      expect(report.distributionAnalysis.deviationFromExpected).toBeLessThan(0.05);
      expect(report.consistencyAnalysis.violationCount).toBe(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.metadata.sampleSize).toBe(10000);
      expect(report.metadata.testDuration).toBeGreaterThan(0);
    });
  });
});