import { describe, it, expect, beforeEach } from 'vitest';
import { validateOmikujiResultFile, validateAllResultFiles, ValidationResult, ValidationError } from './validateOmikujiResultData';
import type { OmikujiResultData } from '../../types/omikujiResultData';

describe('Omikuji Result Data Validation', () => {
  describe('Individual file validation', () => {
    it('有効なデータファイルの場合は成功を返す', () => {
      // Given
      const validData: OmikujiResultData = {
        omikujiTypeId: 'engineer-fortune',
        results: {
          daikichi: [
            {
              id: 'engineer-daikichi-001',
              titlePhrase: '今日は神レベルのコードが降臨する最高の一日！', // 22文字
              description: 'バグゼロでリリース成功、技術選定も完璧、同僚からの評価もMAX。今日のあなたは無敵のエンジニアです。コードレビューも一発通過で、新しいアーキテクチャの設計も神がかり的。全てのタスクが理想的に進行し、技術的な課題も次々と解決していく素晴らしい一日となるでしょう。', // 130文字
              emotionAttribute: 'positive',
              categories: [
                { name: '恋愛運', content: 'ペアプロで距離が縮まる', emotionTone: 'positive' },
                { name: '仕事運', content: 'コードレビューが一発承認', emotionTone: 'positive' },
                { name: '健康運', content: '良い椅子との出会い', emotionTone: 'positive' },
                { name: '金運', content: 'ストックオプション上昇', emotionTone: 'positive' },
                { name: '学業運', content: '新フレームワーク理解が進む', emotionTone: 'positive' }
              ]
            }
          ]
        },
        metadata: {
          lastUpdated: '2025-01-04T15:30:00.000Z',
          contentVersion: '1.1.0',
          totalVariations: 1,
          status: 'active',
          emotionDistributionRules: {
            daikichi: { positive: 0.80, neutral: 0.15, negative: 0.05 }
          }
        }
      };

      // When
      const result = validateOmikujiResultFile(validData);

      // Then
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('タイトルフレーズが20文字未満の場合はエラーを返す', () => {
      // Given
      const invalidData: OmikujiResultData = {
        omikujiTypeId: 'engineer-fortune',
        results: {
          daikichi: [{
            id: 'test-001',
            titlePhrase: '短いタイトル', // 6文字
            description: 'バグゼロでリリース成功、技術選定も完璧、同僚からの評価もMAX。今日のあなたは無敵のエンジニアです。コードレビューも一発通過で、新しいアーキテクチャの設計も神がかり的。全てのタスクが理想的に進行し、技術的な課題も次々と解決していく素晴らしい一日となるでしょう。', // 130文字
            emotionAttribute: 'positive',
            categories: [
              { name: '恋愛運', content: 'ペアプロで距離が縮まる', emotionTone: 'positive' },
              { name: '仕事運', content: 'コードレビューが一発承認', emotionTone: 'positive' },
              { name: '健康運', content: '良い椅子との出会い', emotionTone: 'positive' },
              { name: '金運', content: 'ストックオプション上昇', emotionTone: 'positive' },
              { name: '学業運', content: '新フレームワーク理解が進む', emotionTone: 'positive' }
            ]
          }]
        },
        metadata: {
          lastUpdated: '2025-01-04T15:30:00.000Z',
          contentVersion: '1.0.0',
          totalVariations: 1,
          status: 'active',
          emotionDistributionRules: {
            daikichi: { positive: 0.80, neutral: 0.15, negative: 0.05 }
          }
        }
      };

      // When
      const result = validateOmikujiResultFile(invalidData);

      // Then
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('TITLE_TOO_SHORT');
      expect(result.errors[0].context.resultId).toBe('test-001');
    });

    it('説明文が100文字未満の場合はエラーを返す', () => {
      // Given
      const invalidData: OmikujiResultData = {
        omikujiTypeId: 'engineer-fortune',
        results: {
          daikichi: [{
            id: 'test-001',
            titlePhrase: '今日は神レベルのコードが降臨する最高の一日！',
            description: '短すぎる説明文', // 8文字
            emotionAttribute: 'positive',
            categories: [
              { name: '恋愛運', content: 'ペアプロで距離が縮まる', emotionTone: 'positive' },
              { name: '仕事運', content: 'コードレビューが一発承認', emotionTone: 'positive' },
              { name: '健康運', content: '良い椅子との出会い', emotionTone: 'positive' },
              { name: '金運', content: 'ストックオプション上昇', emotionTone: 'positive' },
              { name: '学業運', content: '新フレームワーク理解が進む', emotionTone: 'positive' }
            ]
          }]
        },
        metadata: {
          lastUpdated: '2025-01-04T15:30:00.000Z',
          contentVersion: '1.0.0',
          totalVariations: 1,
          status: 'active'
        }
      };

      // When
      const result = validateOmikujiResultFile(invalidData);

      // Then
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('DESCRIPTION_TOO_SHORT');
    });

    it('必須カテゴリが不足している場合はエラーを返す', () => {
      // Given
      const invalidData: OmikujiResultData = {
        omikujiTypeId: 'engineer-fortune',
        results: {
          daikichi: [{
            id: 'test-001',
            titlePhrase: '今日は神レベルのコードが降臨する最高の一日！',
            description: 'バグゼロでリリース成功、技術選定も完璧、同僚からの評価もMAX。今日のあなたは無敵のエンジニアです。コードレビューも一発通過で、新しいアーキテクチャの設計も神がかり的。全てのタスクが理想的に進行し、技術的な課題も次々と解決していく素晴らしい一日となるでしょう。', // 130文字
            emotionAttribute: 'positive',
            categories: [
              { name: '恋愛運', content: 'ペアプロで距離が縮まる', emotionTone: 'positive' },
              { name: '仕事運', content: 'コードレビューが一発承認', emotionTone: 'positive' }
              // 健康運、金運、学業運が不足
            ]
          }]
        },
        metadata: {
          lastUpdated: '2025-01-04T15:30:00.000Z',
          contentVersion: '1.0.0',
          totalVariations: 1,
          status: 'active',
          emotionDistributionRules: {
            daikichi: { positive: 0.80, neutral: 0.15, negative: 0.05 }
          }
        }
      };

      // When
      const result = validateOmikujiResultFile(invalidData);

      // Then
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('MISSING_REQUIRED_CATEGORIES');
      expect(result.errors[0].message).toContain('健康運');
      expect(result.errors[0].message).toContain('金運');
      expect(result.errors[0].message).toContain('学業運');
    });

    it('感情属性確率分布の合計が1.0でない場合はエラーを返す', () => {
      // Given
      const invalidData: OmikujiResultData = {
        omikujiTypeId: 'engineer-fortune',
        results: {
          daikichi: [{
            id: 'test-001',
            titlePhrase: '今日は神レベルのコードが降臨する最高の一日！',
            description: 'バグゼロでリリース成功、技術選定も完璧、同僚からの評価もMAX。今日のあなたは無敵のエンジニアです。コードレビューも一発通過で、新しいアーキテクチャの設計も神がかり的。全てのタスクが理想的に進行し、技術的な課題も次々と解決していく素晴らしい一日となるでしょう。', // 130文字
            emotionAttribute: 'positive',
            categories: [
              { name: '恋愛運', content: 'ペアプロで距離が縮まる', emotionTone: 'positive' },
              { name: '仕事運', content: 'コードレビューが一発承認', emotionTone: 'positive' },
              { name: '健康運', content: '良い椅子との出会い', emotionTone: 'positive' },
              { name: '金運', content: 'ストックオプション上昇', emotionTone: 'positive' },
              { name: '学業運', content: '新フレームワーク理解が進む', emotionTone: 'positive' }
            ]
          }]
        },
        metadata: {
          lastUpdated: '2025-01-04T15:30:00.000Z',
          contentVersion: '1.0.0',
          totalVariations: 1,
          status: 'active',
          emotionDistributionRules: {
            daikichi: { positive: 0.70, neutral: 0.20, negative: 0.05 } // 合計0.95
          }
        }
      };

      // When
      const result = validateOmikujiResultFile(invalidData);

      // Then
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_EMOTION_DISTRIBUTION');
      expect(result.errors[0].message).toContain('1.0');
    });
  });

  describe('Directory structure validation', () => {
    it('すべての結果ファイルが存在する場合は成功を返す', async () => {
      // Given
      const expectedOmikujiTypes = [
        'engineer-fortune',
        'tech-selection',
        'debug-fortune',
        'code-review-fortune',
        'deploy-fortune'
      ];

      // When
      const result = await validateAllResultFiles(expectedOmikujiTypes);

      // Then
      expect(result.isValid).toBe(true);
      expect(result.validatedFiles).toHaveLength(5);
      expect(result.errors).toHaveLength(0);
    });

    it('結果ファイルが不足している場合はエラーを返す', async () => {
      // Given
      const expectedOmikujiTypes = [
        'engineer-fortune',
        'nonexistent-type'
      ];

      // When
      const result = await validateAllResultFiles(expectedOmikujiTypes);

      // Then
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'FILE_NOT_FOUND')).toBe(true);
      expect(result.errors.some(e => e.context?.fileName === 'nonexistent-type.json')).toBe(true);
    });
  });

  describe('Content quality validation', () => {
    it('エンジニア特化表現が含まれていない場合はワーニングを返す', () => {
      // Given
      const dataWithoutEngineerTerms: OmikujiResultData = {
        omikujiTypeId: 'engineer-fortune',
        results: {
          daikichi: [{
            id: 'test-001',
            titlePhrase: '今日は素晴らしい一日になりそうです！運気絶好調！',
            description: '何もかもが順調に進み、良いことが次々と起こるでしょう。期待を持って一日を過ごしてください。今日のあなたは輝いています。運命の扉が開かれ、素晴らしい出来事が待ち受けています。充実した時間を過ごせるはずです。', // 100文字以上
            emotionAttribute: 'positive',
            categories: [
              { name: '恋愛運', content: '良い出会いがありそう', emotionTone: 'positive' },
              { name: '仕事運', content: '業務が順調に進む', emotionTone: 'positive' },
              { name: '健康運', content: '体調が良好', emotionTone: 'positive' },
              { name: '金運', content: '収入が安定', emotionTone: 'positive' },
              { name: '学業運', content: '学習が進む', emotionTone: 'positive' }
            ]
          }]
        },
        metadata: {
          lastUpdated: '2025-01-04T15:30:00.000Z',
          contentVersion: '1.0.0',
          totalVariations: 1,
          status: 'active',
          emotionDistributionRules: {
            daikichi: { positive: 0.80, neutral: 0.15, negative: 0.05 }
          }
        }
      };

      // When
      const result = validateOmikujiResultFile(dataWithoutEngineerTerms);

      // Then
      expect(result.isValid).toBe(true); // 有効だが警告あり
      expect(result.warnings).toHaveLength(2); // INSUFFICIENT_VARIATIONS and MISSING_ENGINEER_TERMS
      expect(result.warnings.some(w => w.type === 'MISSING_ENGINEER_TERMS')).toBe(true);
    });

    it('最低3つの結果バリエーションがない場合はワーニングを返す', () => {
      // Given
      const dataWithFewVariations: OmikujiResultData = {
        omikujiTypeId: 'engineer-fortune',
        results: {
          daikichi: [{
            id: 'test-001',
            titlePhrase: '今日は神レベルのコードが降臨する最高の一日！',
            description: 'バグゼロでリリース成功、技術選定も完璧、同僚からの評価もMAX。今日のあなたは無敵のエンジニアです。コードレビューも一発通過で、新しいアーキテクチャの設計も神がかり的。全てのタスクが理想的に進行し、技術的な課題も次々と解決していく素晴らしい一日となるでしょう。', // 130文字
            emotionAttribute: 'positive',
            categories: [
              { name: '恋愛運', content: 'ペアプロで距離が縮まる', emotionTone: 'positive' },
              { name: '仕事運', content: 'コードレビューが一発承認', emotionTone: 'positive' },
              { name: '健康運', content: '良い椅子との出会い', emotionTone: 'positive' },
              { name: '金運', content: 'ストックオプション上昇', emotionTone: 'positive' },
              { name: '学業運', content: '新フレームワーク理解が進む', emotionTone: 'positive' }
            ]
          }]
          // 1つのバリエーションのみ
        },
        metadata: {
          lastUpdated: '2025-01-04T15:30:00.000Z',
          contentVersion: '1.0.0',
          totalVariations: 1,
          status: 'active',
          emotionDistributionRules: {
            daikichi: { positive: 0.80, neutral: 0.15, negative: 0.05 }
          }
        }
      };

      // When
      const result = validateOmikujiResultFile(dataWithFewVariations);

      // Then
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('INSUFFICIENT_VARIATIONS');
      expect(result.warnings[0].message).toContain('3つ以上');
    });
  });

  describe('Metadata validation', () => {
    it('メタデータが不正な場合はエラーを返す', () => {
      // Given
      const invalidMetadata: OmikujiResultData = {
        omikujiTypeId: 'engineer-fortune',
        results: {
          daikichi: [{
            id: 'test-001',
            titlePhrase: '今日は神レベルのコードが降臨する最高の一日！',
            description: 'バグゼロでリリース成功、技術選定も完璧、同僚からの評価もMAX。'.repeat(2),
            emotionAttribute: 'positive',
            categories: [
              { name: '恋愛運', content: 'ペアプロで距離が縮まる', emotionTone: 'positive' },
              { name: '仕事運', content: 'コードレビューが一発承認', emotionTone: 'positive' },
              { name: '健康運', content: '良い椅子との出会い', emotionTone: 'positive' },
              { name: '金運', content: 'ストックオプション上昇', emotionTone: 'positive' },
              { name: '学業運', content: '新フレームワーク理解が進む', emotionTone: 'positive' }
            ]
          }]
        },
        metadata: {
          lastUpdated: 'invalid-date',
          contentVersion: '1.0.0',
          totalVariations: -1, // 無効な値
          status: 'invalid-status' as any
        }
      };

      // When
      const result = validateOmikujiResultFile(invalidMetadata);

      // Then
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'INVALID_DATE_FORMAT')).toBe(true);
      expect(result.errors.some(e => e.type === 'INVALID_TOTAL_VARIATIONS')).toBe(true);
      expect(result.errors.some(e => e.type === 'INVALID_STATUS')).toBe(true);
    });
  });
});