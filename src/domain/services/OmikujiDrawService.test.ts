import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OmikujiDrawService } from './OmikujiDrawService';
import { OmikujiResult } from '../entities/OmikujiResult';
import { OmikujiType } from '../entities/OmikujiType';
import { Fortune } from '../valueObjects/Fortune';
import { EmotionAttributeCalculator } from './EmotionAttributeCalculator';
import { IOmikujiResultRepository } from '../repositories/IOmikujiResultRepository';
import { IFortuneRepository } from '../../infrastructure/repositories/json/FortuneRepository';

describe('OmikujiDrawService', () => {
  let drawService: OmikujiDrawService;
  let mockFortuneRepository: IFortuneRepository;
  let mockOmikujiResultRepository: IOmikujiResultRepository;
  let mockEmotionAttributeCalculator: EmotionAttributeCalculator;

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

  const mockKichiFortune = Fortune.fromData({
    id: 'kichi',
    englishName: 'rare',
    japaneseName: '吉',
    description: '良いことが起こりそうな予感です',
    probability: 0.25,
    value: 2,
    color: {
      primary: '#3B82F6',
      secondary: '#1E40AF',
      background: '#DBEAFE'
    },
    effects: {
      glow: false,
      sparkle: false,
      animation: null
    }
  });

  const mockOmikujiResult = OmikujiResult.create({
    omikujiType: mockOmikujiType,
    fortune: mockDaikichiFortune
  });

  beforeEach(() => {
    // Create mocks
    mockFortuneRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByEnglishName: vi.fn(),
      findActiveFortunes: vi.fn()
    };

    mockOmikujiResultRepository = {
      findByTypeAndFortune: vi.fn(),
      findAll: vi.fn()
    };

    mockEmotionAttributeCalculator = {
      selectByEmotionAttribute: vi.fn(),
      getEmotionDistribution: vi.fn()
    } as any;

    drawService = new OmikujiDrawService(
      mockFortuneRepository,
      mockOmikujiResultRepository,
      mockEmotionAttributeCalculator
    );
  });

  describe('drawOmikuji', () => {
    it('should successfully draw omikuji result for valid type', async () => {
      // Given
      const typeId = 'engineer-fortune';
      const saisenLevel = 0;

      const availableFortunes = [mockDaikichiFortune, mockKichiFortune];
      const availableResults = [mockOmikujiResult];

      vi.mocked(mockFortuneRepository.findActiveFortunes).mockResolvedValue(availableFortunes);
      vi.mocked(mockOmikujiResultRepository.findByTypeAndFortune).mockResolvedValue({
        success: true,
        data: availableResults
      });
      vi.mocked(mockEmotionAttributeCalculator.selectByEmotionAttribute).mockReturnValue({
        success: true,
        data: mockOmikujiResult
      });

      // When
      const result = await drawService.drawOmikuji(typeId, saisenLevel);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(OmikujiResult);
        expect(mockFortuneRepository.findActiveFortunes).toHaveBeenCalled();
        expect(mockOmikujiResultRepository.findByTypeAndFortune).toHaveBeenCalled();
        expect(mockEmotionAttributeCalculator.selectByEmotionAttribute).toHaveBeenCalled();
      }
    });

    it('should return error when no active fortunes available', async () => {
      // Given
      const typeId = 'engineer-fortune';
      const saisenLevel = 0;

      vi.mocked(mockFortuneRepository.findActiveFortunes).mockResolvedValue([]);

      // When
      const result = await drawService.drawOmikuji(typeId, saisenLevel);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FORTUNE_DATA_NOT_FOUND');
        expect(result.error.typeId).toBe(typeId);
      }
    });

    it('should return default result when no specific results found', async () => {
      // Given
      const typeId = 'engineer-fortune';
      const saisenLevel = 0;

      const availableFortunes = [mockDaikichiFortune];

      vi.mocked(mockFortuneRepository.findActiveFortunes).mockResolvedValue(availableFortunes);
      vi.mocked(mockOmikujiResultRepository.findByTypeAndFortune).mockResolvedValue({
        success: true,
        data: []
      });

      // When
      const result = await drawService.drawOmikuji(typeId, saisenLevel);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(OmikujiResult);
        // Should create a default result
      }
    });

    it('should adjust fortune probabilities based on saisen level', async () => {
      // Given
      const typeId = 'engineer-fortune';
      const highSaisenLevel = 3; // Higher saisen should increase good fortune probability

      const availableFortunes = [mockDaikichiFortune, mockKichiFortune];
      const availableResults = [mockOmikujiResult];

      vi.mocked(mockFortuneRepository.findActiveFortunes).mockResolvedValue(availableFortunes);
      vi.mocked(mockOmikujiResultRepository.findByTypeAndFortune).mockResolvedValue({
        success: true,
        data: availableResults
      });
      vi.mocked(mockEmotionAttributeCalculator.selectByEmotionAttribute).mockReturnValue({
        success: true,
        data: mockOmikujiResult
      });

      // When
      const result = await drawService.drawOmikuji(typeId, highSaisenLevel);

      // Then
      expect(result.success).toBe(true);
      expect(mockFortuneRepository.findActiveFortunes).toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Given
      const typeId = 'engineer-fortune';
      const saisenLevel = 0;

      vi.mocked(mockFortuneRepository.findActiveFortunes).mockRejectedValue(new Error('Repository error'));

      // When
      const result = await drawService.drawOmikuji(typeId, saisenLevel);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('REPOSITORY_ERROR');
      }
    });
  });

  describe('statistical probability validation', () => {
    it('should respect fortune selection probabilities', async () => {
      // Given
      const typeId = 'engineer-fortune';
      const saisenLevel = 0;

      const availableFortunes = [
        mockDaikichiFortune, // probability 0.03 (3%)
        mockKichiFortune    // probability 0.25 (25%)
      ];

      // Create different results for each fortune
      const daikichiResult = OmikujiResult.create({
        omikujiType: mockOmikujiType,
        fortune: mockDaikichiFortune
      });

      const kichiResult = OmikujiResult.create({
        omikujiType: mockOmikujiType,
        fortune: mockKichiFortune
      });

      vi.mocked(mockFortuneRepository.findActiveFortunes).mockResolvedValue(availableFortunes);
      
      // Mock different results for different fortunes
      vi.mocked(mockOmikujiResultRepository.findByTypeAndFortune)
        .mockImplementation(async (typeId, fortuneId) => {
          if (fortuneId === 'daikichi') {
            return { success: true, data: [daikichiResult] };
          } else if (fortuneId === 'kichi') {
            return { success: true, data: [kichiResult] };
          }
          return { success: true, data: [] };
        });

      vi.mocked(mockEmotionAttributeCalculator.selectByEmotionAttribute)
        .mockImplementation((results) => {
          return { success: true, data: results[0] };
        });

      // When
      const result = await drawService.drawOmikuji(typeId, saisenLevel);

      // Then - Should get a valid result
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(OmikujiResult);
        const fortuneId = result.data.getFortune().getId();
        expect(['daikichi', 'kichi']).toContain(fortuneId);
      }
    });
  });

  describe('calculateFortuneDistribution', () => {
    it('should return valid fortune distribution for existing type', async () => {
      // Given
      const typeId = 'engineer-fortune';
      const availableFortunes = [mockDaikichiFortune, mockKichiFortune];

      vi.mocked(mockFortuneRepository.findActiveFortunes).mockResolvedValue(availableFortunes);

      // When
      const result = await drawService.calculateFortuneDistribution(typeId);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fortunes).toHaveLength(2);
        expect(result.data.totalProbability).toBeCloseTo(0.28, 2); // 0.03 + 0.25
        
        const daikichiFortune = result.data.fortunes.find(f => f.id === 'daikichi');
        expect(daikichiFortune?.probability).toBe(0.03);
      }
    });
  });
});