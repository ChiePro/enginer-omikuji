import * as fs from 'fs/promises';
import * as path from 'path';
import { FortuneCategory } from '../../../domain/valueObjects/FortuneCategory';
import { 
  ICategoryPoolRepository, 
  CategoryPoolRepositoryError, 
  CategoryPoolData,
  Result 
} from '../../../domain/repositories/ICategoryPoolRepository';
import {
  ExtendedOmikujiResultData,
  CategoryContent,
  EmotionAttribute,
  CategoryName,
  SchemaValidator
} from './ExtendedJsonSchema';

/**
 * JSON形式でのカテゴリプールデータアクセス実装
 * 
 * 責務:
 * - 拡張JSONスキーマによるプールデータ管理
 * - おみくじタイプ×カテゴリ×感情属性による3次元データアクセス
 * - 既存データ形式との下位互換性維持
 * - エラーハンドリングとフォールバック機能
 */
export class JsonCategoryPoolRepository implements ICategoryPoolRepository {
  private readonly dataDirectory: string;

  constructor(dataDirectory?: string) {
    this.dataDirectory = dataDirectory || path.join(process.cwd(), 'data', 'results');
  }

  async findByTypeAndCategory(
    omikujiTypeId: string,
    category: FortuneCategory,
    emotionAttribute: EmotionAttribute
  ): Promise<Result<CategoryContent[], CategoryPoolRepositoryError>> {
    try {
      const filePath = this.getFilePath(omikujiTypeId);
      
      // ファイル存在確認
      try {
        await fs.access(filePath);
      } catch {
        return { success: false, error: { type: 'FILE_NOT_FOUND', typeId: omikujiTypeId } };
      }

      // ファイル読み込みとパース
      const parseResult = await this.parseJsonFile(filePath);
      if (!parseResult.success) {
        return { success: false, error: parseResult.error };
      }

      const data = parseResult.data;

      // プール機能が有効かチェック
      if (!SchemaValidator.shouldUsePool(data)) {
        return { success: false, error: { 
          type: 'POOL_NOT_ENABLED', 
          typeId: omikujiTypeId 
        } };
      }

      // カテゴリプールからコンテンツを取得
      const categoryName = category.getDisplayName() as CategoryName;
      const categoryPool = data.categoryPools?.[categoryName];
      
      if (!categoryPool || !categoryPool[emotionAttribute]) {
        // カテゴリまたは感情属性が存在しない場合は空配列を返す
        return { success: true, data: [] };
      }

      const contents = categoryPool[emotionAttribute] || [];
      return { success: true, data: contents };

    } catch (error) {
      return { success: false, error: { 
        type: 'PARSE_ERROR', 
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      } };
    }
  }

  async findAllByType(
    omikujiTypeId: string
  ): Promise<Result<CategoryPoolData, CategoryPoolRepositoryError>> {
    try {
      const filePath = this.getFilePath(omikujiTypeId);
      
      // ファイル存在確認
      try {
        await fs.access(filePath);
      } catch {
        return { success: false, error: { type: 'FILE_NOT_FOUND', typeId: omikujiTypeId } };
      }

      // ファイル読み込みとパース
      const parseResult = await this.parseJsonFile(filePath);
      if (!parseResult.success) {
        return { success: false, error: parseResult.error };
      }

      const data = parseResult.data;

      // CategoryPoolData形式に変換
      const poolData: CategoryPoolData = {
        omikujiTypeId: data.omikujiTypeId,
        pools: this.convertToPoolFormat(data.categoryPools),
        metadata: {
          lastUpdated: data.metadata.lastUpdated,
          contentVersion: data.metadata.contentVersion,
          totalItems: this.calculateTotalItems(data.categoryPools)
        }
      };

      return { success: true, data: poolData };

    } catch (error) {
      return { success: false, error: { 
        type: 'PARSE_ERROR', 
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      } };
    }
  }

  async updatePool(
    omikujiTypeId: string,
    poolData: CategoryPoolData
  ): Promise<Result<void, CategoryPoolRepositoryError>> {
    try {
      const filePath = this.getFilePath(omikujiTypeId);

      // ExtendedOmikujiResultData形式に変換
      const extendedData: ExtendedOmikujiResultData = {
        omikujiTypeId: poolData.omikujiTypeId,
        categoryPools: this.convertFromPoolFormat(poolData.pools),
        metadata: {
          ...poolData.metadata,
          poolEnabled: true
        }
      };

      // JSONとして書き込み
      const jsonContent = JSON.stringify(extendedData, null, 2);
      await fs.writeFile(filePath, jsonContent, 'utf-8');

      return { success: true, data: undefined };

    } catch (error) {
      return { success: false, error: { 
        type: 'WRITE_ERROR', 
        message: `Failed to write pool data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      } };
    }
  }

  /**
   * ファイルパスを生成
   */
  private getFilePath(omikujiTypeId: string): string {
    return path.join(this.dataDirectory, `${omikujiTypeId}.json`);
  }

  /**
   * JSONファイルを安全にパース
   */
  private async parseJsonFile(filePath: string): Promise<Result<ExtendedOmikujiResultData, CategoryPoolRepositoryError>> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent) as ExtendedOmikujiResultData;
      return { success: true, data };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { success: false, error: { 
          type: 'PARSE_ERROR', 
          message: `Invalid JSON format: ${error.message}` 
        } };
      }
      return { success: false, error: { 
        type: 'PARSE_ERROR', 
        message: `File read error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      } };
    }
  }

  /**
   * ExtendedOmikujiResultData.categoryPools を CategoryPoolData.pools 形式に変換
   */
  private convertToPoolFormat(
    categoryPools: ExtendedOmikujiResultData['categoryPools']
  ): CategoryPoolData['pools'] {
    if (!categoryPools) {
      return {};
    }

    const pools: CategoryPoolData['pools'] = {};
    
    for (const [categoryName, emotionPools] of Object.entries(categoryPools)) {
      if (emotionPools) {
        pools[categoryName] = {
          positive: emotionPools.positive || [],
          neutral: emotionPools.neutral || [],
          negative: emotionPools.negative || []
        };
      }
    }

    return pools;
  }

  /**
   * CategoryPoolData.pools を ExtendedOmikujiResultData.categoryPools 形式に変換
   */
  private convertFromPoolFormat(
    pools: CategoryPoolData['pools']
  ): ExtendedOmikujiResultData['categoryPools'] {
    const categoryPools: ExtendedOmikujiResultData['categoryPools'] = {};

    for (const [categoryName, emotionPools] of Object.entries(pools)) {
      const typedCategoryName = categoryName as CategoryName;
      categoryPools[typedCategoryName] = {
        positive: emotionPools.positive,
        neutral: emotionPools.neutral,
        negative: emotionPools.negative
      };
    }

    return categoryPools;
  }

  /**
   * プール内の総アイテム数を計算
   */
  private calculateTotalItems(
    categoryPools: ExtendedOmikujiResultData['categoryPools']
  ): number {
    if (!categoryPools) {
      return 0;
    }

    let totalItems = 0;
    
    for (const emotionPools of Object.values(categoryPools)) {
      if (emotionPools) {
        totalItems += emotionPools.positive?.length || 0;
        totalItems += emotionPools.neutral?.length || 0;
        totalItems += emotionPools.negative?.length || 0;
      }
    }

    return totalItems;
  }
}