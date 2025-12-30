import { describe, it, expect } from 'vitest';
import { OmikujiTypeId } from './OmikujiTypeId';
import { InvalidOmikujiTypeIdError } from '../errors/ApplicationErrors';

describe('OmikujiTypeId', () => {
  describe('作成時', () => {
    describe('正常系', () => {
      it('有効なIDで作成される', () => {
        // Arrange
        const validId = 'engineer-fortune';

        // Act
        const typeId = OmikujiTypeId.create(validId);

        // Assert
        expect(typeId.getValue()).toBe(validId);
      });

      it('小文字、数字、ハイフンが使用可能', () => {
        // Arrange
        const validIds = ['test-123', 'abc', 'tech-selection-2024'];

        // Act & Assert
        validIds.forEach(id => {
          expect(() => OmikujiTypeId.create(id)).not.toThrow();
        });
      });
    });

    describe('異常系', () => {
      it('空文字列でInvalidOmikujiTypeIdErrorを投げる', () => {
        // Act & Assert
        expect(() => OmikujiTypeId.create(''))
          .toThrow(InvalidOmikujiTypeIdError);
      });

      it('空白文字でInvalidOmikujiTypeIdErrorを投げる', () => {
        // Act & Assert
        expect(() => OmikujiTypeId.create('   '))
          .toThrow(InvalidOmikujiTypeIdError);
      });

      it('無効な文字でInvalidOmikujiTypeIdErrorを投げる', () => {
        // Arrange
        const invalidIds = ['Engineer-Fortune', 'test_id', 'test@id', 'テスト'];

        // Act & Assert
        invalidIds.forEach(id => {
          expect(() => OmikujiTypeId.create(id))
            .toThrow(InvalidOmikujiTypeIdError);
        });
      });
    });
  });

  describe('同一性の判定', () => {
    it('同じ値のIDは等しい', () => {
      // Arrange
      const id1 = OmikujiTypeId.create('engineer-fortune');
      const id2 = OmikujiTypeId.create('engineer-fortune');

      // Act & Assert
      expect(id1.equals(id2)).toBe(true);
    });

    it('異なる値のIDは等しくない', () => {
      // Arrange
      const id1 = OmikujiTypeId.create('engineer-fortune');
      const id2 = OmikujiTypeId.create('tech-selection');

      // Act & Assert
      expect(id1.equals(id2)).toBe(false);
    });
  });
});