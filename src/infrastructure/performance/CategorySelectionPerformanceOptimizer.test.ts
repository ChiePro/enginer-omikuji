import { describe, expect, it, beforeEach, vi } from 'vitest';
import { CategorySelectionPerformanceOptimizer } from './CategorySelectionPerformanceOptimizer';
import { CategoryContentPoolService } from '../../domain/services/CategoryContentPoolService';
import { Fortune } from '../../domain/valueObjects/Fortune';
import { FortuneCategory } from '../../domain/valueObjects/FortuneCategory';

describe('CategorySelectionPerformanceOptimizer', () => {
  let optimizer: CategorySelectionPerformanceOptimizer;
  let mockPoolService: CategoryContentPoolService;
  let testFortune: Fortune;
  let testCategory: FortuneCategory;

  beforeEach(() => {
    mockPoolService = {
      selectCategoryContent: vi.fn(),
      getAvailableContentCount: vi.fn(),
      addContentToPool: vi.fn()
    } as any;

    optimizer = new CategorySelectionPerformanceOptimizer(mockPoolService);

    testFortune = Fortune.fromData({
      id: 'kichi',
      englishName: 'Blessing',
      japaneseName: '吉',
      description: '良い運勢',
      probability: 0.2,
      value: 2,
      color: { primary: '#00ff00', secondary: '#aaffaa', background: '#f0fff0' },
      effects: { glow: false, sparkle: false, animation: null }
    });

    const categoryResult = FortuneCategory.create('love', '恋愛運', '恋愛に関する運勢');
    testCategory = categoryResult.value;
  });

  describe('パフォーマンス測定機能', () => {
    it('カテゴリ選択処理時間を測定できる', async () => {
      const mockContent = {
        id: 'test-content',
        content: 'テストコンテンツ',
        weight: 1.0
      };

      (mockPoolService.selectCategoryContent as any).mockResolvedValue({
        success: true,
        data: mockContent
      });

      const result = await optimizer.measureCategorySelectionTime(
        testCategory,
        testFortune,
        'engineer-fortune'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.processingTimeMs).toBeGreaterThan(0);
        expect(result.data.processingTimeMs).toBeLessThan(100); // 100ms以内の要件
        expect(result.data.selectedContent).toEqual(mockContent);
      }
    });

    it('パフォーマンス要件100msを超えた場合、警告フラグを設定する', async () => {
      // 遅延をシミュレート
      (mockPoolService.selectCategoryContent as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 150)); // 150ms遅延
        return {
          success: true,
          data: { id: 'slow-content', content: 'スローコンテンツ', weight: 1.0 }
        };
      });

      const result = await optimizer.measureCategorySelectionTime(
        testCategory,
        testFortune,
        'engineer-fortune'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.processingTimeMs).toBeGreaterThan(100);
        expect(result.data.exceedsPerformanceTarget).toBe(true);
      }
    });

    it('エラー時も時間測定は正常動作する', async () => {
      (mockPoolService.selectCategoryContent as any).mockResolvedValue({
        success: false,
        error: { type: 'POOL_EXHAUSTED', category: '恋愛運', emotionAttribute: 'positive' }
      });

      const result = await optimizer.measureCategorySelectionTime(
        testCategory,
        testFortune,
        'engineer-fortune'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('CATEGORY_SELECTION_ERROR');
        expect(result.error.processingTimeMs).toBeGreaterThan(0);
      }
    });
  });

  describe('プールデータキャッシュ機能', () => {
    it('プールデータをキャッシュして高速化する', async () => {
      const mockContent = {
        id: 'cached-content',
        content: 'キャッシュコンテンツ',
        weight: 1.0
      };

      (mockPoolService.selectCategoryContent as any).mockResolvedValue({
        success: true,
        data: mockContent
      });

      // 1回目の呼び出し（キャッシュなし）
      const result1 = await optimizer.selectCategoryContentWithCache(
        testCategory,
        testFortune,
        'engineer-fortune',
        'cache-key-1'
      );

      // 2回目の呼び出し（キャッシュあり）
      const result2 = await optimizer.selectCategoryContentWithCache(
        testCategory,
        testFortune,
        'engineer-fortune',
        'cache-key-1'
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // プールサービスは1回だけ呼ばれる（2回目はキャッシュ）
      expect(mockPoolService.selectCategoryContent).toHaveBeenCalledTimes(1);

      if (result1.success && result2.success) {
        expect(result1.data.content).toEqual(result2.data.content);
        expect(result2.data.fromCache).toBe(true);
      }
    });

    it('異なるキャッシュキーでは独立してキャッシュする', async () => {
      const mockContent1 = { id: 'content-1', content: 'コンテンツ1', weight: 1.0 };
      const mockContent2 = { id: 'content-2', content: 'コンテンツ2', weight: 1.0 };

      (mockPoolService.selectCategoryContent as any)
        .mockResolvedValueOnce({ success: true, data: mockContent1 })
        .mockResolvedValueOnce({ success: true, data: mockContent2 });

      await optimizer.selectCategoryContentWithCache(
        testCategory,
        testFortune,
        'engineer-fortune',
        'cache-key-1'
      );

      await optimizer.selectCategoryContentWithCache(
        testCategory,
        testFortune,
        'engineer-fortune',
        'cache-key-2'
      );

      // 異なるキーなので両方とも新規呼び出し
      expect(mockPoolService.selectCategoryContent).toHaveBeenCalledTimes(2);
    });

    it('キャッシュ無効化機能が正常動作する', async () => {
      const mockContent = { id: 'content', content: 'コンテンツ', weight: 1.0 };

      (mockPoolService.selectCategoryContent as any).mockResolvedValue({
        success: true,
        data: mockContent
      });

      // キャッシュに保存
      await optimizer.selectCategoryContentWithCache(
        testCategory,
        testFortune,
        'engineer-fortune',
        'invalidation-test'
      );

      // キャッシュをクリア
      optimizer.clearCache();

      // 再度呼び出し（キャッシュはクリアされているので新規呼び出し）
      await optimizer.selectCategoryContentWithCache(
        testCategory,
        testFortune,
        'engineer-fortune',
        'invalidation-test'
      );

      expect(mockPoolService.selectCategoryContent).toHaveBeenCalledTimes(2);
    });

    it('キャッシュサイズ上限で古いエントリを削除する', async () => {
      const mockContent = { id: 'content', content: 'コンテンツ', weight: 1.0 };

      (mockPoolService.selectCategoryContent as any).mockResolvedValue({
        success: true,
        data: mockContent
      });

      // キャッシュサイズ上限まで埋める（仮に100エントリ）
      for (let i = 0; i < 102; i++) {
        await optimizer.selectCategoryContentWithCache(
          testCategory,
          testFortune,
          'engineer-fortune',
          `cache-key-${i}`
        );
      }

      // 最初のキーは削除されているはず
      await optimizer.selectCategoryContentWithCache(
        testCategory,
        testFortune,
        'engineer-fortune',
        'cache-key-0'
      );

      // 合計呼び出し数は102（初回）+ 1（再取得）= 103回のはず
      expect(mockPoolService.selectCategoryContent).toHaveBeenCalledTimes(103);
    });
  });

  describe('感情分布メモ化機能', () => {
    it('Fortune値ベースで感情分布計算をメモ化する', () => {
      // 同じ値のFortuneを複数作成
      const fortune1 = Fortune.fromData({
        id: 'kichi-1',
        englishName: 'Blessing 1',
        japaneseName: '吉1',
        description: '吉1',
        probability: 0.2,
        value: 2, // 同じvalue
        color: { primary: '#00ff00', secondary: '#aaffaa', background: '#f0fff0' },
        effects: { glow: false, sparkle: false, animation: null }
      });

      const fortune2 = Fortune.fromData({
        id: 'kichi-2',
        englishName: 'Blessing 2',
        japaneseName: '吉2',
        description: '吉2',
        probability: 0.2,
        value: 2, // 同じvalue
        color: { primary: '#00ff00', secondary: '#aaffaa', background: '#f0fff0' },
        effects: { glow: false, sparkle: false, animation: null }
      });

      const distribution1 = optimizer.getMemoizedEmotionDistribution(fortune1);
      const distribution2 = optimizer.getMemoizedEmotionDistribution(fortune2);

      // 同じvalue値なので同じ分布を返す
      expect(distribution1.getPositiveProbability()).toBe(distribution2.getPositiveProbability());
      expect(distribution1.getNeutralProbability()).toBe(distribution2.getNeutralProbability());
      expect(distribution1.getNegativeProbability()).toBe(distribution2.getNegativeProbability());
    });

    it('異なるFortune値では異なる感情分布を返す', () => {
      const fortuneKichi = Fortune.fromData({
        id: 'kichi',
        englishName: 'Blessing',
        japaneseName: '吉',
        description: '吉',
        probability: 0.2,
        value: 2,
        color: { primary: '#00ff00', secondary: '#aaffaa', background: '#f0fff0' },
        effects: { glow: false, sparkle: false, animation: null }
      });

      const fortuneDaikichi = Fortune.fromData({
        id: 'daikichi',
        englishName: 'Great Blessing',
        japaneseName: '大吉',
        description: '大吉',
        probability: 0.1,
        value: 4,
        color: { primary: '#ff0000', secondary: '#ffaaaa', background: '#fff0f0' },
        effects: { glow: true, sparkle: true, animation: 'bounce' }
      });

      const distributionKichi = optimizer.getMemoizedEmotionDistribution(fortuneKichi);
      const distributionDaikichi = optimizer.getMemoizedEmotionDistribution(fortuneDaikichi);

      // 異なるvalue値なので異なる分布
      expect(distributionKichi.getPositiveProbability()).not.toBe(distributionDaikichi.getPositiveProbability());
    });

    it('メモ化キャッシュのヒット率を測定できる', () => {
      const testFortune = Fortune.fromData({
        id: 'test',
        englishName: 'Test',
        japaneseName: 'テスト',
        description: 'テスト',
        probability: 0.1,
        value: 3,
        color: { primary: '#0000ff', secondary: '#aaaaff', background: '#f0f0ff' },
        effects: { glow: false, sparkle: false, animation: null }
      });

      // 初回（キャッシュミス）
      optimizer.getMemoizedEmotionDistribution(testFortune);
      
      // 2回目以降（キャッシュヒット）
      optimizer.getMemoizedEmotionDistribution(testFortune);
      optimizer.getMemoizedEmotionDistribution(testFortune);

      const stats = optimizer.getEmotionDistributionCacheStats();
      expect(stats.hitRate).toBeGreaterThan(0.5); // 3回中2回ヒット = 66%
      expect(stats.totalRequests).toBe(3);
      expect(stats.cacheHits).toBe(2);
    });
  });

  describe('統合パフォーマンステスト', () => {
    it('最適化されたカテゴリ選択処理が100ms以内で完了する', async () => {
      const mockContents = [
        { id: 'content-1', content: 'コンテンツ1', weight: 1.0 },
        { id: 'content-2', content: 'コンテンツ2', weight: 1.0 },
        { id: 'content-3', content: 'コンテンツ3', weight: 1.0 }
      ];

      // プールサービスをモック
      (mockPoolService.selectCategoryContent as any).mockImplementation(async () => {
        // 実際のプール選択処理をシミュレート（軽微な遅延）
        await new Promise(resolve => setTimeout(resolve, 10));
        const randomContent = mockContents[Math.floor(Math.random() * mockContents.length)];
        return { success: true, data: randomContent };
      });

      const startTime = performance.now();

      // 5つのカテゴリ選択を並行実行
      const categories = FortuneCategory.getAllRequiredCategories();
      const selectionPromises = categories.map(category => 
        optimizer.measureCategorySelectionTime(category, testFortune, 'engineer-fortune')
      );

      const results = await Promise.all(selectionPromises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      // 全体で100ms以内の完了を確認
      expect(totalTime).toBeLessThan(100);

      // すべての選択が成功
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('大量リクエスト処理でもパフォーマンスが維持される', async () => {
      const mockContent = { id: 'perf-content', content: 'パフォーマンステスト', weight: 1.0 };

      (mockPoolService.selectCategoryContent as any).mockResolvedValue({
        success: true,
        data: mockContent
      });

      const totalRequests = 100;
      const numUniqueKeys = 10; // 10種類のキーを使用
      const startTime = performance.now();

      // まず各キーで1回ずつキャッシュを構築
      for (let i = 0; i < numUniqueKeys; i++) {
        await optimizer.selectCategoryContentWithCache(
          testCategory,
          testFortune,
          'engineer-fortune',
          `perf-test-${i}`
        );
      }

      // 次に大量リクエスト（キャッシュヒットが期待される）
      const promises = [];
      for (let i = 0; i < totalRequests; i++) {
        const cacheKey = `perf-test-${i % numUniqueKeys}`;
        promises.push(optimizer.selectCategoryContentWithCache(
          testCategory,
          testFortune,
          'engineer-fortune',
          cacheKey
        ));
      }

      await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      // 全体処理時間をチェック
      expect(totalTime).toBeLessThan(1000); // 1秒以内

      // プールサービス呼び出しは10回のみ（初期キャッシュ構築時のみ）
      expect(mockPoolService.selectCategoryContent).toHaveBeenCalledTimes(numUniqueKeys);
    });
  });

  describe('パフォーマンス統計機能', () => {
    it('処理時間統計を取得できる', async () => {
      const mockContent = { id: 'stats-content', content: '統計テスト', weight: 1.0 };

      (mockPoolService.selectCategoryContent as any).mockResolvedValue({
        success: true,
        data: mockContent
      });

      // 複数回処理を実行
      for (let i = 0; i < 10; i++) {
        await optimizer.measureCategorySelectionTime(testCategory, testFortune, 'engineer-fortune');
      }

      const stats = optimizer.getPerformanceStats();

      expect(stats.totalMeasurements).toBe(10);
      expect(stats.averageTimeMs).toBeGreaterThan(0);
      expect(stats.medianTimeMs).toBeGreaterThan(0);
      expect(stats.p95TimeMs).toBeGreaterThan(0);
      expect(stats.p95TimeMs).toBeLessThan(100); // 95パーセンタイルが100ms以下
      expect(stats.slowRequestsCount).toBe(0); // 100ms超過なし
    });
  });
});