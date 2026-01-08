import { EmotionAttribute } from '../valueObjects/EmotionAttribute';
import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { CategoryContent, EmotionAttribute as EmotionAttributeType } from '../../infrastructure/repositories/json/ExtendedJsonSchema';

/**
 * 拡張感情属性計算サービスのインターフェース
 */
export interface IEnhancedEmotionAttributeCalculator {
  /**
   * カテゴリレベルでの感情属性ベースコンテンツ選択
   */
  selectCategoryContentByEmotion(
    category: FortuneCategory,
    fortune: Fortune,
    contentPool: CategoryContent[],
    targetEmotion: EmotionAttributeType
  ): Promise<Result<CategoryContent, CategoryEmotionError>>;

  /**
   * 運勢に基づくターゲット感情属性の選択
   */
  selectTargetEmotionForFortune(
    fortune: Fortune,
    seed?: string
  ): EmotionAttributeType;

  /**
   * カテゴリの感情属性統計取得
   */
  getCategoryEmotionStats(
    category: FortuneCategory,
    contentPool: CategoryContent[]
  ): Promise<Result<CategoryEmotionStats, CategoryEmotionError>>;

  /**
   * 拡張された感情属性分布情報の取得
   */
  getEnhancedEmotionDistribution(fortune: Fortune): EnhancedEmotionDistribution;
}

// Type definitions
export type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

export type CategoryEmotionError = 
  | { type: 'NO_CONTENT_AVAILABLE'; category: string }
  | { type: 'INVALID_EMOTION_TYPE'; emotion: string }
  | { type: 'CONTENT_CLASSIFICATION_ERROR'; contentId: string };

export interface CategoryEmotionStats {
  category: string;
  totalContent: number;
  emotionBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  averageWeight: number;
}

export interface EnhancedEmotionDistribution {
  fortuneLevel: string;
  isExtremeLevel: boolean;
  guaranteedEmotion?: EmotionAttributeType;
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}