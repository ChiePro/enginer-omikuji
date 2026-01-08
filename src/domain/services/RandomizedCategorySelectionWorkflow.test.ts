import { describe, expect, it, beforeEach, vi } from 'vitest';
import { RandomizedCategorySelectionWorkflow } from './RandomizedCategorySelectionWorkflow';
import { CategoryRandomizationService } from './CategoryRandomizationService';
import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';

describe('RandomizedCategorySelectionWorkflow', () => {
  let workflow: RandomizedCategorySelectionWorkflow;
  let mockRandomizationService: CategoryRandomizationService;

  beforeEach(() => {
    mockRandomizationService = {
      randomizeCategories: vi.fn(),
      validateCategoryCompleteness: vi.fn(),
      getRandomizationStats: vi.fn(),
      batchRandomizeCategories: vi.fn(),
      deterministicRandomizeCategories: vi.fn()
    } as any;

    workflow = new RandomizedCategorySelectionWorkflow(mockRandomizationService);
  });

  // Helper to create fortune with specific value
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

  const mockCategories = FortuneCategory.getAllRequiredCategories();

  describe('カテゴリ独立ランダム選択', () => {
    it('各カテゴリが独立してランダムに選択される', async () => {
      const fortune = createFortune('kichi', '吉', 2);

      // Mock successful randomization
      (mockRandomizationService.randomizeCategories as any)
        .mockResolvedValue({ success: true, data: mockCategories });

      const result = await workflow.executeIndependentCategorySelection(fortune);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toHaveLength(5);
        expect(result.data.isIndependentSelection).toBe(true);
        expect(result.data.selectionMethod).toBe('independent');
      }

      // 独立選択では各カテゴリに異なるシードが使用されることを確認
      expect(mockRandomizationService.randomizeCategories).toHaveBeenCalledWith(
        fortune,
        undefined,
        expect.stringMatching(/^independent-\d+$/)
      );
    });

    it('独立選択モードで統計的に異なる結果が生成される', async () => {
      const fortune = createFortune('kichi', '吉', 2);

      // 複数の異なる結果をシミュレート
      const mockResults = [
        mockCategories.map(cat => cat.withFortuneLevel('結果A')),
        mockCategories.map(cat => cat.withFortuneLevel('結果B')),
        mockCategories.map(cat => cat.withFortuneLevel('結果C'))
      ];

      (mockRandomizationService.randomizeCategories as any)
        .mockResolvedValueOnce({ success: true, data: mockResults[0] })
        .mockResolvedValueOnce({ success: true, data: mockResults[1] })
        .mockResolvedValueOnce({ success: true, data: mockResults[2] });

      const results = await Promise.all([
        workflow.executeIndependentCategorySelection(fortune),
        workflow.executeIndependentCategorySelection(fortune),
        workflow.executeIndependentCategorySelection(fortune)
      ]);

      // すべてが成功することを確認
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // 異なる結果が生成されていることを確認
      const resultContents = results.map(result => 
        result.success ? result.data.categories.map(cat => cat.getFortuneLevel()).join(',') : ''
      );
      
      const uniqueResults = new Set(resultContents);
      expect(uniqueResults.size).toBeGreaterThan(1); // 少なくとも2つは異なる結果
    });

    it('独立選択で各カテゴリが異なるシードで処理される', async () => {
      const fortune = createFortune('kichi', '吉', 2);

      (mockRandomizationService.randomizeCategories as any)
        .mockResolvedValue({ success: true, data: mockCategories });

      const result = await workflow.executeIndependentCategorySelectionWithDetailedSeeds(
        fortune,
        'base-seed-123'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.seedDetails).toHaveLength(5);
        
        // 各カテゴリに異なるシードが割り当てられていることを確認
        const seeds = result.data.seedDetails.map(detail => detail.seed);
        const uniqueSeeds = new Set(seeds);
        expect(uniqueSeeds.size).toBe(5);
        
        // すべてのシードがベースシードから派生していることを確認
        seeds.forEach(seed => {
          expect(seed).toContain('base-seed-123');
        });
      }
    });
  });

  describe('同一メイン運勢での異なるカテゴリ組み合わせ提供', () => {
    it('同じ運勢で複数回実行すると異なる組み合わせを提供する', async () => {
      const fortune = createFortune('chuukichi', '中吉', 3);

      // 異なる組み合わせをシミュレート
      const combinations = [
        mockCategories.map(cat => cat.withFortuneLevel('パターン1')),
        mockCategories.map(cat => cat.withFortuneLevel('パターン2')),
        mockCategories.map(cat => cat.withFortuneLevel('パターン3')),
        mockCategories.map(cat => cat.withFortuneLevel('パターン4')),
        mockCategories.map(cat => cat.withFortuneLevel('パターン5'))
      ];

      (mockRandomizationService.randomizeCategories as any)
        .mockResolvedValueOnce({ success: true, data: combinations[0] })
        .mockResolvedValueOnce({ success: true, data: combinations[1] })
        .mockResolvedValueOnce({ success: true, data: combinations[2] })
        .mockResolvedValueOnce({ success: true, data: combinations[3] })
        .mockResolvedValueOnce({ success: true, data: combinations[4] });

      const result = await workflow.generateMultipleCategoryCombinations(fortune, 5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.combinations).toHaveLength(5);
        
        // すべての組み合わせが異なることを確認
        const combinationStrings = result.data.combinations.map(combo =>
          combo.categories.map(cat => cat.getFortuneLevel()).join(',')
        );
        const uniqueCombinations = new Set(combinationStrings);
        expect(uniqueCombinations.size).toBe(5);
        
        // メタデータが正しく設定されていることを確認
        expect(result.data.fortuneLevel).toBe('中吉');
        expect(result.data.totalCombinations).toBe(5);
      }
    });

    it('同一運勢での組み合わせバリエーションを検証する', async () => {
      const fortune = createFortune('daikichi', '大吉', 4);

      const mockCombination = mockCategories.map(cat => cat.withFortuneLevel('大吉コンテンツ'));
      (mockRandomizationService.randomizeCategories as any)
        .mockResolvedValue({ success: true, data: mockCombination });

      const result = await workflow.validateCombinationVariation(fortune, 10);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalAttempts).toBe(10);
        expect(result.data.uniqueCombinations).toBeGreaterThanOrEqual(1);
        expect(result.data.variationRate).toBeGreaterThanOrEqual(0);
        expect(result.data.variationRate).toBeLessThanOrEqual(1);
        expect(result.data.fortuneLevel).toBe('大吉');
      }
    });

    it('組み合わせ多様性統計を提供する', async () => {
      const fortune = createFortune('kichi', '吉', 2);

      const mockCombination = mockCategories;
      (mockRandomizationService.randomizeCategories as any)
        .mockResolvedValue({ success: true, data: mockCombination });

      const result = await workflow.getCombinationDiversityStats(fortune, 50);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalSamples).toBe(50);
        expect(result.data.uniquePatterns).toBeGreaterThanOrEqual(1);
        expect(result.data.diversityIndex).toBeGreaterThanOrEqual(0);
        expect(result.data.entropyMeasure).toBeGreaterThanOrEqual(0);
        expect(result.data.categoryDistribution).toBeDefined();
      }
    });
  });

  describe('emotion-weighted probability distributionの適用', () => {
    it('運勢レベルに応じた感情重み付き確率分布を適用する', async () => {
      const daikichiFortune = createFortune('daikichi', '大吉', 4);

      (mockRandomizationService.randomizeCategories as any)
        .mockResolvedValue({ success: true, data: mockCategories });

      const result = await workflow.executeEmotionWeightedSelection(daikichiFortune);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.appliedDistribution.isExtremeLevel).toBe(true);
        expect(result.data.appliedDistribution.guaranteedEmotion).toBe('positive');
        expect(result.data.emotionWeights.positive).toBeGreaterThan(0.7); // 大吉では高いポジティブ重み
      }
    });

    it('凶運勢ではネガティブ感情が重み付けされる', async () => {
      const kyoFortune = createFortune('kyo', '凶', -1);

      (mockRandomizationService.randomizeCategories as any)
        .mockResolvedValue({ success: true, data: mockCategories });

      const result = await workflow.executeEmotionWeightedSelection(kyoFortune);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emotionWeights.negative).toBeGreaterThan(0.5); // 凶ではネガティブ重み高
        expect(result.data.appliedDistribution.isExtremeLevel).toBe(false);
      }
    });

    it('中程度の運勢ではバランスの取れた感情分布を適用する', async () => {
      const chuukichiFortune = createFortune('chuukichi', '中吉', 3);

      (mockRandomizationService.randomizeCategories as any)
        .mockResolvedValue({ success: true, data: mockCategories });

      const result = await workflow.executeEmotionWeightedSelection(chuukichiFortune);

      expect(result.success).toBe(true);
      if (result.success) {
        const weights = result.data.emotionWeights;
        
        // 中吉では適度にポジティブだがバランスも考慮
        expect(weights.positive).toBeGreaterThan(0.5);
        expect(weights.positive).toBeLessThan(0.9);
        expect(weights.neutral).toBeGreaterThan(0.1);
        expect(weights.negative).toBeGreaterThan(0.01);
        
        // 重みの合計が1.0になることを確認
        const total = weights.positive + weights.neutral + weights.negative;
        expect(total).toBeCloseTo(1.0, 0.01);
      }
    });
  });

  describe('ワークフロー統合機能', () => {
    it('完全なランダム化ワークフローを実行する', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      const sessionId = 'workflow-session-123';

      (mockRandomizationService.randomizeCategories as any)
        .mockResolvedValue({ success: true, data: mockCategories });

      const result = await workflow.executeCompleteRandomizationWorkflow(
        fortune,
        sessionId,
        {
          enableIndependentSelection: true,
          generateMultipleCombinations: 3,
          applyEmotionWeighting: true
        }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.primaryResult).toBeDefined();
        expect(result.data.alternativeCombinations).toHaveLength(3);
        expect(result.data.emotionDistributionApplied).toBe(true);
        expect(result.data.independentSelectionUsed).toBe(true);
        expect(result.data.sessionId).toBe(sessionId);
      }
    });

    it('ワークフロー設定に基づいてカスタマイズされた実行を行う', async () => {
      const fortune = createFortune('suekichi', '末吉', 0);

      (mockRandomizationService.randomizeCategories as any)
        .mockResolvedValue({ success: true, data: mockCategories });

      const result = await workflow.executeCompleteRandomizationWorkflow(
        fortune,
        undefined,
        {
          enableIndependentSelection: false,
          generateMultipleCombinations: 1,
          applyEmotionWeighting: true,
          customSeed: 'custom-workflow-seed'
        }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.independentSelectionUsed).toBe(false);
        expect(result.data.alternativeCombinations).toHaveLength(1);
        expect(result.data.customSettings?.customSeed).toBe('custom-workflow-seed');
      }
    });

    it('エラー処理とフォールバック機能を検証する', async () => {
      const fortune = createFortune('invalid', '無効', 999);

      (mockRandomizationService.randomizeCategories as any)
        .mockResolvedValue({
          success: false,
          error: { type: 'EMOTION_DISTRIBUTION_ERROR', fortuneValue: 999 }
        });

      const result = await workflow.executeCompleteRandomizationWorkflow(fortune);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('WORKFLOW_EXECUTION_ERROR');
        expect(result.error.cause).toContain('EMOTION_DISTRIBUTION_ERROR');
      }
    });
  });

  describe('パフォーマンス要件', () => {
    it('100ms以内でワークフロー実行が完了する', async () => {
      const fortune = createFortune('kichi', '吉', 2);

      (mockRandomizationService.randomizeCategories as any)
        .mockResolvedValue({ success: true, data: mockCategories });

      const startTime = performance.now();
      
      const result = await workflow.executeCompleteRandomizationWorkflow(fortune);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(100); // 100ms以内
    });
  });
});