import type { ICategoryRandomizationService, Result, ValidationError, RandomizationError } from './ICategoryRandomizationService';
export type { RandomizationError } from './ICategoryRandomizationService';
import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { CategoryContentPoolService } from './CategoryContentPoolService';
import { SessionDuplicationGuardService } from './SessionDuplicationGuardService';
import { EnhancedEmotionAttributeCalculator } from './EnhancedEmotionAttributeCalculator';
import { CategoryContent } from '../../infrastructure/repositories/json/ExtendedJsonSchema';

/**
 * カテゴリランダム化オーケストレーションサービス
 * 
 * 5つの必須カテゴリの完全性保証、セッション管理との協調、メイン運勢に応じた適切な組み合わせ生成を担当
 */
export class CategoryRandomizationService implements ICategoryRandomizationService {
  
  constructor(
    private readonly poolService: CategoryContentPoolService,
    private readonly sessionGuardService: SessionDuplicationGuardService,
    private readonly emotionCalculator: EnhancedEmotionAttributeCalculator
  ) {}

  /**
   * 運勢に基づいて5つの必須カテゴリをランダム化
   */
  async randomizeCategories(
    fortune: Fortune,
    omikujiTypeId: string,
    sessionId?: string,
    seed?: string
  ): Promise<Result<FortuneCategory[], RandomizationError>> {
    try {
      // 1. 5つの必須カテゴリを取得
      const requiredCategories = FortuneCategory.getAllRequiredCategories();
      
      // 2. 各カテゴリにコンテンツを選択して割り当て
      const categoriesWithContent: any[] = [];
      const selectedContents: CategoryContent[] = [];

      for (const category of requiredCategories) {
        // 運勢に基づく感情属性の決定
        const targetEmotion = this.emotionCalculator.selectTargetEmotionForFortune(fortune, seed);
        
        // プールからコンテンツを選択
        const contentResult = await this.poolService.selectCategoryContent(
          category,
          fortune,
          omikujiTypeId,
          sessionId ? [] : undefined // セッションIDがある場合は重複制御を後で適用
        );

        if (!contentResult.success) {
          return {
            success: false,
            error: {
              type: 'INSUFFICIENT_CONTENT_POOL',
              category: category.getDisplayName()
            }
          };
        }

        // カテゴリにコンテンツと感情属性を付与
        const categoryWithContentAndEmotion = {
          ...category.withFortuneLevel(contentResult.data.content.content),
          emotionAttribute: contentResult.data.emotionAttribute,
          getEmotionAttribute: () => contentResult.data.emotionAttribute
        };
        categoriesWithContent.push(categoryWithContentAndEmotion);
        selectedContents.push(contentResult.data.content);
      }

      // 3. セッション管理（提供された場合のみ）
      if (sessionId) {
        const recordResult = await this.sessionGuardService.recordSelectedContent(
          sessionId,
          selectedContents
        );

        if (!recordResult.success) {
          return {
            success: false,
            error: {
              type: 'SESSION_GUARD_FAILURE',
              sessionId
            }
          };
        }
      }

      // 4. 完全性検証
      const validationResult = this.validateCategoryCompleteness(categoriesWithContent);
      if (!validationResult.success) {
        return {
          success: false,
          error: {
            type: 'INSUFFICIENT_CONTENT_POOL',
            category: 'validation-failed'
          }
        };
      }

      return { success: true, data: categoriesWithContent };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'EMOTION_DISTRIBUTION_ERROR',
          fortuneValue: fortune.getValue()
        }
      };
    }
  }

  /**
   * カテゴリの完全性を検証
   */
  validateCategoryCompleteness(
    categories: FortuneCategory[]
  ): Result<boolean, ValidationError> {
    try {
      const requiredIds = ['love', 'work', 'health', 'money', 'study'];
      const providedIds = categories.map(cat => cat.getId());

      // 重複チェック
      const uniqueIds = new Set(providedIds);
      if (uniqueIds.size !== providedIds.length) {
        const duplicates = providedIds.filter((id, index) => 
          providedIds.indexOf(id) !== index
        );
        return {
          success: false,
          error: {
            type: 'DUPLICATE_CATEGORIES',
            duplicates: Array.from(new Set(duplicates))
          }
        };
      }

      // 不足チェック
      const missingIds = requiredIds.filter(id => !providedIds.includes(id));
      if (missingIds.length > 0) {
        return {
          success: false,
          error: {
            type: 'INCOMPLETE_CATEGORIES',
            missing: missingIds
          }
        };
      }

      // 過剰チェック
      const extraIds = providedIds.filter(id => !requiredIds.includes(id));
      if (extraIds.length > 0) {
        return {
          success: false,
          error: {
            type: 'INVALID_CATEGORY_FORMAT',
            categoryId: extraIds[0]
          }
        };
      }

      return { success: true, data: true };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'INVALID_CATEGORY_FORMAT',
          categoryId: 'validation-error'
        }
      };
    }
  }

  /**
   * カテゴリランダム化統計を取得（監視・デバッグ用）
   */
  async getRandomizationStats(fortune: Fortune): Promise<RandomizationStats> {
    const requiredCategories = FortuneCategory.getAllRequiredCategories();
    const emotionDistribution = this.emotionCalculator.getEnhancedEmotionDistribution(fortune);
    
    let totalAvailableContent = 0;
    const categoryStats: { [key: string]: number } = {};

    for (const category of requiredCategories) {
      try {
        const statsResult = await this.emotionCalculator.getCategoryEmotionStats(
          category,
          [] // Empty pool for now - this would need actual pool data in real implementation
        );
        
        if (statsResult.success) {
          const count = statsResult.data.totalContent;
          categoryStats[category.getDisplayName()] = count;
          totalAvailableContent += count;
        } else {
          categoryStats[category.getDisplayName()] = 0;
        }
      } catch {
        categoryStats[category.getDisplayName()] = 0;
      }
    }

    return {
      fortuneLevel: fortune.getJapaneseName(),
      isExtremeLevel: emotionDistribution.isExtremeLevel,
      totalRequiredCategories: requiredCategories.length,
      totalAvailableContent,
      categoryBreakdown: categoryStats,
      estimatedProcessingTime: this.estimateProcessingTime(totalAvailableContent)
    };
  }

  /**
   * 批量カテゴリランダム化（テスト・ベンチマーク用）
   */
  async batchRandomizeCategories(
    fortunes: Fortune[],
    omikujiTypeId: string,
    sessionId?: string
  ): Promise<Result<FortuneCategory[][], RandomizationError>> {
    try {
      const results: FortuneCategory[][] = [];

      for (const fortune of fortunes) {
        const result = await this.randomizeCategories(fortune, omikujiTypeId, sessionId);
        
        if (!result.success) {
          return result;
        }
        
        results.push(result.data);
      }

      return { success: true, data: results };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'EMOTION_DISTRIBUTION_ERROR',
          fortuneValue: -999 // Indicates batch processing error
        }
      };
    }
  }

  /**
   * 処理時間推定（最適化用）
   */
  private estimateProcessingTime(contentPoolSize: number): number {
    // Simple estimation based on pool size
    const baseTime = 5; // Base processing time in ms
    const poolFactor = Math.log(contentPoolSize + 1) * 2; // Logarithmic scaling
    return Math.round(baseTime + poolFactor);
  }

  /**
   * 決定論的カテゴリランダム化（テスト用）
   */
  async deterministicRandomizeCategories(
    fortune: Fortune,
    omikujiTypeId: string,
    seed: string,
    sessionId?: string
  ): Promise<Result<FortuneCategory[], RandomizationError>> {
    return this.randomizeCategories(fortune, omikujiTypeId, sessionId, seed);
  }
}

// Additional types
export interface RandomizationStats {
  fortuneLevel: string;
  isExtremeLevel: boolean;
  totalRequiredCategories: number;
  totalAvailableContent: number;
  categoryBreakdown: { [categoryName: string]: number };
  estimatedProcessingTime: number;
}