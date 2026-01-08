import { describe, expect, it, beforeEach, vi } from 'vitest';
import { CategoryContentPoolService } from './CategoryContentPoolService';
import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { EmotionAttributeDistribution } from '../valueObjects/EmotionAttributeDistribution';
import { ICategoryPoolRepository } from '../repositories/ICategoryPoolRepository';
import { CategoryContent, EmotionAttribute } from '../../infrastructure/repositories/json/ExtendedJsonSchema';

// Mock dependencies
const mockRepository: ICategoryPoolRepository = {
  findByTypeAndCategory: vi.fn(),
  findAllByType: vi.fn(),
  updatePool: vi.fn()
};

describe('CategoryContentPoolService', () => {
  let service: CategoryContentPoolService;
  let testFortune: Fortune;
  let testCategory: FortuneCategory;

  beforeEach(() => {
    service = new CategoryContentPoolService(mockRepository);
    vi.clearAllMocks();
    
    // Create test data
    testFortune = Fortune.fromData({
      id: 'daikichi',
      englishName: 'Great Blessing',
      japaneseName: '大吉',
      description: '最高の運勢',
      probability: 0.1,
      value: 4, // 大吉は value 4 (100% positive)
      color: { primary: '#ff0000', secondary: '#ffaaaa', background: '#fff0f0' },
      effects: { glow: true, sparkle: true, animation: 'bounce' }
    });
    
    const categoryResult = FortuneCategory.create('love', '恋愛運', '恋愛に関する運勢');
    testCategory = categoryResult.value;
  });

  describe('selectCategoryContent', () => {
    it('感情属性確率分布に基づいてコンテンツを選択する', async () => {
      // 大吉（100）の場合、100% positive になる
      const mockContent: CategoryContent = {
        id: 'love-pos-001',
        content: 'ペアプロで距離が縮まる',
        weight: 1.0
      };

      (mockRepository.findByTypeAndCategory as any).mockResolvedValue({
        success: true,
        data: [mockContent]
      });

      const result = await service.selectCategoryContent(
        testCategory,
        testFortune,
        'engineer-fortune'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('love-pos-001');
        expect(result.data.content).toBe('ペアプロで距離が縮まる');
      }
      
      // positive感情属性で検索されることを確認
      expect(mockRepository.findByTypeAndCategory).toHaveBeenCalledWith(
        'engineer-fortune',
        testCategory,
        'positive'
      );
    });

    it('プール枯渇時にデフォルトコンテンツを提供する', async () => {
      // プールが空の場合
      (mockRepository.findByTypeAndCategory as any).mockResolvedValue({
        success: true,
        data: []
      });

      const result = await service.selectCategoryContent(
        testCategory,
        testFortune,
        'engineer-fortune'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toMatch(/^fallback-/);
        expect(result.data.content).toContain('デフォルト');
      }
    });

    it('除外コンテンツを考慮してフィルタリングする', async () => {
      const mockContents: CategoryContent[] = [
        { id: 'content-1', content: 'コンテンツ1', weight: 1.0 },
        { id: 'content-2', content: 'コンテンツ2', weight: 1.0 },
        { id: 'content-3', content: 'コンテンツ3', weight: 1.0 }
      ];

      (mockRepository.findByTypeAndCategory as any).mockResolvedValue({
        success: true,
        data: mockContents
      });

      const excludeIds = ['content-1', 'content-3'];
      const result = await service.selectCategoryContent(
        testCategory,
        testFortune,
        'engineer-fortune',
        excludeIds
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('content-2');
        expect(excludeIds).not.toContain(result.data.id);
      }
    });

    it('リポジトリエラー時に適切なエラーを返す', async () => {
      (mockRepository.findByTypeAndCategory as any).mockResolvedValue({
        success: false,
        error: { type: 'FILE_NOT_FOUND', typeId: 'test-fortune' }
      });

      const result = await service.selectCategoryContent(
        testCategory,
        testFortune,
        'test-fortune'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('REPOSITORY_ACCESS_ERROR');
        expect(result.error.message).toContain('FILE_NOT_FOUND');
      }
    });

    it('除外後にコンテンツがない場合、フォールバックを提供する', async () => {
      const mockContents: CategoryContent[] = [
        { id: 'content-1', content: 'コンテンツ1', weight: 1.0 }
      ];

      (mockRepository.findByTypeAndCategory as any).mockResolvedValue({
        success: true,
        data: mockContents
      });

      // 唯一のコンテンツを除外
      const excludeIds = ['content-1'];
      const result = await service.selectCategoryContent(
        testCategory,
        testFortune,
        'engineer-fortune',
        excludeIds
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toMatch(/^fallback-/);
      }
    });
  });

  describe('getAvailableContentCount', () => {
    it('指定された感情属性のコンテンツ数を取得する', async () => {
      const mockContents: CategoryContent[] = [
        { id: '1', content: 'content1', weight: 1.0 },
        { id: '2', content: 'content2', weight: 1.0 },
        { id: '3', content: 'content3', weight: 1.0 }
      ];

      (mockRepository.findByTypeAndCategory as any).mockResolvedValue({
        success: true,
        data: mockContents
      });

      const result = await service.getAvailableContentCount(
        testCategory,
        'positive' as EmotionAttribute,
        'engineer-fortune'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(3);
      }

      expect(mockRepository.findByTypeAndCategory).toHaveBeenCalledWith(
        'engineer-fortune',
        testCategory,
        'positive'
      );
    });

    it('プールが空の場合、0を返す', async () => {
      (mockRepository.findByTypeAndCategory as any).mockResolvedValue({
        success: true,
        data: []
      });

      const result = await service.getAvailableContentCount(
        testCategory,
        'negative' as EmotionAttribute,
        'engineer-fortune'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0);
      }
    });

    it('リポジトリエラーを適切にハンドリングする', async () => {
      (mockRepository.findByTypeAndCategory as any).mockResolvedValue({
        success: false,
        error: { type: 'PARSE_ERROR', message: 'Invalid JSON' }
      });

      const result = await service.getAvailableContentCount(
        testCategory,
        'positive' as EmotionAttribute,
        'engineer-fortune'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('REPOSITORY_ACCESS_ERROR');
      }
    });
  });

  describe('addContentToPool', () => {
    it('新しいコンテンツをプールに追加する', async () => {
      const newContent: CategoryContent = {
        id: 'new-content-001',
        content: '新しいコンテンツ',
        weight: 1.0
      };

      // 既存データの取得をモック
      (mockRepository.findAllByType as any).mockResolvedValue({
        success: true,
        data: {
          omikujiTypeId: 'engineer-fortune',
          pools: {
            '恋愛運': {
              positive: [],
              neutral: [],
              negative: []
            }
          },
          metadata: {
            lastUpdated: '2024-01-01T00:00:00Z',
            contentVersion: '1.0.0',
            totalItems: 0
          }
        }
      });

      // プール更新をモック
      (mockRepository.updatePool as any).mockResolvedValue({
        success: true,
        data: undefined
      });

      const result = await service.addContentToPool(
        newContent,
        testCategory,
        'engineer-fortune'
      );

      expect(result.success).toBe(true);
      expect(mockRepository.updatePool).toHaveBeenCalledWith(
        'engineer-fortune',
        expect.objectContaining({
          omikujiTypeId: 'engineer-fortune',
          metadata: expect.objectContaining({
            totalItems: 1
          })
        })
      );
    });

    it('無効なコンテンツ形式の場合、エラーを返す', async () => {
      const invalidContent: CategoryContent = {
        id: '', // 無効なID
        content: '無効なコンテンツ',
        weight: 1.0
      };

      const result = await service.addContentToPool(
        invalidContent,
        testCategory,
        'engineer-fortune'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_CONTENT_FORMAT');
        expect(result.error.contentId).toBe('');
      }
    });

    it('プール更新失敗時にエラーを返す', async () => {
      const newContent: CategoryContent = {
        id: 'valid-content',
        content: '有効なコンテンツ',
        weight: 1.0
      };

      (mockRepository.findAllByType as any).mockResolvedValue({
        success: true,
        data: {
          omikujiTypeId: 'engineer-fortune',
          pools: {},
          metadata: { lastUpdated: '2024-01-01', contentVersion: '1.0', totalItems: 0 }
        }
      });

      (mockRepository.updatePool as any).mockResolvedValue({
        success: false,
        error: { type: 'WRITE_ERROR', message: 'Disk full' }
      });

      const result = await service.addContentToPool(
        newContent,
        testCategory,
        'engineer-fortune'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('REPOSITORY_ACCESS_ERROR');
      }
    });
  });

  describe('重み付き選択アルゴリズム', () => {
    it('重みに応じてコンテンツを選択する', async () => {
      const mockContents: CategoryContent[] = [
        { id: 'heavy-weight', content: 'ヘビー', weight: 10.0 },
        { id: 'light-weight', content: 'ライト', weight: 1.0 }
      ];

      (mockRepository.findByTypeAndCategory as any).mockResolvedValue({
        success: true,
        data: mockContents
      });

      // 複数回実行して統計的傾向を確認
      const selections: { [key: string]: number } = {};
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const result = await service.selectCategoryContent(
          testCategory,
          testFortune,
          'engineer-fortune'
        );

        if (result.success) {
          selections[result.data.id] = (selections[result.data.id] || 0) + 1;
        }
      }

      // 重みが10倍なので、heavy-weightが多く選ばれるはず
      expect(selections['heavy-weight'] || 0).toBeGreaterThan(selections['light-weight'] || 0);
    });
  });

  describe('感情属性分布による選択', () => {
    it('中吉の場合、適切な感情属性分布で選択される', async () => {
      const chuukichiFortune = Fortune.fromData({
        id: 'chuukichi',
        englishName: 'Middle Blessing',
        japaneseName: '中吉',
        description: '中程度の運勢',
        probability: 0.15,
        value: 3, // 中吉は value 3 (80% positive, 15% neutral, 5% negative)
        color: { primary: '#00ff00', secondary: '#aaffaa', background: '#f0fff0' },
        effects: { glow: false, sparkle: false, animation: null }
      });

      const positiveContent: CategoryContent = { id: 'pos', content: 'ポジティブ', weight: 1.0 };
      const neutralContent: CategoryContent = { id: 'neu', content: 'ニュートラル', weight: 1.0 };
      const negativeContent: CategoryContent = { id: 'neg', content: 'ネガティブ', weight: 1.0 };

      // 各感情属性に対してモックを設定
      (mockRepository.findByTypeAndCategory as any)
        .mockImplementation((typeId: string, category: FortuneCategory, emotion: EmotionAttribute) => {
          switch (emotion) {
            case 'positive':
              return Promise.resolve({ success: true, data: [positiveContent] });
            case 'neutral':
              return Promise.resolve({ success: true, data: [neutralContent] });
            case 'negative':
              return Promise.resolve({ success: true, data: [negativeContent] });
            default:
              return Promise.resolve({ success: true, data: [] });
          }
        });

      // 複数回実行して分布を確認
      const emotionCounts: { [key: string]: number } = {};
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const result = await service.selectCategoryContent(
          testCategory,
          chuukichiFortune,
          'engineer-fortune'
        );

        if (result.success) {
          const emotion = result.data.id.startsWith('pos') ? 'positive' : 
                         result.data.id.startsWith('neu') ? 'neutral' : 'negative';
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        }
      }

      // 中吉では positive > neutral > negative の順になることを期待
      expect(emotionCounts['positive'] || 0).toBeGreaterThan(emotionCounts['neutral'] || 0);
      expect(emotionCounts['neutral'] || 0).toBeGreaterThan(emotionCounts['negative'] || 0);
    });
  });
});