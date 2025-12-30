/**
 * FortuneRepository のテスト
 * 
 * TDD: t-wada手法に基づくリポジトリテスト
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { JsonFortuneRepository } from './FortuneRepository';
import { Fortune } from '@/domain/valueObjects/Fortune';

// fetch のモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('JsonFortuneRepository', () => {
  let repository: JsonFortuneRepository;

  beforeEach(() => {
    repository = new JsonFortuneRepository();
    repository.clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findAll', () => {
    it('APIから運勢データを正常に取得できる', async () => {
      // Arrange
      const mockData = {
        fortunes: [
          {
            id: 'shokichi',
            englishName: 'common',
            japaneseName: '小吉',
            description: '少しずつ良いことがありそうです',
            probability: 0.40,
            value: 1,
            color: { primary: '#9CA3AF', secondary: '#6B7280', background: '#F3F4F6' },
            effects: { glow: false, sparkle: false, animation: null }
          },
          {
            id: 'daikichi',
            englishName: 'legendary',
            japaneseName: '大吉',
            description: '最高の運勢！',
            probability: 0.05,
            value: 4,
            color: { primary: '#F59E0B', secondary: '#92400E', background: '#FEF3C7' },
            effects: { glow: true, sparkle: true, animation: 'pulse' }
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      // Act
      const fortunes = await repository.findAll();

      // Assert
      expect(fortunes).toHaveLength(2);
      expect(fortunes[0]).toBeInstanceOf(Fortune);
      expect(fortunes[0].getId()).toBe('shokichi');
      expect(fortunes[1].getId()).toBe('daikichi');
    });

    it('API エラー時はフォールバックデータを返す', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Act
      const fortunes = await repository.findAll();

      // Assert
      expect(fortunes).toHaveLength(6); // フォールバックデータの数
      expect(fortunes[0]).toBeInstanceOf(Fortune);
      expect(fortunes.some(f => f.getJapaneseName() === '小吉')).toBe(true);
    });

    it('キャッシュが正常に動作する', async () => {
      // Arrange
      const mockData = {
        fortunes: [
          {
            id: 'shokichi',
            englishName: 'common',
            japaneseName: '小吉',
            description: '少しずつ良いことがありそうです',
            probability: 0.40,
            value: 1,
            color: { primary: '#9CA3AF', secondary: '#6B7280', background: '#F3F4F6' },
            effects: { glow: false, sparkle: false, animation: null }
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      // Act
      await repository.findAll(); // 1回目のアクセス
      await repository.findAll(); // 2回目のアクセス（キャッシュから取得）

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1); // APIは1回だけ呼ばれる
    });
  });

  describe('findById', () => {
    beforeEach(async () => {
      // テスト用データをセットアップ
      const mockData = {
        fortunes: [
          {
            id: 'shokichi',
            englishName: 'common',
            japaneseName: '小吉',
            description: '少しずつ良いことがありそうです',
            probability: 0.40,
            value: 1,
            color: { primary: '#9CA3AF', secondary: '#6B7280', background: '#F3F4F6' },
            effects: { glow: false, sparkle: false, animation: null }
          },
          {
            id: 'daikichi',
            englishName: 'legendary',
            japaneseName: '大吉',
            description: '最高の運勢！',
            probability: 0.05,
            value: 4,
            color: { primary: '#F59E0B', secondary: '#92400E', background: '#FEF3C7' },
            effects: { glow: true, sparkle: true, animation: 'pulse' }
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });
    });

    it('存在するIDで運勢を取得できる', async () => {
      // Act
      const fortune = await repository.findById('shokichi');

      // Assert
      expect(fortune).not.toBeNull();
      expect(fortune!.getId()).toBe('shokichi');
      expect(fortune!.getJapaneseName()).toBe('小吉');
    });

    it('存在しないIDではnullが返される', async () => {
      // Act
      const fortune = await repository.findById('nonexistent');

      // Assert
      expect(fortune).toBeNull();
    });
  });

  describe('findByEnglishName', () => {
    beforeEach(async () => {
      // テスト用データをセットアップ
      const mockData = {
        fortunes: [
          {
            id: 'shokichi',
            englishName: 'common',
            japaneseName: '小吉',
            description: '少しずつ良いことがありそうです',
            probability: 0.40,
            value: 1,
            color: { primary: '#9CA3AF', secondary: '#6B7280', background: '#F3F4F6' },
            effects: { glow: false, sparkle: false, animation: null }
          },
          {
            id: 'daikichi',
            englishName: 'legendary',
            japaneseName: '大吉',
            description: '最高の運勢！',
            probability: 0.05,
            value: 4,
            color: { primary: '#F59E0B', secondary: '#92400E', background: '#FEF3C7' },
            effects: { glow: true, sparkle: true, animation: 'pulse' }
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });
    });

    it('存在する英語名で運勢を取得できる', async () => {
      // Act
      const fortune = await repository.findByEnglishName('legendary');

      // Assert
      expect(fortune).not.toBeNull();
      expect(fortune!.getId()).toBe('daikichi');
      expect(fortune!.getEnglishName()).toBe('legendary');
    });

    it('存在しない英語名ではnullが返される', async () => {
      // Act
      const fortune = await repository.findByEnglishName('nonexistent');

      // Assert
      expect(fortune).toBeNull();
    });
  });

  describe('findActiveFortunes', () => {
    it('無効化されていない運勢のみを取得できる', async () => {
      // Arrange
      const mockData = {
        fortunes: [
          {
            id: 'shokichi',
            englishName: 'common',
            japaneseName: '小吉',
            description: '少しずつ良いことがありそうです',
            probability: 0.40,
            value: 1,
            color: { primary: '#9CA3AF', secondary: '#6B7280', background: '#F3F4F6' },
            effects: { glow: false, sparkle: false, animation: null }
          },
          {
            id: 'daikichi',
            englishName: 'legendary',
            japaneseName: '大吉',
            description: '最高の運勢！',
            probability: 0.05,
            value: 4,
            color: { primary: '#F59E0B', secondary: '#92400E', background: '#FEF3C7' },
            effects: { glow: true, sparkle: true, animation: 'pulse' }
          },
          {
            id: 'kyo',
            englishName: 'unlucky',
            japaneseName: '凶',
            description: '注意深く行動しましょう',
            probability: 0.00,
            value: -1,
            color: { primary: '#DC2626', secondary: '#991B1B', background: '#FECACA' },
            effects: { glow: false, sparkle: false, animation: null },
            disabled: true
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      // Act
      const activeFortunes = await repository.findActiveFortunes();

      // Assert
      expect(activeFortunes).toHaveLength(2);
      expect(activeFortunes.some(f => f.getId() === 'shokichi')).toBe(true);
      expect(activeFortunes.some(f => f.getId() === 'daikichi')).toBe(true);
      expect(activeFortunes.some(f => f.getId() === 'kyo')).toBe(false); // disabled
    });
  });
});