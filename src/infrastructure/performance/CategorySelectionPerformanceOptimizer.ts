import { CategoryContentPoolService } from '../../domain/services/CategoryContentPoolService';
import { CategoryContentWithEmotion } from '../../domain/services/ICategoryContentPoolService';
import { Fortune } from '../../domain/valueObjects/Fortune';
import { FortuneCategory } from '../../domain/valueObjects/FortuneCategory';
import { EmotionAttributeDistribution } from '../../domain/valueObjects/EmotionAttributeDistribution';

/**
 * カテゴリ選択パフォーマンス最適化クラス
 * 
 * 機能:
 * - 100ms以内でのカテゴリ選択処理完了の実装
 * - プールデータのインメモリキャッシュ（ファイル更新時無効化）
 * - 感情分布計算結果のメモ化（Fortune値ベース）
 * - パフォーマンス測定とレポート機能
 */
export class CategorySelectionPerformanceOptimizer {
  private poolDataCache = new Map<string, CachedPoolResult>();
  private emotionDistributionCache = new Map<number, EmotionAttributeDistribution>();
  private performanceMetrics: PerformanceMeasurement[] = [];
  private emotionDistributionStats = { hits: 0, misses: 0 };

  // LRUキャッシュの最大サイズ
  private readonly MAX_CACHE_SIZE = 100;

  constructor(
    private readonly poolService: CategoryContentPoolService
  ) {}

  /**
   * カテゴリ選択処理時間を測定
   */
  async measureCategorySelectionTime(
    category: FortuneCategory,
    fortune: Fortune,
    omikujiTypeId: string,
    excludeContent?: string[]
  ): Promise<Result<CategorySelectionTimingResult, CategorySelectionTimingError>> {
    const startTime = performance.now();

    try {
      const result = await this.poolService.selectCategoryContent(
        category,
        fortune,
        omikujiTypeId,
        excludeContent
      );

      const endTime = performance.now();
      const processingTimeMs = endTime - startTime;

      // パフォーマンス統計に記録
      this.recordPerformanceMeasurement({
        timestamp: Date.now(),
        processingTimeMs,
        category: category.getDisplayName(),
        fortuneValue: fortune.getValue(),
        success: result.success
      });

      if (result.success) {
        return {
          success: true,
          data: {
            selectedContent: result.data,
            processingTimeMs,
            exceedsPerformanceTarget: processingTimeMs > 100,
            timestamp: Date.now()
          }
        };
      } else {
        return {
          success: false,
          error: {
            type: 'CATEGORY_SELECTION_ERROR',
            originalError: result.error,
            processingTimeMs
          }
        };
      }

    } catch (error) {
      const endTime = performance.now();
      const processingTimeMs = endTime - startTime;

      return {
        success: false,
        error: {
          type: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          processingTimeMs
        }
      };
    }
  }

  /**
   * プールデータキャッシュを使用したカテゴリコンテンツ選択
   */
  async selectCategoryContentWithCache(
    category: FortuneCategory,
    fortune: Fortune,
    omikujiTypeId: string,
    cacheKey: string,
    excludeContent?: string[]
  ): Promise<Result<CachedCategoryContent, CategorySelectionTimingError>> {
    // キャッシュチェック
    const cachedResult = this.poolDataCache.get(cacheKey);
    if (cachedResult && this.isCacheValid(cachedResult)) {
      return {
        success: true,
        data: {
          ...cachedResult.content,
          fromCache: true,
          cacheHit: true
        }
      };
    }

    // キャッシュミス - 新規取得
    const startTime = performance.now();
    const result = await this.poolService.selectCategoryContent(
      category,
      fortune,
      omikujiTypeId,
      excludeContent
    );
    const endTime = performance.now();

    if (result.success) {
      // キャッシュに保存（LRU方式）
      this.setCacheEntry(cacheKey, {
        content: result.data,
        timestamp: Date.now(),
        processingTimeMs: endTime - startTime
      });

      return {
        success: true,
        data: {
          ...result.data,
          fromCache: false,
          cacheHit: false
        }
      };
    } else {
      return {
        success: false,
        error: {
          type: 'CATEGORY_SELECTION_ERROR',
          originalError: result.error,
          processingTimeMs: endTime - startTime
        }
      };
    }
  }

