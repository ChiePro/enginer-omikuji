import { describe, it, expect } from 'vitest';
import { convertOmikujiTypeToCardData } from './omikujiTypeConverter';
import { OmikujiType } from '../../../domain/entities/OmikujiType';

describe('omikujiTypeConverter', () => {
  describe('convertOmikujiTypeToCardData', () => {
    it('ドメインオブジェクトを正しくプレゼンテーション用データに変換する', () => {
      // Arrange
      const omikujiType = OmikujiType.create({
        id: 'engineer-fortune',
        name: 'エンジニア運勢',
        description: '今日のコーディングを占う',
        icon: '⚡',
        color: { primary: '#3B82F6', secondary: '#1E40AF' },
        sortOrder: 1
      });

      // Act
      const cardData = convertOmikujiTypeToCardData(omikujiType);

      // Assert
      expect(cardData.id).toBe('engineer-fortune');
      expect(cardData.name).toBe('エンジニア運勢');
      expect(cardData.description).toBe('今日のコーディングを占う');
      expect(cardData.icon).toBe('⚡');
      expect(cardData.color.primary).toBe('#3B82F6');
      expect(cardData.color.secondary).toBe('#1E40AF');
      expect(cardData.route).toBe('/omikuji/engineer-fortune');
    });

    it('アクセント色がある場合は正しく変換される', () => {
      // Arrange
      const omikujiType = OmikujiType.create({
        id: 'tech-selection',
        name: '技術選定おみくじ',
        description: '次に学ぶ技術を決める',
        icon: '🎲',
        color: { primary: '#10B981', secondary: '#065F46', accent: '#6EE7B7' },
        sortOrder: 2
      });

      // Act
      const cardData = convertOmikujiTypeToCardData(omikujiType);

      // Assert
      expect(cardData.color.accent).toBe('#6EE7B7');
    });
  });
});