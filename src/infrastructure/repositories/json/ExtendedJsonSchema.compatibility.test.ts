import { describe, expect, it } from 'vitest';
import { ExtendedOmikujiResultData, SchemaValidator, CategoryContent, EmotionAttribute } from './ExtendedJsonSchema';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('ExtendedJsonSchema 下位互換性テスト', () => {
  describe('既存データ形式との互換性', () => {
    it('既存のJSONファイルがExtendedOmikujiResultData型として読み込める', async () => {
      // 既存のengineer-fortune.jsonを読み込んでテスト
      const filePath = path.join(process.cwd(), 'data', 'results', 'engineer-fortune.json');
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const existingData = JSON.parse(fileContent);
      
      // ExtendedOmikujiResultData型として扱える
      const extendedData: ExtendedOmikujiResultData = {
        ...existingData,
        metadata: {
          ...existingData.metadata,
          poolEnabled: false // 既存データはプール無効
        }
      };
      
      expect(extendedData.omikujiTypeId).toBe('engineer-fortune');
      expect(extendedData.results).toBeDefined();
      expect(SchemaValidator.isLegacyFormat(extendedData)).toBe(true);
      expect(SchemaValidator.shouldUsePool(extendedData)).toBe(false);
    });

    it('poolEnabledが未定義の場合、デフォルトでfalseとして扱われる', () => {
      const data: ExtendedOmikujiResultData = {
        omikujiTypeId: 'test-fortune',
        results: {
          daikichi: [{
            id: 'test-001',
            titlePhrase: 'テスト',
            description: 'テスト説明',
            emotionAttribute: 'positive',
            categories: []
          }]
        },
        metadata: {
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '1.0.0'
          // poolEnabledは未定義
        }
      };
      
      expect(data.metadata.poolEnabled).toBeUndefined();
      expect(SchemaValidator.shouldUsePool(data)).toBe(false);
      expect(SchemaValidator.isLegacyFormat(data)).toBe(true);
    });

    it('既存のカテゴリ構造がそのまま使用できる', () => {
      const legacyCategory = {
        name: '恋愛運' as const,
        content: 'ペアプロで距離が縮まる',
        emotionTone: 'positive' as const
      };
      
      const data: ExtendedOmikujiResultData = {
        omikujiTypeId: 'test',
        results: {
          daikichi: [{
            id: 'test-001',
            titlePhrase: 'タイトル',
            description: '説明',
            emotionAttribute: 'positive',
            categories: [legacyCategory]
          }]
        },
        metadata: {
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '1.0.0',
          poolEnabled: false
        }
      };
      
      expect(data.results!.daikichi[0].categories[0]).toEqual(legacyCategory);
    });
  });

  describe('新旧フォーマットの混在', () => {
    it('プール有効時でも既存データをフォールバックとして保持できる', () => {
      const hybridData: ExtendedOmikujiResultData = {
        omikujiTypeId: 'hybrid-fortune',
        
        // 既存フォーマット（フォールバック用）
        results: {
          daikichi: [{
            id: 'fallback-001',
            titlePhrase: 'フォールバック用',
            description: 'プールが空の場合に使用',
            emotionAttribute: 'positive',
            categories: []
          }]
        },
        
        // 新フォーマット（優先使用）
        categoryPools: {
          '恋愛運': {
            positive: [
              { id: 'pool-001', content: 'プールコンテンツ', weight: 1.0 }
            ],
            neutral: [],
            negative: []
          }
        },
        
        metadata: {
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '2.0.0',
          poolEnabled: true
        }
      };
      
      expect(hybridData.results).toBeDefined();
      expect(hybridData.categoryPools).toBeDefined();
      expect(SchemaValidator.shouldUsePool(hybridData)).toBe(true);
    });

    it('段階的移行が可能（一部カテゴリのみプール化）', () => {
      const transitionData: ExtendedOmikujiResultData = {
        omikujiTypeId: 'transition-fortune',
        
        results: {
          // 一部のカテゴリは既存形式で残る
          daikichi: [{
            id: 'legacy-001',
            titlePhrase: '既存',
            description: '説明',
            emotionAttribute: 'positive',
            categories: [
              {
                name: '健康運',
                content: '既存の健康運コンテンツ',
                emotionTone: 'positive'
              }
            ]
          }]
        },
        
        categoryPools: {
          // 一部カテゴリのみプール化
          '恋愛運': {
            positive: [{ id: 'love-001', content: '新プール', weight: 1.0 }],
            neutral: [],
            negative: []
          },
          '仕事運': {
            positive: [{ id: 'work-001', content: '新プール', weight: 1.0 }],
            neutral: [],
            negative: []
          }
          // 健康運、金運、学業運はプール未定義
        },
        
        metadata: {
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '1.5.0',
          poolEnabled: true
        }
      };
      
      expect(transitionData.categoryPools?.['恋愛運']).toBeDefined();
      expect(transitionData.categoryPools?.['健康運']).toBeUndefined();
    });
  });

  describe('SchemaValidatorユーティリティ', () => {
    it('プール統計情報を正しく計算する', () => {
      const data: ExtendedOmikujiResultData = {
        omikujiTypeId: 'test',
        categoryPools: {
          '恋愛運': {
            positive: [
              { id: '1', content: 'A', weight: 2.0 },
              { id: '2', content: 'B', weight: 1.0 }
            ],
            neutral: [
              { id: '3', content: 'C', weight: 1.0 }
            ],
            negative: []
          }
        },
        metadata: {
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '1.0.0',
          poolEnabled: true
        }
      };
      
      const stats = SchemaValidator.calculatePoolStatistics(data.categoryPools);
      
      expect(stats).toHaveLength(1);
      expect(stats[0].categoryName).toBe('恋愛運');
      expect(stats[0].totalItems).toBe(3);
      expect(stats[0].itemsByEmotion.positive).toBe(2);
      expect(stats[0].itemsByEmotion.neutral).toBe(1);
      expect(stats[0].itemsByEmotion.negative).toBe(0);
      expect(stats[0].averageWeight).toBeCloseTo(1.333, 2);
    });

    it('重みの正規化が正しく動作する', () => {
      const contents: CategoryContent[] = [
        { id: '1', content: 'A', weight: 10 },
        { id: '2', content: 'B', weight: 20 },
        { id: '3', content: 'C', weight: 30 }
      ];
      
      const normalized = SchemaValidator.normalizeWeights(contents);
      
      expect(normalized[0].weight).toBeCloseTo(0.167, 2); // 10/60
      expect(normalized[1].weight).toBeCloseTo(0.333, 2); // 20/60
      expect(normalized[2].weight).toBeCloseTo(0.500, 2); // 30/60
      
      // 合計が1.0になることを確認
      const total = normalized.reduce((sum, item) => sum + (item.weight || 0), 0);
      expect(total).toBeCloseTo(1.0, 5);
    });

    it('重みが未定義の場合、デフォルト値1.0として扱う', () => {
      const contents: CategoryContent[] = [
        { id: '1', content: 'A' }, // weight未定義
        { id: '2', content: 'B', weight: 2.0 },
        { id: '3', content: 'C' }  // weight未定義
      ];
      
      const normalized = SchemaValidator.normalizeWeights(contents);
      
      expect(normalized[0].weight).toBeCloseTo(0.25, 2); // 1/4
      expect(normalized[1].weight).toBeCloseTo(0.50, 2); // 2/4
      expect(normalized[2].weight).toBeCloseTo(0.25, 2); // 1/4
    });
  });

  describe('型安全性の確認', () => {
    it('感情属性の型が制限されている', () => {
      const validEmotions: EmotionAttribute[] = ['positive', 'neutral', 'negative'];
      
      validEmotions.forEach(emotion => {
        const pool: Record<EmotionAttribute, CategoryContent[]> = {
          positive: [],
          neutral: [],
          negative: []
        };
        
        expect(pool).toHaveProperty(emotion);
      });
    });

    it('カテゴリ名の型が制限されている', () => {
      const validCategories = ['恋愛運', '仕事運', '健康運', '金運', '学業運'] as const;
      
      const data: ExtendedOmikujiResultData = {
        omikujiTypeId: 'test',
        categoryPools: {
          '恋愛運': { positive: [], neutral: [], negative: [] },
          '仕事運': { positive: [], neutral: [], negative: [] },
          '健康運': { positive: [], neutral: [], negative: [] },
          '金運': { positive: [], neutral: [], negative: [] },
          '学業運': { positive: [], neutral: [], negative: [] }
        },
        metadata: {
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '1.0.0',
          poolEnabled: true
        }
      };
      
      validCategories.forEach(category => {
        expect(data.categoryPools).toHaveProperty(category);
      });
    });
  });
});