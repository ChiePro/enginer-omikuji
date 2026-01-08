import { describe, expect, it, beforeEach, vi } from 'vitest';
import { OptimizedCategoryRandomizationService } from './OptimizedCategoryRandomizationService';
import { CategoryContentPoolService } from './CategoryContentPoolService';
import { SessionDuplicationGuardService } from './SessionDuplicationGuardService';
import { EnhancedEmotionAttributeCalculator } from './EnhancedEmotionAttributeCalculator';
import { CategorySelectionPerformanceOptimizer } from '../../infrastructure/performance/CategorySelectionPerformanceOptimizer';
import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';

describe('OptimizedCategoryRandomizationService', () => {
  let service: OptimizedCategoryRandomizationService;
  let mockPoolService: CategoryContentPoolService;
  let mockSessionGuardService: SessionDuplicationGuardService;
  let mockEmotionCalculator: EnhancedEmotionAttributeCalculator;
  let mockOptimizer: CategorySelectionPerformanceOptimizer;

  beforeEach(() => {
    mockPoolService = {
      selectCategoryContent: vi.fn(),
      getAvailableContentCount: vi.fn(),
      addContentToPool: vi.fn()
    } as any;

    mockSessionGuardService = {
      filterAvailableContent: vi.fn(),
      recordSelectedContent: vi.fn(),
      clearSession: vi.fn()
    } as any;

    mockEmotionCalculator = {
      selectCategoryContentByEmotion: vi.fn(),
      selectTargetEmotionForFortune: vi.fn(),
      getCategoryEmotionStats: vi.fn(),
      getEnhancedEmotionDistribution: vi.fn()
    } as any;

    mockOptimizer = {
      measureCategorySelectionTime: vi.fn(),
      selectCategoryContentWithCache: vi.fn(),
      getMemoizedEmotionDistribution: vi.fn(),
      clearCache: vi.fn(),
      getPerformanceStats: vi.fn(),
      getEmotionDistributionCacheStats: vi.fn()
    } as any;

    service = new OptimizedCategoryRandomizationService(
      mockPoolService,
      mockSessionGuardService,
      mockEmotionCalculator,
      mockOptimizer
    );
  });

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

  describe('最適化されたカテゴリランダム化', () => {
    it('100ms以内でカテゴリランダム化が完了する', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      const sessionId = 'performance-test-session';

      // Mock the optimizer to return timing results
      (mockOptimizer.measureCategorySelectionTime as any).mockResolvedValue({
        success: true,
        data: {
          selectedContent: { id: 'content-1', content: 'テストコンテンツ', weight: 1.0 },
          processingTimeMs: 15, // 15ms per category
          exceedsPerformanceTarget: false,
          timestamp: Date.now()
        }
      });

      (mockOptimizer.getMemoizedEmotionDistribution as any).mockReturnValue({
        getPositiveProbability: () => 0.6,
        getNeutralProbability: () => 0.3,
        getNegativeProbability: () => 0.1,
        selectEmotionAttribute: () => 'positive'
      });

      (mockSessionGuardService.recordSelectedContent as any).mockResolvedValue({
        success: true,
        data: undefined
      });

      const startTime = performance.now();
      const result = await service.randomizeCategoriesOptimized(fortune, sessionId);
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(totalTime).toBeLessThan(100); // 100ms requirement

      if (result.success) {
        expect(result.data.categories).toHaveLength(5);
        expect(result.data.performanceMetrics.totalProcessingTimeMs).toBeDefined();
        expect(result.data.performanceMetrics.exceedsTarget).toBe(false);
      }
    });

    it('パフォーマンス統計を含む詳細結果を返す', async () => {
      const fortune = createFortune('daikichi', '大吉', 4);

      const mockTimingResults = Array(5).fill(0).map((_, index) => ({
        success: true,
        data: {
          selectedContent: { id: `content-${index}`, content: `コンテンツ${index}`, weight: 1.0 },
          processingTimeMs: 10 + index * 5, // 10-30ms range
          exceedsPerformanceTarget: false,
          timestamp: Date.now() + index
        }
      }));

      (mockOptimizer.measureCategorySelectionTime as any)
        .mockResolvedValueOnce(mockTimingResults[0])
        .mockResolvedValueOnce(mockTimingResults[1])
        .mockResolvedValueOnce(mockTimingResults[2])
        .mockResolvedValueOnce(mockTimingResults[3])
        .mockResolvedValueOnce(mockTimingResults[4]);

      (mockOptimizer.getMemoizedEmotionDistribution as any).mockReturnValue({
        getPositiveProbability: () => 1.0, // 大吉は100% positive
        getNeutralProbability: () => 0.0,
        getNegativeProbability: () => 0.0,
        selectEmotionAttribute: () => 'positive'
      });

      const result = await service.randomizeCategoriesOptimized(fortune);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.performanceMetrics.categoryTimings).toHaveLength(5);
        expect(result.data.performanceMetrics.averageTimeMs).toBeGreaterThan(0);
        expect(result.data.performanceMetrics.maxTimeMs).toBeGreaterThan(0);
        expect(result.data.performanceMetrics.totalProcessingTimeMs).toBeGreaterThan(0);
      }
    });

    it('キャッシュを活用して高速化する', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      const sessionId = 'cache-test-session';

      const mockCachedContent = {
        id: 'cached-content',
        content: 'キャッシュされたコンテンツ',
        weight: 1.0,
        fromCache: true,
        cacheHit: true
      };

      (mockOptimizer.selectCategoryContentWithCache as any).mockResolvedValue({
        success: true,
        data: mockCachedContent
      });

      (mockOptimizer.getMemoizedEmotionDistribution as any).mockReturnValue({
        getPositiveProbability: () => 0.6,
        getNeutralProbability: () => 0.3,
        getNegativeProbability: () => 0.1,
        selectEmotionAttribute: () => 'positive'
      });

      (mockSessionGuardService.recordSelectedContent as any).mockResolvedValue({
        success: true,
        data: undefined
      });

      const result = await service.randomizeCategoriesWithCache(
        fortune,
        sessionId,
        'test-cache-prefix'
      );

      expect(result.success).toBe(true);
      
      // キャッシュされたコンテンツ選択が5回呼ばれる
      expect(mockOptimizer.selectCategoryContentWithCache).toHaveBeenCalledTimes(5);

      // セッション記録は1回だけ
      expect(mockSessionGuardService.recordSelectedContent).toHaveBeenCalledTimes(1);
    });

    it('エラー時でも適切にパフォーマンス統計を記録する', async () => {
      const fortune = createFortune('kyo', '凶', -1);

      (mockOptimizer.measureCategorySelectionTime as any).mockResolvedValueOnce({
        success: false,
        error: {
          type: 'CATEGORY_SELECTION_ERROR',
          originalError: { type: 'POOL_EXHAUSTED', category: '恋愛運', emotionAttribute: 'negative' },
          processingTimeMs: 50
        }
      });

      const result = await service.randomizeCategoriesOptimized(fortune);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('PERFORMANCE_OPTIMIZATION_ERROR');
        expect(result.error.performanceData).toBeDefined();
        expect(result.error.performanceData?.processingTimeMs).toBe(50);
      }
    });

    it('パフォーマンス要件を超えた場合、警告付きで結果を返す', async () => {
      const fortune = createFortune('kichi', '吉', 2);

      const slowTimingResults = Array(5).fill(0).map((_, index) => ({
        success: true,
        data: {
          selectedContent: { id: `slow-content-${index}`, content: `スローコンテンツ${index}`, weight: 1.0 },
          processingTimeMs: 25, // 合計125ms (5 * 25)
          exceedsPerformanceTarget: true,
          timestamp: Date.now() + index
        }
      }));

      (mockOptimizer.measureCategorySelectionTime as any)
        .mockResolvedValueOnce(slowTimingResults[0])
        .mockResolvedValueOnce(slowTimingResults[1])
        .mockResolvedValueOnce(slowTimingResults[2])
        .mockResolvedValueOnce(slowTimingResults[3])
        .mockResolvedValueOnce(slowTimingResults[4]);

      (mockOptimizer.getMemoizedEmotionDistribution as any).mockReturnValue({
        getPositiveProbability: () => 0.6,
        getNeutralProbability: () => 0.3,
        getNegativeProbability: () => 0.1,
        selectEmotionAttribute: () => 'positive'
      });

      const result = await service.randomizeCategoriesOptimized(fortune);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.performanceMetrics.exceedsTarget).toBe(true);
        expect(result.data.performanceMetrics.totalProcessingTimeMs).toBeGreaterThan(0); // Real processing time should be minimal with mocks
        expect(result.data.performanceWarnings).toContain('PERFORMANCE_TARGET_EXCEEDED');
      }
    });

    it('感情分布メモ化が正常動作する', async () => {
      const fortune1 = createFortune('kichi-1', '吉1', 2);
      const fortune2 = createFortune('kichi-2', '吉2', 2); // 同じvalue

      const mockDistribution = {
        getPositiveProbability: () => 0.6,
        getNeutralProbability: () => 0.3,
        getNegativeProbability: () => 0.1,
        selectEmotionAttribute: () => 'positive'
      };

      (mockOptimizer.getMemoizedEmotionDistribution as any).mockReturnValue(mockDistribution);

      (mockOptimizer.measureCategorySelectionTime as any).mockResolvedValue({
        success: true,
        data: {
          selectedContent: { id: 'content', content: 'テスト', weight: 1.0 },
          processingTimeMs: 10,
          exceedsPerformanceTarget: false,
          timestamp: Date.now()
        }
      });

      // 両方の運勢でランダム化実行
      await service.randomizeCategoriesOptimized(fortune1);
      await service.randomizeCategoriesOptimized(fortune2);

      // 感情分布は同じvalue値なので2回とも同じものが返される
      expect(mockOptimizer.getMemoizedEmotionDistribution).toHaveBeenCalledTimes(10); // 5カテゴリ × 2回
    });
  });

  describe('統合パフォーマンステスト', () => {
    it('リアルワールドシナリオで100ms要件を満たす', async () => {
      const fortune = createFortune('chuukichi', '中吉', 3);
      const sessionId = 'real-world-test';

      // リアルタイミングをシミュレート
      (mockOptimizer.measureCategorySelectionTime as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 15)); // 15ms per category
        return {
          success: true,
          data: {
            selectedContent: { id: 'realistic-content', content: 'リアルコンテンツ', weight: 1.0 },
            processingTimeMs: 15,
            exceedsPerformanceTarget: false,
            timestamp: Date.now()
          }
        };
      });

      (mockOptimizer.getMemoizedEmotionDistribution as any).mockReturnValue({
        getPositiveProbability: () => 0.8,
        getNeutralProbability: () => 0.15,
        getNegativeProbability: () => 0.05,
        selectEmotionAttribute: () => 'positive'
      });

      (mockSessionGuardService.recordSelectedContent as any).mockResolvedValue({
        success: true,
        data: undefined
      });

      const startTime = performance.now();
      const result = await service.randomizeCategoriesOptimized(fortune, sessionId);
      const endTime = performance.now();

      const actualTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(actualTime).toBeLessThan(100); // Real 100ms requirement

      if (result.success) {
        expect(result.data.categories).toHaveLength(5);
        // 各カテゴリが適切なコンテンツを持つ
        result.data.categories.forEach(category => {
          expect(category.getFortuneLevel()).toBe('リアルコンテンツ');
        });
      }
    });
  });
});