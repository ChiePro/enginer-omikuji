import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ExtendedOmikujiDrawService } from './ExtendedOmikujiDrawService';
import { OmikujiDrawService } from './OmikujiDrawService';
import { CategoryRandomizationService } from './CategoryRandomizationService';
import { Fortune } from '../valueObjects/Fortune';
import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { OmikujiResult } from '../entities/OmikujiResult';
import { OmikujiType } from '../entities/OmikujiType';

describe('ExtendedOmikujiDrawService', () => {
  let extendedDrawService: ExtendedOmikujiDrawService;
  let mockBaseDrawService: OmikujiDrawService;
  let mockRandomizationService: CategoryRandomizationService;

  beforeEach(() => {
    // Mock base draw service
    mockBaseDrawService = {
      drawOmikuji: vi.fn(),
      calculateFortuneDistribution: vi.fn()
    } as any;

    // Mock randomization service
    mockRandomizationService = {
      randomizeCategories: vi.fn(),
      validateCategoryCompleteness: vi.fn()
    } as any;

    extendedDrawService = new ExtendedOmikujiDrawService(
      mockBaseDrawService,
      mockRandomizationService
    );
  });

  // Helper to create test data
  const createFortune = (id: string, japaneseName: string, value: number): Fortune => {
    return Fortune.fromData({
      id,
      englishName: id,
      japaneseName,
      description: `${japaneseName}の運勢`,
      probability: 0.1,
      value,
      color: { primary: '#000000', secondary: '#ffffff', background: '#f0f0f0' },
      effects: { glow: false, sparkle: false, animation: null }
    });
  };

  const createOmikujiType = (id: string): OmikujiType => {
    return OmikujiType.create({
      id,
      name: 'Test Omikuji',
      description: 'Test description',
      icon: '🎯',
      color: { primary: '#000000', secondary: '#ffffff' },
      sortOrder: 1
    });
  };

  const createMockResult = (typeId: string, fortune: Fortune): OmikujiResult => {
    return OmikujiResult.create({
      omikujiType: createOmikujiType(typeId),
      fortune: fortune
    });
  };

  describe('既存OmikujiDrawServiceとの互換性維持', () => {
    it('既存のdrawOmikuji APIとの互換性を保持する', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      const mockResult = createMockResult('engineer-fortune', fortune);

      (mockBaseDrawService.drawOmikuji as any).mockResolvedValue({
        success: true,
        data: mockResult
      });

      const result = await extendedDrawService.drawOmikuji('engineer-fortune', 0);

      expect(result.success).toBe(true);
      expect(mockBaseDrawService.drawOmikuji).toHaveBeenCalledWith('engineer-fortune', 0);
    });

    it('既存APIレスポンス形式を保持する', async () => {
      const fortune = createFortune('daikichi', '大吉', 4);
      const mockResult = createMockResult('engineer-fortune', fortune);

      (mockBaseDrawService.drawOmikuji as any).mockResolvedValue({
        success: true,
        data: mockResult
      });

      const result = await extendedDrawService.drawOmikuji('engineer-fortune');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(OmikujiResult);
        expect(result.data.getFortune()).toBe(fortune);
      }
    });
  });

  describe('ランダム化機能統合', () => {
    it('sessionIdが提供された場合にランダム化機能を使用する', async () => {
      const fortune = createFortune('chuukichi', '中吉', 3);
      const mockResult = createMockResult('engineer-fortune', fortune);
      const mockCategories = FortuneCategory.getAllRequiredCategories();

      (mockBaseDrawService.drawOmikuji as any).mockResolvedValue({
        success: true,
        data: mockResult
      });

      (mockRandomizationService.randomizeCategories as any).mockResolvedValue({
        success: true,
        data: mockCategories
      });

      const result = await extendedDrawService.drawWithRandomization(
        'engineer-fortune',
        { sessionId: 'test-session-123' }
      );

      expect(result.success).toBe(true);
      expect(mockRandomizationService.randomizeCategories).toHaveBeenCalledWith(
        fortune,
        'test-session-123',
        undefined
      );
    });

    it('ランダム化された結果が既存形式と互換性を持つ', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      const mockResult = createMockResult('engineer-fortune', fortune);
      const mockCategories = FortuneCategory.getAllRequiredCategories();

      (mockBaseDrawService.drawOmikuji as any).mockResolvedValue({
        success: true,
        data: mockResult
      });

      (mockRandomizationService.randomizeCategories as any).mockResolvedValue({
        success: true,
        data: mockCategories
      });

      const result = await extendedDrawService.drawWithRandomization(
        'engineer-fortune',
        { sessionId: 'test-session-456' }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('baseResult');
        expect(result.data).toHaveProperty('randomizedCategories');
        expect(result.data.baseResult).toBeInstanceOf(OmikujiResult);
        expect(result.data.randomizedCategories).toHaveLength(5);
      }
    });

    it('決定論的テスト用にシードを受け入れる', async () => {
      const fortune = createFortune('suekichi', '末吉', 0);
      const mockResult = createMockResult('engineer-fortune', fortune);
      const mockCategories = FortuneCategory.getAllRequiredCategories();

      (mockBaseDrawService.drawOmikuji as any).mockResolvedValue({
        success: true,
        data: mockResult
      });

      (mockRandomizationService.randomizeCategories as any).mockResolvedValue({
        success: true,
        data: mockCategories
      });

      const result = await extendedDrawService.drawWithRandomization(
        'engineer-fortune',
        {
          sessionId: 'deterministic-session',
          seed: 'test-seed-12345'
        }
      );

      expect(result.success).toBe(true);
      expect(mockRandomizationService.randomizeCategories).toHaveBeenCalledWith(
        fortune,
        'deterministic-session',
        'test-seed-12345'
      );
    });
  });

  describe('IOmikujiResultRepositoryインターフェース互換性', () => {
    it('既存のリポジトリメソッドを適切に委譲する', async () => {
      const fortune = createFortune('kyo', '凶', -1);
      const mockResult = createMockResult('engineer-fortune', fortune);

      (mockBaseDrawService.calculateFortuneDistribution as any).mockResolvedValue({
        success: true,
        data: {
          fortunes: [{ id: 'kyo', probability: 0.05 }],
          totalProbability: 1.0
        }
      });

      const result = await extendedDrawService.calculateFortuneDistribution('engineer-fortune');

      expect(result.success).toBe(true);
      expect(mockBaseDrawService.calculateFortuneDistribution).toHaveBeenCalledWith('engineer-fortune');
    });

    it('エラー時に既存のエラー形式を保持する', async () => {
      (mockBaseDrawService.drawOmikuji as any).mockResolvedValue({
        success: false,
        error: { type: 'FORTUNE_DATA_NOT_FOUND', typeId: 'invalid-type' }
      });

      const result = await extendedDrawService.drawOmikuji('invalid-type');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FORTUNE_DATA_NOT_FOUND');
      }
    });
  });

  describe('フォールバック機能', () => {
    it('ランダム化サービスが失敗した場合にベースサービスにフォールバックする', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      const mockResult = createMockResult('engineer-fortune', fortune);

      (mockBaseDrawService.drawOmikuji as any).mockResolvedValue({
        success: true,
        data: mockResult
      });

      (mockRandomizationService.randomizeCategories as any).mockResolvedValue({
        success: false,
        error: { type: 'INSUFFICIENT_CONTENT_POOL', category: 'love' }
      });

      const result = await extendedDrawService.drawWithRandomization(
        'engineer-fortune',
        { sessionId: 'fallback-test' }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.baseResult).toBeInstanceOf(OmikujiResult);
        expect(result.data.randomizedCategories).toBe(null);
        expect(result.data.fallbackUsed).toBe(true);
      }
    });
  });

  describe('パフォーマンス要件', () => {
    it('統合処理が100ms以内で完了する', async () => {
      const fortune = createFortune('kichi', '吉', 2);
      const mockResult = createMockResult('engineer-fortune', fortune);
      const mockCategories = FortuneCategory.getAllRequiredCategories();

      (mockBaseDrawService.drawOmikuji as any).mockResolvedValue({
        success: true,
        data: mockResult
      });

      (mockRandomizationService.randomizeCategories as any).mockResolvedValue({
        success: true,
        data: mockCategories
      });

      const startTime = performance.now();

      const result = await extendedDrawService.drawWithRandomization(
        'engineer-fortune',
        { sessionId: 'perf-test' }
      );

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(100);
    });
  });
});