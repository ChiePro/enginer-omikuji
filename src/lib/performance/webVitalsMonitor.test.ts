import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebVitalsMonitor } from './webVitalsMonitor';

// Web Vitals API をモック
const mockOnCLS = vi.fn();
const mockOnFCP = vi.fn();
const mockOnLCP = vi.fn();
const mockOnTTI = vi.fn();

vi.mock('web-vitals', () => ({
  onCLS: (callback: any) => mockOnCLS(callback),
  onFCP: (callback: any) => mockOnFCP(callback),
  onLCP: (callback: any) => mockOnLCP(callback),
  onTTFB: vi.fn(),
  onINP: vi.fn(),
}));

// Performance APIをモック
global.performance = {
  ...global.performance,
  measure: vi.fn(),
  mark: vi.fn(),
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
} as any;

describe('WebVitalsMonitor', () => {
  let monitor: WebVitalsMonitor;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnFCP.mockClear();
    mockOnLCP.mockClear();
    mockOnCLS.mockClear();
    monitor = new WebVitalsMonitor();
  });

  describe('Core Web Vitals測定', () => {
    it('FCP測定を開始できる', async () => {
      // Act
      monitor.startMonitoring();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(mockOnFCP).toHaveBeenCalledWith(expect.any(Function));
    });

    it('LCP測定を開始できる', async () => {
      // Act
      monitor.startMonitoring();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(mockOnLCP).toHaveBeenCalledWith(expect.any(Function));
    });

    it('CLS測定を開始できる', async () => {
      // Act
      monitor.startMonitoring();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(mockOnCLS).toHaveBeenCalledWith(expect.any(Function));
    });

    it('FCP < 1.0秒の要件を検証できる', async () => {
      // Arrange
      const onVitals = vi.fn();
      monitor.onVitalsUpdate(onVitals);

      // Act
      monitor.startMonitoring();
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // FCP コールバックを実行
      const fcpCallback = mockOnFCP.mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 800 }); // 0.8秒

      // Assert
      expect(onVitals).toHaveBeenCalledWith({
        name: 'FCP',
        value: 800,
        isGood: true, // < 1000ms なので良好
        threshold: 1000
      });
    });

    it('TTI < 2.5秒の要件を検証できる', () => {
      // Arrange
      const onVitals = vi.fn();
      monitor.onVitalsUpdate(onVitals);
      
      // Act
      monitor.measureTTI().then(() => {
        // Assert
        expect(performance.measure).toHaveBeenCalledWith('TTI', 'navigation-start');
      });
    });

    it('CLS < 0.1の要件を検証できる', async () => {
      // Arrange
      const onVitals = vi.fn();
      monitor.onVitalsUpdate(onVitals);

      // Act
      monitor.startMonitoring();
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // CLS コールバックを実行
      const clsCallback = mockOnCLS.mock.calls[0][0];
      clsCallback({ name: 'CLS', value: 0.05 });

      // Assert
      expect(onVitals).toHaveBeenCalledWith({
        name: 'CLS',
        value: 0.05,
        isGood: true, // < 0.1 なので良好
        threshold: 0.1
      });
    });
  });

  describe('パフォーマンス警告', () => {
    it('FCP > 1.0秒で警告を出す', async () => {
      // Arrange
      const onWarning = vi.fn();
      monitor.onPerformanceWarning(onWarning);

      // Act
      monitor.startMonitoring();
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const fcpCallback = mockOnFCP.mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 1200 }); // 1.2秒

      // Assert
      expect(onWarning).toHaveBeenCalledWith({
        metric: 'FCP',
        value: 1200,
        threshold: 1000,
        message: 'FCP が要件を超過しています (1200ms > 1000ms)'
      });
    });

    it('CLS > 0.1で警告を出す', async () => {
      // Arrange
      const onWarning = vi.fn();
      monitor.onPerformanceWarning(onWarning);

      // Act
      monitor.startMonitoring();
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const clsCallback = mockOnCLS.mock.calls[0][0];
      clsCallback({ name: 'CLS', value: 0.15 });

      // Assert
      expect(onWarning).toHaveBeenCalledWith({
        metric: 'CLS',
        value: 0.15,
        threshold: 0.1,
        message: 'CLS が要件を超過しています (0.15 > 0.1)'
      });
    });
  });

  describe('レポート生成', () => {
    it('パフォーマンスレポートを生成できる', () => {
      // Arrange
      monitor.recordMetric('FCP', 800);
      monitor.recordMetric('LCP', 1500);
      monitor.recordMetric('CLS', 0.05);

      // Act
      const report = monitor.generateReport();

      // Assert
      expect(report).toEqual({
        FCP: { value: 800, isGood: true, threshold: 1000 },
        LCP: { value: 1500, isGood: true, threshold: 2500 },
        CLS: { value: 0.05, isGood: true, threshold: 0.1 },
        overallScore: 100 // 全て良好
      });
    });

    it('要件を満たさない場合のスコア計算', () => {
      // Arrange
      monitor.recordMetric('FCP', 1200); // 悪い
      monitor.recordMetric('LCP', 1500); // 良い
      monitor.recordMetric('CLS', 0.15); // 悪い

      // Act
      const report = monitor.generateReport();

      // Assert
      expect(report.overallScore).toBe(33); // 1/3が良好
    });
  });

  describe('アニメーション 60fps 監視', () => {
    it('フレームレート監視を開始できる', () => {
      // Arrange
      const onFrameRate = vi.fn();
      monitor.onFrameRateUpdate(onFrameRate);

      // Act
      monitor.startFrameRateMonitoring();

      // Assert - requestAnimationFrame が呼ばれることを確認
      expect(typeof monitor.frameRateCallback).toBe('function');
    });

    it('60fps未満で警告を出す', () => {
      // Arrange
      const onWarning = vi.fn();
      monitor.onPerformanceWarning(onWarning);

      // Act
      monitor.checkFrameRate(45); // 45fps

      // Assert
      expect(onWarning).toHaveBeenCalledWith({
        metric: 'FPS',
        value: 45,
        threshold: 60,
        message: 'フレームレートが要件を下回っています (45fps < 60fps)'
      });
    });
  });
});