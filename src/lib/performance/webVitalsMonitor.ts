interface VitalsMetric {
  name: string;
  value: number;
  isGood: boolean;
  threshold: number;
}

interface PerformanceWarning {
  metric: string;
  value: number;
  threshold: number;
  message: string;
}

interface MetricData {
  value: number;
  isGood: boolean;
  threshold: number;
}

interface PerformanceReport {
  metrics: Record<string, MetricData>;
  overallScore: number;
}

export class WebVitalsMonitor {
  private vitalsCallbacks: ((metric: VitalsMetric) => void)[] = [];
  private warningCallbacks: ((warning: PerformanceWarning) => void)[] = [];
  private frameRateCallbacks: ((fps: number) => void)[] = [];
  private metrics: Map<string, number> = new Map();
  private thresholds = {
    FCP: 1000, // NFR-TOP-001: < 1.0秒
    LCP: 2500, // NFR-TOP-001: < 2.5秒
    CLS: 0.1,  // NFR-TOP-001: < 0.1
    TTI: 2500, // NFR-TOP-001: < 2.5秒
    FPS: 60    // NFR-TOP-001: 60fps維持
  };

  public frameRateCallback?: () => void;

  constructor() {
    // パフォーマンスマークを設定
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('navigation-start');
    }
  }

  startMonitoring(): void {
    this.initializeWebVitals();
  }

  private async initializeWebVitals(): Promise<void> {
    try {
      // Web Vitals の動的インポートを試行
      const webVitals = await this.importWebVitals();
      
      if (webVitals) {
        // Web Vitals が利用可能
        webVitals.onFCP((metric: any) => this.handleVitalsMetric('FCP', metric.value));
        webVitals.onLCP((metric: any) => this.handleVitalsMetric('LCP', metric.value));
        webVitals.onCLS((metric: any) => this.handleVitalsMetric('CLS', metric.value));
      } else {
        // フォールバック実装
        this.measureFCPFallback();
      }
    } catch (error) {
      console.warn('Web Vitals library not available:', error);
      // フォールバック実装
      this.measureFCPFallback();
    }
  }

  private async importWebVitals(): Promise<any> {
    try {
      // 動的インポートを試行
      const webVitals = await import('web-vitals');
      return webVitals;
    } catch (error) {
      console.warn('Failed to import web-vitals:', error);
      return null; // web-vitalsが利用できない場合
    }
  }

  // テスト用のモック関数（実際のweb-vitalsがない場合の代替）
  private mockGetCLS = (callback: (metric: any) => void) => {
    // テスト環境用のスタブ
  }

  private mockGetFCP = (callback: (metric: any) => void) => {
    // テスト環境用のスタブ
  }

  private mockGetLCP = (callback: (metric: any) => void) => {
    // テスト環境用のスタブ
  }

  private handleVitalsMetric(name: string, value: number): void {
    const threshold = this.thresholds[name as keyof typeof this.thresholds];
    const isGood = value <= threshold;

    const metric: VitalsMetric = {
      name,
      value,
      isGood,
      threshold
    };

    // メトリクスを記録
    this.recordMetric(name, value);

    // コールバックを実行
    this.vitalsCallbacks.forEach(callback => callback(metric));

    // 要件を満たさない場合は警告
    if (!isGood) {
      this.emitWarning(name, value, threshold);
    }
  }

  private measureFCPFallback(): void {
    // Performance Observer のフォールバック実装
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              this.handleVitalsMetric('FCP', entry.startTime);
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch (error) {
        console.warn('Performance Observer not supported');
      }
    }
  }

  async measureTTI(): Promise<void> {
    return new Promise((resolve) => {
      // TTI測定の簡易実装
      if (typeof performance !== 'undefined' && performance.measure) {
        setTimeout(() => {
          try {
            performance.measure('TTI', 'navigation-start');
            const entries = performance.getEntriesByName('TTI');
            if (entries.length > 0) {
              const tti = entries[0].duration;
              this.handleVitalsMetric('TTI', tti);
            }
          } catch (error) {
            console.warn('TTI measurement failed:', error);
          }
          resolve();
        }, 0);
      } else {
        resolve();
      }
    });
  }

  recordMetric(name: string, value: number): void {
    this.metrics.set(name, value);
  }

  generateReport(): PerformanceReport {
    const report: PerformanceReport = { metrics: {}, overallScore: 0 };
    let goodMetrics = 0;
    let totalMetrics = 0;

    for (const [name, value] of this.metrics) {
      const threshold = this.thresholds[name as keyof typeof this.thresholds];
      const isGood = value <= threshold;

      report.metrics[name] = {
        value,
        isGood,
        threshold
      };

      totalMetrics++;
      if (isGood) goodMetrics++;
    }

    // 全体スコアを計算（0-100）
    report.overallScore = totalMetrics > 0 ? Math.round((goodMetrics / totalMetrics) * 100) : 0;

    return report;
  }

  startFrameRateMonitoring(): void {
    let frameCount = 0;
    let lastTime = performance.now();

    this.frameRateCallback = () => {
      frameCount++;
      const now = performance.now();
      
      if (now >= lastTime + 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = now;

        this.frameRateCallbacks.forEach(callback => callback(fps));
        this.checkFrameRate(fps);
      }

      requestAnimationFrame(this.frameRateCallback!);
    };

    requestAnimationFrame(this.frameRateCallback);
  }

  checkFrameRate(fps: number): void {
    if (fps < this.thresholds.FPS) {
      this.emitWarning('FPS', fps, this.thresholds.FPS);
    }
  }

  private emitWarning(metric: string, value: number, threshold: number): void {
    let message: string;
    
    switch (metric) {
      case 'FPS':
        message = `フレームレートが要件を下回っています (${value}fps < ${threshold}fps)`;
        break;
      case 'CLS':
        message = `CLS が要件を超過しています (${value} > ${threshold})`;
        break;
      default:
        message = `${metric} が要件を超過しています (${value}ms > ${threshold}ms)`;
    }

    const warning: PerformanceWarning = {
      metric,
      value,
      threshold,
      message
    };

    this.warningCallbacks.forEach(callback => callback(warning));
  }

  onVitalsUpdate(callback: (metric: VitalsMetric) => void): void {
    this.vitalsCallbacks.push(callback);
  }

  onPerformanceWarning(callback: (warning: PerformanceWarning) => void): void {
    this.warningCallbacks.push(callback);
  }

  onFrameRateUpdate(callback: (fps: number) => void): void {
    this.frameRateCallbacks.push(callback);
  }
}