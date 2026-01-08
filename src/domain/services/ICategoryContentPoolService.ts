import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { Fortune } from '../valueObjects/Fortune';
import { CategoryContent, EmotionAttribute } from '../../infrastructure/repositories/json/ExtendedJsonSchema';

/**
 * Result type for service operations
 */
export type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Pool service error types
 */
export type PoolError = 
  | { type: 'POOL_EXHAUSTED'; category: string; emotionAttribute: string }
  | { type: 'INVALID_CONTENT_FORMAT'; contentId: string }
  | { type: 'REPOSITORY_ACCESS_ERROR'; message: string };

/**
 * カテゴリコンテンツと感情属性の組み合わせ
 */
export interface CategoryContentWithEmotion {
  content: CategoryContent;
  emotionAttribute: EmotionAttribute;
}

/**
 * カテゴリコンテンツプールサービス インターフェース
 * 
 * 責務:
 * - 感情属性確率分布に基づくコンテンツ選択
 * - プール枯渇時のデフォルトコンテンツ提供
 * - 動的コンテンツ統合とプール拡張
 */
export interface ICategoryContentPoolService {
  /**
   * カテゴリコンテンツを選択する
   * 
   * @param category - 運勢カテゴリ
   * @param fortune - メイン運勢（感情属性分布の計算に使用）
   * @param omikujiTypeId - おみくじタイプID
   * @param excludeContent - 除外するコンテンツIDの配列
   * @returns 選択されたコンテンツと感情属性またはエラー
   */
  selectCategoryContent(
    category: FortuneCategory,
    fortune: Fortune,
    omikujiTypeId: string,
    excludeContent?: string[]
  ): Promise<Result<CategoryContentWithEmotion, PoolError>>;
  
  /**
   * 利用可能なコンテンツ数を取得する
   * 
   * @param category - 運勢カテゴリ
   * @param emotionAttribute - 感情属性
   * @param omikujiTypeId - おみくじタイプID
   * @returns コンテンツ数またはエラー
   */
  getAvailableContentCount(
    category: FortuneCategory,
    emotionAttribute: EmotionAttribute,
    omikujiTypeId: string
  ): Promise<Result<number, PoolError>>;
  
  /**
   * プールにコンテンツを追加する
   * 
   * @param content - 追加するコンテンツ
   * @param category - 対象カテゴリ
   * @param omikujiTypeId - おみくじタイプID
   * @returns 成功またはエラー
   */
  addContentToPool(
    content: CategoryContent,
    category: FortuneCategory,
    omikujiTypeId: string
  ): Promise<Result<void, PoolError>>;
}