  /**
   * Fortune値ベースでメモ化された感情分布を取得
   */
  getMemoizedEmotionDistribution(fortune: Fortune): EmotionAttributeDistribution {
    const fortuneValue = fortune.getValue();
    
    // キャッシュチェック
    if (this.emotionDistributionCache.has(fortuneValue)) {
      this.emotionDistributionStats.hits++;
      return this.emotionDistributionCache.get(fortuneValue)!;
    }

    // キャッシュミス - 新規計算
    this.emotionDistributionStats.misses++;
    const distribution = EmotionAttributeDistribution.forFortuneLevel(fortuneValue);
    
    // キャッシュに保存
    this.emotionDistributionCache.set(fortuneValue, distribution);
    
    return distribution;
  }

  /**
   * キャッシュクリア
   */
  clearCache(): void {
    this.poolDataCache.clear();
    this.emotionDistributionCache.clear();
    this.resetEmotionDistributionStats();
  }

  /**
   * パフォーマンス統計を取得
   */
  getPerformanceStats(): PerformanceStats {
    if (this.performanceMetrics.length === 0) {
      return {
        totalMeasurements: 0,
        averageTimeMs: 0,
        medianTimeMs: 0,
        p95TimeMs: 0,
        slowRequestsCount: 0,
        lastMeasuredAt: null
      };
    }

    const times = this.performanceMetrics.map(m => m.processingTimeMs).sort((a, b) => a - b);
    const total = times.reduce((sum, time) => sum + time, 0);
    const average = total / times.length;
    const median = times[Math.floor(times.length / 2)];
    const p95Index = Math.floor(times.length * 0.95);
    const p95 = times[p95Index];
    const slowRequests = times.filter(time => time > 100).length;

    return {
      totalMeasurements: this.performanceMetrics.length,
      averageTimeMs: average,
      medianTimeMs: median,
      p95TimeMs: p95,
      slowRequestsCount: slowRequests,
      lastMeasuredAt: Math.max(...this.performanceMetrics.map(m => m.timestamp))
    };
  }

  /**
   * 感情分布キャッシュ統計を取得
   */
  getEmotionDistributionCacheStats(): CacheStats {
    const total = this.emotionDistributionStats.hits + this.emotionDistributionStats.misses;
    return {
      totalRequests: total,
      cacheHits: this.emotionDistributionStats.hits,
      hitRate: total > 0 ? this.emotionDistributionStats.hits / total : 0
    };
  }

  /**
   * パフォーマンス測定結果を記録
   */
  private recordPerformanceMeasurement(measurement: PerformanceMeasurement): void {
    this.performanceMetrics.push(measurement);

    // 古い測定データの削除（メモリ効率のため最新1000件のみ保持）
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  /**
   * キャッシュエントリを設定（LRU方式）
   */
  private setCacheEntry(key: string, result: CachedPoolResult): void {
    // キャッシュサイズ上限チェック
    if (this.poolDataCache.size >= this.MAX_CACHE_SIZE) {
      // 最も古いエントリを削除（LRU）
      const oldestKey = this.poolDataCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.poolDataCache.delete(oldestKey);
      }
    }

    this.poolDataCache.set(key, result);
  }

  /**
   * キャッシュの有効性チェック
   */
  private isCacheValid(cachedResult: CachedPoolResult): boolean {
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5分間有効
    return (Date.now() - cachedResult.timestamp) < CACHE_TTL_MS;
  }

  /**
   * 感情分布統計をリセット
   */
  private resetEmotionDistributionStats(): void {
    this.emotionDistributionStats = { hits: 0, misses: 0 };
  }
}

// Type definitions
export type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface CategorySelectionTimingResult {
  selectedContent: CategoryContentWithEmotion;
  processingTimeMs: number;
  exceedsPerformanceTarget: boolean;
  timestamp: number;
}

export interface CachedCategoryContent extends CategoryContentWithEmotion {
  fromCache: boolean;
  cacheHit: boolean;
}

export interface CachedPoolResult {
  content: CategoryContentWithEmotion;
  timestamp: number;
  processingTimeMs: number;
}

export interface PerformanceMeasurement {
  timestamp: number;
  processingTimeMs: number;
  category: string;
  fortuneValue: number;
  success: boolean;
}

export interface PerformanceStats {
  totalMeasurements: number;
  averageTimeMs: number;
  medianTimeMs: number;
  p95TimeMs: number;
  slowRequestsCount: number;
  lastMeasuredAt: number | null;
}

export interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  hitRate: number;
}

export type CategorySelectionTimingError = 
  | { type: 'CATEGORY_SELECTION_ERROR'; originalError: any; processingTimeMs: number }
  | { type: 'UNEXPECTED_ERROR'; message: string; processingTimeMs: number };