import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { JsonCategoryPoolRepository } from './JsonCategoryPoolRepository';
import { FortuneCategory } from '../../../domain/valueObjects/FortuneCategory';
import { EmotionAttribute, CategoryContent } from './ExtendedJsonSchema';

// fs/promisesをモック
vi.mock('fs/promises', () => ({
  access: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn()
}));

describe('JsonCategoryPoolRepository', () => {
  let repository: JsonCategoryPoolRepository;
  const mockDataDir = '/mock/data/results';

  beforeEach(() => {
    repository = new JsonCategoryPoolRepository();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('findByTypeAndCategory', () => {
    it('指定されたタイプ・カテゴリ・感情属性のコンテンツを取得する', async () => {
      // テストデータ
      const mockPoolData = {
        omikujiTypeId: 'engineer-fortune',
        categoryPools: {
          '恋愛運': {
            positive: [
              { id: 'love-pos-001', content: 'ペアプロで距離が縮まる', weight: 1.0 },
              { id: 'love-pos-002', content: 'GitHubのフォロワー急増', weight: 0.8 }
            ],
            neutral: [
              { id: 'love-neu-001', content: '普通の開発日和', weight: 1.0 }
            ],
            negative: [
              { id: 'love-neg-001', content: 'コードレビューで気まずい雰囲気', weight: 1.0 }
            ]
          }
        },
        metadata: {
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '2.0.0',
          poolEnabled: true
        }
      };

      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockPoolData));

      // カテゴリ値オブジェクトの作成
      const categoryResult = FortuneCategory.create('love', '恋愛運', '恋愛に関する運勢');
      expect(categoryResult.isSuccess()).toBe(true);
      const category = categoryResult.value;

      const result = await repository.findByTypeAndCategory(
        'engineer-fortune',
        category,
        'positive' as EmotionAttribute
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe('love-pos-001');
        expect(result.data[1].id).toBe('love-pos-002');
      }
    });

    it('ファイルが存在しない場合、FILE_NOT_FOUNDエラーを返す', async () => {
      (fs.access as any).mockRejectedValue(new Error('File not found'));

      const categoryResult = FortuneCategory.create('love', '恋愛運', '恋愛に関する運勢');
      const category = categoryResult.value;

      const result = await repository.findByTypeAndCategory(
        'non-existent-type',
        category,
        'positive' as EmotionAttribute
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FILE_NOT_FOUND');
        expect(result.error.typeId).toBe('non-existent-type');
      }
    });

    it('JSONパースエラーの場合、PARSE_ERRORを返す', async () => {
      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue('invalid json');

      const categoryResult = FortuneCategory.create('love', '恋愛運', '恋愛に関する運勢');
      const category = categoryResult.value;

      const result = await repository.findByTypeAndCategory(
        'engineer-fortune',
        category,
        'positive' as EmotionAttribute
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('PARSE_ERROR');
        expect(result.error.message).toContain('Invalid JSON');
      }
    });

    it('poolEnabledがfalseの場合、POOL_NOT_ENABLEDエラーを返す', async () => {
      const mockData = {
        omikujiTypeId: 'engineer-fortune',
        metadata: {
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '1.0.0',
          poolEnabled: false
        }
      };

      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockData));

      const categoryResult = FortuneCategory.create('love', '恋愛運', '恋愛に関する運勢');
      const category = categoryResult.value;

      const result = await repository.findByTypeAndCategory(
        'engineer-fortune',
        category,
        'positive' as EmotionAttribute
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('POOL_NOT_ENABLED');
      }
    });

    it('カテゴリが存在しない場合、空配列を返す', async () => {
      const mockData = {
        omikujiTypeId: 'engineer-fortune',
        categoryPools: {
          '仕事運': {
            positive: [{ id: 'work-001', content: 'テスト', weight: 1.0 }],
            neutral: [],
            negative: []
          }
        },
        metadata: {
          poolEnabled: true,
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '2.0.0'
        }
      };

      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockData));

      const categoryResult = FortuneCategory.create('love', '恋愛運', '恋愛に関する運勢');
      const category = categoryResult.value;

      const result = await repository.findByTypeAndCategory(
        'engineer-fortune',
        category,
        'positive' as EmotionAttribute
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('findAllByType', () => {
    it('指定されたタイプの全プールデータを取得する', async () => {
      const mockPoolData = {
        omikujiTypeId: 'engineer-fortune',
        categoryPools: {
          '恋愛運': {
            positive: [{ id: 'love-001', content: 'コンテンツ1', weight: 1.0 }],
            neutral: [],
            negative: []
          },
          '仕事運': {
            positive: [{ id: 'work-001', content: 'コンテンツ2', weight: 1.0 }],
            neutral: [],
            negative: []
          }
        },
        metadata: {
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '2.0.0',
          poolEnabled: true,
          totalItems: 2
        }
      };

      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockPoolData));

      const result = await repository.findAllByType('engineer-fortune');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.omikujiTypeId).toBe('engineer-fortune');
        expect(result.data.pools['恋愛運']).toBeDefined();
        expect(result.data.pools['仕事運']).toBeDefined();
        expect(result.data.metadata.totalItems).toBe(2);
      }
    });

    it('プール構造を持たないデータの場合、空のpoolsを返す', async () => {
      const mockData = {
        omikujiTypeId: 'legacy-fortune',
        results: {}, // レガシー構造
        metadata: {
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '1.0.0',
          poolEnabled: false
        }
      };

      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockData));

      const result = await repository.findAllByType('legacy-fortune');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.omikujiTypeId).toBe('legacy-fortune');
        expect(result.data.pools).toEqual({});
        expect(result.data.metadata.totalItems).toBe(0);
      }
    });
  });

  describe('updatePool', () => {
    it('プールデータを正常に更新する', async () => {
      const poolData = {
        omikujiTypeId: 'test-fortune',
        pools: {
          '恋愛運': {
            positive: [{ id: 'new-001', content: '新コンテンツ', weight: 1.0 }] as CategoryContent[],
            neutral: [] as CategoryContent[],
            negative: [] as CategoryContent[]
          }
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          contentVersion: '2.0.0',
          totalItems: 1
        }
      };

      (fs.writeFile as any).mockResolvedValue(undefined);

      const result = await repository.updatePool('test-fortune', poolData);

      expect(result.success).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-fortune.json'),
        expect.stringMatching(/"omikujiTypeId":\s*"test-fortune"/),
        'utf-8'
      );
    });

    it('書き込みエラーの場合、WRITE_ERRORを返す', async () => {
      const poolData = {
        omikujiTypeId: 'test-fortune',
        pools: {},
        metadata: {
          lastUpdated: new Date().toISOString(),
          contentVersion: '2.0.0',
          totalItems: 0
        }
      };

      (fs.writeFile as any).mockRejectedValue(new Error('Write failed'));

      const result = await repository.updatePool('test-fortune', poolData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('WRITE_ERROR');
        expect(result.error.message).toContain('Failed to write');
      }
    });
  });

  describe('3次元データアクセス', () => {
    it('おみくじタイプ×カテゴリ×感情属性の組み合わせで正確にデータを取得', async () => {
      const mockData = {
        omikujiTypeId: 'engineer-fortune',
        categoryPools: {
          '恋愛運': {
            positive: [{ id: 'ep-love-pos', content: 'エンジニア恋愛ポジティブ' }],
            neutral: [{ id: 'ep-love-neu', content: 'エンジニア恋愛ニュートラル' }],
            negative: [{ id: 'ep-love-neg', content: 'エンジニア恋愛ネガティブ' }]
          },
          '仕事運': {
            positive: [{ id: 'ep-work-pos', content: 'エンジニア仕事ポジティブ' }],
            neutral: [{ id: 'ep-work-neu', content: 'エンジニア仕事ニュートラル' }],
            negative: [{ id: 'ep-work-neg', content: 'エンジニア仕事ネガティブ' }]
          }
        },
        metadata: { poolEnabled: true, lastUpdated: '2024-01-01', contentVersion: '1.0' }
      };

      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockData));

      // 異なる組み合わせでテスト
      const loveCategory = FortuneCategory.create('love', '恋愛運', '恋愛に関する運勢').value;
      const workCategory = FortuneCategory.create('work', '仕事運', '仕事に関する運勢').value;

      // エンジニア × 恋愛運 × positive
      const result1 = await repository.findByTypeAndCategory('engineer-fortune', loveCategory, 'positive');
      expect(result1.success && result1.data[0].id).toBe('ep-love-pos');

      // エンジニア × 仕事運 × negative
      const result2 = await repository.findByTypeAndCategory('engineer-fortune', workCategory, 'negative');
      expect(result2.success && result2.data[0].id).toBe('ep-work-neg');
    });
  });
});