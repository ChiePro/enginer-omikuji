import { IEnhancedEmotionAttributeCalculator, Result, CategoryEmotionError, CategoryEmotionStats, EnhancedEmotionDistribution } from './IEnhancedEmotionAttributeCalculator';
import { EmotionAttribute } from '../valueObjects/EmotionAttribute';
import { EmotionAttributeDistribution } from '../valueObjects/EmotionAttributeDistribution';
import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { CategoryContent, EmotionAttribute as EmotionAttributeType } from '../../infrastructure/repositories/json/ExtendedJsonSchema';
import { WeightedRandomSelector } from '../../infrastructure/services/WeightedRandomSelector';
import seedrandom from 'seedrandom';

/**
 * 拡張感情属性計算サービス
 * 
 * カテゴリレベルでの感情属性制御、大吉・大凶での完全選択、最適化された確率分布計算を提供
 */
export class EnhancedEmotionAttributeCalculator implements IEnhancedEmotionAttributeCalculator {
  
  /**
   * カテゴリレベルでの感情属性ベースコンテンツ選択
   */
  async selectCategoryContentByEmotion(
    category: FortuneCategory,
    fortune: Fortune,
    contentPool: CategoryContent[],
    targetEmotion: EmotionAttributeType
  ): Promise<Result<CategoryContent, CategoryEmotionError>> {
    try {
      // 空のコンテンツプールチェック
      if (contentPool.length === 0) {
        return {
          success: false,
          error: {
            type: 'NO_CONTENT_AVAILABLE',
            category: category.getDisplayName()
          }
        };
      }

      // ターゲット感情に分類されるコンテンツを特定
      const matchingContents = contentPool.filter(content => 
        this.classifyContentEmotion(content) === targetEmotion
      );

      let selectedContents: CategoryContent[];
      
      if (matchingContents.length > 0) {
        selectedContents = matchingContents;
      } else {
        // フォールバック: 任意の利用可能コンテンツ
        selectedContents = contentPool;
      }

      // 重み付きランダム選択
      const selector = new WeightedRandomSelector<CategoryContent>();
      const weightedItems = selectedContents.map(content => ({
        item: content,
        weight: content.weight || 1.0
      }));

      const buildResult = selector.build(weightedItems);
      if (!buildResult.success) {
        return {
          success: false,
          error: {
            type: 'CONTENT_CLASSIFICATION_ERROR',
            contentId: 'weight-selection-failed'
          }
        };
      }

      const selectionResult = selector.select();
      if (!selectionResult.success) {
        // 最終的なフォールバック
        return { success: true, data: selectedContents[0] };
      }

      return { success: true, data: selectionResult.data };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'CONTENT_CLASSIFICATION_ERROR',
          contentId: `error: ${error instanceof Error ? error.message : 'unknown'}`
        }
      };
    }
  }

  /**
   * 運勢に基づくターゲット感情属性の選択
   */
  selectTargetEmotionForFortune(
    fortune: Fortune,
    seed?: string
  ): EmotionAttributeType {
    const fortuneValue = fortune.getValue();

    // 大吉・大凶での完全選択
    if (fortuneValue >= 4) { // 大吉
      return 'positive';
    }
    if (fortuneValue <= -2) { // 大凶
      return 'negative';
    }

    // 通常の確率分布選択
    const distribution = EmotionAttributeDistribution.forFortuneLevel(fortuneValue);
    
    const randomValue = seed ? seedrandom(seed)() : Math.random();
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
        return 'positive';
    }
  }

  /**
   * カテゴリの感情属性統計取得
   */
  async getCategoryEmotionStats(
    category: FortuneCategory,
    contentPool: CategoryContent[]
  ): Promise<Result<CategoryEmotionStats, CategoryEmotionError>> {
    try {
      const breakdown = { positive: 0, neutral: 0, negative: 0 };
      let totalWeight = 0;

      for (const content of contentPool) {
        const emotion = this.classifyContentEmotion(content);
        breakdown[emotion]++;
        totalWeight += (content.weight || 1.0);
      }

      const averageWeight = contentPool.length > 0 ? totalWeight / contentPool.length : 0;

      return {
        success: true,
        data: {
          category: category.getDisplayName(),
          totalContent: contentPool.length,
          emotionBreakdown: breakdown,
          averageWeight
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'CONTENT_CLASSIFICATION_ERROR',
          contentId: `stats-error: ${error instanceof Error ? error.message : 'unknown'}`
        }
      };
    }
  }

  /**
   * 拡張された感情属性分布情報の取得
   */
  getEnhancedEmotionDistribution(fortune: Fortune): EnhancedEmotionDistribution {
    const fortuneValue = fortune.getValue();
    const fortuneLevel = fortune.getJapaneseName();
    
    // 極端レベル判定
    const isExtremeLevel = fortuneValue >= 4 || fortuneValue <= -2;
    let guaranteedEmotion: EmotionAttributeType | undefined;

    if (fortuneValue >= 4) {
      guaranteedEmotion = 'positive';
    } else if (fortuneValue <= -2) {
      guaranteedEmotion = 'negative';
    }

    // 基本分布取得
    const distribution = EmotionAttributeDistribution.forFortuneLevel(fortuneValue);

    return {
      fortuneLevel,
      isExtremeLevel,
      guaranteedEmotion,
      distribution: {
        positive: distribution.getPositiveProbability(),
        neutral: distribution.getNeutralProbability(),
        negative: distribution.getNegativeProbability()
      }
    };
  }

  /**
   * コンテンツの感情属性を分類
   */
  private classifyContentEmotion(content: CategoryContent): EmotionAttributeType {
    // メタデータに感情属性が含まれている場合
    if (content.metadata && content.metadata.emotionAttribute) {
      const emotion = content.metadata.emotionAttribute as string;
      if (emotion === 'positive' || emotion === 'neutral' || emotion === 'negative') {
        return emotion as EmotionAttributeType;
      }
    }

    // コンテンツ内容から感情属性を推定（ヒューリスティック分析）
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
      '急上昇', '獲得', '承認', '称賛', '出会い', '発展', 'チャンス', '活躍',
      '実現', '達成', '勝利', '栄光', '充実', '満足', '輝く', '繁栄',
      'ポジティブ', '前進', '成長', '改善', '増加', '拡大'
    ];
    return positiveKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * ネガティブキーワードの判定
   */
  private containsNegativeKeywords(text: string): boolean {
    const negativeKeywords = [
      '失敗', '悪い', 'ひどい', '最悪', '不幸', '悲しみ', '停滞', '低下',
      '急落', '失う', '拒否', '批判', '別れ', '困難', '危険', '挫折',
      '損失', '破綻', '後退', '減少', '悪化', '混乱', '絶望', '苦痛',
      'ネガティブ', '問題', 'トラブル', '障害', '遅延', '中止'
    ];
    return negativeKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * 決定論的感情選択（テスト用）
   */
  selectEmotionDeterministic(
    fortune: Fortune,
    randomSeed: string
  ): EmotionAttributeType {
    return this.selectTargetEmotionForFortune(fortune, randomSeed);
  }

  /**
   * カテゴリレベル確率制御の最適化情報
   */
  getOptimizationInfo(fortune: Fortune): {
    useOptimizedPath: boolean;
    processingStrategy: 'guaranteed' | 'probabilistic' | 'weighted';
    estimatedPerformance: 'high' | 'medium' | 'low';
  } {
    const fortuneValue = fortune.getValue();

    if (fortuneValue >= 4 || fortuneValue <= -2) {
      return {
        useOptimizedPath: true,
        processingStrategy: 'guaranteed',
        estimatedPerformance: 'high'
      };
    } else if (Math.abs(fortuneValue) <= 1) {
      return {
        useOptimizedPath: false,
        processingStrategy: 'probabilistic',
        estimatedPerformance: 'medium'
      };
    } else {
      return {
        useOptimizedPath: true,
        processingStrategy: 'weighted',
        estimatedPerformance: 'high'
      };
    }
  }
}