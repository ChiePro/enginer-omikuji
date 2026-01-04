import { OmikujiResult } from './OmikujiResult';
import { OmikujiType } from './OmikujiType';
import { Fortune } from '../valueObjects/Fortune';

describe('OmikujiResult', () => {
  const mockOmikujiType = OmikujiType.create({
    id: 'love',
    name: '恋愛運',
    description: '恋愛に関する運勢',
    icon: '💕',
    color: {
      primary: '#000000',
      secondary: '#FFFFFF'
    },
    sortOrder: 1
  });

  const mockFortune = Fortune.fromData({
    id: 'daikichi',
    englishName: 'legendary',
    japaneseName: '大吉',
    description: '最高の運勢！素晴らしいことが待っています',
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

  describe('create', () => {
    it('should create an OmikujiResult with required properties', () => {
      const result = OmikujiResult.create({
        omikujiType: mockOmikujiType,
        fortune: mockFortune
      });

      expect(result.getOmikujiType()).toBe(mockOmikujiType);
      expect(result.getFortune()).toBe(mockFortune);
      expect(result.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should create unique IDs for different results', () => {
      const result1 = OmikujiResult.create({
        omikujiType: mockOmikujiType,
        fortune: mockFortune
      });
      
      const result2 = OmikujiResult.create({
        omikujiType: mockOmikujiType,
        fortune: mockFortune
      });

      expect(result1.getId()).not.toBe(result2.getId());
    });
  });

  describe('getDisplaySummary', () => {
    it('should return formatted display summary', () => {
      const result = OmikujiResult.create({
        omikujiType: mockOmikujiType,
        fortune: mockFortune
      });

      const summary = result.getDisplaySummary();
      expect(summary).toContain('💕 恋愛運');
      expect(summary).toContain('✨ 大吉 ✨');
    });
  });

  describe('equals', () => {
    it('should return true for same ID', () => {
      const result = OmikujiResult.create({
        omikujiType: mockOmikujiType,
        fortune: mockFortune
      });

      expect(result.equals(result)).toBe(true);
    });

    it('should return false for different IDs', () => {
      const result1 = OmikujiResult.create({
        omikujiType: mockOmikujiType,
        fortune: mockFortune
      });
      
      const result2 = OmikujiResult.create({
        omikujiType: mockOmikujiType,
        fortune: mockFortune
      });

      expect(result1.equals(result2)).toBe(false);
    });
  });
});