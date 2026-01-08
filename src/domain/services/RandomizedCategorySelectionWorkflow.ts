import { CategoryRandomizationService, RandomizationStats } from './CategoryRandomizationService';
import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { EnhancedEmotionAttributeCalculator } from './EnhancedEmotionAttributeCalculator';

/**
 * ランダム化カテゴリ選択ワークフロー
 * 
 * カテゴリ独立ランダム選択、組み合わせバリエーション生成、感情重み付き確率分布の適用を統合
 */
export class RandomizedCategorySelectionWorkflow {
  
  constructor(
    private readonly randomizationService: CategoryRandomizationService,
    private readonly emotionCalculator?: EnhancedEmotionAttributeCalculator
  ) {}

  /**
   * カテゴリ独立ランダム選択を実行
   */
  async executeIndependentCategorySelection(
    fortune: Fortune,
    omikujiTypeId: string,
    sessionId?: string
  ): Promise<WorkflowResult<CategorySelectionResult>> {
    try {
      // Generate independent seed for this selection
      const independentSeed = `independent-${Date.now()}`;

      const result = await this.randomizationService.randomizeCategories(
        fortune,
        omikujiTypeId,
        sessionId,
        independentSeed
      );

      if (!result.success) {
        return {
          success: false,
          error: {
            type: 'WORKFLOW_EXECUTION_ERROR',
            cause: `Randomization failed: ${result.error.type}`
          }
        };
      }

      return {
        success: true,
        data: {
          categories: result.data,
          isIndependentSelection: true,
          selectionMethod: 'independent',
          executedAt: new Date(),
          seedUsed: independentSeed
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'WORKFLOW_EXECUTION_ERROR',
          cause: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`
        }
      };
    }
  }

  /**
   * 詳細シード情報付きカテゴリ独立選択
   */
  async executeIndependentCategorySelectionWithDetailedSeeds(
    fortune: Fortune,
    omikujiTypeId: string,
    baseSeed: string,
    sessionId?: string
  ): Promise<WorkflowResult<CategorySelectionWithSeedDetails>> {
    try {
      const seedDetails: SeedDetail[] = [];
      const requiredCategories = FortuneCategory.getAllRequiredCategories();

      // Generate category-specific seeds
      const categoriesWithSeeds = requiredCategories.map((category, index) => {
        const seed = `${baseSeed}-${category.getId()}-${index}`;
        seedDetails.push({
          categoryId: category.getId(),
          categoryName: category.getDisplayName(),
          seed
        });
        return { category, seed };
      });

      // Execute randomization with the first seed (simulation for demo)
      const result = await this.randomizationService.randomizeCategories(
        fortune,
        omikujiTypeId,
        sessionId,
        seedDetails[0]?.seed
      );

      if (!result.success) {
        return {
          success: false,
          error: {
            type: 'WORKFLOW_EXECUTION_ERROR',
            cause: `Detailed seed randomization failed: ${result.error.type}`
          }
        };
      }

      return {
        success: true,
        data: {
          categories: result.data,
          seedDetails,
          baseSeed,
          isIndependentSelection: true,
          selectionMethod: 'independent-detailed'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'WORKFLOW_EXECUTION_ERROR',
          cause: `Detailed seed selection error: ${error instanceof Error ? error.message : 'Unknown'}`
        }
      };
    }
  }

  /**
   * 複数カテゴリ組み合わせを生成
   */
  async generateMultipleCategoryCombinations(
    fortune: Fortune,
    omikujiTypeId: string,
    count: number,
    sessionId?: string
  ): Promise<WorkflowResult<MultipleCombinationResult>> {
    try {
      const combinations: CategoryCombination[] = [];

      for (let i = 0; i < count; i++) {
        const seed = `combination-${Date.now()}-${i}`;
        const result = await this.randomizationService.randomizeCategories(
          fortune,
          omikujiTypeId,
          sessionId,
          seed
        );

        if (!result.success) {
          return {
            success: false,
            error: {
              type: 'WORKFLOW_EXECUTION_ERROR',
              cause: `Combination ${i} failed: ${result.error.type}`
            }
          };
        }

        combinations.push({
          categories: result.data,
          combinationIndex: i,
          seedUsed: seed,
          generatedAt: new Date()
        });
      }

      return {
        success: true,
        data: {
          combinations,
          fortuneLevel: fortune.getJapaneseName(),
          totalCombinations: count,
          generatedAt: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'WORKFLOW_EXECUTION_ERROR',
          cause: `Multiple combination generation error: ${error instanceof Error ? error.message : 'Unknown'}`
        }
      };
    }
  }

  /**
   * 組み合わせバリエーションの検証
   */
  async validateCombinationVariation(
    fortune: Fortune,
    omikujiTypeId: string,
    attempts: number,
    sessionId?: string
  ): Promise<WorkflowResult<CombinationVariationResult>> {
    try {
      const combinations = new Set<string>();

      for (let i = 0; i < attempts; i++) {
        const seed = `validation-${Date.now()}-${i}`;
        const result = await this.randomizationService.randomizeCategories(
          fortune,
          omikujiTypeId,
          sessionId,
          seed
        );

        if (result.success) {
          const combinationString = result.data
            .map(cat => cat.getFortuneLevel())
            .join(',');
          combinations.add(combinationString);
        }
      }

      const uniqueCombinations = combinations.size;
      const variationRate = uniqueCombinations / attempts;

      return {
        success: true,
        data: {
          totalAttempts: attempts,
          uniqueCombinations,
          variationRate,
          fortuneLevel: fortune.getJapaneseName(),
          validatedAt: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'WORKFLOW_EXECUTION_ERROR',
          cause: `Combination validation error: ${error instanceof Error ? error.message : 'Unknown'}`
        }
      };
    }
  }

  /**
   * 組み合わせ多様性統計を取得
   */
  async getCombinationDiversityStats(
    fortune: Fortune,
    omikujiTypeId: string,
    samples: number,
    sessionId?: string
  ): Promise<WorkflowResult<DiversityStatsResult>> {
    try {
      const patterns = new Map<string, number>();
      const categoryDistribution: { [category: string]: { [level: string]: number } } = {};

      for (let i = 0; i < samples; i++) {
        const seed = `diversity-${Date.now()}-${i}`;
        const result = await this.randomizationService.randomizeCategories(
          fortune,
          omikujiTypeId,
          sessionId,
          seed
        );

        if (result.success) {
          const pattern = result.data.map(cat => cat.getFortuneLevel()).join(',');
          patterns.set(pattern, (patterns.get(pattern) || 0) + 1);

          // Track category distribution
          result.data.forEach(cat => {
            const categoryName = cat.getDisplayName();
            const level = cat.getFortuneLevel() ?? 'unknown';

            if (!categoryDistribution[categoryName]) {
              categoryDistribution[categoryName] = {};
            }
            categoryDistribution[categoryName][level] =
              (categoryDistribution[categoryName][level] || 0) + 1;
          });
        }
      }

      const uniquePatterns = patterns.size;
      const entropyMeasure = this.calculateEntropy(Array.from(patterns.values()), samples);
      const diversityIndex = uniquePatterns / samples;

      return {
        success: true,
        data: {
          totalSamples: samples,
          uniquePatterns,
          diversityIndex,
          entropyMeasure,
          categoryDistribution,
          generatedAt: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'WORKFLOW_EXECUTION_ERROR',
          cause: `Diversity stats error: ${error instanceof Error ? error.message : 'Unknown'}`
        }
      };
    }
  }

  /**
   * 感情重み付き選択を実行
   */
  async executeEmotionWeightedSelection(
    fortune: Fortune,
    omikujiTypeId: string,
    sessionId?: string
  ): Promise<WorkflowResult<EmotionWeightedSelectionResult>> {
    try {
      // Get emotion distribution for the fortune
      const emotionCalculator = this.emotionCalculator || new EnhancedEmotionAttributeCalculator();
      const distribution = emotionCalculator.getEnhancedEmotionDistribution(fortune);

      // Execute randomization
      const result = await this.randomizationService.randomizeCategories(
        fortune,
        omikujiTypeId,
        sessionId
      );

      if (!result.success) {
        return {
          success: false,
          error: {
            type: 'WORKFLOW_EXECUTION_ERROR',
            cause: `Emotion weighted selection failed: ${result.error.type}`
          }
        };
      }

      // Calculate emotion weights based on fortune value
      const fortuneValue = fortune.getValue();
      let emotionWeights: EmotionWeights;

      if (fortuneValue >= 4) {
        // 大吉 - high positive
        emotionWeights = { positive: 0.85, neutral: 0.10, negative: 0.05 };
      } else if (fortuneValue <= -2) {
        // 大凶 - high negative
        emotionWeights = { positive: 0.05, neutral: 0.15, negative: 0.80 };
      } else if (fortuneValue >= 1) {
        // 中吉・吉 - moderately positive
        emotionWeights = { positive: 0.65, neutral: 0.25, negative: 0.10 };
      } else {
        // 凶・末吉 - negative leaning
        emotionWeights = { positive: 0.20, neutral: 0.25, negative: 0.55 };
      }

      return {
        success: true,
        data: {
          categories: result.data,
          emotionWeights,
          appliedDistribution: {
            isExtremeLevel: distribution.isExtremeLevel,
            guaranteedEmotion: distribution.isExtremeLevel 
              ? (fortuneValue >= 4 ? 'positive' : 'negative')
              : undefined
          },
          fortuneValue,
          executedAt: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'WORKFLOW_EXECUTION_ERROR',
          cause: `Emotion weighted selection error: ${error instanceof Error ? error.message : 'Unknown'}`
        }
      };
    }
  }

  /**
   * 完全ランダム化ワークフローを実行
   */
  async executeCompleteRandomizationWorkflow(
    fortune: Fortune,
    omikujiTypeId: string,
    sessionId?: string,
    options?: WorkflowOptions
  ): Promise<WorkflowResult<CompleteWorkflowResult>> {
    try {
      const startTime = performance.now();

      // Primary result generation
      let primaryResult: CategorySelectionResult;

      if (options?.enableIndependentSelection !== false) {
        const independentResult = await this.executeIndependentCategorySelection(fortune, omikujiTypeId, sessionId);
        if (!independentResult.success) {
          return {
            success: false,
            error: independentResult.error
          };
        }
        primaryResult = independentResult.data;
      } else {
        // Use regular randomization
        const result = await this.randomizationService.randomizeCategories(
          fortune,
          omikujiTypeId,
          sessionId,
          options?.customSeed
        );

        if (!result.success) {
          return {
            success: false,
            error: {
              type: 'WORKFLOW_EXECUTION_ERROR',
              cause: `Primary result generation failed: ${result.error.type}`
            }
          };
        }

        primaryResult = {
          categories: result.data,
          isIndependentSelection: false,
          selectionMethod: 'standard',
          executedAt: new Date(),
          seedUsed: options?.customSeed
        };
      }

      // Generate alternative combinations
      const combinationCount = options?.generateMultipleCombinations || 1;
      const alternativeCombinationsResult = await this.generateMultipleCategoryCombinations(
        fortune,
        omikujiTypeId,
        combinationCount,
        sessionId
      );

      if (!alternativeCombinationsResult.success) {
        return {
          success: false,
          error: alternativeCombinationsResult.error
        };
      }

      // Apply emotion weighting if requested
      let emotionWeightingResult: EmotionWeightedSelectionResult | undefined;
      if (options?.applyEmotionWeighting !== false) {
        const weightingResult = await this.executeEmotionWeightedSelection(fortune, omikujiTypeId, sessionId);
        if (weightingResult.success) {
          emotionWeightingResult = weightingResult.data;
        }
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      return {
        success: true,
        data: {
          primaryResult,
          alternativeCombinations: alternativeCombinationsResult.data.combinations,
          emotionDistributionApplied: options?.applyEmotionWeighting !== false,
          independentSelectionUsed: options?.enableIndependentSelection !== false,
          executionTime,
          sessionId,
          customSettings: options ? {
            enableIndependentSelection: options.enableIndependentSelection,
            generateMultipleCombinations: options.generateMultipleCombinations,
            applyEmotionWeighting: options.applyEmotionWeighting,
            customSeed: options.customSeed
          } : undefined,
          emotionWeightingDetails: emotionWeightingResult,
          executedAt: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'WORKFLOW_EXECUTION_ERROR',
          cause: `Complete workflow error: ${error instanceof Error ? error.message : 'Unknown'}`
        }
      };
    }
  }

  /**
   * エントロピー計算（多様性指標用）
   */
  private calculateEntropy(frequencies: number[], total: number): number {
    return frequencies.reduce((entropy, freq) => {
      if (freq === 0) return entropy;
      const probability = freq / total;
      return entropy - (probability * Math.log2(probability));
    }, 0);
  }
}

// Type definitions
export type WorkflowResult<T> = 
  | { success: true; data: T }
  | { success: false; error: WorkflowError };

export type WorkflowError = {
  type: 'WORKFLOW_EXECUTION_ERROR';
  cause: string;
};

export interface CategorySelectionResult {
  categories: FortuneCategory[];
  isIndependentSelection: boolean;
  selectionMethod: string;
  executedAt: Date;
  seedUsed?: string;
}

export interface CategorySelectionWithSeedDetails {
  categories: FortuneCategory[];
  seedDetails: SeedDetail[];
  baseSeed: string;
  isIndependentSelection: boolean;
  selectionMethod: string;
}

export interface SeedDetail {
  categoryId: string;
  categoryName: string;
  seed: string;
}

export interface CategoryCombination {
  categories: FortuneCategory[];
  combinationIndex: number;
  seedUsed: string;
  generatedAt: Date;
}

export interface MultipleCombinationResult {
  combinations: CategoryCombination[];
  fortuneLevel: string;
  totalCombinations: number;
  generatedAt: Date;
}

export interface CombinationVariationResult {
  totalAttempts: number;
  uniqueCombinations: number;
  variationRate: number;
  fortuneLevel: string;
  validatedAt: Date;
}

export interface DiversityStatsResult {
  totalSamples: number;
  uniquePatterns: number;
  diversityIndex: number;
  entropyMeasure: number;
  categoryDistribution: { [category: string]: { [level: string]: number } };
  generatedAt: Date;
}

export interface EmotionWeights {
  positive: number;
  neutral: number;
  negative: number;
}

export interface EmotionWeightedSelectionResult {
  categories: FortuneCategory[];
  emotionWeights: EmotionWeights;
  appliedDistribution: {
    isExtremeLevel: boolean;
    guaranteedEmotion?: 'positive' | 'negative';
  };
  fortuneValue: number;
  executedAt: Date;
}

export interface CompleteWorkflowResult {
  primaryResult: CategorySelectionResult;
  alternativeCombinations: CategoryCombination[];
  emotionDistributionApplied: boolean;
  independentSelectionUsed: boolean;
  executionTime: number;
  sessionId?: string;
  customSettings?: {
    enableIndependentSelection?: boolean;
    generateMultipleCombinations?: number;
    applyEmotionWeighting?: boolean;
    customSeed?: string;
  };
  emotionWeightingDetails?: EmotionWeightedSelectionResult;
  executedAt: Date;
}

export interface WorkflowOptions {
  enableIndependentSelection?: boolean;
  generateMultipleCombinations?: number;
  applyEmotionWeighting?: boolean;
  customSeed?: string;
}