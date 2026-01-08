/**
 * 拡張JSONスキーマ定義
 * カテゴリプール機能をサポートする新しいデータ構造
 */

// 感情属性の型定義
export type EmotionAttribute = 'positive' | 'neutral' | 'negative';

// カテゴリ名の型定義
export type CategoryName = '恋愛運' | '仕事運' | '健康運' | '金運' | '学業運';

/**
 * カテゴリコンテンツの定義
 * プール内の個々のコンテンツ項目
 */
export interface CategoryContent {
  /** コンテンツの一意識別子 */
  id: string;
  
  /** 表示するコンテンツ文字列 */
  content: string;
  
  /** 選択確率の重み（デフォルト: 1.0） */
  weight?: number;
  
  /** 追加のメタデータ（タグ、著者、難易度など） */
  metadata?: Record<string, unknown>;
}

/**
 * 既存の結果データ構造（下位互換性のため維持）
 */
interface LegacyResultItem {
  id: string;
  titlePhrase: string;
  description: string;
  emotionAttribute: EmotionAttribute;
  categories: Array<{
    name: CategoryName;
    content: string;
    emotionTone: EmotionAttribute;
  }>;
}

/**
 * 拡張されたメタデータ構造
 */
export interface ExtendedMetadata {
  /** 最終更新日時 */
  lastUpdated: string;
  
  /** コンテンツバージョン */
  contentVersion: string;
  
  /** カテゴリプール機能の有効/無効（デフォルト: false） */
  poolEnabled?: boolean;
  
  /** プール内の総アイテム数（統計情報） */
  totalPoolItems?: number;
  
  /** その他の拡張可能なメタデータ */
  [key: string]: unknown;
}

/**
 * 拡張されたおみくじ結果データ構造
 * 既存構造との下位互換性を保ちながら、カテゴリプール機能を追加
 */
export interface ExtendedOmikujiResultData {
  /** おみくじタイプの識別子 */
  omikujiTypeId: string;
  
  /**
   * 既存の固定結果データ（オプショナル）
   * poolEnabledがfalseまたは未定義の場合に使用
   */
  results?: {
    [fortuneId: string]: LegacyResultItem[];
  };
  
  /**
   * 新規: カテゴリ別コンテンツプール
   * カテゴリ名 → 感情属性 → コンテンツ配列のマッピング
   */
  categoryPools?: {
    [category in CategoryName]?: {
      [emotion in EmotionAttribute]: CategoryContent[];
    };
  };
  
  /** 拡張されたメタデータ */
  metadata: ExtendedMetadata;
}

/**
 * カテゴリプール統計情報
 */
export interface CategoryPoolStatistics {
  categoryName: CategoryName;
  totalItems: number;
  itemsByEmotion: {
    positive: number;
    neutral: number;
    negative: number;
  };
  averageWeight: number;
}

/**
 * スキーマバリデーションヘルパー
 */
export class SchemaValidator {
  /**
   * データがプール機能を使用すべきかどうかを判定
   */
  static shouldUsePool(data: ExtendedOmikujiResultData): boolean {
    return data.metadata.poolEnabled === true && data.categoryPools !== undefined;
  }
  
  /**
   * レガシーデータ形式かどうかを判定
   */
  static isLegacyFormat(data: ExtendedOmikujiResultData): boolean {
    return !data.metadata.poolEnabled && data.results !== undefined;
  }
  
  /**
   * カテゴリプールの統計情報を計算
   */
  static calculatePoolStatistics(
    categoryPools: ExtendedOmikujiResultData['categoryPools']
  ): CategoryPoolStatistics[] {
    if (!categoryPools) return [];
    
    const stats: CategoryPoolStatistics[] = [];
    
    for (const [categoryName, emotionPools] of Object.entries(categoryPools)) {
      if (!emotionPools) continue;
      
      let totalItems = 0;
      let totalWeight = 0;
      const itemsByEmotion = {
        positive: 0,
        neutral: 0,
        negative: 0
      };
      
      for (const [emotion, contents] of Object.entries(emotionPools)) {
        const emotionKey = emotion as EmotionAttribute;
        itemsByEmotion[emotionKey] = contents.length;
        totalItems += contents.length;
        
        totalWeight += contents.reduce((sum, item) => sum + (item.weight || 1.0), 0);
      }
      
      stats.push({
        categoryName: categoryName as CategoryName,
        totalItems,
        itemsByEmotion,
        averageWeight: totalItems > 0 ? totalWeight / totalItems : 0
      });
    }
    
    return stats;
  }
  
  /**
   * 重みを正規化（合計が1.0になるように調整）
   */
  static normalizeWeights(contents: CategoryContent[]): CategoryContent[] {
    if (contents.length === 0) return [];
    
    const totalWeight = contents.reduce((sum, item) => sum + (item.weight || 1.0), 0);
    
    if (totalWeight <= 0) {
      throw new Error('Total weight must be positive');
    }
    
    return contents.map(item => ({
      ...item,
      weight: (item.weight || 1.0) / totalWeight
    }));
  }
}