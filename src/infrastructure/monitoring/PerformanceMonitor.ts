import { CategoryRandomizationService } from '../../domain/services/CategoryRandomizationService';
import { SessionDuplicationGuardService } from '../../domain/services/SessionDuplicationGuardService';
import { Fortune } from '../../domain/valueObjects/Fortune';
import { FortuneCategory } from '../../domain/valueObjects/FortuneCategory';

/**
 * パフォーマンス監視クラス
 * 
 * 機能:
 * - カテゴリ選択処理時間の測定とレポート機能
 * - セッション状態管理のパフォーマンス監視
 * - 統計精度とレスポンス時間のベンチマークテスト
 * 
 * Requirements: 5.1, 5.3
 */
export class PerformanceMonitor {
  private performanceMeasurements: PerformanceMeasurement[] = [];
  private sessionOperations: SessionOperationMeasurement[] = [];
  private performanceAlerts: PerformanceAlert[] = [];
  private continuousMonitoringTasks = new Map<string, ContinuousMonitoringTask>();

  constructor(
    private readonly randomizationService: CategoryRandomizationService,
    private readonly sessionGuardService: SessionDuplicationGuardService
  ) {}

  /**
   * カテゴリランダム化のパフォーマンスを測定
   */
  async measureCategoryRandomizationPerformance(
    fortune: Fortune,
    omikujiTypeId: string,
    sessionId?: string
  ): Promise<Result<CategoryRandomizationPerformance, RandomizationPerformanceError>> {
    const startTime = performance.now();

    try {
      const result = await this.randomizationService.randomizeCategories(
        fortune,
        omikujiTypeId,
        sessionId
      );
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      const performanceData: CategoryRandomizationPerformance = {
        processingTimeMs: processingTime,
        categoriesCount: result.success ? result.data.length : 0,
        meetsPerformanceTarget: processingTime <= 100, // 100ms requirement
        timestamp: Date.now(),
        fortuneType: fortune.getJapaneseName(),
        sessionId
      };

      // 記録
      this.recordPerformanceMeasurement({
        type: 'category_randomization',
        processingTimeMs: processingTime,
        success: result.success,
        timestamp: Date.now(),
        metadata: {
          fortuneValue: fortune.getValue(),
          sessionId,
          categoriesCount: performanceData.categoriesCount
        }
      });

      // アラート検証
      this.checkPerformanceAlerts(processingTime, 'category_randomization');

      if (result.success) {
        return {
          success: true,
          data: performanceData
        };
      } else {
        return {
          success: false,
          error: {
            type: 'RANDOMIZATION_ERROR',
            processingTimeMs: processingTime,
            originalError: result.error
          }
        };
      }
    } catch (error) {
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      return {
        success: false,
        error: {
          type: 'UNEXPECTED_ERROR',
          processingTimeMs: processingTime,
          originalError: error
        }
      };
    }
  }

  /**
   * セッション操作のパフォーマンスを測定
   */
  async measureSessionOperationPerformance<T>(
    sessionId: string,
    operationType: string,
    operation: () => Promise<{ success: boolean; data?: T; error?: any }>
  ): Promise<Result<SessionOperationPerformance, SessionPerformanceError>> {
    const startTime = performance.now();

    try {
      const result = await operation();
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      const performanceData: SessionOperationPerformance = {
        sessionId,
        operationType,
        processingTimeMs: processingTime,
        isSuccessful: result.success,
        timestamp: Date.now()
      };

      // 記録
      this.recordSessionOperationMeasurement({
        sessionId,
        operationType,
        processingTimeMs: processingTime,
        success: result.success,
        timestamp: Date.now()
      });

      return {
        success: true,
        data: performanceData
      };
    } catch (error) {
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      return {
        success: false,
        error: {
          type: 'SESSION_OPERATION_ERROR',
          processingTimeMs: processingTime,
          sessionId,
          operationType,
          originalError: error
        }
      };
    }
  }

