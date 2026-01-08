import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';

/**
 * カテゴリランダム化サービスのインターフェース
 */
export interface ICategoryRandomizationService {
  /**
   * 運勢に基づいて5つの必須カテゴリをランダム化
   */
  randomizeCategories(
    fortune: Fortune,
    omikujiTypeId: string,
    sessionId?: string,
    seed?: string
  ): Promise<Result<FortuneCategory[], RandomizationError>>;

  /**
   * カテゴリの完全性を検証（5つの必須カテゴリがすべて含まれているか）
   */
  validateCategoryCompleteness(
    categories: FortuneCategory[]
  ): Result<boolean, ValidationError>;
}

// Type definitions
export type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

export type RandomizationError = 
  | { type: 'INSUFFICIENT_CONTENT_POOL'; category: string }
  | { type: 'SESSION_GUARD_FAILURE'; sessionId: string }
  | { type: 'EMOTION_DISTRIBUTION_ERROR'; fortuneValue: number };

export type ValidationError = 
  | { type: 'INCOMPLETE_CATEGORIES'; missing: string[] }
  | { type: 'DUPLICATE_CATEGORIES'; duplicates: string[] }
  | { type: 'INVALID_CATEGORY_FORMAT'; categoryId: string };