import { describe, it, expect, beforeEach } from 'vitest';
import { EnhancedEmotionAttributeCalculator } from './EnhancedEmotionAttributeCalculator';
import { EmotionAttribute } from '../valueObjects/EmotionAttribute';
import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { CategoryContent } from '../../infrastructure/repositories/json/ExtendedJsonSchema';

describe('EnhancedEmotionAttributeCalculator', () => {
  let calculator: EnhancedEmotionAttributeCalculator;
  let testCategory: FortuneCategory;

  beforeEach(() => {
    calculator = new EnhancedEmotionAttributeCalculator();
    const categoryResult = FortuneCategory.create('love', '恋愛運', '恋愛に関する運勢');
    testCategory = categoryResult.value;
  });

  // Helper to create fortune with specific value
  const createFortune = (id: string, japaneseName: string, value: number): Fortune => {
    return Fortune.fromData({
      id,
      englishName: id,
      japaneseName,
      description: `${japaneseName}の運勢`,
      probability: 0.1,
      value,
      color: { primary: '#000000', secondary: '#ffffff', background: '#f0f0f0' },
      effects: { glow: false, sparkle: false, animation: null }
    });
  };

  // Helper to create category content
  const createCategoryContent = (id: string, content: string, weight: number = 1.0): CategoryContent => {
    return { id, content, weight };
  };

  describe('カテゴリレベル感情属性選択', () => {
    it('大吉（value >= 4）の場合、100%ポジティブコンテンツを選択する', async () => {
      const daikichiFortune = createFortune('daikichi', '大吉', 4);
      const contentPool: CategoryContent[] = [
        createCategoryContent('pos-1', 'ポジティブコンテンツ1'),
        createCategoryContent('neu-1', 'ニュートラルコンテンツ1'),
        createCategoryContent('neg-1', 'ネガティブコンテンツ1')
      ];

      const result = await calculator.selectCategoryContentByEmotion(
        testCategory,
        daikichiFortune,
        contentPool,
        'positive'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('pos-1');
      }
    });

    it('大凶（value <= -2）の場合、100%ネガティブコンテンツを選択する', async () => {
      const daikyoFortune = createFortune('daikyo', '大凶', -2);
      const contentPool: CategoryContent[] = [
        createCategoryContent('pos-1', 'ポジティブコンテンツ1'),
        createCategoryContent('neu-1', 'ニュートラルコンテンツ1'),
        createCategoryContent('neg-1', 'ネガティブコンテンツ1')
      ];

      const result = await calculator.selectCategoryContentByEmotion(
        testCategory,
        daikyoFortune,
        contentPool,
        'negative'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('neg-1');
      }
    });

    it('中吉（value = 3）では適切な確率分布で選択する', async () => {
      const chuukichiFortune = createFortune('chuukichi', '中吉', 3);
      const contentPool: CategoryContent[] = [
        ...Array.from({ length: 8 }, (_, i) => createCategoryContent(`pos-${i}`, `ポジティブ${i}`)),
        ...Array.from({ length: 2 }, (_, i) => createCategoryContent(`neu-${i}`, `ニュートラル${i}`)),
        createCategoryContent('neg-1', 'ネガティブ1')
      ];

      const selections = { positive: 0, neutral: 0, negative: 0 };
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const targetEmotion = calculator.selectTargetEmotionForFortune(chuukichiFortune);
        selections[targetEmotion]++;
      }

      const positiveRate = selections.positive / iterations;
      const neutralRate = selections.neutral / iterations;
      const negativeRate = selections.negative / iterations;

      // 中吉は80% positive, 15% neutral, 5% negative
      expect(positiveRate).toBeCloseTo(0.80, 0.05);
      expect(neutralRate).toBeCloseTo(0.15, 0.05);
      expect(negativeRate).toBeCloseTo(0.05, 0.05);
    });

    it('凶（value = -1）では適切な確率分布で選択する', async () => {
      const kyoFortune = createFortune('kyo', '凶', -1);

      const selections = { positive: 0, neutral: 0, negative: 0 };
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const targetEmotion = calculator.selectTargetEmotionForFortune(kyoFortune);
        selections[targetEmotion]++;
      }

      const positiveRate = selections.positive / iterations;
      const neutralRate = selections.neutral / iterations;
      const negativeRate = selections.negative / iterations;

      // 凶は15% positive, 25% neutral, 60% negative
      expect(positiveRate).toBeCloseTo(0.15, 0.05);
      expect(neutralRate).toBeCloseTo(0.25, 0.05);
      expect(negativeRate).toBeCloseTo(0.60, 0.05);
    });

    it('コンテンツが存在しない感情属性を指定した場合、フォールバックが動作する', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      const contentPool: CategoryContent[] = [
        createCategoryContent('pos-1', 'ポジティブのみ'),
        createCategoryContent('pos-2', 'ポジティブのみ2')
      ];

      // negative を要求するがコンテンツがない
      const result = await calculator.selectCategoryContentByEmotion(
        testCategory,
        fortune,
        contentPool,
        'negative'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // 利用可能な任意のコンテンツが返される
        expect(['pos-1', 'pos-2']).toContain(result.data.id);
      }
    });

    it('空のコンテンツプールの場合、エラーを返す', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      const emptyPool: CategoryContent[] = [];

      const result = await calculator.selectCategoryContentByEmotion(
        testCategory,
        fortune,
        emptyPool,
        'positive'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NO_CONTENT_AVAILABLE');
      }
    });
  });

  describe('カテゴリレベル確率制御', () => {
    it('重み付きランダム選択が正しく動作する', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      const contentPool: CategoryContent[] = [
        createCategoryContent('heavy', 'ヘビーウェイト', 10.0),
        createCategoryContent('light', 'ライトウェイト', 1.0)
      ];

      const selections = { heavy: 0, light: 0 };
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const result = await calculator.selectCategoryContentByEmotion(
          testCategory,
          fortune,
          contentPool,
          'positive'
        );
        
        if (result.success) {
          if (result.data.id === 'heavy') {
            selections.heavy++;
          } else if (result.data.id === 'light') {
            selections.light++;
          }
        }
      }

      const heavyRate = selections.heavy / (selections.heavy + selections.light);
      
      // 重みが10:1なので、約90%がheavyになるはず
      expect(heavyRate).toBeGreaterThan(0.8);
      expect(heavyRate).toBeLessThan(0.95);
    });

    it('カテゴリレベルの感情属性統計を取得できる', async () => {
      const contentPool: CategoryContent[] = [
        createCategoryContent('pos-1', 'ポジティブ1'),
        createCategoryContent('pos-2', 'ポジティブ2'),
        createCategoryContent('neu-1', 'ニュートラル1'),
        createCategoryContent('neg-1', 'ネガティブ1')
      ];

      const result = await calculator.getCategoryEmotionStats(
        testCategory,
        contentPool
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalContent).toBe(4);
        expect(result.data.emotionBreakdown.positive).toBe(2);
        expect(result.data.emotionBreakdown.neutral).toBe(1);
        expect(result.data.emotionBreakdown.negative).toBe(1);
      }
    });
  });

  describe('最適化された感情属性分布計算', () => {
    it('決定論的選択モードで一貫した結果を返す', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      
      const result1 = calculator.selectTargetEmotionForFortune(fortune, 'test-seed-123');
      const result2 = calculator.selectTargetEmotionForFortune(fortune, 'test-seed-123');
      const result3 = calculator.selectTargetEmotionForFortune(fortune, 'test-seed-456');

      expect(result1).toBe(result2); // 同じシードで同じ結果
      expect(result1).not.toBe(result3); // 異なるシードで（おそらく）異なる結果
    });

    it('拡張された感情属性分布情報を提供する', () => {
      const fortune = createFortune('suekichi', '末吉', 0);
      
      const distribution = calculator.getEnhancedEmotionDistribution(fortune);

      expect(distribution.fortuneLevel).toBe('末吉');
      expect(distribution.isExtremeLevel).toBe(false);
      expect(distribution.distribution.positive).toBe(0.30);
      expect(distribution.distribution.neutral).toBe(0.50);
      expect(distribution.distribution.negative).toBe(0.20);
    });

    it('大吉では極端レベルフラグが設定される', () => {
      const daikichiFortune = createFortune('daikichi', '大吉', 4);
      
      const distribution = calculator.getEnhancedEmotionDistribution(daikichiFortune);

      expect(distribution.fortuneLevel).toBe('大吉');
      expect(distribution.isExtremeLevel).toBe(true);
      expect(distribution.guaranteedEmotion).toBe('positive');
    });

    it('大凶では極端レベルフラグが設定される', () => {
      const daikyoFortune = createFortune('daikyo', '大凶', -2);
      
      const distribution = calculator.getEnhancedEmotionDistribution(daikyoFortune);

      expect(distribution.fortuneLevel).toBe('大凶');
      expect(distribution.isExtremeLevel).toBe(true);
      expect(distribution.guaranteedEmotion).toBe('negative');
    });
  });

  describe('パフォーマンス最適化', () => {
    it('大量のコンテンツプールを効率的に処理する', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      const largeContentPool: CategoryContent[] = Array.from({ length: 10000 }, (_, i) => 
        createCategoryContent(`content-${i}`, `コンテンツ${i}`, Math.random() * 10)
      );

      const startTime = performance.now();
      
      const result = await calculator.selectCategoryContentByEmotion(
        testCategory,
        fortune,
        largeContentPool,
        'positive'
      );
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(100); // 100ms以内で完了
    });
  });
});