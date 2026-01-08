import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { PerformanceMonitor } from './PerformanceMonitor';
import { CategoryRandomizationService } from '../../domain/services/CategoryRandomizationService';
import { SessionDuplicationGuardService } from '../../domain/services/SessionDuplicationGuardService';
import { Fortune } from '../../domain/valueObjects/Fortune';
import { FortuneCategory } from '../../domain/valueObjects/FortuneCategory';

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;
  let mockRandomizationService: CategoryRandomizationService;
  let mockSessionGuardService: SessionDuplicationGuardService;
  let testFortune: Fortune;

  beforeEach(() => {
    mockRandomizationService = {
      randomizeCategories: vi.fn(),
      validateCategoryCompleteness: vi.fn()
    } as any;

    mockSessionGuardService = {
      filterAvailableContent: vi.fn(),
      recordSelectedContent: vi.fn(),
      clearSession: vi.fn()
    } as any;

    performanceMonitor = new PerformanceMonitor(mockRandomizationService, mockSessionGuardService);

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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('カテゴリ選択処理時間の測定とレポート機能', () => {
    it('カテゴリランダム化の処理時間を測定できる', async () => {
      // Mock successful randomization
      const mockCategories = FortuneCategory.getAllRequiredCategories();
      (mockRandomizationService.randomizeCategories as any).mockResolvedValue({
        success: true,
        data: mockCategories
      });

      const result = await performanceMonitor.measureCategoryRandomizationPerformance(
        testFortune,
        'test-session'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.processingTimeMs).toBeGreaterThan(0);
        expect(result.data.categoriesCount).toBe(5);
        expect(result.data.meetsPerformanceTarget).toBe(result.data.processingTimeMs <= 100);
        expect(result.data.timestamp).toBeDefined();
      }
    });

    it('100msを超える処理はパフォーマンス要件未達として記録する', async () => {
      // Mock slow randomization
      (mockRandomizationService.randomizeCategories as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return {
          success: true,
          data: FortuneCategory.getAllRequiredCategories()
        };
      });

      const result = await performanceMonitor.measureCategoryRandomizationPerformance(
        testFortune,
        'slow-session'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.processingTimeMs).toBeGreaterThan(100);
        expect(result.data.meetsPerformanceTarget).toBe(false);
      }
    });

    it('ランダム化エラー時も処理時間を記録する', async () => {
      (mockRandomizationService.randomizeCategories as any).mockResolvedValue({
        success: false,
        error: { type: 'INSUFFICIENT_CONTENT_POOL', category: 'love' }
      });

      const result = await performanceMonitor.measureCategoryRandomizationPerformance(
        testFortune,
        'error-session'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('RANDOMIZATION_ERROR');
        expect(result.error.processingTimeMs).toBeGreaterThan(0);
        expect(result.error.originalError).toBeDefined();
      }
    });

    it('複数回の測定結果から統計レポートを生成できる', async () => {
      const mockCategories = FortuneCategory.getAllRequiredCategories();
      (mockRandomizationService.randomizeCategories as any).mockResolvedValue({
        success: true,
        data: mockCategories
      });

      // 複数回の測定を実行
      for (let i = 0; i < 10; i++) {
        await performanceMonitor.measureCategoryRandomizationPerformance(
          testFortune,
          `session-${i}`
        );
      }

      const report = performanceMonitor.getPerformanceReport();

      expect(report.totalMeasurements).toBe(10);
      expect(report.averageProcessingTimeMs).toBeGreaterThan(0);
      expect(report.p95ProcessingTimeMs).toBeGreaterThan(0);
      expect(report.performanceTargetMetRate).toBeDefined();
      expect(report.slowRequestsCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('セッション状態管理のパフォーマンス監視', () => {
    it('セッション操作の処理時間を測定できる', async () => {
      const sessionId = 'performance-test-session';
      const testContent = [
        { id: 'content-1', content: 'テストコンテンツ1', weight: 1.0 }
      ];

      (mockSessionGuardService.recordSelectedContent as any).mockResolvedValue({
        success: true,
        data: undefined
      });

      const result = await performanceMonitor.measureSessionOperationPerformance(
        sessionId,
        'record_content',
        () => mockSessionGuardService.recordSelectedContent(sessionId, testContent)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operationType).toBe('record_content');
        expect(result.data.processingTimeMs).toBeGreaterThan(0);
        expect(result.data.sessionId).toBe(sessionId);
        expect(result.data.isSuccessful).toBe(true);
      }
    });

    it('セッション操作エラー時も時間測定を行う', async () => {
      const sessionId = 'error-session';

      (mockSessionGuardService.recordSelectedContent as any).mockResolvedValue({
        success: false,
        error: { type: 'SESSION_STORAGE_ERROR', message: 'Storage failed' }
      });

      const result = await performanceMonitor.measureSessionOperationPerformance(
        sessionId,
        'record_content',
        () => mockSessionGuardService.recordSelectedContent(sessionId, [])
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isSuccessful).toBe(false);
        expect(result.data.processingTimeMs).toBeGreaterThan(0);
      }
    });

    it('セッション操作統計を取得できる', async () => {
      const sessionIds = ['session-1', 'session-2', 'session-3'];

      (mockSessionGuardService.recordSelectedContent as any).mockResolvedValue({
        success: true,
        data: undefined
      });

      // 複数のセッション操作を実行
      for (const sessionId of sessionIds) {
        await performanceMonitor.measureSessionOperationPerformance(
          sessionId,
          'record_content',
          () => mockSessionGuardService.recordSelectedContent(sessionId, [])
        );
      }

      const stats = performanceMonitor.getSessionOperationStats();

      expect(stats.totalOperations).toBe(3);
      expect(stats.operationTypes['record_content']).toBe(3);
      expect(stats.averageProcessingTimeMs).toBeGreaterThan(0);
      expect(stats.successRate).toBe(1.0);
    });

    it('セッション状態アクセス時間が10ms以内であることを検証', async () => {
      const sessionId = 'fast-session';

      (mockSessionGuardService.filterAvailableContent as any).mockResolvedValue({
        success: true,
        data: []
      });

      const result = await performanceMonitor.measureSessionOperationPerformance(
        sessionId,
        'filter_content',
        () => mockSessionGuardService.filterAvailableContent(sessionId, [])
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.processingTimeMs).toBeLessThan(10); // 10ms requirement
      }
    });
  });

  describe('統計精度とレスポンス時間のベンチマークテスト', () => {
    it('大量リクエスト処理でのパフォーマンスベンチマークを実行', async () => {
      const requestCount = 100;
      const mockCategories = FortuneCategory.getAllRequiredCategories();

      (mockRandomizationService.randomizeCategories as any).mockResolvedValue({
        success: true,
        data: mockCategories
      });

      const benchmark = await performanceMonitor.runPerformanceBenchmark({
        requestCount,
        concurrentRequests: 10,
        targetResponseTimeMs: 100
      });

      expect(benchmark.success).toBe(true);
      if (benchmark.success) {
        expect(benchmark.data.totalRequests).toBe(requestCount);
        expect(benchmark.data.completedRequests).toBe(requestCount);
        expect(benchmark.data.averageResponseTimeMs).toBeGreaterThan(0);
        expect(benchmark.data.p95ResponseTimeMs).toBeGreaterThan(0);
        expect(benchmark.data.throughputRequestsPerSecond).toBeGreaterThan(0);
        expect(benchmark.data.performanceTargetMet).toBe(
          benchmark.data.p95ResponseTimeMs <= 100
        );
      }
    });

    it('統計的精度の継続監視を実行', async () => {
      const mockCategories = FortuneCategory.getAllRequiredCategories();

      // 一貫した結果を返すモック
      (mockRandomizationService.randomizeCategories as any).mockResolvedValue({
        success: true,
        data: mockCategories
      });

      const accuracyTest = await performanceMonitor.monitorStatisticalAccuracy({
        sampleSize: 1000,
        accuracyThreshold: 0.05, // ±5%
        confidenceLevel: 0.95
      });

      expect(accuracyTest.success).toBe(true);
      if (accuracyTest.success) {
        expect(accuracyTest.data.sampleSize).toBe(1000);
        expect(accuracyTest.data.accuracyThreshold).toBe(0.05);
        expect(accuracyTest.data.meetsAccuracyRequirements).toBeDefined();
        expect(accuracyTest.data.categoryDistributionAccuracy).toBeDefined();
      }
    });

    it('パフォーマンス劣化を検出できる', async () => {
      // 最初は高速（複数回のベースライン）
      (mockRandomizationService.randomizeCategories as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          success: true,
          data: FortuneCategory.getAllRequiredCategories()
        };
      });

      // 10回のベースライン測定
      for (let i = 0; i < 10; i++) {
        await performanceMonitor.measureCategoryRandomizationPerformance(testFortune, `fast-${i}`);
      }

      // 次に低速
      (mockRandomizationService.randomizeCategories as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
          success: true,
          data: FortuneCategory.getAllRequiredCategories()
        };
      });

      // 5回の劣化測定
      for (let i = 0; i < 5; i++) {
        await performanceMonitor.measureCategoryRandomizationPerformance(testFortune, `slow-${i}`);
      }

      const degradation = performanceMonitor.detectPerformanceDegradation();

      expect(degradation.hasSignificantDegradation).toBe(true);
      expect(degradation.degradationFactor).toBeGreaterThan(1);
      expect(degradation.recommendation).toContain('performance');
    });

    it('リアルタイムパフォーマンス監視アラートを生成', async () => {
      const mockCategories = FortuneCategory.getAllRequiredCategories();

      // 複数の遅い処理をシミュレート
      (mockRandomizationService.randomizeCategories as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return { success: true, data: mockCategories };
      });

      // 複数回の遅い処理を実行
      for (let i = 0; i < 5; i++) {
        await performanceMonitor.measureCategoryRandomizationPerformance(testFortune, `slow-${i}`);
      }

      const alerts = performanceMonitor.getPerformanceAlerts();

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('HIGH');
      expect(alerts[0].message).toContain('performance');
      expect(alerts[0].timestamp).toBeDefined();
    });
  });

  describe('統合パフォーマンステスト', () => {
    it('エンドツーエンドパフォーマンス監視が正常動作', async () => {
      const mockCategories = FortuneCategory.getAllRequiredCategories();

      (mockRandomizationService.randomizeCategories as any).mockResolvedValue({
        success: true,
        data: mockCategories
      });

      (mockSessionGuardService.recordSelectedContent as any).mockResolvedValue({
        success: true,
        data: undefined
      });

      // フル監視付きワークフローを実行
      const workflow = await performanceMonitor.monitorFullRandomizationWorkflow({
        fortune: testFortune,
        sessionId: 'full-monitoring',
        includeSessionOperations: true,
        includeBenchmarking: true
      });

      expect(workflow.success).toBe(true);
      if (workflow.success) {
        expect(workflow.data.randomizationPerformance).toBeDefined();
        expect(workflow.data.sessionPerformance).toBeDefined();
        expect(workflow.data.overallPerformance.totalTimeMs).toBeGreaterThan(0);
        expect(workflow.data.performanceScore).toBeGreaterThanOrEqual(0);
        expect(workflow.data.performanceScore).toBeLessThanOrEqual(100);
      }
    });

    it('継続的パフォーマンス監視の設定と実行', async () => {
      const monitoringConfig = {
        interval: 1000, // 1秒間隔
        duration: 3000, // 3秒間
        alertThreshold: 150 // 150ms
      };

      const mockCategories = FortuneCategory.getAllRequiredCategories();
      (mockRandomizationService.randomizeCategories as any).mockResolvedValue({
        success: true,
        data: mockCategories
      });

      const continuousMonitoring = await performanceMonitor.startContinuousMonitoring(
        monitoringConfig
      );

      expect(continuousMonitoring.success).toBe(true);
      if (continuousMonitoring.success) {
        expect(continuousMonitoring.data.monitoringId).toBeDefined();
        expect(continuousMonitoring.data.isActive).toBe(true);
      }

      // 少し待ってから停止
      await new Promise(resolve => setTimeout(resolve, 100));

      const stopResult = performanceMonitor.stopContinuousMonitoring(
        continuousMonitoring.success ? continuousMonitoring.data.monitoringId : ''
      );

      expect(stopResult.success).toBe(true);
    });
  });
});