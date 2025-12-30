import { describe, it, expect, beforeEach } from 'vitest';
import { OmikujiType } from './OmikujiType';
import { InvalidOmikujiTypeIdError, InvalidColorCodeError } from '../errors/ApplicationErrors';

describe('OmikujiType', () => {
  describe('作成時', () => {
    describe('正常系', () => {
      it('有効なパラメータでおみくじタイプが作成される', () => {
        // Arrange
        const params = {
          id: 'engineer-fortune',
          name: 'エンジニア運勢',
          description: '今日のコーディングを占う',
          icon: '⚡',
          color: { primary: '#3B82F6', secondary: '#1E40AF' },
          sortOrder: 1
        };

        // Act
        const omikujiType = OmikujiType.create(params);

        // Assert
        expect(omikujiType.id.getValue()).toBe('engineer-fortune');
        expect(omikujiType.name).toBe('エンジニア運勢');
        expect(omikujiType.getDisplayName()).toBe('⚡ エンジニア運勢');
      });
    });

    describe('異常系', () => {
      it('無効なIDの場合、InvalidOmikujiTypeIdErrorを投げる', () => {
        // Arrange
        const invalidParams = {
          id: '', // 空文字列
          name: 'エンジニア運勢',
          description: '今日のコーディングを占う',
          icon: '⚡',
          color: { primary: '#3B82F6', secondary: '#1E40AF' },
          sortOrder: 1
        };

        // Act & Assert
        expect(() => OmikujiType.create(invalidParams))
          .toThrow(InvalidOmikujiTypeIdError);
      });

      it('無効なカラーコードの場合、InvalidColorCodeErrorを投げる', () => {
        // Arrange
        const invalidParams = {
          id: 'engineer-fortune',
          name: 'エンジニア運勢',
          description: '今日のコーディングを占う',
          icon: '⚡',
          color: { primary: 'invalid-color', secondary: '#1E40AF' }, // 無効な色
          sortOrder: 1
        };

        // Act & Assert
        expect(() => OmikujiType.create(invalidParams))
          .toThrow(InvalidColorCodeError);
      });
    });
  });

  describe('振る舞い', () => {
    let omikujiType1: OmikujiType;
    let omikujiType2: OmikujiType;

    beforeEach(() => {
      omikujiType1 = OmikujiType.create({
        id: 'engineer-fortune',
        name: 'エンジニア運勢',
        description: '今日のコーディングを占う',
        icon: '⚡',
        color: { primary: '#3B82F6', secondary: '#1E40AF' },
        sortOrder: 1
      });

      omikujiType2 = OmikujiType.create({
        id: 'tech-selection',
        name: '技術選定おみくじ',
        description: '次に学ぶ技術を決める',
        icon: '🎲',
        color: { primary: '#10B981', secondary: '#065F46' },
        sortOrder: 2
      });
    });

    it('表示順序で比較できる', () => {
      // Act
      const comparison = omikujiType1.compareByOrder(omikujiType2);

      // Assert
      expect(comparison).toBe(-1); // omikujiType1が先
    });

    it('同一のIDのおみくじタイプは等しいと判定される', () => {
      // Arrange
      const sameOmikujiType = OmikujiType.create({
        id: 'engineer-fortune', // 同じID
        name: '異なる名前', // 名前が違っても
        description: '異なる説明',
        icon: '🔥',
        color: { primary: '#EF4444', secondary: '#991B1B' },
        sortOrder: 99
      });

      // Act & Assert
      expect(omikujiType1.equals(sameOmikujiType)).toBe(true);
    });

    it('異なるIDのおみくじタイプは等しくないと判定される', () => {
      // Act & Assert
      expect(omikujiType1.equals(omikujiType2)).toBe(false);
    });
  });
});