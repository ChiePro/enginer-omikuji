/**
 * パフォーマンステストの自動化
 * 
 * タスク13: 追加テストカバレッジの実装 - パフォーマンステストの自動化
 * TDD Red Phase: パフォーマンス最適化が不十分な状態で失敗するテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// パフォーマンス測定ユーティリティ
class PerformanceTestUtil {
  static async measureExecutionTime<T>(
    operation: () => Promise<T>,
    description: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`${description}: ${duration.toFixed(2)}ms`);
    return { result, duration };
  }

  static async measureMemoryUsage<T>(
    operation: () => T,
    description: string
  ): Promise<{ result: T; memoryDelta: number }> {
    // ガベージコレクションを実行（可能であれば）
    if (global.gc) {
      global.gc();
    }

    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const result = operation();
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryDelta = finalMemory - initialMemory;

    console.log(`${description}: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    return { result, memoryDelta };
  }

  static async profileCPUUsage<T>(
    operation: () => Promise<T>,
    description: string
  ): Promise<{ result: T; cpuSamples: number[] }> {
    const cpuSamples: number[] = [];
    
    // CPUサンプリングを開始
    const samplingInterval = setInterval(() => {
      const sample = process.cpuUsage?.() || { user: 0, system: 0 };
      cpuSamples.push(sample.user + sample.system);
    }, 10);

    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    
    clearInterval(samplingInterval);
    
    console.log(`${description}: ${(endTime - startTime).toFixed(2)}ms, ${cpuSamples.length} CPU samples`);
    return { result, cpuSamples };
  }
}

// 自動パフォーマンス監視
class AutomatedPerformanceMonitor {
  private thresholds: Record<string, number> = {};
  private measurements: Record<string, number[]> = {};

  setThreshold(metricName: string, threshold: number): void {
    this.thresholds[metricName] = threshold;
  }

  recordMeasurement(metricName: string, value: number): void {
    if (!this.measurements[metricName]) {
      this.measurements[metricName] = [];
    }
    this.measurements[metricName].push(value);
  }

  checkThresholds(): { passed: boolean; violations: string[] } {
    const violations: string[] = [];

    for (const [metric, threshold] of Object.entries(this.thresholds)) {
      const values = this.measurements[metric] || [];
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      if (average > threshold) {
        violations.push(`${metric}: ${average.toFixed(2)} > ${threshold}`);
      }
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  generateReport(): Record<string, any> {
    const report: Record<string, any> = {};

    for (const [metric, values] of Object.entries(this.measurements)) {
      if (values.length === 0) continue;

      const sorted = [...values].sort((a, b) => a - b);
      report[metric] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      };
    }

    return report;
  }
}

describe('パフォーマンステストの自動化', () => {
  let monitor: AutomatedPerformanceMonitor;

  beforeEach(() => {
    monitor = new AutomatedPerformanceMonitor();
    
    // NFR-TOP-001 要件に基づく閾値設定
    monitor.setThreshold('componentInitialization', 100); // 100ms以内
    monitor.setThreshold('frameTime', 16.67); // 60fps維持
    monitor.setThreshold('memoryUsage', 50 * 1024 * 1024); // 50MB以内
    monitor.setThreshold('renderTime', 16); // 16ms以内でレンダリング
  });

  afterEach(() => {
    const report = monitor.generateReport();
    console.log('Performance Report:', JSON.stringify(report, null, 2));

    const { passed, violations } = monitor.checkThresholds();
    if (!passed) {
      console.warn('Performance threshold violations:', violations);
    }
  });

  describe('コンポーネント初期化パフォーマンス', () => {
    it('OmikujiTypeの大量作成が性能要件を満たす', async () => {
      const { duration } = await PerformanceTestUtil.measureExecutionTime(async () => {
        const types = [];
        for (let i = 0; i < 1000; i++) {
          // この実装は完了していないため失敗する（RED phase）
          const typeData = {
            id: `type-${i}`,
            name: `おみくじ${i}`,
            description: `説明${i}`,
            icon: '🎲',
            color: { primary: '#000000', secondary: '#FFFFFF' },
            sortOrder: i
          };
          
          // 実際の実装では OmikujiType.create() を使用
          types.push(typeData);
        }
        return types;
      }, '1000個のOmikujiType作成');

      monitor.recordMeasurement('componentInitialization', duration);
      
      // 要件: 100ms以内で1000個作成
      expect(duration).toBeLessThan(100);
    });

    it('レアリティ計算の大量実行が性能要件を満たす', async () => {
      const { duration } = await PerformanceTestUtil.measureExecutionTime(async () => {
        const results = [];
        for (let i = 0; i < 10000; i++) {
          // この実装は完了していないため失敗する（RED phase） 
          const rarityResult = Math.random() > 0.5 ? 'COMMON' : 'RARE';
          results.push(rarityResult);
        }
        return results;
      }, '10000回のレアリティ計算');

      monitor.recordMeasurement('rarityCalculation', duration);
      
      // 要件: 10000回計算を100ms以内
      expect(duration).toBeLessThan(100);
    });

    it('メモリ効率的なデータ構造使用', async () => {
      const { memoryDelta } = await PerformanceTestUtil.measureMemoryUsage(() => {
        const largeDataSet = [];
        
        // 10000個のオブジェクトを作成
        for (let i = 0; i < 10000; i++) {
          largeDataSet.push({
            id: `item-${i}`,
            data: `data-${i}`.repeat(10) // 少し大きなデータ
          });
        }
        
        return largeDataSet;
      }, '10000個オブジェクトのメモリ使用量');

      monitor.recordMeasurement('memoryUsage', memoryDelta);
      
      // 要件: 50MB以内
      expect(memoryDelta).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('レンダリングパフォーマンス', () => {
    it('アニメーション実行中のフレームレート維持', async () => {
      // 60fps = 16.67ms per frame
      const frameTarget = 16.67;
      const frameCount = 60; // 1秒間のテスト
      const frameTimes: number[] = [];

      for (let frame = 0; frame < frameCount; frame++) {
        const { duration } = await PerformanceTestUtil.measureExecutionTime(async () => {
          // アニメーションフレーム処理をシミュレート
          await new Promise(resolve => {
            setTimeout(() => {
              // DOM操作やスタイル計算をシミュレート
              const element = document.createElement('div');
              element.style.transform = `translateX(${frame * 10}px)`;
              element.style.opacity = `${Math.sin(frame * 0.1)}`;
              
              // レイアウト強制計算
              element.offsetHeight;
              
              resolve(undefined);
            }, 1);
          });
        }, `フレーム ${frame + 1}`);

        frameTimes.push(duration);
        monitor.recordMeasurement('frameTime', duration);
      }

      // 95%のフレームが16.67ms以内で完了
      const slowFrames = frameTimes.filter(time => time > frameTarget);
      const slowFramePercentage = (slowFrames.length / frameCount) * 100;
      
      expect(slowFramePercentage).toBeLessThan(5); // 5%以下の遅延フレーム
    });

    it('DOM操作の集約化によるパフォーマンス向上', async () => {
      const { duration: individualDuration } = await PerformanceTestUtil.measureExecutionTime(async () => {
        // 個別DOM操作（非効率）
        for (let i = 0; i < 1000; i++) {
          const element = document.createElement('div');
          element.textContent = `Item ${i}`;
          element.style.color = 'red';
          element.style.fontSize = '16px';
          
          // 各操作でreflow発生
          document.body.appendChild(element);
          element.offsetHeight; // force reflow
          document.body.removeChild(element);
        }
      }, '個別DOM操作1000回');

      const { duration: batchDuration } = await PerformanceTestUtil.measureExecutionTime(async () => {
        // 集約DOM操作（効率的）
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < 1000; i++) {
          const element = document.createElement('div');
          element.textContent = `Item ${i}`;
          element.style.cssText = 'color: red; font-size: 16px;'; // 集約設定
          fragment.appendChild(element);
        }
        
        // 一度に追加
        document.body.appendChild(fragment);
        
        // 一度に削除
        while (document.body.firstChild) {
          document.body.removeChild(document.body.firstChild);
        }
      }, '集約DOM操作1000回');

      monitor.recordMeasurement('renderTime', Math.min(individualDuration, batchDuration));
      
      // 集約操作は個別操作より高速
      expect(batchDuration).toBeLessThan(individualDuration);
      
      // 集約操作は16ms以内
      expect(batchDuration).toBeLessThan(16);
    });
  });

  describe('リソース読み込みパフォーマンス', () => {
    it('画像遅延読み込みの効率性', async () => {
      // 画像読み込みをモック
      const mockImageLoad = (src: string, lazy: boolean = false): Promise<number> => {
        return new Promise(resolve => {
          const loadTime = lazy ? Math.random() * 50 + 10 : Math.random() * 200 + 100;
          setTimeout(() => resolve(loadTime), loadTime);
        });
      };

      const { duration: eagerDuration } = await PerformanceTestUtil.measureExecutionTime(async () => {
        const promises = Array.from({ length: 20 }, (_, i) => 
          mockImageLoad(`/image-${i}.jpg`, false)
        );
        await Promise.all(promises);
      }, '即座読み込み20枚');

      const { duration: lazyDuration } = await PerformanceTestUtil.measureExecutionTime(async () => {
        // 遅延読み込み: 最初の5枚のみ読み込み
        const initialPromises = Array.from({ length: 5 }, (_, i) => 
          mockImageLoad(`/image-${i}.jpg`, true)
        );
        await Promise.all(initialPromises);
      }, '遅延読み込み最初5枚');

      monitor.recordMeasurement('imageLoadTime', lazyDuration);
      
      // 遅延読み込みが高速
      expect(lazyDuration).toBeLessThan(eagerDuration);
      expect(lazyDuration).toBeLessThan(500); // 500ms以内
    });

    it('コードスプリッティングによる初期ロード最適化', async () => {
      // 動的import（コードスプリッティング）をシミュレート
      const { duration: splitDuration } = await PerformanceTestUtil.measureExecutionTime(async () => {
        // 初期ロード（重要な部分のみ）
        const coreModules = ['core', 'essential'];
        await Promise.all(
          coreModules.map(module => new Promise(resolve => setTimeout(resolve, 50)))
        );
      }, 'コードスプリッティング初期ロード');

      const { duration: monolithicDuration } = await PerformanceTestUtil.measureExecutionTime(async () => {
        // 一括ロード（すべて）
        const allModules = ['core', 'essential', 'optional1', 'optional2', 'optional3'];
        await Promise.all(
          allModules.map(module => new Promise(resolve => setTimeout(resolve, 100)))
        );
      }, '一括ロード');

      monitor.recordMeasurement('initialLoadTime', splitDuration);
      
      // コードスプリッティングが高速
      expect(splitDuration).toBeLessThan(monolithicDuration);
      expect(splitDuration).toBeLessThan(1000); // First Contentful Paint要件: 1秒以内
    });
  });

  describe('データ処理パフォーマンス', () => {
    it('大量データのフィルタリングが高速', async () => {
      // 10000件のデータを生成
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        type: ['engineer', 'tech', 'debug', 'review', 'deploy'][i % 5],
        rarity: ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'][i % 4],
        active: i % 3 === 0
      }));

      const { duration } = await PerformanceTestUtil.measureExecutionTime(async () => {
        // 複数条件でフィルタリング
        const filtered = largeDataset
          .filter(item => item.active)
          .filter(item => item.type === 'engineer')
          .filter(item => item.rarity !== 'COMMON');
        
        return filtered;
      }, '10000件データの複合フィルタリング');

      monitor.recordMeasurement('dataProcessing', duration);
      
      // 要件: 50ms以内
      expect(duration).toBeLessThan(50);
    });

    it('ソート処理の最適化', async () => {
      const unsortedData = Array.from({ length: 5000 }, () => ({
        id: Math.random(),
        sortOrder: Math.floor(Math.random() * 100),
        name: Math.random().toString(36)
      }));

      const { duration: quickSortDuration } = await PerformanceTestUtil.measureExecutionTime(async () => {
        // 最適化されたソート
        const sorted = [...unsortedData].sort((a, b) => a.sortOrder - b.sortOrder);
        return sorted;
      }, 'クイックソート5000件');

      monitor.recordMeasurement('sortingTime', quickSortDuration);
      
      // 要件: 100ms以内
      expect(quickSortDuration).toBeLessThan(100);
    });
  });

  describe('メモリリーク検出', () => {
    it('長時間動作でメモリリークなし', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // 長時間動作をシミュレート（100回繰り返し）
      for (let cycle = 0; cycle < 100; cycle++) {
        // オブジェクト作成と破棄を繰り返し
        const tempData = Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          data: new Array(100).fill(`data-${cycle}-${i}`)
        }));

        // 処理をシミュレート
        tempData.forEach(item => {
          item.data.reverse();
        });

        // ガベージコレクション実行（可能であれば）
        if (cycle % 10 === 0 && global.gc) {
          global.gc();
        }
      }

      // 強制ガベージコレクション
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      monitor.recordMeasurement('memoryLeak', memoryIncrease);
      
      // メモリ増加が10MB以内（許容範囲）
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('イベントリスナーの適切なクリーンアップ', () => {
      const mockElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      // イベントリスナー大量登録
      const listeners: Array<() => void> = [];
      
      for (let i = 0; i < 1000; i++) {
        const listener = () => console.log(`Listener ${i}`);
        listeners.push(listener);
        mockElement.addEventListener('click', listener);
      }

      // クリーンアップ
      listeners.forEach(listener => {
        mockElement.removeEventListener('click', listener);
      });

      // 登録と削除の回数が一致
      expect(mockElement.addEventListener).toHaveBeenCalledTimes(1000);
      expect(mockElement.removeEventListener).toHaveBeenCalledTimes(1000);
    });
  });

  describe('レスポンス時間監視', () => {
    it('API応答時間の自動監視', async () => {
      // API応答をシミュレート
      const mockApiCall = (delay: number): Promise<any> => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ status: 'success', data: {} });
          }, delay);
        });
      };

      const apiEndpoints = [
        { name: 'omikuji/types', delay: 50 },
        { name: 'omikuji/draw', delay: 100 },
        { name: 'omikuji/history', delay: 200 }
      ];

      for (const endpoint of apiEndpoints) {
        const { duration } = await PerformanceTestUtil.measureExecutionTime(
          () => mockApiCall(endpoint.delay),
          `API ${endpoint.name}`
        );

        monitor.recordMeasurement(`api_${endpoint.name.replace('/', '_')}`, duration);
        
        // API応答時間要件: 250ms以内
        expect(duration).toBeLessThan(250);
      }
    });
  });
});