  /**
   * パフォーマンスベンチマークを実行
   */
  async runPerformanceBenchmark(
    config: BenchmarkConfig
  ): Promise<Result<BenchmarkResult, BenchmarkError>> {
    try {
      const startTime = performance.now();
      const responseTimes: number[] = [];
      let completedRequests = 0;
      
      const fortune = Fortune.fromData({
        id: 'benchmark',
        englishName: 'Benchmark',
        japaneseName: 'ベンチマーク',
        description: 'ベンチマーク用運勢',
        probability: 0.1,
        value: 2,
        color: { primary: '#000000', secondary: '#ffffff', background: '#f0f0f0' },
        effects: { glow: false, sparkle: false, animation: null }
      });

      // 並行リクエスト実行
      const batchSize = Math.ceil(config.requestCount / config.concurrentRequests);
      
      for (let batch = 0; batch < config.concurrentRequests; batch++) {
        const batchPromises = [];
        
        for (let i = 0; i < batchSize && completedRequests < config.requestCount; i++) {
          batchPromises.push(
            this.measureCategoryRandomizationPerformance(
              fortune,
              `benchmark-${completedRequests}`
            ).then(result => {
              if (result.success) {
                responseTimes.push(result.data.processingTimeMs);
              }
              completedRequests++;
            })
          );
        }
        
        await Promise.all(batchPromises);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 統計計算
      responseTimes.sort((a, b) => a - b);
      const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const p95Index = Math.floor(responseTimes.length * 0.95);
      const p95ResponseTime = responseTimes[p95Index] || 0;
      const throughput = (completedRequests / totalTime) * 1000; // requests per second

      const benchmarkResult: BenchmarkResult = {
        totalRequests: config.requestCount,
        completedRequests,
        averageResponseTimeMs: averageResponseTime,
        p95ResponseTimeMs: p95ResponseTime,
        throughputRequestsPerSecond: throughput,
        totalDurationMs: totalTime,
        performanceTargetMet: p95ResponseTime <= config.targetResponseTimeMs
      };

      return {
        success: true,
        data: benchmarkResult
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'BENCHMARK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * 統計的精度を監視
   */
  async monitorStatisticalAccuracy(
    config: StatisticalAccuracyConfig
  ): Promise<Result<StatisticalAccuracyResult, StatisticalAccuracyError>> {
    try {
      const categoryDistributionCounts: { [category: string]: number } = {};
      const fortune = Fortune.fromData({
        id: 'accuracy-test',
        englishName: 'Accuracy Test',
        japaneseName: '精度テスト',
        description: '統計精度テスト用運勢',
        probability: 0.1,
        value: 2,
        color: { primary: '#000000', secondary: '#ffffff', background: '#f0f0f0' },
        effects: { glow: false, sparkle: false, animation: null }
      });

      // サンプル収集
      for (let i = 0; i < config.sampleSize; i++) {
        const result = await this.randomizationService.randomizeCategories(fortune, `accuracy-${i}`);
        
        if (result.success) {
          result.data.forEach(category => {
            const categoryName = category.getDisplayName();
            categoryDistributionCounts[categoryName] = (categoryDistributionCounts[categoryName] || 0) + 1;
          });
        }
      }

      // 期待分布との比較
      const expectedCount = config.sampleSize / 5; // 5つのカテゴリが均等に出現する期待値
      let meetsAccuracyRequirements = true;
      
      const distributionAccuracy: { [category: string]: number } = {};
      
      for (const [category, count] of Object.entries(categoryDistributionCounts)) {
        const actualRate = count / config.sampleSize;
        const expectedRate = 0.2; // 20% each for 5 categories
        const deviation = Math.abs(actualRate - expectedRate);
        
        distributionAccuracy[category] = deviation;
        
        if (deviation > config.accuracyThreshold) {
          meetsAccuracyRequirements = false;
        }
      }

      const result: StatisticalAccuracyResult = {
        sampleSize: config.sampleSize,
        accuracyThreshold: config.accuracyThreshold,
        meetsAccuracyRequirements,
        categoryDistributionAccuracy: distributionAccuracy,
        testTimestamp: Date.now()
      };

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'STATISTICAL_ACCURACY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * パフォーマンス劣化を検出
   */
  detectPerformanceDegradation(): PerformanceDegradationResult {
    if (this.performanceMeasurements.length < 10) {
      return {
        hasSignificantDegradation: false,
        degradationFactor: 1.0,
        recommendation: '測定データが不足しています'
      };
    }

    // 最近の測定値と過去の測定値を比較
    const recentMeasurements = this.performanceMeasurements
      .slice(-5)
      .map(m => m.processingTimeMs);
    
    const historicalMeasurements = this.performanceMeasurements
      .slice(0, Math.max(1, this.performanceMeasurements.length - 5))
      .map(m => m.processingTimeMs);

    const recentAverage = recentMeasurements.reduce((sum, time) => sum + time, 0) / recentMeasurements.length;
    const historicalAverage = historicalMeasurements.reduce((sum, time) => sum + time, 0) / historicalMeasurements.length;

    const degradationFactor = recentAverage / historicalAverage;
    const hasSignificantDegradation = degradationFactor > 1.5; // 50%以上の劣化

    let recommendation = '';
    if (hasSignificantDegradation) {
      recommendation = `performance degradation detected: パフォーマンスが${Math.round((degradationFactor - 1) * 100)}%劣化しています。システムの最適化を検討してください。`;
    } else {
      recommendation = 'パフォーマンスは正常範囲内です。';
    }

    return {
      hasSignificantDegradation,
      degradationFactor,
      recommendation
    };
  }

  /**
   * フル監視付きワークフローを実行
   */
  async monitorFullRandomizationWorkflow(
    config: FullWorkflowMonitoringConfig
  ): Promise<Result<FullWorkflowPerformance, WorkflowMonitoringError>> {
    const workflowStartTime = performance.now();

    try {
      // 1. ランダム化パフォーマンス測定
      const randomizationResult = await this.measureCategoryRandomizationPerformance(
        config.fortune,
        config.omikujiTypeId,
        config.sessionId
      );

      // 2. セッション操作パフォーマンス測定（オプション）
      let sessionPerformance: SessionOperationPerformance | undefined;
      
      if (config.includeSessionOperations && config.sessionId) {
        const sessionResult = await this.measureSessionOperationPerformance(
          config.sessionId,
          'record_content',
          () => this.sessionGuardService.recordSelectedContent(config.sessionId!, [])
        );
        
        if (sessionResult.success) {
          sessionPerformance = sessionResult.data;
        }
      }

      // 3. ベンチマーク（オプション）
      let benchmarkResult: BenchmarkResult | undefined;
      
      if (config.includeBenchmarking) {
        const benchmark = await this.runPerformanceBenchmark({
          requestCount: 50,
          concurrentRequests: 5,
          targetResponseTimeMs: 100
        });
        
        if (benchmark.success) {
          benchmarkResult = benchmark.data;
        }
      }

      const workflowEndTime = performance.now();
      const totalTimeMs = workflowEndTime - workflowStartTime;

      // パフォーマンススコア計算（0-100）
      const performanceScore = this.calculatePerformanceScore({
        randomizationTime: randomizationResult.success ? randomizationResult.data.processingTimeMs : 200,
        sessionTime: sessionPerformance?.processingTimeMs || 0,
        totalTime: totalTimeMs
      });

      const workflowPerformance: FullWorkflowPerformance = {
        randomizationPerformance: randomizationResult.success ? randomizationResult.data : undefined,
        sessionPerformance,
        benchmarkResult,
        overallPerformance: {
          totalTimeMs,
          performanceScore
        },
        performanceScore
      };

      return {
        success: true,
        data: workflowPerformance
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'WORKFLOW_MONITORING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * 継続的監視を開始
   */
  async startContinuousMonitoring(
    config: ContinuousMonitoringConfig
  ): Promise<Result<ContinuousMonitoringInfo, ContinuousMonitoringError>> {
    const monitoringId = `monitoring-${Date.now()}`;
    
    try {
      const task: ContinuousMonitoringTask = {
        id: monitoringId,
        config,
        isActive: true,
        startTime: Date.now(),
        measurements: []
      };

      this.continuousMonitoringTasks.set(monitoringId, task);

      // バックグラウンド監視を開始（実際のプロジェクトではWorkerやタイマーを使用）
      const monitoringInterval = setInterval(async () => {
        const currentTask = this.continuousMonitoringTasks.get(monitoringId);
        if (!currentTask || !currentTask.isActive) {
          clearInterval(monitoringInterval);
          return;
        }

        // 監視期間チェック
        if (Date.now() - currentTask.startTime > config.duration) {
          currentTask.isActive = false;
          clearInterval(monitoringInterval);
          return;
        }

        // パフォーマンス測定実行
        const fortune = Fortune.fromData({
          id: 'monitoring',
          englishName: 'Monitoring',
          japaneseName: '監視',
          description: '継続監視用',
          probability: 0.1,
          value: 2,
          color: { primary: '#000000', secondary: '#ffffff', background: '#f0f0f0' },
          effects: { glow: false, sparkle: false, animation: null }
        });

        const result = await this.measureCategoryRandomizationPerformance(fortune, 'continuous');
        if (result.success) {
          currentTask.measurements.push(result.data);
          
          // アラートチェック
          if (result.data.processingTimeMs > config.alertThreshold) {
            this.addPerformanceAlert({
              severity: 'HIGH',
              message: `継続監視でパフォーマンス劣化を検出: ${result.data.processingTimeMs.toFixed(2)}ms`,
              timestamp: Date.now(),
              metadata: { monitoringId, processingTime: result.data.processingTimeMs }
            });
          }
        }
      }, config.interval);

      return {
        success: true,
        data: {
          monitoringId,
          isActive: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'CONTINUOUS_MONITORING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * 継続的監視を停止
   */
  stopContinuousMonitoring(monitoringId: string): Result<void, ContinuousMonitoringError> {
    const task = this.continuousMonitoringTasks.get(monitoringId);
    
    if (!task) {
      return {
        success: false,
        error: {
          type: 'MONITORING_NOT_FOUND',
          message: `監視タスクが見つかりません: ${monitoringId}`
        }
      };
    }

    task.isActive = false;
    this.continuousMonitoringTasks.delete(monitoringId);

    return {
      success: true,
      data: undefined
    };
  }

  /**
   * パフォーマンスレポートを取得
   */
  getPerformanceReport(): PerformanceReport {
    if (this.performanceMeasurements.length === 0) {
      return {
        totalMeasurements: 0,
        averageProcessingTimeMs: 0,
        p95ProcessingTimeMs: 0,
        performanceTargetMetRate: 0,
        slowRequestsCount: 0
      };
    }

    const processingTimes = this.performanceMeasurements
      .filter(m => m.type === 'category_randomization')
      .map(m => m.processingTimeMs)
      .sort((a, b) => a - b);

    const average = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    const p95Index = Math.floor(processingTimes.length * 0.95);
    const p95 = processingTimes[p95Index] || 0;
    
    const targetMetCount = processingTimes.filter(time => time <= 100).length;
    const targetMetRate = targetMetCount / processingTimes.length;
    
    const slowRequestsCount = processingTimes.filter(time => time > 100).length;

    return {
      totalMeasurements: processingTimes.length,
      averageProcessingTimeMs: average,
      p95ProcessingTimeMs: p95,
      performanceTargetMetRate: targetMetRate,
      slowRequestsCount
    };
  }

  /**
   * セッション操作統計を取得
   */
  getSessionOperationStats(): SessionOperationStats {
    const operations = this.sessionOperations;
    
    if (operations.length === 0) {
      return {
        totalOperations: 0,
        operationTypes: {},
        averageProcessingTimeMs: 0,
        successRate: 0
      };
    }

    const operationTypes: { [type: string]: number } = {};
    let totalTime = 0;
    let successCount = 0;

    for (const op of operations) {
      operationTypes[op.operationType] = (operationTypes[op.operationType] || 0) + 1;
      totalTime += op.processingTimeMs;
      if (op.success) successCount++;
    }

    return {
      totalOperations: operations.length,
      operationTypes,
      averageProcessingTimeMs: totalTime / operations.length,
      successRate: successCount / operations.length
    };
  }

  /**
   * パフォーマンスアラートを取得
   */
  getPerformanceAlerts(): PerformanceAlert[] {
    return [...this.performanceAlerts];
  }

  /**
   * 測定データを記録
   */
  private recordPerformanceMeasurement(measurement: PerformanceMeasurement): void {
    this.performanceMeasurements.push(measurement);
    
    // 古い測定データの削除（最新1000件のみ保持）
    if (this.performanceMeasurements.length > 1000) {
      this.performanceMeasurements = this.performanceMeasurements.slice(-1000);
    }
  }

  /**
   * セッション操作測定を記録
   */
  private recordSessionOperationMeasurement(measurement: SessionOperationMeasurement): void {
    this.sessionOperations.push(measurement);
    
    // 古い測定データの削除（最新1000件のみ保持）
    if (this.sessionOperations.length > 1000) {
      this.sessionOperations = this.sessionOperations.slice(-1000);
    }
  }

  /**
   * パフォーマンスアラートをチェック
   */
  private checkPerformanceAlerts(processingTime: number, operationType: string): void {
    if (processingTime > 100) {
      this.addPerformanceAlert({
        severity: 'HIGH',
        message: `performance degradation detected: ${operationType}の処理時間が100msを超過 ${processingTime.toFixed(2)}ms`,
        timestamp: Date.now(),
        metadata: { processingTime, operationType }
      });
    }
  }

  /**
   * パフォーマンスアラートを追加
   */
  private addPerformanceAlert(alert: PerformanceAlert): void {
    this.performanceAlerts.push(alert);
    
    // 古いアラートの削除（最新100件のみ保持）
    if (this.performanceAlerts.length > 100) {
      this.performanceAlerts = this.performanceAlerts.slice(-100);
    }
  }

  /**
   * パフォーマンススコアを計算
   */
  private calculatePerformanceScore(metrics: {
    randomizationTime: number;
    sessionTime: number;
    totalTime: number;
  }): number {
    // 100ms以内なら100点、それ以上は減点
    const randomizationScore = Math.max(0, 100 - Math.max(0, metrics.randomizationTime - 100));
    const sessionScore = Math.max(0, 100 - Math.max(0, metrics.sessionTime - 10));
    const totalScore = Math.max(0, 100 - Math.max(0, metrics.totalTime - 150));
    
    return Math.round((randomizationScore + sessionScore + totalScore) / 3);
  }
}

// Type definitions

export type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface CategoryRandomizationPerformance {
  processingTimeMs: number;
  categoriesCount: number;
  meetsPerformanceTarget: boolean;
  timestamp: number;
  fortuneType: string;
  sessionId?: string;
}

export interface SessionOperationPerformance {
  sessionId: string;
  operationType: string;
  processingTimeMs: number;
  isSuccessful: boolean;
  timestamp: number;
}

export interface PerformanceMeasurement {
  type: string;
  processingTimeMs: number;
  success: boolean;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface SessionOperationMeasurement {
  sessionId: string;
  operationType: string;
  processingTimeMs: number;
  success: boolean;
  timestamp: number;
}

export interface BenchmarkConfig {
  requestCount: number;
  concurrentRequests: number;
  targetResponseTimeMs: number;
}

export interface BenchmarkResult {
  totalRequests: number;
  completedRequests: number;
  averageResponseTimeMs: number;
  p95ResponseTimeMs: number;
  throughputRequestsPerSecond: number;
  totalDurationMs: number;
  performanceTargetMet: boolean;
}

export interface StatisticalAccuracyConfig {
  sampleSize: number;
  accuracyThreshold: number;
  confidenceLevel: number;
}

export interface StatisticalAccuracyResult {
  sampleSize: number;
  accuracyThreshold: number;
  meetsAccuracyRequirements: boolean;
  categoryDistributionAccuracy: { [category: string]: number };
  testTimestamp: number;
}

export interface PerformanceDegradationResult {
  hasSignificantDegradation: boolean;
  degradationFactor: number;
  recommendation: string;
}

export interface FullWorkflowMonitoringConfig {
  fortune: Fortune;
  omikujiTypeId: string;
  sessionId?: string;
  includeSessionOperations: boolean;
  includeBenchmarking: boolean;
}

export interface FullWorkflowPerformance {
  randomizationPerformance?: CategoryRandomizationPerformance;
  sessionPerformance?: SessionOperationPerformance;
  benchmarkResult?: BenchmarkResult;
  overallPerformance: {
    totalTimeMs: number;
    performanceScore: number;
  };
  performanceScore: number;
}

export interface ContinuousMonitoringConfig {
  interval: number;
  duration: number;
  alertThreshold: number;
}

export interface ContinuousMonitoringInfo {
  monitoringId: string;
  isActive: boolean;
}

export interface ContinuousMonitoringTask {
  id: string;
  config: ContinuousMonitoringConfig;
  isActive: boolean;
  startTime: number;
  measurements: CategoryRandomizationPerformance[];
}

export interface PerformanceReport {
  totalMeasurements: number;
  averageProcessingTimeMs: number;
  p95ProcessingTimeMs: number;
  performanceTargetMetRate: number;
  slowRequestsCount: number;
}

export interface SessionOperationStats {
  totalOperations: number;
  operationTypes: { [type: string]: number };
  averageProcessingTimeMs: number;
  successRate: number;
}

export interface PerformanceAlert {
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export type RandomizationPerformanceError = 
  | { type: 'RANDOMIZATION_ERROR'; processingTimeMs: number; originalError: any }
  | { type: 'UNEXPECTED_ERROR'; processingTimeMs: number; originalError: any };

export type SessionPerformanceError = {
  type: 'SESSION_OPERATION_ERROR';
  processingTimeMs: number;
  sessionId: string;
  operationType: string;
  originalError: any;
};

export type BenchmarkError = {
  type: 'BENCHMARK_ERROR';
  message: string;
};

export type StatisticalAccuracyError = {
  type: 'STATISTICAL_ACCURACY_ERROR';
  message: string;
};

export type WorkflowMonitoringError = {
  type: 'WORKFLOW_MONITORING_ERROR';
  message: string;
};

export type ContinuousMonitoringError = 
  | { type: 'CONTINUOUS_MONITORING_ERROR'; message: string }
  | { type: 'MONITORING_NOT_FOUND'; message: string };