/**
 * Fortune Value Object のテスト
 * 
 * TDD: t-wada手法に基づく振る舞いテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Fortune, FortuneData } from './Fortune';

describe('Fortune', () => {
  let sampleFortuneData: FortuneData[];
  let fortunes: Fortune[];

  beforeEach(() => {
    sampleFortuneData = [
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
    ];

    fortunes = Fortune.fromDataArray(sampleFortuneData);
  });

  describe('インスタンス生成', () => {
    it('JSONデータから運勢インスタンスを生成できる', () => {
      // Act
      const fortune = Fortune.fromData(sampleFortuneData[0]);

      // Assert
      expect(fortune.getId()).toBe('shokichi');
      expect(fortune.getJapaneseName()).toBe('小吉');
      expect(fortune.getEnglishName()).toBe('common');
      expect(fortune.getDescription()).toBe('少しずつ良いことがありそうです');
      expect(fortune.getValue()).toBe(1);
      expect(fortune.getProbability()).toBe(0.40);
      expect(fortune.isDisabled()).toBe(false);
    });

    it('配列から複数の運勢インスタンスを生成できる', () => {
      // Act
      const fortuneArray = Fortune.fromDataArray(sampleFortuneData);

      // Assert
      expect(fortuneArray).toHaveLength(3);
      expect(fortuneArray[0].getId()).toBe('shokichi');
      expect(fortuneArray[1].getId()).toBe('daikichi');
      expect(fortuneArray[2].getId()).toBe('kyo');
    });
  });

  describe('振る舞い - 価値による比較', () => {
    it('大吉は小吉より価値が高い', () => {
      // Arrange
      const shokichi = fortunes.find(f => f.getId() === 'shokichi')!;
      const daikichi = fortunes.find(f => f.getId() === 'daikichi')!;

      // Act & Assert
      expect(daikichi.isMoreValuableThan(shokichi)).toBe(true);
      expect(shokichi.isMoreValuableThan(daikichi)).toBe(false);
    });

    it('同じ運勢同士は等しい価値を持つ', () => {
      // Arrange
      const shokichi1 = fortunes.find(f => f.getId() === 'shokichi')!;
      const shokichi2 = Fortune.fromData(sampleFortuneData[0]);

      // Act & Assert
      expect(shokichi1.isMoreValuableThan(shokichi2)).toBe(false);
      expect(shokichi2.isMoreValuableThan(shokichi1)).toBe(false);
    });
  });

  describe('振る舞い - 運勢の種類判定', () => {
    it('正の値の運勢は良い運勢と判定される', () => {
      // Arrange
      const shokichi = fortunes.find(f => f.getId() === 'shokichi')!;
      const daikichi = fortunes.find(f => f.getId() === 'daikichi')!;

      // Act & Assert
      expect(shokichi.isGoodFortune()).toBe(true);
      expect(daikichi.isGoodFortune()).toBe(true);
    });

    it('負の値の運勢は悪い運勢と判定される', () => {
      // Arrange
      const kyo = fortunes.find(f => f.getId() === 'kyo')!;

      // Act & Assert
      expect(kyo.isBadFortune()).toBe(true);
      expect(kyo.isGoodFortune()).toBe(false);
    });
  });

  describe('振る舞い - エフェクトの判定', () => {
    it('光や輝きエフェクトがある運勢は特別エフェクトありと判定される', () => {
      // Arrange
      const daikichi = fortunes.find(f => f.getId() === 'daikichi')!;

      // Act & Assert
      expect(daikichi.hasSpecialEffects()).toBe(true);
    });

    it('エフェクトがない運勢は特別エフェクトなしと判定される', () => {
      // Arrange
      const shokichi = fortunes.find(f => f.getId() === 'shokichi')!;

      // Act & Assert
      expect(shokichi.hasSpecialEffects()).toBe(false);
    });
  });

  describe('振る舞い - 表示とフォーマット', () => {
    it('確率をパーセンテージ形式で表示できる', () => {
      // Arrange
      const shokichi = fortunes.find(f => f.getId() === 'shokichi')!;

      // Act & Assert
      expect(shokichi.getProbabilityPercentage()).toBe('40%');
    });

    it('特別エフェクトがある運勢は装飾付きで表示される', () => {
      // Arrange
      const daikichi = fortunes.find(f => f.getId() === 'daikichi')!;
      const shokichi = fortunes.find(f => f.getId() === 'shokichi')!;

      // Act & Assert
      expect(daikichi.getDisplayName()).toBe('✨ 大吉 ✨');
      expect(shokichi.getDisplayName()).toBe('小吉');
    });

    it('CSS クラス名を正しく生成する', () => {
      // Arrange
      const shokichi = fortunes.find(f => f.getId() === 'shokichi')!;

      // Act & Assert
      expect(shokichi.getCssClassName()).toBe('fortune-shokichi');
    });
  });

  describe('振る舞い - レガシーサポート', () => {
    it('既存のRarity名との互換性を保つ', () => {
      // Arrange
      const shokichi = fortunes.find(f => f.getId() === 'shokichi')!;
      const daikichi = fortunes.find(f => f.getId() === 'daikichi')!;

      // Act & Assert
      expect(shokichi.getLegacyRarityName()).toBe('common');
      expect(daikichi.getLegacyRarityName()).toBe('legendary');
    });
  });

  describe('静的メソッド - 検索機能', () => {
    it('IDによる検索が正常に動作する', () => {
      // Act
      const found = Fortune.findById(fortunes, 'daikichi');
      const notFound = Fortune.findById(fortunes, 'nonexistent');

      // Assert
      expect(found?.getId()).toBe('daikichi');
      expect(notFound).toBeNull();
    });

    it('英語名による検索が正常に動作する', () => {
      // Act
      const found = Fortune.findByEnglishName(fortunes, 'legendary');
      const notFound = Fortune.findByEnglishName(fortunes, 'nonexistent');

      // Assert
      expect(found?.getId()).toBe('daikichi');
      expect(notFound).toBeNull();
    });
  });

  describe('静的メソッド - ソート機能', () => {
    it('価値による昇順ソートが正常に動作する', () => {
      // Act
      const sorted = Fortune.sortByValue(fortunes);

      // Assert
      expect(sorted[0].getId()).toBe('kyo'); // value: -1
      expect(sorted[1].getId()).toBe('shokichi'); // value: 1
      expect(sorted[2].getId()).toBe('daikichi'); // value: 4
    });

    it('確率による降順ソートが正常に動作する', () => {
      // Act
      const sorted = Fortune.sortByProbability(fortunes);

      // Assert
      expect(sorted[0].getId()).toBe('shokichi'); // probability: 0.40
      expect(sorted[1].getId()).toBe('daikichi'); // probability: 0.05
      expect(sorted[2].getId()).toBe('kyo'); // probability: 0.00
    });
  });

  describe('静的メソッド - フィルタリング', () => {
    it('有効な運勢のみを取得できる', () => {
      // Act
      const activeFortunes = Fortune.getActiveFortunes(fortunes);

      // Assert
      expect(activeFortunes).toHaveLength(2);
      expect(activeFortunes.some(f => f.getId() === 'kyo')).toBe(false);
      expect(activeFortunes.some(f => f.getId() === 'shokichi')).toBe(true);
      expect(activeFortunes.some(f => f.getId() === 'daikichi')).toBe(true);
    });
  });

  describe('同一性と等価性', () => {
    it('同じIDの運勢は等しいと判定される', () => {
      // Arrange
      const shokichi1 = fortunes.find(f => f.getId() === 'shokichi')!;
      const shokichi2 = Fortune.fromData(sampleFortuneData[0]);

      // Act & Assert
      expect(shokichi1.equals(shokichi2)).toBe(true);
    });

    it('異なるIDの運勢は等しくないと判定される', () => {
      // Arrange
      const shokichi = fortunes.find(f => f.getId() === 'shokichi')!;
      const daikichi = fortunes.find(f => f.getId() === 'daikichi')!;

      // Act & Assert
      expect(shokichi.equals(daikichi)).toBe(false);
    });
  });
});