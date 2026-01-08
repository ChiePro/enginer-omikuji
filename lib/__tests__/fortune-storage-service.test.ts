/**
 * FortuneStorageServiceのテスト
 *
 * ストレージキー生成、結果データ作成、バリデーション機能をテストします。
 * TDD原則に従い、実装前にテストを作成します（RED phase）。
 */

import {
  getStorageKey,
  createStoredResult,
  validateStoredResult,
} from '../fortune-storage-service';
import { FortuneResult } from '../draw-fortune';
import { IntegratedFortuneResult, CategoryAdvice } from '../integrated-fortune';
import { FortuneLevel } from '../fortune-data';

describe('FortuneStorageService', () => {
  describe('getStorageKey', () => {
    it('should generate storage key in correct format', () => {
      const omikujiId = 'daily-luck';
      const key = getStorageKey(omikujiId);
      expect(key).toBe('omikuji-result:daily-luck');
    });

    it('should handle different omikuji IDs', () => {
      expect(getStorageKey('code-review')).toBe('omikuji-result:code-review');
      expect(getStorageKey('integrated')).toBe('omikuji-result:integrated');
    });

    it('should handle empty string', () => {
      expect(getStorageKey('')).toBe('omikuji-result:');
    });
  });

  describe('createStoredResult', () => {
    const mockFortuneLevel: FortuneLevel = {
      id: 'daikichi',
      name: '大吉',
      weight: 16,
      rank: 1,
    };

    const mockFortuneResult: FortuneResult = {
      level: mockFortuneLevel,
      message: '今日は最高の1日！',
    };

    const mockCategoryAdvice: CategoryAdvice = {
      coding: 'スムーズに進む',
      review: 'スムーズに進む',
      deploy: 'スムーズに進む',
      waiting: '良い知らせあり',
      conflict: '心配なし',
      growth: '大きく成長する',
    };

    const mockIntegratedResult: IntegratedFortuneResult = {
      level: mockFortuneLevel,
      overallMessage: '大いなる吉兆なり',
      categoryAdvice: mockCategoryAdvice,
    };

    it('should create stored result for basic fortune', () => {
      const result = createStoredResult('daily-luck', mockFortuneResult, 'basic');

      expect(result.type).toBe('basic');
      expect(result.fortuneResult).toEqual(mockFortuneResult);
      expect(result.integratedResult).toBeUndefined();
      expect(result.omikujiName).toBe('今日の運勢');
      expect(result.drawnAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should create stored result for integrated fortune', () => {
      const result = createStoredResult(
        'integrated',
        mockIntegratedResult,
        'integrated'
      );

      expect(result.type).toBe('integrated');
      expect(result.fortuneResult).toBeUndefined();
      expect(result.integratedResult).toEqual(mockIntegratedResult);
      expect(result.omikujiName).toBeDefined();
      expect(result.drawnAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should generate timestamp in ISO 8601 format', () => {
      const result = createStoredResult('daily-luck', mockFortuneResult, 'basic');
      const timestamp = new Date(result.drawnAt);

      expect(timestamp.toISOString()).toBe(result.drawnAt);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });

    it('should generate unique timestamps for successive calls', (done) => {
      const result1 = createStoredResult('daily-luck', mockFortuneResult, 'basic');

      // Wait 1ms to ensure timestamp difference
      setTimeout(() => {
        const result2 = createStoredResult('daily-luck', mockFortuneResult, 'basic');
        expect(result1.drawnAt).not.toBe(result2.drawnAt);
        done();
      }, 1);
    });
  });

  describe('validateStoredResult', () => {
    const validBasicResult = {
      type: 'basic' as const,
      fortuneResult: {
        level: { id: 'daikichi', name: '大吉', weight: 16, rank: 1 },
        message: 'Test message',
      },
      omikujiName: '今日の運勢',
      drawnAt: '2025-12-31T00:00:00.000Z',
    };

    const validIntegratedResult = {
      type: 'integrated' as const,
      integratedResult: {
        level: { id: 'daikichi', name: '大吉', weight: 16, rank: 1 },
        overallMessage: 'Overall message',
        categoryAdvice: {
          coding: 'Good',
          review: 'Good',
          deploy: 'Good',
          waiting: 'Good',
          conflict: 'Good',
          growth: 'Good',
        },
      },
      omikujiName: '統合運勢',
      drawnAt: '2025-12-31T00:00:00.000Z',
    };

    it('should validate correct basic fortune result', () => {
      expect(validateStoredResult(validBasicResult)).toBe(true);
    });

    it('should validate correct integrated fortune result', () => {
      expect(validateStoredResult(validIntegratedResult)).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(validateStoredResult(null)).toBe(false);
      expect(validateStoredResult(undefined)).toBe(false);
    });

    it('should reject non-object values', () => {
      expect(validateStoredResult('string')).toBe(false);
      expect(validateStoredResult(123)).toBe(false);
      expect(validateStoredResult(true)).toBe(false);
    });

    it('should reject object without required type field', () => {
      const { type: _type, ...withoutType } = validBasicResult;
      expect(validateStoredResult(withoutType)).toBe(false);
    });

    it('should reject object with invalid type', () => {
      expect(validateStoredResult({ ...validBasicResult, type: 'invalid' })).toBe(
        false
      );
    });

    it('should reject object without required omikujiName field', () => {
      const { omikujiName: _omikujiName, ...withoutName } = validBasicResult;
      expect(validateStoredResult(withoutName)).toBe(false);
    });

    it('should reject object without required drawnAt field', () => {
      const { drawnAt: _drawnAt, ...withoutDrawnAt } = validBasicResult;
      expect(validateStoredResult(withoutDrawnAt)).toBe(false);
    });

    it('should reject basic type without fortuneResult', () => {
      const { fortuneResult: _fortuneResult, ...withoutResult } = validBasicResult;
      expect(validateStoredResult(withoutResult)).toBe(false);
    });

    it('should reject integrated type without integratedResult', () => {
      const {
        integratedResult: _integratedResult,
        ...withoutResult
      } = validIntegratedResult;
      expect(validateStoredResult(withoutResult)).toBe(false);
    });

    it('should reject basic type with integratedResult instead of fortuneResult', () => {
      const invalid = {
        type: 'basic' as const,
        integratedResult: validIntegratedResult.integratedResult,
        omikujiName: '今日の運勢',
        drawnAt: '2025-12-31T00:00:00.000Z',
      };
      expect(validateStoredResult(invalid)).toBe(false);
    });

    it('should reject integrated type with fortuneResult instead of integratedResult', () => {
      const invalid = {
        type: 'integrated' as const,
        fortuneResult: validBasicResult.fortuneResult,
        omikujiName: '統合運勢',
        drawnAt: '2025-12-31T00:00:00.000Z',
      };
      expect(validateStoredResult(invalid)).toBe(false);
    });

    it('should reject fortuneResult with missing level', () => {
      const invalid = {
        ...validBasicResult,
        fortuneResult: { message: 'Test' },
      };
      expect(validateStoredResult(invalid)).toBe(false);
    });

    it('should reject fortuneResult with missing message', () => {
      const invalid = {
        ...validBasicResult,
        fortuneResult: { level: validBasicResult.fortuneResult?.level },
      };
      expect(validateStoredResult(invalid)).toBe(false);
    });
  });
});
