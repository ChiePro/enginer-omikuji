import { describe, it, expect } from 'vitest';
import { EmotionAttributeDistribution } from './EmotionAttributeDistribution';
import { EmotionAttribute } from './EmotionAttribute';

describe('EmotionAttributeDistribution', () => {
  describe('create', () => {
    it('should create valid distribution when probabilities sum to 1.0', () => {
      // Given
      const positive = 0.6;
      const neutral = 0.3;
      const negative = 0.1;

      // When
      const result = EmotionAttributeDistribution.create(positive, neutral, negative);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getPositiveProbability()).toBe(0.6);
        expect(result.data.getNeutralProbability()).toBe(0.3);
        expect(result.data.getNegativeProbability()).toBe(0.1);
      }
    });

    it('should return error when probabilities sum does not equal 1.0', () => {
      // Given
      const positive = 0.7;
      const neutral = 0.3;
      const negative = 0.2; // Sum = 1.2

      // When
      const result = EmotionAttributeDistribution.create(positive, neutral, negative);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('PROBABILITY_SUM_INVALID');
        expect(result.error.message).toContain('確率の合計は1.0である必要があります');
      }
    });

    it('should return error when any probability is out of range (0.0-1.0)', () => {
      // Given
      const positive = 1.5; // Invalid: > 1.0
      const neutral = 0.3;
      const negative = -0.8; // Invalid: < 0.0

      // When
      const result = EmotionAttributeDistribution.create(positive, neutral, negative);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_PROBABILITY_RANGE');
        expect(result.error.message).toContain('確率は0.0から1.0の範囲で指定してください');
      }
    });

    it('should handle floating point precision correctly', () => {
      // Given - Values that should sum to 1.0 but might have floating point issues
      const positive = 0.1;
      const neutral = 0.2;
      const negative = 0.7000000000000001; // Sum might be 1.0000000000000001

      // When
      const result = EmotionAttributeDistribution.create(positive, neutral, negative);

      // Then - Should accept small floating point errors
      expect(result.success).toBe(true);
    });
  });

  describe('selectEmotionAttribute', () => {
    it('should select positive attribute for random value in positive range', () => {
      // Given
      const distribution = EmotionAttributeDistribution.create(0.6, 0.3, 0.1).data!;
      const randomValue = 0.3; // Within positive range (0.0-0.6)

      // When
      const selected = distribution.selectEmotionAttribute(randomValue);

      // Then
      expect(selected).toBe(EmotionAttribute.POSITIVE);
    });

    it('should select neutral attribute for random value in neutral range', () => {
      // Given
      const distribution = EmotionAttributeDistribution.create(0.6, 0.3, 0.1).data!;
      const randomValue = 0.8; // Within neutral range (0.6-0.9)

      // When
      const selected = distribution.selectEmotionAttribute(randomValue);

      // Then
      expect(selected).toBe(EmotionAttribute.NEUTRAL);
    });

    it('should select negative attribute for random value in negative range', () => {
      // Given
      const distribution = EmotionAttributeDistribution.create(0.6, 0.3, 0.1).data!;
      const randomValue = 0.95; // Within negative range (0.9-1.0)

      // When
      const selected = distribution.selectEmotionAttribute(randomValue);

      // Then
      expect(selected).toBe(EmotionAttribute.NEGATIVE);
    });

    it('should handle edge cases at boundaries', () => {
      // Given
      const distribution = EmotionAttributeDistribution.create(0.5, 0.3, 0.2).data!;

      // When/Then - Boundary values
      expect(distribution.selectEmotionAttribute(0.0)).toBe(EmotionAttribute.POSITIVE);
      expect(distribution.selectEmotionAttribute(0.5)).toBe(EmotionAttribute.NEUTRAL);
      expect(distribution.selectEmotionAttribute(0.8)).toBe(EmotionAttribute.NEGATIVE);
      expect(distribution.selectEmotionAttribute(0.99)).toBe(EmotionAttribute.NEGATIVE);
    });
  });

  describe('forFortuneLevel', () => {
    it('should return high positive distribution for daikichi (fortune value 4)', () => {
      // Given
      const daikichiFortune = 4;

      // When
      const distribution = EmotionAttributeDistribution.forFortuneLevel(daikichiFortune);

      // Then
      expect(distribution.getPositiveProbability()).toBe(0.80);
      expect(distribution.getNeutralProbability()).toBe(0.15);
      expect(distribution.getNegativeProbability()).toBe(0.05);
    });

    it('should return balanced distribution for kichi (fortune value 2)', () => {
      // Given
      const kichiFortune = 2;

      // When
      const distribution = EmotionAttributeDistribution.forFortuneLevel(kichiFortune);

      // Then
      expect(distribution.getPositiveProbability()).toBe(0.60);
      expect(distribution.getNeutralProbability()).toBe(0.30);
      expect(distribution.getNegativeProbability()).toBe(0.10);
    });

    it('should return high negative distribution for kyo (fortune value -1)', () => {
      // Given
      const kyoFortune = -1;

      // When
      const distribution = EmotionAttributeDistribution.forFortuneLevel(kyoFortune);

      // Then
      expect(distribution.getPositiveProbability()).toBe(0.15);
      expect(distribution.getNeutralProbability()).toBe(0.25);
      expect(distribution.getNegativeProbability()).toBe(0.60);
    });

    it('should return neutral-heavy distribution for neutral fortune (value 0)', () => {
      // Given
      const neutralFortune = 0;

      // When
      const distribution = EmotionAttributeDistribution.forFortuneLevel(neutralFortune);

      // Then
      expect(distribution.getPositiveProbability()).toBe(0.30);
      expect(distribution.getNeutralProbability()).toBe(0.50);
      expect(distribution.getNegativeProbability()).toBe(0.20);
    });
  });

  describe('10000 iteration statistical validation', () => {
    it('should converge to expected probabilities within tolerance', () => {
      // Given
      const distribution = EmotionAttributeDistribution.create(0.6, 0.3, 0.1).data!;
      const iterations = 10000;
      const tolerance = 0.05; // 5% tolerance
      
      let positiveCount = 0;
      let neutralCount = 0; 
      let negativeCount = 0;

      // When - Run 10000 iterations
      for (let i = 0; i < iterations; i++) {
        const randomValue = Math.random();
        const selected = distribution.selectEmotionAttribute(randomValue);
        
        switch (selected) {
          case EmotionAttribute.POSITIVE:
            positiveCount++;
            break;
          case EmotionAttribute.NEUTRAL:
            neutralCount++;
            break;
          case EmotionAttribute.NEGATIVE:
            negativeCount++;
            break;
        }
      }

      // Then - Results should converge to expected probabilities
      const positiveRate = positiveCount / iterations;
      const neutralRate = neutralCount / iterations;
      const negativeRate = negativeCount / iterations;

      expect(positiveRate).toBeCloseTo(0.6, 1); // Within 0.1 (10%)
      expect(neutralRate).toBeCloseTo(0.3, 1);
      expect(negativeRate).toBeCloseTo(0.1, 1);
      
      // More precise tolerance check
      expect(Math.abs(positiveRate - 0.6)).toBeLessThan(tolerance);
      expect(Math.abs(neutralRate - 0.3)).toBeLessThan(tolerance);
      expect(Math.abs(negativeRate - 0.1)).toBeLessThan(tolerance);
    });
  });
});