import { OmikujiDrawService, DrawError, Result, FortuneDistribution } from './OmikujiDrawService';
import { CategoryRandomizationService, RandomizationError } from './CategoryRandomizationService';
import { OmikujiResult } from '../entities/OmikujiResult';
import { FortuneCategory } from '../valueObjects/FortuneCategory';

// Extended error types for integration scenarios
export type ExtendedDrawError = DrawError | RandomizationError | {
  type: 'INTEGRATION_ERROR';
  message: string;
  originalError?: DrawError | RandomizationError;
};

/**
 * ランダム化機能統合済みおみくじ抽選サービス
 * 
 * 既存OmikujiDrawServiceにカテゴリランダム化機能を統合し、
 * IOmikujiResultRepositoryインターフェースとの互換性を維持
 */
export class ExtendedOmikujiDrawService {
  constructor(
    private readonly baseDrawService: OmikujiDrawService,
    private readonly randomizationService: CategoryRandomizationService
  ) {}

  /**
   * 既存APIとの互換性を保持したおみくじ抽選
   */
  async drawOmikuji(
    typeId: string, 
    saisenLevel: number = 0
  ): Promise<Result<OmikujiResult, DrawError>> {
    return this.baseDrawService.drawOmikuji(typeId, saisenLevel);
  }

  /**
   * ランダム化機能付きおみくじ抽選
   * 
   * 既存おみくじ抽選にカテゴリランダム化を統合し、
   * セッション管理とエラーハンドリングを含む包括的抽選機能を提供
   * 
   * @param typeId おみくじタイプID
   * @param options ランダム化オプション
   * @returns ランダム化結果またはエラー
   */
  async drawWithRandomization(
    typeId: string,
    options?: RandomizationOptions
  ): Promise<Result<RandomizedDrawResult, ExtendedDrawError>> {
    try {
      // Step 1: 基本おみくじ抽選
      const baseResult = await this.baseDrawService.drawOmikuji(
        typeId, 
        options?.saisenLevel || 0
      );

      if (!baseResult.success) {
        return baseResult;
      }

      const fortune = baseResult.data.getFortune();
      let randomizedCategories: FortuneCategory[] | null = null;
      let fallbackUsed = false;

      // Step 2: カテゴリランダム化（セッション提供時のみ）
      if (options?.sessionId) {
        const randomizationResult = await this.randomizationService.randomizeCategories(
          fortune,
          options.sessionId,
          options.seed
        );

        if (randomizationResult.success) {
          randomizedCategories = randomizationResult.data;
        } else {
          // フォールバック: ランダム化失敗時もベース結果を返す
          fallbackUsed = true;
        }
      }

      return {
        success: true,
        data: {
          baseResult: baseResult.data,
          randomizedCategories,
          fallbackUsed,
          sessionId: options?.sessionId,
          executedAt: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'REPOSITORY_ERROR',
          message: `Extended draw service error: ${(error as Error).message}`
        }
      };
    }
  }

  /**
   * 既存APIとの互換性を保持した確率分布計算
   */
  async calculateFortuneDistribution(
    typeId: string
  ): Promise<Result<FortuneDistribution, DrawError>> {
    return this.baseDrawService.calculateFortuneDistribution(typeId);
  }

  /**
   * ランダム化機能の有効性を検証
   */
  async validateRandomizationCapability(
    typeId: string
  ): Promise<Result<RandomizationCapabilityResult, DrawError>> {
    try {
      // 基本サービスが利用可能かチェック
      const distributionResult = await this.baseDrawService.calculateFortuneDistribution(typeId);
      
      if (!distributionResult.success) {
        return {
          success: false,
          error: distributionResult.error
        };
      }

      // カテゴリの完全性検証
      const requiredCategories = FortuneCategory.getAllRequiredCategories();
      const validationResult = this.randomizationService.validateCategoryCompleteness(
        requiredCategories
      );

      return {
        success: true,
        data: {
          baseServiceAvailable: true,
          randomizationServiceAvailable: validationResult.success,
          requiredCategoriesCount: requiredCategories.length,
          supportedFortunesCount: distributionResult.data.fortunes.length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'REPOSITORY_ERROR',
          message: `Capability validation error: ${(error as Error).message}`
        }
      };
    }
  }
}

// Type definitions for extended functionality

/**
 * ランダム化オプション
 */
export interface RandomizationOptions {
  /** セッションID（重複制御用） */
  sessionId?: string;
  /** 決定論的テスト用シード */
  seed?: string;
  /** お賽銭レベル（運気調整） */
  saisenLevel?: number;
}

/**
 * ランダム化抽選結果
 */
export interface RandomizedDrawResult {
  /** 基本おみくじ結果 */
  baseResult: OmikujiResult;
  /** ランダム化されたカテゴリ配列（失敗時はnull） */
  randomizedCategories: FortuneCategory[] | null;
  /** フォールバック使用フラグ */
  fallbackUsed: boolean;
  /** セッションID */
  sessionId?: string;
  /** 実行時刻 */
  executedAt: Date;
}

/**
 * ランダム化機能利用可能性結果
 */
export interface RandomizationCapabilityResult {
  /** ベースサービス利用可能性 */
  baseServiceAvailable: boolean;
  /** ランダム化サービス利用可能性 */
  randomizationServiceAvailable: boolean;
  /** 必須カテゴリ数 */
  requiredCategoriesCount: number;
  /** サポート運勢数 */
  supportedFortunesCount: number;
}