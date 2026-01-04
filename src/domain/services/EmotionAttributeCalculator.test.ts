import { describe, it, expect } from 'vitest';
import { EmotionAttributeCalculator } from './EmotionAttributeCalculator';
import { EmotionAttribute } from '../valueObjects/EmotionAttribute';
import { OmikujiResult } from '../entities/OmikujiResult';
import { OmikujiType } from '../entities/OmikujiType';
import { Fortune } from '../valueObjects/Fortune';

describe('EmotionAttributeCalculator', () => {
  let calculator: EmotionAttributeCalculator;

  const mockOmikujiType = OmikujiType.create({
    id: 'engineer-fortune',
    name: 'エンジニア運勢',
    description: '今日のコーディングを占う',
    icon: '⚡',
    color: { primary: '#000000', secondary: '#FFFFFF' },
    sortOrder: 1
  });

  const mockDaikichiFortune = Fortune.fromData({
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

  const mockKyoFortune = Fortune.fromData({
    id: 'kyo',
    englishName: 'unlucky',
    japaneseName: '凶',
    description: '注意深く行動しましょう',
    probability: 0.15,
    value: -1,
    color: {
      primary: '#DC2626',
      secondary: '#991B1B',
      background: '#FECACA'
    },
    effects: {
      glow: false,
      sparkle: false,
      animation: null
    }
  });

  beforeEach(() => {
    calculator = new EmotionAttributeCalculator();
  });

  describe('selectByEmotionAttribute', () => {
    it('should select result with matching emotion attribute', () => {
      // Given
      const positiveResult = OmikujiResult.create({
        omikujiType: mockOmikujiType,
        fortune: mockDaikichiFortune
      });
      
      const negativeResult = OmikujiResult.create({
        omikujiType: mockOmikujiType,
        fortune: mockDaikichiFortune
      });

      const results = [positiveResult, negativeResult];

      // When
      const result = calculator.selectByEmotionAttribute(results, mockDaikichiFortune);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(results).toContain(result.data);
      }
    });

    it('should return error when no results provided', () => {
      // Given
      const emptyResults: OmikujiResult[] = [];

      // When
      const result = calculator.selectByEmotionAttribute(emptyResults, mockDaikichiFortune);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NO_RESULTS_PROVIDED');
        expect(result.error.resultsCount).toBe(0);
      }
    });

    it('should handle fallback when no results match target emotion', () => {
      // Given
      const positiveResult = OmikujiResult.create({
        omikujiType: mockOmikujiType,
        fortune: mockDaikichiFortune
      });

      const results = [positiveResult];

      // When - Fortune value is negative (kyo) but only positive results available
      const result = calculator.selectByEmotionAttribute(results, mockKyoFortune);

      // Then - Should return the available result as fallback
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(positiveResult);
      }
    });

    it('should respect emotion distribution probabilities for daikichi fortune', () => {
      // Given
      const positiveResults = Array.from({ length: 10 }, () => 
        OmikujiResult.create({
          omikujiType: mockOmikujiType,
          fortune: mockDaikichiFortune
        })
      );
      
      const neutralResults = Array.from({ length: 2 }, () => 
        OmikujiResult.create({
          omikujiType: mockOmikujiType, 
          fortune: mockDaikichiFortune
        })
      );
      
      const negativeResults = Array.from({ length: 1 }, () => 
        OmikujiResult.create({
          omikujiType: mockOmikujiType,
          fortune: mockDaikichiFortune
        })
      );

      const allResults = [...positiveResults, ...neutralResults, ...negativeResults];
      const iterations = 1000;
      let positiveSelections = 0;

      // When - Run multiple selections
      for (let i = 0; i < iterations; i++) {
        const result = calculator.selectByEmotionAttribute(allResults, mockDaikichiFortune);
        if (result.success && positiveResults.includes(result.data)) {
          positiveSelections++;
        }
      }

      // Then - Should favor positive results (~80% for daikichi)
      const positiveRate = positiveSelections / iterations;
      expect(positiveRate).toBeGreaterThan(0.60); // Should be around 80%, but allow variance
      expect(positiveRate).toBeLessThan(0.95);
    });

    it('should respect emotion distribution probabilities for kyo fortune', () => {
      // Given  
      const positiveResults = Array.from({ length: 2 }, () =>
        OmikujiResult.create({
          omikujiType: mockOmikujiType,
          fortune: mockKyoFortune
        })
      );
      
      const neutralResults = Array.from({ length: 3 }, () =>
        OmikujiResult.create({
          omikujiType: mockOmikujiType,
          fortune: mockKyoFortune
        })
      );
      
      const negativeResults = Array.from({ length: 6 }, () =>
        OmikujiResult.create({
          omikujiType: mockOmikujiType,
          fortune: mockKyoFortune
        })
      );

      const allResults = [...positiveResults, ...neutralResults, ...negativeResults];
      const iterations = 1000;
      let negativeSelections = 0;

      // When - Run multiple selections
      for (let i = 0; i < iterations; i++) {
        const result = calculator.selectByEmotionAttribute(allResults, mockKyoFortune);
        if (result.success && negativeResults.includes(result.data)) {
          negativeSelections++;
        }
      }

      // Then - Should favor negative results (~60% for kyo)
      const negativeRate = negativeSelections / iterations;
      expect(negativeRate).toBeGreaterThan(0.40); // Should be around 60%, but allow variance
      expect(negativeRate).toBeLessThan(0.80);
    });
  });

  describe('getEmotionDistribution', () => {
    it('should return correct distribution for daikichi (value 4)', () => {
      // Given
      const daikichiFortune = 4;

      // When
      const distribution = calculator.getEmotionDistribution(daikichiFortune);

      // Then
      expect(distribution.positive).toBe(0.80);
      expect(distribution.neutral).toBe(0.15);
      expect(distribution.negative).toBe(0.05);
    });

    it('should return correct distribution for kyo (value -1)', () => {
      // Given
      const kyoFortune = -1;

      // When
      const distribution = calculator.getEmotionDistribution(kyoFortune);

      // Then
      expect(distribution.positive).toBe(0.15);
      expect(distribution.neutral).toBe(0.25);
      expect(distribution.negative).toBe(0.60);
    });

    it('should return correct distribution for neutral fortune (value 0)', () => {
      // Given
      const neutralFortune = 0;

      // When
      const distribution = calculator.getEmotionDistribution(neutralFortune);

      // Then
      expect(distribution.positive).toBe(0.30);
      expect(distribution.neutral).toBe(0.50);
      expect(distribution.negative).toBe(0.20);
    });
  });
});