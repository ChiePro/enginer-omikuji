import { describe, it, expect } from 'vitest';
import { EmotionAttribute } from './EmotionAttribute';

describe('EmotionAttribute', () => {
  it('should have three emotion types defined', () => {
    // Given/When/Then
    expect(EmotionAttribute.POSITIVE).toBe('positive');
    expect(EmotionAttribute.NEUTRAL).toBe('neutral');
    expect(EmotionAttribute.NEGATIVE).toBe('negative');
  });

  it('should be enumerable', () => {
    // Given/When
    const values = Object.values(EmotionAttribute);

    // Then
    expect(values).toHaveLength(3);
    expect(values).toContain('positive');
    expect(values).toContain('neutral');
    expect(values).toContain('negative');
  });
});