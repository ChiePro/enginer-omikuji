import { describe, expect, it } from 'vitest';
import { ExtendedOmikujiResultData, CategoryContent, EmotionAttribute } from './ExtendedJsonSchema';

describe('ExtendedJsonSchema', () => {
  describe('拡張JSONスキーマ構造', () => {
    it('カテゴリプール構造を含む拡張スキーマが有効である', () => {
      const extendedData: ExtendedOmikujiResultData = {
        omikujiTypeId: 'engineer-fortune',
        
        // 下位互換性のための既存構造（オプショナル）
        results: {
          daikichi: [{
            id: 'engineer-daikichi-001',
            titlePhrase: 'テスト用タイトル',
            description: 'テスト用説明',
            emotionAttribute: 'positive',
            categories: [
              {
                name: '恋愛運',
                content: '既存コンテンツ',
                emotionTone: 'positive'
              }
            ]
          }]
        },
        
        // 新規: カテゴリプール構造
        categoryPools: {
          '恋愛運': {
            positive: [
              {
                id: 'love-pos-001',
                content: 'ペアプロで距離が縮まる',
                weight: 1.0,
                metadata: { tags: ['programming', 'teamwork'] }
              },
              {
                id: 'love-pos-002',
                content: 'GitHubのフォロワー急増',
                weight: 0.8
              }
            ],
            neutral: [
              {
                id: 'love-neu-001',
                content: '普通の開発日和',
                weight: 1.0
              }
            ],
            negative: [
              {
                id: 'love-neg-001',
                content: 'コードレビューで気まずい雰囲気',
                weight: 1.0
              }
            ]
          },
          '仕事運': {
            positive: [{
              id: 'work-pos-001',
              content: 'コードレビューが一発承認',
              weight: 1.0
            }],
            neutral: [],
            negative: []
          }
        },
        
        // 拡張されたメタデータ
        metadata: {
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '1.0.0',
          poolEnabled: true,
          totalPoolItems: 5
        }
      };
      
      // スキーマが有効であることを確認
      expect(extendedData.omikujiTypeId).toBe('engineer-fortune');
      expect(extendedData.categoryPools).toBeDefined();
      expect(extendedData.metadata.poolEnabled).toBe(true);
    });

    it('感情属性別のコンテンツ配列が正しく定義される', () => {
      const categoryPool: Record<EmotionAttribute, CategoryContent[]> = {
        positive: [
          {
            id: 'cat-pos-001',
            content: 'ポジティブなコンテンツ',
            weight: 1.0
          }
        ],
        neutral: [
          {
            id: 'cat-neu-001',
            content: 'ニュートラルなコンテンツ',
            weight: 1.0
          }
        ],
        negative: [
          {
            id: 'cat-neg-001',
            content: 'ネガティブなコンテンツ',
            weight: 1.0
          }
        ]
      };
      
      // 各感情属性の配列が存在することを確認
      expect(categoryPool.positive).toHaveLength(1);
      expect(categoryPool.neutral).toHaveLength(1);
      expect(categoryPool.negative).toHaveLength(1);
      
      // コンテンツの構造が正しいことを確認
      expect(categoryPool.positive[0]).toHaveProperty('id');
      expect(categoryPool.positive[0]).toHaveProperty('content');
      expect(categoryPool.positive[0]).toHaveProperty('weight');
    });

    it('オプショナルなメタデータフィールドを持つ', () => {
      const content: CategoryContent = {
        id: 'content-001',
        content: 'エンジニア向けコンテンツ',
        weight: 1.0,
        metadata: {
          tags: ['coding', 'debugging'],
          author: 'system',
          difficulty: 'medium'
        }
      };
      
      expect(content.metadata).toBeDefined();
      expect(content.metadata?.tags).toContain('coding');
    });
  });

  describe('下位互換性の保証', () => {
    it('poolEnabledがfalseの場合、既存構造のみで動作する', () => {
      const legacyData: ExtendedOmikujiResultData = {
        omikujiTypeId: 'engineer-fortune',
        results: {
          daikichi: [{
            id: 'legacy-001',
            titlePhrase: '既存タイトル',
            description: '既存説明',
            emotionAttribute: 'positive',
            categories: []
          }]
        },
        metadata: {
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '1.0.0',
          poolEnabled: false
        }
        // categoryPoolsは未定義でOK
      };
      
      expect(legacyData.categoryPools).toBeUndefined();
      expect(legacyData.metadata.poolEnabled).toBe(false);
    });

    it('必須フィールドが既存構造と一致する', () => {
      const data: ExtendedOmikujiResultData = {
        omikujiTypeId: 'test-fortune',
        metadata: {
          lastUpdated: '2024-01-01T00:00:00Z',
          contentVersion: '1.0.0'
          // poolEnabledは省略可能（デフォルトfalse）
        }
      };
      
      // 最小限の必須フィールドで有効
      expect(data.omikujiTypeId).toBeDefined();
      expect(data.metadata.lastUpdated).toBeDefined();
      expect(data.metadata.contentVersion).toBeDefined();
    });
  });

  describe('スキーマバリデーション', () => {
    it('重みの合計が正規化可能であることを検証', () => {
      const contents: CategoryContent[] = [
        { id: '1', content: 'A', weight: 2.0 },
        { id: '2', content: 'B', weight: 3.0 },
        { id: '3', content: 'C', weight: 5.0 }
      ];
      
      const totalWeight = contents.reduce((sum, c) => sum + (c.weight || 1.0), 0);
      expect(totalWeight).toBeGreaterThan(0);
      
      // 正規化可能
      const normalized = contents.map(c => ({
        ...c,
        normalizedWeight: (c.weight || 1.0) / totalWeight
      }));
      
      const sumNormalized = normalized.reduce((sum, c) => sum + c.normalizedWeight, 0);
      expect(sumNormalized).toBeCloseTo(1.0, 5);
    });

    it('空のプール配列も有効である', () => {
      const emptyPool: Record<EmotionAttribute, CategoryContent[]> = {
        positive: [],
        neutral: [],
        negative: []
      };
      
      expect(emptyPool.positive).toEqual([]);
      expect(emptyPool.neutral).toEqual([]);
      expect(emptyPool.negative).toEqual([]);
    });
  });
});