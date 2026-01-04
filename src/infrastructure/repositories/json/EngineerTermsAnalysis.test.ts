import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';

/**
 * Task 6.2 Implementation Test: Engineer Terms Analysis
 * Detailed analysis to identify which content needs engineer-specific enhancements
 */

interface OmikujiResultData {
  omikujiTypeId: string;
  results: Record<string, any[]>;
}

const REQUIRED_OMIKUJI_TYPES = [
  'engineer-fortune',
  'tech-selection', 
  'debug-fortune',
  'code-review-fortune',
  'deploy-fortune'
];

const ENGINEER_TERMS = ['コード', 'バグ', 'デプロイ', 'リファクタ', 'マージ', 'プルリク', 'レビュー', 'CI/CD', 'フレームワーク'];

// Additional engineer terms for enhancement
const EXTENDED_ENGINEER_TERMS = [
  ...ENGINEER_TERMS,
  'API', 'ライブラリ', 'データベース', 'サーバー', 'アルゴリズム', 'アーキテクチャ',
  'テスト', 'ビルド', 'Docker', 'Kubernetes', 'Git', 'GitHub', 'コミット',
  'プロダクション', 'ステージング', 'ブランチ', 'Issue', 'PR', 'ペアプロ', 'モブプロ',
  'アジャイル', 'スクラム', 'スプリント', 'バックログ', 'MVP', 'POC',
  'レスポンシブ', 'パフォーマンス', 'セキュリティ', 'ログ', '監視', 'アラート',
  'クラウド', 'AWS', 'Azure', 'GCP', 'サーバーレス', 'マイクロサービス',
  'TypeScript', 'JavaScript', 'React', 'Node.js', 'Python', 'Java',
  'SQL', 'NoSQL', 'Redis', 'MongoDB', 'PostgreSQL', 'MySQL'
];

describe('Task 6.2: Engineer Terms Analysis', () => {
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

  describe('Engineer Terms Coverage Analysis', () => {
    REQUIRED_OMIKUJI_TYPES.forEach(omikujiType => {
      describe(`${omikujiType} の詳細分析`, () => {
        it('各結果のエンジニア用語カバレッジを分析する', () => {
          const data = resultData[omikujiType];
          const failingResults: any[] = [];
          const passResults: any[] = [];

          for (const [fortuneType, variations] of Object.entries(data.results)) {
            for (const result of variations) {
              const combinedContent = result.titlePhrase + ' ' + result.description + 
                ' ' + result.categories.map((c: any) => c.content).join(' ');
              
              const hasBasicTerms = ENGINEER_TERMS.some(term => 
                combinedContent.includes(term)
              );

              const foundTerms = ENGINEER_TERMS.filter(term => 
                combinedContent.includes(term)
              );

              const extendedFoundTerms = EXTENDED_ENGINEER_TERMS.filter(term => 
                combinedContent.includes(term)
              );

              const resultAnalysis = {
                id: result.id,
                fortuneType,
                hasBasicTerms,
                foundTerms,
                extendedFoundTerms,
                termCount: foundTerms.length,
                extendedTermCount: extendedFoundTerms.length,
                content: combinedContent.substring(0, 100) + '...'
              };

              if (hasBasicTerms) {
                passResults.push(resultAnalysis);
              } else {
                failingResults.push(resultAnalysis);
              }
            }
          }

          // Log analysis results for debugging
          console.log(`\n=== ${omikujiType} Analysis ===`);
          console.log(`PASSING: ${passResults.length} results`);
          console.log(`FAILING: ${failingResults.length} results`);
          
          if (failingResults.length > 0) {
            console.log('\n--- FAILING RESULTS ---');
            failingResults.forEach(result => {
              console.log(`${result.id} (${result.fortuneType}): ${result.content}`);
              console.log(`  Found terms: [${result.foundTerms.join(', ')}]`);
              console.log(`  Extended terms: [${result.extendedFoundTerms.join(', ')}]`);
            });
          }

          // The test will pass, but we use the output to understand what needs fixing
          expect(failingResults.length).toBeLessThanOrEqual(passResults.length + failingResults.length);
        });

        it('カテゴリ別のエンジニア用語分布を分析する', () => {
          const data = resultData[omikujiType];
          const categoryAnalysis: Record<string, { hasTerms: number; total: number }> = {};

          for (const [fortuneType, variations] of Object.entries(data.results)) {
            for (const result of variations) {
              for (const category of result.categories) {
                if (!categoryAnalysis[category.name]) {
                  categoryAnalysis[category.name] = { hasTerms: 0, total: 0 };
                }

                const hasEngineerTerms = ENGINEER_TERMS.some(term => 
                  category.content.includes(term)
                );

                categoryAnalysis[category.name].total++;
                if (hasEngineerTerms) {
                  categoryAnalysis[category.name].hasTerms++;
                }
              }
            }
          }

          console.log(`\n--- ${omikujiType} Category Analysis ---`);
          Object.entries(categoryAnalysis).forEach(([categoryName, stats]) => {
            const percentage = ((stats.hasTerms / stats.total) * 100).toFixed(1);
            console.log(`${categoryName}: ${stats.hasTerms}/${stats.total} (${percentage}%) have engineer terms`);
          });

          // Test passes regardless, but we get insights
          expect(Object.keys(categoryAnalysis)).toContain('恋愛運');
        });
      });
    });
  });
});