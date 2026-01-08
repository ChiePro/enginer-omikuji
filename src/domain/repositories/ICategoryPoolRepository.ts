import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { CategoryContent, EmotionAttribute } from '../../infrastructure/repositories/json/ExtendedJsonSchema';

/**
 * Result type for repository operations
 */
export type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * カテゴリプールリポジトリのエラータイプ
 */
export type CategoryPoolRepositoryError = 
  | { type: 'FILE_NOT_FOUND'; typeId: string }
  | { type: 'PARSE_ERROR'; message: string }
  | { type: 'POOL_NOT_ENABLED'; typeId: string }
  | { type: 'WRITE_ERROR'; message: string }
  | { type: 'INVALID_POOL_DATA'; message: string };

/**
 * カテゴリプールデータの型定義
 */
export interface CategoryPoolData {
  omikujiTypeId: string;
  pools: {
    [categoryId: string]: {
      [emotionAttribute in EmotionAttribute]: CategoryContent[];
    };
  };
  metadata: {
    lastUpdated: string;
    contentVersion: string;
    totalItems: number;
  };
}

/**
 * カテゴリコンテンツプール リポジトリインターフェース
 * 
 * 責務: カテゴリプールデータの永続化とアクセス
 * - JSON形式でのカテゴリプールデータ読み書き
 * - おみくじタイプ×カテゴリ×感情属性による3次元データアクセス
 * - エラーハンドリングとフォールバック機能
 */
export interface ICategoryPoolRepository {
  /**
   * 指定されたおみくじタイプ・カテゴリ・感情属性のコンテンツを取得
   * 
   * @param omikujiTypeId - おみくじタイプID
   * @param category - 運勢カテゴリ
   * @param emotionAttribute - 感情属性
   * @returns コンテンツ配列またはエラー
   */
  findByTypeAndCategory(
    omikujiTypeId: string,
    category: FortuneCategory,
    emotionAttribute: EmotionAttribute
  ): Promise<Result<CategoryContent[], CategoryPoolRepositoryError>>;
  
  /**
   * 指定されたおみくじタイプの全プールデータを取得
   * 
   * @param omikujiTypeId - おみくじタイプID
   * @returns プールデータ全体またはエラー
   */
  findAllByType(
    omikujiTypeId: string
  ): Promise<Result<CategoryPoolData, CategoryPoolRepositoryError>>;
  
  /**
   * プールデータを更新（書き込み）
   * 
   * @param omikujiTypeId - おみくじタイプID
   * @param poolData - 更新するプールデータ
   * @returns 成功またはエラー
   */
  updatePool(
    omikujiTypeId: string,
    poolData: CategoryPoolData
  ): Promise<Result<void, CategoryPoolRepositoryError>>;
}