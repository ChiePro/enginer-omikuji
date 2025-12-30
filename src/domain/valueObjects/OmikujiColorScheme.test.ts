import { describe, it, expect } from 'vitest';
import { OmikujiColorScheme } from './OmikujiColorScheme';
import { InvalidColorCodeError, InsufficientContrastError } from '../errors/ApplicationErrors';

describe('OmikujiColorScheme', () => {
  describe('作成時の検証', () => {
    it('有効なカラーコードでカラースキームが作成される', () => {
      // Arrange
      const params = {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#60A5FA'
      };

      // Act
      const colorScheme = OmikujiColorScheme.create(params);

      // Assert
      expect(colorScheme.isAccessible()).toBe(true);
    });

    it('無効なカラーコード形式でInvalidColorCodeErrorを投げる', () => {
      // Arrange
      const invalidParams = {
        primary: 'blue', // CSS名前は無効
        secondary: '#1E40AF'
      };

      // Act & Assert
      expect(() => OmikujiColorScheme.create(invalidParams))
        .toThrow(InvalidColorCodeError);
    });

    it('コントラスト比が不十分でInsufficientContrastErrorを投げる', () => {
      // Arrange
      const lowContrastParams = {
        primary: '#FFFFFF',
        secondary: '#F0F0F0' // コントラスト比が低い
      };

      // Act & Assert
      expect(() => OmikujiColorScheme.create(lowContrastParams))
        .toThrow(InsufficientContrastError);
    });
  });

  describe('TailwindCSS変換', () => {
    it('HEXカラーを適切なTailwindクラスに変換する', () => {
      // Arrange
      const colorScheme = OmikujiColorScheme.create({
        primary: '#3B82F6',
        secondary: '#1E40AF'
      });

      // Act
      const tailwindClasses = colorScheme.toTailwindClasses();

      // Assert
      expect(tailwindClasses.primary).toBe('bg-[#3B82F6]');
      expect(tailwindClasses.secondary).toBe('bg-[#1E40AF]');
    });
  });
});