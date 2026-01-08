import { ICategoryRandomizationService, Result, RandomizationError, ValidationError } from './ICategoryRandomizationService';
import { CategoryContentWithEmotion } from './ICategoryContentPoolService';
import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { CategoryContentPoolService } from './CategoryContentPoolService';
import { SessionDuplicationGuardService } from './SessionDuplicationGuardService';
import { EnhancedEmotionAttributeCalculator } from './EnhancedEmotionAttributeCalculator';
import { CategorySelectionPerformanceOptimizer } from '../../infrastructure/performance/CategorySelectionPerformanceOptimizer';

/**
 * 最適化されたカテゴリランダム化オーケストレーションサービス
 * 
 * 機能:
 * - 100ms以内でのカテゴリ選択処理完了の実装
 * - プールデータのインメモリキャッシュ活用
 * - 感情分布計算結果のメモ化活用
 * - パフォーマンス測定とレポート機能
 * 
 * Requirements: 5.1
 */
export class OptimizedCategoryRandomizationService implements ICategoryRandomizationService {
  
  constructor(
    private readonly poolService: CategoryContentPoolService,
    private readonly sessionGuardService: SessionDuplicationGuardService,
    private readonly emotionCalculator: EnhancedEmotionAttributeCalculator,
    private readonly performanceOptimizer: CategorySelectionPerformanceOptimizer
  ) {}

  /**
   * 既存インターフェース互換性のためのメソッド
   */
  async randomizeCategories(
    fortune: Fortune,
    sessionId?: string,
    seed?: string
  ): Promise<Result<FortuneCategory[], RandomizationError>> {
    const result = await this.randomizeCategoriesOptimized(fortune, sessionId, seed);
    
    if (result.success) {
      return {
        success: true,
        data: result.data.categories
      };
    } else {
      return {
        success: false,
        error: result.error.originalError || {
          type: 'PERFORMANCE_OPTIMIZATION_ERROR',
          message: 'Optimization failed'
        }
      };
    }
  }

  /**
   * パフォーマンス最適化されたカテゴリランダム化
   */
  async randomizeCategoriesOptimized(
    fortune: Fortune,
    sessionId?: string,
    seed?: string
  ): Promise<Result<OptimizedRandomizationResult, OptimizedRandomizationError>> {
    const startTime = performance.now();
    const categoryTimings: CategoryTimingResult[] = [];
    
    try {
      // 1. 5つの必須カテゴリを取得
      const requiredCategories = FortuneCategory.getAllRequiredCategories();
      
      // 2. 各カテゴリにコンテンツを選択して割り当て（パフォーマンス測定付き）
      const categoriesWithContent: FortuneCategory[] = [];
      const selectedContents: CategoryContentWithEmotion[] = [];

      for (const category of requiredCategories) {
        // 各カテゴリごとに感情分布を取得（メモ化済み）
        const distribution = this.performanceOptimizer.getMemoizedEmotionDistribution(fortune);
        
        // パフォーマンス測定付きコンテンツ選択
        const timingResult = await this.performanceOptimizer.measureCategorySelectionTime(
          category,
          fortune,
          'engineer-fortune' // TODO: make this configurable
        );

        if (!timingResult.success) {
          const endTime = performance.now();
          return {
            success: false,
            error: {
              type: 'PERFORMANCE_OPTIMIZATION_ERROR',
              originalError: ('originalError' in timingResult.error) ? timingResult.error.originalError : timingResult.error,
              performanceData: {
                processingTimeMs: timingResult.error.processingTimeMs,
                totalTimeMs: endTime - startTime
              }
            }
          };
        }

        // タイミング結果を記録
        categoryTimings.push({
          category: category.getDisplayName(),
          processingTimeMs: timingResult.data.processingTimeMs,
          exceedsTarget: timingResult.data.exceedsPerformanceTarget
        });

        // カテゴリにコンテンツを設定
        const updatedCategory = category.withFortuneLevel(timingResult.data.selectedContent.content.content);
        categoriesWithContent.push(updatedCategory);
        selectedContents.push(timingResult.data.selectedContent);
      }

      // 4. セッション記録（オプション）
      if (sessionId && selectedContents.length > 0) {
        const sessionResult = await this.sessionGuardService.recordSelectedContent(
          sessionId,
          selectedContents.map(sc => sc.content)
        );

        if (!sessionResult.success) {
          const endTime = performance.now();
          return {
            success: false,
            error: {
              type: 'PERFORMANCE_OPTIMIZATION_ERROR',
              originalError: {
                type: 'SESSION_GUARD_FAILURE',
                sessionId
              },
              performanceData: {
                processingTimeMs: 0,
                totalTimeMs: endTime - startTime
              }
            }
          };
        }
      }

      // 5. パフォーマンス統計計算
      const endTime = performance.now();
      const totalProcessingTime = endTime - startTime;
      const performanceMetrics = this.calculatePerformanceMetrics(categoryTimings, totalProcessingTime);
      
      // 6. 警告チェック
      const warnings: string[] = [];
      if (performanceMetrics.exceedsTarget) {
        warnings.push('PERFORMANCE_TARGET_EXCEEDED');
      }

      return {
        success: true,
        data: {
          categories: categoriesWithContent,
          performanceMetrics,
          performanceWarnings: warnings,
          optimizationData: {
            cacheStats: this.performanceOptimizer.getEmotionDistributionCacheStats(),
            overallStats: this.performanceOptimizer.getPerformanceStats()
          }
        }
      };

    } catch (error) {
      const endTime = performance.now();
      return {
        success: false,
        error: {
          type: 'PERFORMANCE_OPTIMIZATION_ERROR',
          originalError: error,
          performanceData: {
            processingTimeMs: 0,
            totalTimeMs: endTime - startTime
          }
        }
      };
    }
  }

