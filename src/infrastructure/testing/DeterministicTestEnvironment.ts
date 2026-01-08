import seedrandom from 'seedrandom';
import { TestRandomSeedService } from '../services/TestRandomSeedService';

/**
 * 決定論的テスト環境
 * 
 * Task 6.1: seedrandomライブラリを使用した再現可能テスト環境構築
 * 
 * 設計原則:
 * - 全てのランダム性をシードベースで制御
 * - テスト間の完全な分離を保証
 * - 時間依存処理の決定論化
 * - 統計的精度検証のサポート
 * 
 * 使用例:
 * ```typescript
 * const testEnv = new DeterministicTestEnvironment();
 * await testEnv.isolatedTest('my-test', async (env) => {
 *   const rng = env.getRandom();
 *   const value = rng(); // 決定論的な値
 * });
 * ```
 * 
 * Requirements: 5.2, 5.4
 */
export class DeterministicTestEnvironment {
  private seedStack: string[] = [];
  private currentEnvironment: TestEnvironmentContext | null = null;
  private testRandomService: TestRandomSeedService;

  constructor() {
    this.testRandomService = new TestRandomSeedService();
  }

  /**
   * 指定したシードでテスト環境を実行
   * 
   * @param seed - 決定論的シード値
   * @param testFn - テスト実行関数
   * @returns テスト実行結果
   */
  async withSeed<T>(
    seed: string,
    testFn: (env: TestEnvironmentContext) => Promise<T>
  ): Promise<T> {
    if (!seed || typeof seed !== 'string') {
      throw new Error('Seed must be a non-empty string');
    }

    const previousEnv = this.currentEnvironment;
    
    try {
      const env = new TestEnvironmentContext(seed, this.testRandomService);
      this.currentEnvironment = env;
      
      return await testFn(env);
    } catch (error) {
      throw new Error(`Test execution failed with seed '${seed}': ${(error as Error).message}`);
    } finally {
      this.currentEnvironment = previousEnv;
    }
  }

  /**
   * 分離されたテスト環境で実行
   */
  async isolatedTest<T>(
    testCaseName: string,
    testFn: (env: TestEnvironmentContext) => Promise<T>
  ): Promise<T> {
    // テストケース名をシードとして使用して決定論的に
    const seed = `isolated-${testCaseName}`;
    return this.withSeed(seed, testFn);
  }

  /**
   * 再現可能な統合テストを実行
   */
  async reproducibleIntegrationTest<T>(
    testName: string,
    testFn: (env: TestEnvironmentContext) => Promise<T>
  ): Promise<T> {
    const seed = `integration-${testName}`;
    return this.withSeed(seed, testFn);
  }

  /**
   * 環境をクリーンアップ
   */
  cleanup(): void {
    this.seedStack = [];
    this.currentEnvironment = null;
  }
}

/**
 * テスト環境コンテキスト
 * 
 * 個々のテスト実行時に利用可能な決定論的機能を提供
 */
export class TestEnvironmentContext {
  private rng: seedrandom.PRNG;
  private testTime: Date | null = null;
  private seedCounter = 0;

  constructor(
    private baseSeed: string,
    private testRandomService: TestRandomSeedService
  ) {
    this.rng = seedrandom(baseSeed);
  }

  /**
   * 決定論的乱数生成器を取得
   */
  getRandom(customSeed?: string): () => number {
    if (customSeed) {
      return seedrandom(customSeed) as () => number;
    }
    return this.rng as () => number;
  }

  /**
   * テスト用のシードを生成
   */
  generateSeed(context: string): string {
    this.seedCounter++;
    return `${this.baseSeed}-${context}-${this.seedCounter}`;
  }

  /**
   * テスト用固定時間を設定
   */
  setTestTime(time: Date): void {
    this.testTime = new Date(time);
  }

  /**
   * 現在のテスト時間を取得
   */
  getTestTimestamp(): number {
    return this.testTime ? this.testTime.getTime() : Date.now();
  }

  /**
   * テスト時間に指定した時間を加算
   */
  addTime(milliseconds: number): number {
    if (!this.testTime) {
      throw new Error('Test time must be set before adding time');
    }
    
    const newTime = new Date(this.testTime.getTime() + milliseconds);
    this.testTime = newTime;
    return newTime.getTime();
  }

  /**
   * 決定論的セッションIDを生成
   */
  generateSessionId(): string {
    const sessionSeed = this.generateSeed('session');
    const rng = seedrandom(sessionSeed);
    
    // 決定論的にセッションIDを生成
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(rng() * chars.length));
    }
    return `test-${result}`;
  }

  /**
   * 重み付き選択を実行
   */
  weightedSelection<T>(items: T[], weights: number[], randomValue: number): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights must have the same length');
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);
    
    let cumulativeWeight = 0;
    for (let i = 0; i < normalizedWeights.length; i++) {
      cumulativeWeight += normalizedWeights[i];
      if (randomValue <= cumulativeWeight) {
        return items[i];
      }
    }
    
    // フォールバック
    return items[items.length - 1];
  }

  /**
   * 統計分析用のサンプル生成
   */
  generateStatisticalSamples(count: number, generator: () => number): number[] {
    const samples: number[] = [];
    for (let i = 0; i < count; i++) {
      samples.push(generator());
    }
    return samples;
  }

  /**
   * 決定論的UUID生成（テスト用）
   */
  generateTestUUID(): string {
    const seed = this.generateSeed('uuid');
    const rng = seedrandom(seed);
    
    const hex = '0123456789abcdef';
    let uuid = '';
    
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += '-';
      } else if (i === 14) {
        uuid += '4'; // version 4
      } else if (i === 19) {
        uuid += hex.charAt((rng() * 4 | 0) + 8); // variant bits
      } else {
        uuid += hex.charAt(rng() * 16 | 0);
      }
    }
    
    return uuid;
  }
}

// Type definitions for better type safety

/**
 * テスト実行関数の型定義
 */
export type TestFunction<T> = (env: TestEnvironmentContext) => Promise<T>;

/**
 * 統計サンプル結果の型定義
 */
export interface StatisticalSampleResult {
  samples: number[];
  mean: number;
  variance: number;
  standardDeviation: number;
  min: number;
  max: number;
  count: number;
}

/**
 * 重み付き選択の設定
 */
export interface WeightedSelectionConfig<T> {
  items: T[];
  weights: number[];
  seed?: string;
}

/**
 * テスト環境設定
 */
export interface TestEnvironmentConfig {
  baseSeed?: string;
  timeFixed?: boolean;
  startTime?: Date;
  enableStatistics?: boolean;
}