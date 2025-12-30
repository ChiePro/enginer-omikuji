import { describe, it, expect } from 'vitest';
import { OmikujiTypeService } from './OmikujiTypeService';
import { OmikujiType } from '../entities/OmikujiType';

describe('OmikujiTypeService', () => {
  describe('デフォルトおみくじタイプの取得', () => {
    it('5種類のおみくじタイプが定義されている', () => {
      // Act
      const types = OmikujiTypeService.getDefaultOmikujiTypes();

      // Assert
      expect(types).toHaveLength(5);
    });

    it('エンジニア運勢が最初に定義されている', () => {
      // Act
      const types = OmikujiTypeService.getDefaultOmikujiTypes();
      const engineerFortune = types[0];

      // Assert
      expect(engineerFortune.id.getValue()).toBe('engineer-fortune');
      expect(engineerFortune.name).toBe('エンジニア運勢');
      expect(engineerFortune.description).toBe('今日のコーディングを占う');
      expect(engineerFortune.icon).toBe('⚡');
      expect(engineerFortune.sortOrder).toBe(1);
    });

    it('技術選定おみくじが2番目に定義されている', () => {
      // Act
      const types = OmikujiTypeService.getDefaultOmikujiTypes();
      const techSelection = types[1];

      // Assert
      expect(techSelection.id.getValue()).toBe('tech-selection');
      expect(techSelection.name).toBe('技術選定おみくじ');
      expect(techSelection.description).toBe('次に学ぶ技術を決める');
      expect(techSelection.icon).toBe('🎲');
      expect(techSelection.sortOrder).toBe(2);
    });

    it('デバッグ運が3番目に定義されている', () => {
      // Act
      const types = OmikujiTypeService.getDefaultOmikujiTypes();
      const debugFortune = types[2];

      // Assert
      expect(debugFortune.id.getValue()).toBe('debug-fortune');
      expect(debugFortune.name).toBe('デバッグ運');
      expect(debugFortune.description).toBe('バグ解決のヒントを得る');
      expect(debugFortune.icon).toBe('🐛');
      expect(debugFortune.sortOrder).toBe(3);
    });

    it('コードレビュー運が4番目に定義されている', () => {
      // Act
      const types = OmikujiTypeService.getDefaultOmikujiTypes();
      const reviewFortune = types[3];

      // Assert
      expect(reviewFortune.id.getValue()).toBe('review-fortune');
      expect(reviewFortune.name).toBe('コードレビュー運');
      expect(reviewFortune.description).toBe('レビューの結果を予想');
      expect(reviewFortune.icon).toBe('👀');
      expect(reviewFortune.sortOrder).toBe(4);
    });

    it('デプロイ運が5番目に定義されている', () => {
      // Act
      const types = OmikujiTypeService.getDefaultOmikujiTypes();
      const deployFortune = types[4];

      // Assert
      expect(deployFortune.id.getValue()).toBe('deploy-fortune');
      expect(deployFortune.name).toBe('デプロイ運');
      expect(deployFortune.description).toBe('デプロイの成功を占う');
      expect(deployFortune.icon).toBe('🚀');
      expect(deployFortune.sortOrder).toBe(5);
    });

    it('sortOrder順で並んでいる', () => {
      // Act
      const types = OmikujiTypeService.getDefaultOmikujiTypes();

      // Assert
      for (let i = 0; i < types.length - 1; i++) {
        expect(types[i].sortOrder).toBeLessThan(types[i + 1].sortOrder);
      }
    });

    it('すべてのカラースキームがアクセシブルである', () => {
      // Act
      const types = OmikujiTypeService.getDefaultOmikujiTypes();

      // Assert
      types.forEach(type => {
        expect(type.color.isAccessible()).toBe(true);
      });
    });
  });

  describe('ID による検索', () => {
    it('有効なIDでおみくじタイプを取得できる', () => {
      // Act
      const result = OmikujiTypeService.findById('engineer-fortune');

      // Assert
      expect(result).toBeDefined();
      expect(result?.id.getValue()).toBe('engineer-fortune');
    });

    it('無効なIDではundefinedを返す', () => {
      // Act
      const result = OmikujiTypeService.findById('invalid-id');

      // Assert
      expect(result).toBeUndefined();
    });
  });
});