  /**
   * キャッシュ活用版カテゴリランダム化
   */
  async randomizeCategoriesWithCache(
    fortune: Fortune,
    sessionId?: string,
    cachePrefix: string = 'category-selection'
  ): Promise<Result<FortuneCategory[], OptimizedRandomizationError>> {
    try {
      // 1. 5つの必須カテゴリを取得
      const requiredCategories = FortuneCategory.getAllRequiredCategories();
      
      // 2. 各カテゴリにキャッシュ付きコンテンツ選択
      const categoriesWithContent: FortuneCategory[] = [];
      const selectedContents: CategoryContentWithEmotion[] = [];

      for (let i = 0; i < requiredCategories.length; i++) {
        const category = requiredCategories[i];
        const cacheKey = `${cachePrefix}-${fortune.getValue()}-${category.getId()}`;

        const cacheResult = await this.performanceOptimizer.selectCategoryContentWithCache(
          category,
          fortune,
          'engineer-fortune',
          cacheKey
        );

        if (!cacheResult.success) {
          return {
            success: false,
            error: {
              type: 'PERFORMANCE_OPTIMIZATION_ERROR',
              originalError: ('originalError' in cacheResult.error) ? cacheResult.error.originalError : cacheResult.error,
              performanceData: {
                processingTimeMs: cacheResult.error.processingTimeMs || 0,
                totalTimeMs: 0
              }
            }
          };
        }

        // カテゴリにコンテンツを設定
        const updatedCategory = category.withFortuneLevel(cacheResult.data.content.content);
        categoriesWithContent.push(updatedCategory);

        // キャッシュ情報を除いてセッション記録用にコンテンツを保存
        const { fromCache, cacheHit, ...contentForSession } = cacheResult.data;
        selectedContents.push(contentForSession as CategoryContentWithEmotion);
      }

      // 3. セッション記録（オプション）
      if (sessionId && selectedContents.length > 0) {
        const sessionResult = await this.sessionGuardService.recordSelectedContent(
          sessionId,
          selectedContents.map(sc => sc.content)
        );

        if (!sessionResult.success) {
          return {
            success: false,
            error: {
              type: 'PERFORMANCE_OPTIMIZATION_ERROR',
              originalError: {
                type: 'SESSION_GUARD_FAILURE',
                sessionId
              },
              performanceData: {
                processingTimeMs: 0,
                totalTimeMs: 0
              }
            }
          };
        }
      }

      return {
        success: true,
        data: categoriesWithContent
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'PERFORMANCE_OPTIMIZATION_ERROR',
          originalError: error,
          performanceData: {
            processingTimeMs: 0,
            totalTimeMs: 0
          }
        }
      };
    }
  }

  /**
   * カテゴリ完全性検証（既存インターフェース互換）
   */
  validateCategoryCompleteness(
    categories: FortuneCategory[]
  ): Result<boolean, ValidationError> {
    const requiredCategories = FortuneCategory.getAllRequiredCategories();
    const requiredIds = requiredCategories.map(cat => cat.getId());
    const categoryIds = categories.map(cat => cat.getId());

    // Check for missing categories
    const missingCategories = requiredIds.filter(id => !categoryIds.includes(id));
    if (missingCategories.length > 0) {
      return {
        success: false,
        error: {
          type: 'INCOMPLETE_CATEGORIES',
          missing: missingCategories
        }
      };
    }

    // Check for duplicates
    const uniqueIds = new Set(categoryIds);
    if (uniqueIds.size !== categoryIds.length) {
      const duplicates = categoryIds.filter((id, index) => categoryIds.indexOf(id) !== index);
      return {
        success: false,
        error: {
          type: 'DUPLICATE_CATEGORIES',
          duplicates
        }
      };
    }

    return { success: true, data: true };
  }

  /**
   * パフォーマンス統計計算
   */
  private calculatePerformanceMetrics(
    categoryTimings: CategoryTimingResult[],
    totalTime: number
  ): PerformanceMetrics {
    if (categoryTimings.length === 0) {
      return {
        totalProcessingTimeMs: totalTime,
        averageTimeMs: 0,
        maxTimeMs: 0,
        exceedsTarget: totalTime > 100,
        categoryTimings: []
      };
    }

    const processingTimes = categoryTimings.map(ct => ct.processingTimeMs);
    const averageTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    const maxTime = Math.max(...processingTimes);

    // Check if any category exceeds target OR total time exceeds target
    const anyExceedsTarget = categoryTimings.some(ct => ct.exceedsTarget) || totalTime > 100;

    return {
      totalProcessingTimeMs: totalTime,
      averageTimeMs: averageTime,
      maxTimeMs: maxTime,
      exceedsTarget: anyExceedsTarget,
      categoryTimings
    };
  }

  /**
   * パフォーマンスキャッシュクリア
   */
  clearPerformanceCache(): void {
    this.performanceOptimizer.clearCache();
  }

  /**
   * パフォーマンス統計取得
   */
  getPerformanceStats(): any {
    return this.performanceOptimizer.getPerformanceStats();
  }
}

// Type definitions

export interface OptimizedRandomizationResult {
  categories: FortuneCategory[];
  performanceMetrics: PerformanceMetrics;
  performanceWarnings: string[];
  optimizationData: {
    cacheStats: any;
    overallStats: any;
  };
}

export interface PerformanceMetrics {
  totalProcessingTimeMs: number;
  averageTimeMs: number;
  maxTimeMs: number;
  exceedsTarget: boolean;
  categoryTimings: CategoryTimingResult[];
}

export interface CategoryTimingResult {
  category: string;
  processingTimeMs: number;
  exceedsTarget: boolean;
}

export type OptimizedRandomizationError = {
  type: 'PERFORMANCE_OPTIMIZATION_ERROR';
  originalError: any;
  performanceData?: {
    processingTimeMs: number;
    totalTimeMs: number;
  };
};