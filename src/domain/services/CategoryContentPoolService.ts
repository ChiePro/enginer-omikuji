import { 
  ICategoryContentPoolService, 
  CategoryContentWithEmotion,
  PoolError, 
  Result 
} from './ICategoryContentPoolService';
import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { Fortune } from '../valueObjects/Fortune';
import { EmotionAttribute } from '../valueObjects/EmotionAttribute';
import { EmotionAttributeDistribution } from '../valueObjects/EmotionAttributeDistribution';
import { ICategoryPoolRepository, CategoryPoolData } from '../repositories/ICategoryPoolRepository';
import { CategoryContent, EmotionAttribute as EmotionAttributeType } from '../../infrastructure/repositories/json/ExtendedJsonSchema';
import { WeightedRandomSelector } from '../../infrastructure/services/WeightedRandomSelector';

/**
 * カテゴリコンテンツプールサービス
 * 
 * 責務:
 * - 感情属性確率分布に基づくコンテンツ選択ロジック
 * - プール枯渇時のデフォルトコンテンツ提供機能
 * - 動的コンテンツ統合とプール拡張機能
 */
export class CategoryContentPoolService implements ICategoryContentPoolService {
  constructor(
    private readonly repository: ICategoryPoolRepository
  ) {}

  async selectCategoryContent(
    category: FortuneCategory,
    fortune: Fortune,
    omikujiTypeId: string,
    excludeContent?: string[]
  ): Promise<Result<CategoryContentWithEmotion, PoolError>> {
    try {
      // 1. 運勢値から感情属性分布を取得
      const distribution = EmotionAttributeDistribution.forFortuneLevel(fortune.getValue());
      
      // 2. 感情属性を確率的に選択
      const selectedEmotion = this.selectEmotionByDistribution(distribution);
      
      // 3. 選択された感情属性のコンテンツを取得
      const contentResult = await this.repository.findByTypeAndCategory(
        omikujiTypeId,
        category,
        selectedEmotion
      );

      if (!contentResult.success) {
        return {
          success: false,
          error: {
            type: 'REPOSITORY_ACCESS_ERROR',
            message: `Repository error: ${contentResult.error.type}`
          }
        };
      }

      let availableContents = contentResult.data;

      // 4. 除外コンテンツをフィルタリング
      if (excludeContent && excludeContent.length > 0) {
        availableContents = availableContents.filter(
          content => !excludeContent.includes(content.id)
        );
      }

      // 5. プール枯渇時のフォールバック処理
      if (availableContents.length === 0) {
        const fallbackContent = this.createFallbackContent(
          category,
          selectedEmotion,
          omikujiTypeId
        );
        return { 
          success: true, 
          data: { 
            content: fallbackContent, 
            emotionAttribute: selectedEmotion 
          } 
        };
      }

      // 6. 重み付きランダム選択
      const selectedContent = this.selectContentByWeight(availableContents);

      return { 
        success: true, 
        data: { 
          content: selectedContent, 
          emotionAttribute: selectedEmotion 
        } 
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'REPOSITORY_ACCESS_ERROR',
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  async getAvailableContentCount(
    category: FortuneCategory,
    emotionAttribute: EmotionAttributeType,
    omikujiTypeId: string
  ): Promise<Result<number, PoolError>> {
    try {
      const contentResult = await this.repository.findByTypeAndCategory(
        omikujiTypeId,
        category,
        emotionAttribute
      );

      if (!contentResult.success) {
        return {
          success: false,
          error: {
            type: 'REPOSITORY_ACCESS_ERROR',
            message: `Repository error: ${contentResult.error.type}`
          }
        };
      }

      return { success: true, data: contentResult.data.length };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'REPOSITORY_ACCESS_ERROR',
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  async addContentToPool(
    content: CategoryContent,
    category: FortuneCategory,
    omikujiTypeId: string
  ): Promise<Result<void, PoolError>> {
    try {
      // 1. コンテンツ形式の検証
      const validationResult = this.validateContent(content);
      if (!validationResult.success) {
        return validationResult;
      }

      // 2. 既存プールデータを取得
      const poolResult = await this.repository.findAllByType(omikujiTypeId);
      if (!poolResult.success) {
        return {
          success: false,
          error: {
            type: 'REPOSITORY_ACCESS_ERROR',
            message: `Failed to get existing pool: ${poolResult.error.type}`
          }
        };
      }

      // 3. プールデータを更新
      const updatedPoolData = this.addContentToPoolData(
        poolResult.data,
        content,
        category,
        omikujiTypeId
      );

      // 4. 更新されたプールを保存
      const updateResult = await this.repository.updatePool(omikujiTypeId, updatedPoolData);
      if (!updateResult.success) {
        return {
          success: false,
          error: {
            type: 'REPOSITORY_ACCESS_ERROR',
            message: `Failed to update pool: ${updateResult.error.type}`
          }
        };
      }

      return { success: true, data: undefined };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'REPOSITORY_ACCESS_ERROR',
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  /**
   * 感情属性分布に基づいて感情属性を選択
   */
  private selectEmotionByDistribution(distribution: EmotionAttributeDistribution): EmotionAttributeType {
    const randomValue = Math.random();
    const selectedEmotion = distribution.selectEmotionAttribute(randomValue);
    
    // EmotionAttribute enum値をstring型に変換
    switch (selectedEmotion) {
      case EmotionAttribute.POSITIVE:
        return 'positive';
      case EmotionAttribute.NEUTRAL:
        return 'neutral';
      case EmotionAttribute.NEGATIVE:
        return 'negative';
      default:
        return 'positive'; // デフォルトはpositive
    }
  }

  /**
   * 重み付きランダム選択（Alias Methodによる高性能実装）
   */
  private selectContentByWeight(contents: CategoryContent[]): CategoryContent {
    if (contents.length === 0) {
      throw new Error('No contents available for selection');
    }

    if (contents.length === 1) {
      return contents[0];
    }

    // WeightedRandomSelectorを使用した高性能選択
    const selector = new WeightedRandomSelector<CategoryContent>();
    const weightedItems = contents.map(content => ({
      item: content,
      weight: content.weight || 1.0
    }));
    
    const buildResult = selector.build(weightedItems);
    if (!buildResult.success) {
      // フォールバック: 最初のアイテムを返す
      return contents[0];
    }
    
    const selectionResult = selector.select();
    if (selectionResult.success) {
      return selectionResult.data;
    } else {
      // フォールバック: 最初のアイテムを返す
      return contents[0];
    }
  }

  /**
   * フォールバックコンテンツの生成
   */
  private createFallbackContent(
    category: FortuneCategory,
    emotionAttribute: EmotionAttributeType,
    omikujiTypeId: string
  ): CategoryContent {
    const categoryName = category.getDisplayName();
    const fallbackId = `fallback-${categoryName}-${emotionAttribute}-${Date.now()}`;
    
    const emotionText = emotionAttribute === 'positive' ? 'ポジティブ' : 
                      emotionAttribute === 'neutral' ? 'ニュートラル' : 'ネガティブ';
    
    return {
      id: fallbackId,
      content: `デフォルト${categoryName}（${emotionText}）コンテンツ`,
      weight: 1.0,
      metadata: {
        isFallback: true,
        generatedAt: new Date().toISOString(),
        omikujiTypeId
      }
    };
  }

  /**
   * コンテンツの検証
   */
  private validateContent(content: CategoryContent): Result<void, PoolError> {
    if (!content.id || content.id.trim() === '') {
      return {
        success: false,
        error: {
          type: 'INVALID_CONTENT_FORMAT',
          contentId: content.id || ''
        }
      };
    }

    if (!content.content || content.content.trim() === '') {
      return {
        success: false,
        error: {
          type: 'INVALID_CONTENT_FORMAT',
          contentId: content.id
        }
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * プールデータにコンテンツを追加
   */
  private addContentToPoolData(
    poolData: CategoryPoolData,
    content: CategoryContent,
    category: FortuneCategory,
    omikujiTypeId: string
  ): CategoryPoolData {
    const categoryName = category.getDisplayName();
    
    // プール構造がない場合は初期化
    if (!poolData.pools[categoryName]) {
      poolData.pools[categoryName] = {
        positive: [],
        neutral: [],
        negative: []
      };
    }

    // コンテンツの感情属性を推定（メタデータから、またはデフォルトでpositive）
    const emotionAttribute = this.inferEmotionAttribute(content);
    
    // 該当する感情属性にコンテンツを追加
    poolData.pools[categoryName][emotionAttribute].push(content);

    // メタデータを更新
    const updatedPoolData: CategoryPoolData = {
      ...poolData,
      metadata: {
        ...poolData.metadata,
        lastUpdated: new Date().toISOString(),
        totalItems: poolData.metadata.totalItems + 1
      }
    };

    return updatedPoolData;
  }

  /**
   * コンテンツの感情属性を推定
   */
  private inferEmotionAttribute(content: CategoryContent): EmotionAttributeType {
    // メタデータに感情属性が含まれている場合
    if (content.metadata && content.metadata.emotionAttribute) {
      const emotion = content.metadata.emotionAttribute as string;
      if (emotion === 'positive' || emotion === 'neutral' || emotion === 'negative') {
        return emotion as EmotionAttributeType;
      }
    }

    // コンテンツ内容から感情属性を推定（簡単なヒューリスティック）
    const contentText = content.content.toLowerCase();
    
    if (this.containsPositiveKeywords(contentText)) {
      return 'positive';
    } else if (this.containsNegativeKeywords(contentText)) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  /**
   * ポジティブキーワードの判定
   */
  private containsPositiveKeywords(text: string): boolean {
    const positiveKeywords = [
      '成功', '良い', '素晴らしい', '最高', '幸せ', '喜び', '順調', '向上', 
      '急上昇', '獲得', '承認', '称賛', '出会い', '発展', 'チャンス'
    ];
    return positiveKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * ネガティブキーワードの判定
   */
  private containsNegativeKeywords(text: string): boolean {
    const negativeKeywords = [
      '失敗', '悪い', 'ひどい', '最悪', '不幸', '悲しみ', '停滞', '低下',
      '急落', '失う', '拒否', '批判', '別れ', '困難', '危険'
    ];
    return negativeKeywords.some(keyword => text.includes(keyword));
  }
}