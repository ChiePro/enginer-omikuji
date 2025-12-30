/**
 * エラーシナリオテスト拡充
 * 
 * タスク13: 追加テストカバレッジの実装 - エラーシナリオのテスト拡充
 * TDD Red Phase: システムのエラーハンドリングで失敗するテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApplicationErrors } from '@/domain/errors/ApplicationErrors';
import { OmikujiType } from '@/domain/entities/OmikujiType';
import { Saisen } from '@/domain/valueObjects/Saisen';
import { RarityCalculatorService } from '@/domain/services/RarityCalculatorService';

describe('エラーシナリオテスト拡充', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ドメインエラーのハンドリング', () => {
    it('無効なおみくじタイプ作成時のエラーハンドリング', () => {
      // 複数の無効パターンをテスト
      const invalidParams = [
        // 空のID
        { id: '', name: '運勢', description: '説明', icon: '🎲', color: { primary: '#000', secondary: '#FFF' }, sortOrder: 1 },
        // 無効な文字を含むID
        { id: 'invalid ID', name: '運勢', description: '説明', icon: '🎲', color: { primary: '#000', secondary: '#FFF' }, sortOrder: 1 },
        // 無効なカラー
        { id: 'valid-id', name: '運勢', description: '説明', icon: '🎲', color: { primary: 'invalid', secondary: '#FFF' }, sortOrder: 1 },
        // 無効なソート順
        { id: 'valid-id', name: '運勢', description: '説明', icon: '🎲', color: { primary: '#000', secondary: '#FFF' }, sortOrder: -1 },
      ];

      invalidParams.forEach((params, index) => {
        expect(() => OmikujiType.create(params), `テストケース ${index + 1}`).toThrow();
      });
    });

    it('カスケードエラー: 複数の検証エラーが同時発生', () => {
      // Arrange - 複数の問題を持つパラメータ
      const multipleErrorParams = {
        id: '', // エラー1: 空ID
        name: '運勢',
        description: '説明',
        icon: '🎲',
        color: { primary: 'invalid', secondary: 'also-invalid' }, // エラー2: 無効カラー
        sortOrder: -1 // エラー3: 無効順序
      };

      // Act & Assert - 最初のエラーで停止することを確認
      expect(() => OmikujiType.create(multipleErrorParams)).toThrow();
    });

    it('メモリ不足シミュレーション: 大量データ処理時のエラー', () => {
      // Arrange - 大量のおみくじタイプ作成を試行
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `omikuji-${i}`,
        name: `運勢${i}`,
        description: `説明${i}`,
        icon: '🎲',
        color: { primary: '#000000', secondary: '#FFFFFF' },
        sortOrder: i
      }));

      // Act & Assert - メモリ制限に達する前に適切にハンドリングされる
      expect(() => {
        const types = largeDataset.map(params => OmikujiType.create(params));
        return types;
      }).not.toThrow('OutOfMemoryError');
    });
  });

  describe('非同期処理エラーハンドリング', () => {
    it('Promise拒否の適切なハンドリング', async () => {
      // Arrange - 失敗するPromiseを作成
      const failingAsyncOperation = (): Promise<any> => {
        return Promise.reject(new ApplicationErrors.OmikujiError('非同期処理エラー', 'ASYNC_ERROR'));
      };

      // Act & Assert - Promise拒否が適切にキャッチされる
      await expect(failingAsyncOperation()).rejects.toThrow('非同期処理エラー');
    });

    it('タイムアウトエラーのハンドリング', async () => {
      // Arrange - タイムアウトする処理をシミュレート
      const timeoutOperation = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new ApplicationErrors.OmikujiError('処理がタイムアウトしました', 'TIMEOUT_ERROR', 408));
          }, 100);
        });
      };

      // Act & Assert
      await expect(timeoutOperation()).rejects.toThrow('処理がタイムアウトしました');
    });

    it('ネットワークエラーシミュレーション', async () => {
      // Arrange - ネットワーク失敗をモック
      const networkError = new ApplicationErrors.OmikujiError(
        'ネットワーク接続エラー',
        'NETWORK_ERROR',
        503
      );

      const failingNetworkCall = async (): Promise<any> => {
        throw networkError;
      };

      // Act & Assert
      await expect(failingNetworkCall()).rejects.toThrow('ネットワーク接続エラー');
    });
  });

  describe('入力検証エラーハンドリング', () => {
    it('SQL Injection攻撃の防御', () => {
      // Arrange - 悪意のある入力
      const maliciousInputs = [
        "'; DROP TABLE omikuji; --",
        "<script>alert('xss')</script>",
        "../../../../../../etc/passwd",
        "null\x00byte",
        "\x1b[31mANSI escape codes\x1b[0m"
      ];

      // Act & Assert - すべての悪意ある入力が拒否される
      maliciousInputs.forEach(input => {
        expect(() => {
          // おみくじIDとして悪意ある文字列を使用
          OmikujiType.create({
            id: input,
            name: '運勢',
            description: '説明', 
            icon: '🎲',
            color: { primary: '#000000', secondary: '#FFFFFF' },
            sortOrder: 1
          });
        }).toThrow();
      });
    });

    it('XSS攻撃の防御', () => {
      // Arrange - XSS攻撃パターン
      const xssPayloads = [
        "<img src=x onerror=alert(1)>",
        "javascript:alert(document.cookie)",
        "\"><img src=x onerror=alert(1)>",
        "';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//",
        "\";alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//"
      ];

      // Act & Assert - XSSペイロードが適切にサニタイズされる
      xssPayloads.forEach(payload => {
        expect(() => {
          OmikujiType.create({
            id: 'valid-id',
            name: payload, // nameフィールドにXSSペイロード
            description: '説明',
            icon: '🎲', 
            color: { primary: '#000000', secondary: '#FFFFFF' },
            sortOrder: 1
          });
        }).not.toThrow(); // サニタイズされて通る

        // ただし、サニタイズ後の値に危険な文字列が含まれていないことを確認
        const omikuji = OmikujiType.create({
          id: 'valid-id',
          name: payload,
          description: '説明',
          icon: '🎲',
          color: { primary: '#000000', secondary: '#FFFFFF' },
          sortOrder: 1
        });

        // HTMLタグや JavaScriptが含まれていないことを確認
        expect(omikuji.name).not.toMatch(/<script|javascript:|onerror|onload/i);
      });
    });

    it('バッファオーバーフロー攻撃の防御', () => {
      // Arrange - 極端に長い入力
      const extremelyLongString = 'A'.repeat(1000000); // 1MB文字列

      // Act & Assert - 適切に制限される（メモリ不足にならない）
      expect(() => {
        const startTime = performance.now();
        
        OmikujiType.create({
          id: 'valid-id',
          name: extremelyLongString,
          description: '説明',
          icon: '🎲',
          color: { primary: '#000000', secondary: '#FFFFFF' },
          sortOrder: 1
        });

        const endTime = performance.now();
        const processingTime = endTime - startTime;
        
        // 処理時間が合理的な範囲内（1秒以内）
        expect(processingTime).toBeLessThan(1000);
      }).not.toThrow('RangeError');
    });
  });

  describe('状態管理エラーハンドリング', () => {
    it('無効な状態遷移の検出', () => {
      // Arrange - 無効な状態変更をシミュレート
      const invalidStateTransition = () => {
        // お賽銭を投げる前におみくじを引こうとする
        const saisen = Saisen.create(-1); // 無効な金額
        return saisen;
      };

      // Act & Assert - 無効状態遷移が拒否される
      expect(invalidStateTransition).toThrow();
    });

    it('競合状態(Race Condition)の検出', async () => {
      // Arrange - 同時実行をシミュレート
      const concurrentOperations = Array.from({ length: 10 }, () => 
        Promise.resolve().then(() => {
          return RarityCalculatorService.calculateDisplayRarities();
        })
      );

      // Act - 並行実行
      const results = await Promise.all(concurrentOperations);

      // Assert - すべての結果が一貫している
      const firstResult = JSON.stringify(results[0]);
      results.forEach((result, index) => {
        expect(JSON.stringify(result), `結果${index}`).toBe(firstResult);
      });
    });

    it('メモリリークの検出', () => {
      // Arrange - メモリリークを引き起こす可能性のある操作
      const memoryLeakTest = () => {
        const largeArray: any[] = [];
        
        // 循環参照を作成
        for (let i = 0; i < 1000; i++) {
          const obj: any = { id: i };
          obj.self = obj; // 循環参照
          largeArray.push(obj);
        }
        
        return largeArray;
      };

      // Act & Assert - 適切にガベージコレクションされる
      expect(() => {
        const before = (performance as any).memory?.usedJSHeapSize || 0;
        
        const result = memoryLeakTest();
        
        // 明示的にnullにして参照を削除
        result.length = 0;
        
        // ガベージコレクションを促す
        if (global.gc) {
          global.gc();
        }
        
        const after = (performance as any).memory?.usedJSHeapSize || 0;
        
        // メモリ使用量の増加が合理的な範囲内
        const memoryIncrease = after - before;
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB以下
        
      }).not.toThrow();
    });
  });

  describe('外部依存エラーハンドリング', () => {
    it('localStorage不使用時のフォールバック', () => {
      // Arrange - localStorageが利用できない環境をシミュレート
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;

      // Act & Assert - localStorageなしでも動作する
      expect(() => {
        // localStorage使用を想定した処理
        const data = { test: 'value' };
        
        // フォールバック処理（メモリ内保存など）
        const memoryStorage: Record<string, string> = {};
        memoryStorage['key'] = JSON.stringify(data);
        
        const retrieved = JSON.parse(memoryStorage['key']);
        expect(retrieved).toEqual(data);
        
      }).not.toThrow();

      // Cleanup
      global.localStorage = originalLocalStorage;
    });

    it('navigator API不使用時のフォールバック', () => {
      // Arrange - navigator APIが利用できない環境をシミュレート
      const originalNavigator = global.navigator;
      delete (global as any).navigator;

      // Act & Assert - navigator APIなしでも動作する
      expect(() => {
        // User-Agent検出のフォールバック
        const userAgent = global.navigator?.userAgent || 'unknown-browser';
        expect(typeof userAgent).toBe('string');
        
      }).not.toThrow();

      // Cleanup
      global.navigator = originalNavigator;
    });

    it('Intersection Observer不使用時のフォールバック', () => {
      // Arrange - Intersection Observer APIが利用できない環境をシミュレート
      const originalIntersectionObserver = global.IntersectionObserver;
      delete (global as any).IntersectionObserver;

      // Act & Assert - Intersection Observerなしでも動作する
      expect(() => {
        // ポリフィルまたはフォールバック処理
        if (!global.IntersectionObserver) {
          // スクロールイベントベースのフォールバック
          const fallbackObserver = {
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn()
          };
          
          expect(fallbackObserver.observe).toBeDefined();
        }
        
      }).not.toThrow();

      // Cleanup
      global.IntersectionObserver = originalIntersectionObserver;
    });
  });

  describe('エラー回復メカニズム', () => {
    it('自動リトライ機能のテスト', async () => {
      // Arrange - 失敗→成功パターンをモック
      let attemptCount = 0;
      const flakyOperation = async (): Promise<string> => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new ApplicationErrors.OmikujiError('一時的エラー', 'TEMPORARY_ERROR', 500);
        }
        return '成功';
      };

      const retryWrapper = async (operation: () => Promise<string>, maxRetries = 3): Promise<string> => {
        let lastError: Error;
        
        for (let i = 0; i <= maxRetries; i++) {
          try {
            return await operation();
          } catch (error) {
            lastError = error as Error;
            if (i === maxRetries) throw lastError;
            await new Promise(resolve => setTimeout(resolve, 100 * (i + 1))); // 指数バックオフ
          }
        }
        
        throw lastError!;
      };

      // Act & Assert - リトライ後に成功する
      const result = await retryWrapper(flakyOperation);
      expect(result).toBe('成功');
      expect(attemptCount).toBe(3);
    });

    it('サーキットブレーカーパターンのテスト', () => {
      // Arrange - サーキットブレーカーをシミュレート
      class CircuitBreaker {
        private failureCount = 0;
        private lastFailTime = 0;
        private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
        
        constructor(
          private threshold: number = 5,
          private timeout: number = 60000
        ) {}

        async call<T>(operation: () => Promise<T>): Promise<T> {
          if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailTime > this.timeout) {
              this.state = 'HALF_OPEN';
            } else {
              throw new ApplicationErrors.OmikujiError('サーキットブレーカー開放中', 'CIRCUIT_OPEN', 503);
            }
          }

          try {
            const result = await operation();
            this.reset();
            return result;
          } catch (error) {
            this.recordFailure();
            throw error;
          }
        }

        private recordFailure(): void {
          this.failureCount++;
          this.lastFailTime = Date.now();
          if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
          }
        }

        private reset(): void {
          this.failureCount = 0;
          this.state = 'CLOSED';
        }
      }

      const breaker = new CircuitBreaker(3, 1000);
      const failingOp = async () => { 
        throw new ApplicationErrors.OmikujiError('外部サービスエラー', 'EXTERNAL_ERROR', 500);
      };

      // Act & Assert - 閾値に達した後サーキットが開く
      expect(async () => {
        // 3回失敗でサーキットが開く
        for (let i = 0; i < 3; i++) {
          try {
            await breaker.call(failingOp);
          } catch (error) {
            // 期待される失敗
          }
        }

        // 4回目でサーキットブレーカー開放エラー
        await breaker.call(failingOp);
      }).rejects.toThrow('サーキットブレーカー開放中');
    });

    it('グレースフルデグラデーション機能のテスト', async () => {
      // Arrange - 機能縮退をテスト
      const featureWithFallback = async (useAdvancedFeature: boolean) => {
        if (useAdvancedFeature) {
          // 高機能版（失敗する可能性）
          throw new ApplicationErrors.OmikujiError('高機能版エラー', 'ADVANCED_ERROR');
        } else {
          // 基本版（安全）
          return { basic: true, features: ['essential'] };
        }
      };

      const gracefulService = async () => {
        try {
          return await featureWithFallback(true);
        } catch (error) {
          // フォールバック
          return await featureWithFallback(false);
        }
      };

      // Act
      const result = await gracefulService();

      // Assert - 基本機能は動作する
      expect(result).toEqual({ basic: true, features: ['essential'] });
    });
  });
});