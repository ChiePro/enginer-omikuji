import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JsonOmikujiResultRepository } from './JsonOmikujiResultRepository';
import { OmikujiResult } from '../../../domain/entities/OmikujiResult';
import { OmikujiType } from '../../../domain/entities/OmikujiType';
import { Fortune } from '../../../domain/valueObjects/Fortune';

describe('JsonOmikujiResultRepository', () => {
  let repository: JsonOmikujiResultRepository;
  
  const mockOmikujiType = OmikujiType.create({
    id: 'engineer-fortune',
    name: 'エンジニア運勢',
    description: '今日のコーディングを占う',
    icon: '⚡',
    color: { primary: '#000000', secondary: '#FFFFFF' },
    sortOrder: 1
  });

  const mockFortune = Fortune.fromData({
    id: 'daikichi',
    englishName: 'legendary', 
    japaneseName: '大吉',
    description: '最高の運勢！',
    probability: 0.03,
    value: 4,
    color: {
      primary: '#F59E0B',
      secondary: '#92400E',
      background: '#FEF3C7'
    },
    effects: {
      glow: true,
      sparkle: true,
      animation: 'pulse'
    }
  });

  beforeEach(() => {
    repository = new JsonOmikujiResultRepository();
  });

  describe('findByTypeAndFortune', () => {
    it('should return results for valid typeId and fortuneId', async () => {
      // Given
      const typeId = 'engineer-fortune';
      const fortuneId = 'daikichi';

      // When  
      const result = await repository.findByTypeAndFortune(typeId, fortuneId);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach(omikujiResult => {
          expect(omikujiResult).toBeInstanceOf(OmikujiResult);
          expect(omikujiResult.getOmikujiType().id.getValue()).toBe(typeId);
          expect(omikujiResult.getFortune().getId()).toBe(fortuneId);
        });
      }
    });

    it('should return error when typeId does not exist', async () => {
      // Given
      const invalidTypeId = 'nonexistent-fortune';
      const fortuneId = 'daikichi';

      // When
      const result = await repository.findByTypeAndFortune(invalidTypeId, fortuneId);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FILE_NOT_FOUND');
        expect(result.error.typeId).toBe(invalidTypeId);
      }
    });

    it('should return empty array when no results found for fortune', async () => {
      // Given
      const typeId = 'engineer-fortune';
      const nonexistentFortuneId = 'nonexistent-fortune';

      // When
      const result = await repository.findByTypeAndFortune(typeId, nonexistentFortuneId);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('findAll', () => {
    it('should return all results for valid typeId', async () => {
      // Given
      const typeId = 'engineer-fortune';

      // When
      const result = await repository.findAll(typeId);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach(omikujiResult => {
          expect(omikujiResult).toBeInstanceOf(OmikujiResult);
          expect(omikujiResult.getOmikujiType().id.getValue()).toBe(typeId);
        });
      }
    });

    it('should return error for nonexistent typeId', async () => {
      // Given
      const invalidTypeId = 'invalid-type';

      // When
      const result = await repository.findAll(invalidTypeId);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FILE_NOT_FOUND');
        expect(result.error.typeId).toBe(invalidTypeId);
      }
    });
  });
});