import { describe, expect, it, beforeEach, vi } from 'vitest';
import { CategoryRandomizationService } from './CategoryRandomizationService';
import { CategoryContentPoolService } from './CategoryContentPoolService';
import { SessionDuplicationGuardService } from './SessionDuplicationGuardService';
import { EnhancedEmotionAttributeCalculator } from './EnhancedEmotionAttributeCalculator';
import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { CategoryContent } from '../../infrastructure/repositories/json/ExtendedJsonSchema';

describe('CategoryRandomizationService', () => {
  let service: CategoryRandomizationService;
  let mockPoolService: CategoryContentPoolService;
  let mockSessionGuardService: SessionDuplicationGuardService;
  let mockEmotionCalculator: EnhancedEmotionAttributeCalculator;

  beforeEach(() => {
    // Mock dependencies
    mockPoolService = {
      selectCategoryContent: vi.fn(),
      getAvailableContentCount: vi.fn(),
      addContentToPool: vi.fn()
    } as any;

    mockSessionGuardService = {
      filterAvailableContent: vi.fn(),
      recordSelectedContent: vi.fn(),
      clearSession: vi.fn()
    } as any;

    mockEmotionCalculator = {
      selectCategoryContentByEmotion: vi.fn(),
      selectTargetEmotionForFortune: vi.fn(),
      getCategoryEmotionStats: vi.fn(),
      getEnhancedEmotionDistribution: vi.fn()
    } as any;

    service = new CategoryRandomizationService(
      mockPoolService,
      mockSessionGuardService,
      mockEmotionCalculator
    );
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
  const createCategoryContent = (id: string, content: string): CategoryContent => {
    return { id, content, weight: 1.0 };
  };

  describe('必須カテゴリ完全性保証', () => {
    it('常に5つの必須カテゴリを返す', async () => {
      const daikichiFortune = createFortune('daikichi', '大吉', 4);

      // Mock all required dependencies
      (mockEmotionCalculator.selectTargetEmotionForFortune as any)
        .mockReturnValue('positive');
      
      (mockPoolService.selectCategoryContent as any)
        .mockResolvedValue({
          success: true,
          data: createCategoryContent('test-content', 'テストコンテンツ')
        });

      const result = await service.randomizeCategories(daikichiFortune);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(5);
        
        const categoryNames = result.data.map(cat => cat.getDisplayName());
        expect(categoryNames).toContain('恋愛運');
        expect(categoryNames).toContain('仕事運');
        expect(categoryNames).toContain('健康運');
        expect(categoryNames).toContain('金運');
        expect(categoryNames).toContain('学業運');
      }
    });

    it('validateCategoryCompletenessで5つのカテゴリを検証する', () => {
      const completeCategories = FortuneCategory.getAllRequiredCategories();
      const result = service.validateCategoryCompleteness(completeCategories);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('不完全なカテゴリ配列では検証に失敗する', () => {
      const incompleteCategories = [
        FortuneCategory.createLove(),
        FortuneCategory.createWork()
      ]; // 3つ足りない

      const result = service.validateCategoryCompleteness(incompleteCategories);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INCOMPLETE_CATEGORIES');
      }
    });

    it('重複カテゴリを含む場合は検証に失敗する', () => {
      const duplicateCategories = [
        FortuneCategory.createLove(),
        FortuneCategory.createLove(), // 重複
        FortuneCategory.createWork(),
        FortuneCategory.createHealth(),
        FortuneCategory.createMoney()
      ];

      const result = service.validateCategoryCompleteness(duplicateCategories);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('DUPLICATE_CATEGORIES');
      }
    });
  });

  describe('メイン運勢に応じたカテゴリ組み合わせ生成', () => {
    it('大吉ではすべてのカテゴリでポジティブコンテンツを選択する', async () => {
      const daikichiFortune = createFortune('daikichi', '大吉', 4);

      (mockEmotionCalculator.selectTargetEmotionForFortune as any)
        .mockReturnValue('positive');

      const positiveContent = createCategoryContent('pos-content', 'ポジティブコンテンツ');
      (mockPoolService.selectCategoryContent as any)
        .mockResolvedValue({ success: true, data: positiveContent });

      const result = await service.randomizeCategories(daikichiFortune);

      expect(result.success).toBe(true);
      
      // すべてのカテゴリでselectCategoryContentが呼ばれることを確認
      expect(mockPoolService.selectCategoryContent).toHaveBeenCalledTimes(5);
      
      // 各カテゴリでポジティブ感情が選択されることを確認
      expect(mockEmotionCalculator.selectTargetEmotionForFortune)
        .toHaveBeenCalledWith(daikichiFortune, undefined);
    });

    it('大凶ではすべてのカテゴリでネガティブコンテンツを選択する', async () => {
      const daikyoFortune = createFortune('daikyo', '大凶', -2);

      (mockEmotionCalculator.selectTargetEmotionForFortune as any)
        .mockReturnValue('negative');

      const negativeContent = createCategoryContent('neg-content', 'ネガティブコンテンツ');
      (mockPoolService.selectCategoryContent as any)
        .mockResolvedValue({ success: true, data: negativeContent });

      const result = await service.randomizeCategories(daikyoFortune);

      expect(result.success).toBe(true);
      
      expect(mockPoolService.selectCategoryContent).toHaveBeenCalledTimes(5);
      expect(mockEmotionCalculator.selectTargetEmotionForFortune)
        .toHaveBeenCalledWith(daikyoFortune, undefined);
    });

    it('中程度の運勢では確率的な感情属性選択を行う', async () => {
      const kichiFortune = createFortune('kichi', '吉', 2);

      // 確率的選択をシミュレート
      (mockEmotionCalculator.selectTargetEmotionForFortune as any)
        .mockReturnValueOnce('positive')
        .mockReturnValueOnce('positive')
        .mockReturnValueOnce('neutral')
        .mockReturnValueOnce('positive')
        .mockReturnValueOnce('negative');

      const mockContent = createCategoryContent('test-content', 'テストコンテンツ');
      (mockPoolService.selectCategoryContent as any)
        .mockResolvedValue({ success: true, data: mockContent });

      const result = await service.randomizeCategories(kichiFortune);

      expect(result.success).toBe(true);
      expect(mockEmotionCalculator.selectTargetEmotionForFortune)
        .toHaveBeenCalledTimes(5);
    });
  });

  describe('セッション管理との協調制御', () => {
    it('セッションIDが提供された場合、重複制御を適用する', async () => {
      const sessionId = 'test-session-123';
      const fortune = createFortune('kichi', '吉', 2);

      (mockEmotionCalculator.selectTargetEmotionForFortune as any)
        .mockReturnValue('positive');

      const mockContent = createCategoryContent('content-1', 'コンテンツ1');
      (mockPoolService.selectCategoryContent as any)
        .mockResolvedValue({ success: true, data: mockContent });

      (mockSessionGuardService.recordSelectedContent as any)
        .mockResolvedValue({ success: true, data: undefined });

      const result = await service.randomizeCategories(fortune, sessionId);

      expect(result.success).toBe(true);
      
      // セッションに選択されたコンテンツが記録されることを確認
      expect(mockSessionGuardService.recordSelectedContent)
        .toHaveBeenCalledWith(sessionId, expect.any(Array));
    });

    it('セッション記録が失敗した場合、エラーを返す', async () => {
      const sessionId = 'failing-session';
      const fortune = createFortune('kichi', '吉', 2);

      (mockEmotionCalculator.selectTargetEmotionForFortune as any)
        .mockReturnValue('positive');

      const mockContent = createCategoryContent('content-1', 'コンテンツ1');
      (mockPoolService.selectCategoryContent as any)
        .mockResolvedValue({ success: true, data: mockContent });

      (mockSessionGuardService.recordSelectedContent as any)
        .mockResolvedValue({
          success: false,
          error: { type: 'SESSION_STORAGE_ERROR', message: 'Storage failed' }
        });

      const result = await service.randomizeCategories(fortune, sessionId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SESSION_GUARD_FAILURE');
        expect(result.error.sessionId).toBe(sessionId);
      }
    });

    it('セッションIDなしの場合、重複制御をスキップする', async () => {
      const fortune = createFortune('kichi', '吉', 2);

      (mockEmotionCalculator.selectTargetEmotionForFortune as any)
        .mockReturnValue('positive');

      const mockContent = createCategoryContent('content-1', 'コンテンツ1');
      (mockPoolService.selectCategoryContent as any)
        .mockResolvedValue({ success: true, data: mockContent });

      const result = await service.randomizeCategories(fortune);

      expect(result.success).toBe(true);
      
      // セッション関連メソッドが呼ばれないことを確認
      expect(mockSessionGuardService.recordSelectedContent)
        .not.toHaveBeenCalled();
    });
  });

  describe('プール管理との協調制御', () => {
    it('コンテンツプールが枯渇した場合、適切なエラーを返す', async () => {
      const fortune = createFortune('kichi', '吉', 2);

      (mockEmotionCalculator.selectTargetEmotionForFortune as any)
        .mockReturnValue('positive');

      (mockPoolService.selectCategoryContent as any)
        .mockResolvedValueOnce({ success: true, data: createCategoryContent('c1', 'コンテンツ1') })
        .mockResolvedValueOnce({
          success: false,
          error: { type: 'POOL_EXHAUSTED', category: '仕事運', emotionAttribute: 'positive' }
        });

      const result = await service.randomizeCategories(fortune);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INSUFFICIENT_CONTENT_POOL');
        expect(result.error.category).toBe('仕事運');
      }
    });

    it('すべてのカテゴリでコンテンツ選択が成功する場合', async () => {
      const fortune = createFortune('kichi', '吉', 2);

      (mockEmotionCalculator.selectTargetEmotionForFortune as any)
        .mockReturnValue('positive');

      // 各カテゴリで異なるコンテンツを返す
      (mockPoolService.selectCategoryContent as any)
        .mockResolvedValueOnce({ success: true, data: createCategoryContent('love-1', '恋愛コンテンツ') })
        .mockResolvedValueOnce({ success: true, data: createCategoryContent('work-1', '仕事コンテンツ') })
        .mockResolvedValueOnce({ success: true, data: createCategoryContent('health-1', '健康コンテンツ') })
        .mockResolvedValueOnce({ success: true, data: createCategoryContent('money-1', '金運コンテンツ') })
        .mockResolvedValueOnce({ success: true, data: createCategoryContent('study-1', '学業コンテンツ') });

      const result = await service.randomizeCategories(fortune);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(5);
        
        // 各カテゴリが適切なコンテンツを持つことを確認
        const loveCategory = result.data.find(cat => cat.getId() === 'love');
        expect(loveCategory?.getFortuneLevel()).toBe('恋愛コンテンツ');
      }
    });
  });

  describe('決定論的テストサポート', () => {
    it('シードが提供された場合、決定論的な結果を返す', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      const seed = 'deterministic-seed-123';

      (mockEmotionCalculator.selectTargetEmotionForFortune as any)
        .mockReturnValue('positive');

      const mockContent = createCategoryContent('seeded-content', 'シード付きコンテンツ');
      (mockPoolService.selectCategoryContent as any)
        .mockResolvedValue({ success: true, data: mockContent });

      const result1 = await service.randomizeCategories(fortune, undefined, seed);
      const result2 = await service.randomizeCategories(fortune, undefined, seed);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // 同じシードで同じ結果が得られることを確認
      if (result1.success && result2.success) {
        expect(result1.data.map(c => c.getId())).toEqual(result2.data.map(c => c.getId()));
      }

      // シードが感情計算機に渡されることを確認
      expect(mockEmotionCalculator.selectTargetEmotionForFortune)
        .toHaveBeenCalledWith(fortune, seed);
    });
  });

  describe('パフォーマンスと最適化', () => {
    it('大量のカテゴリランダム化を効率的に処理する', async () => {
      const fortune = createFortune('kichi', '吉', 2);

      (mockEmotionCalculator.selectTargetEmotionForFortune as any)
        .mockReturnValue('positive');

      const mockContent = createCategoryContent('content', 'コンテンツ');
      (mockPoolService.selectCategoryContent as any)
        .mockResolvedValue({ success: true, data: mockContent });

      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        await service.randomizeCategories(fortune);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;

      // 1回のランダム化が10ms以内で完了することを確認
      expect(averageTime).toBeLessThan(10);
    });
  });

  describe('エラーハンドリング', () => {
    it('感情属性分布エラーを適切にハンドリングする', async () => {
      const fortune = createFortune('invalid-fortune', '不正運勢', 999);

      (mockEmotionCalculator.selectTargetEmotionForFortune as any)
        .mockImplementation(() => {
          throw new Error('Invalid fortune value: 999');
        });

      const result = await service.randomizeCategories(fortune);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('EMOTION_DISTRIBUTION_ERROR');
        expect(result.error.fortuneValue).toBe(999);
      }
    });
  });
});