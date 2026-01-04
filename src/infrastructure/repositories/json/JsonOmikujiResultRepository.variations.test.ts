import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';

/**
 * Task 6.1 Implementation Test: 結果バリエーションの追加
 * Tests to verify that each fortune type has at least 3 variations
 * across all omikuji types
 */

interface OmikujiResultData {
  omikujiTypeId: string;
  results: Record<string, any[]>;
  metadata: {
    fortuneTypes: Record<string, number>;
  };
}

const REQUIRED_OMIKUJI_TYPES = [
  'engineer-fortune',
  'tech-selection', 
  'debug-fortune',
  'code-review-fortune',
  'deploy-fortune'
];

const REQUIRED_FORTUNE_TYPES = [
  'daikichi',
  'chukichi', 
  'kichi',
  'shokichi',
  'kyo',
  'daikyo'
];

const MIN_VARIATIONS_PER_FORTUNE = 3;

describe('Task 6.1: おみくじ結果バリエーション要件検証', () => {
  let resultData: Record<string, OmikujiResultData> = {};

  beforeAll(async () => {
    // Load all result data files
    for (const omikujiType of REQUIRED_OMIKUJI_TYPES) {
      try {
        const filePath = path.join(process.cwd(), 'data', 'results', `${omikujiType}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        resultData[omikujiType] = JSON.parse(fileContent);
      } catch (error) {
        console.warn(`Failed to load ${omikujiType}.json:`, error);
      }
    }
  });

  describe('各おみくじタイプのバリエーション数検証', () => {
    REQUIRED_OMIKUJI_TYPES.forEach(omikujiType => {
      describe(`${omikujiType} のバリエーション要件`, () => {
        it('必須の運勢タイプが全て定義されている', () => {
          const data = resultData[omikujiType];
          expect(data).toBeDefined();
          
          for (const fortuneType of REQUIRED_FORTUNE_TYPES) {
            expect(data.results[fortuneType]).toBeDefined();
            expect(Array.isArray(data.results[fortuneType])).toBe(true);
          }
        });

        REQUIRED_FORTUNE_TYPES.forEach(fortuneType => {
          it(`${fortuneType} に最低${MIN_VARIATIONS_PER_FORTUNE}つの結果バリエーションがある`, () => {
            const data = resultData[omikujiType];
            const variations = data.results[fortuneType] || [];
            
            expect(variations.length).toBeGreaterThanOrEqual(MIN_VARIATIONS_PER_FORTUNE);
          });
        });
      });
    });
  });

  describe('感情属性分布の妥当性検証', () => {
    REQUIRED_OMIKUJI_TYPES.forEach(omikujiType => {
      it(`${omikujiType} の感情属性が適切に設定されている`, () => {
        const data = resultData[omikujiType];
        
        for (const [fortuneType, variations] of Object.entries(data.results)) {
          for (const result of variations) {
            // Each result should have a valid emotion attribute
            expect(['positive', 'neutral', 'negative']).toContain(result.emotionAttribute);
            
            // Categories should have consistent emotion tones
            expect(result.categories).toBeDefined();
            expect(Array.isArray(result.categories)).toBe(true);
            expect(result.categories.length).toBe(5); // 5 required categories
            
            for (const category of result.categories) {
              expect(['positive', 'neutral', 'negative']).toContain(category.emotionTone);
            }
          }
        }
      });
    });
  });

  describe('エンジニア特化コンテンツの検証', () => {
    REQUIRED_OMIKUJI_TYPES.forEach(omikujiType => {
      it(`${omikujiType} にエンジニア特有の表現が含まれている`, () => {
        const data = resultData[omikujiType];
        const engineerTerms = ['コード', 'バグ', 'デプロイ', 'リファクタ', 'マージ', 'プルリク', 'レビュー', 'CI/CD', 'フレームワーク'];
        
        for (const [fortuneType, variations] of Object.entries(data.results)) {
          for (const result of variations) {
            const combinedContent = result.titlePhrase + ' ' + result.description + 
              ' ' + result.categories.map((c: any) => c.content).join(' ');
            
            const hasEngineerTerms = engineerTerms.some(term => 
              combinedContent.includes(term)
            );
            
            expect(hasEngineerTerms).toBe(true);
          }
        }
      });
    });
  });
});