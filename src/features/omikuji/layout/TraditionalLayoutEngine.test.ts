import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TraditionalLayoutEngine } from './TraditionalLayoutEngine';

describe('TraditionalLayoutEngine', () => {
  let layoutEngine: TraditionalLayoutEngine;

  beforeEach(() => {
    layoutEngine = new TraditionalLayoutEngine();
  });

  describe('縦書きスタイル生成', () => {
    it('基本的な縦書きCSSスタイルを生成できる', () => {
      // Given
      const expectedStyles = {
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        direction: 'ltr'
      };

      // When
      const styles = layoutEngine.generateVerticalTextStyles();

      // Then
      expect(styles).toEqual(expectedStyles);
    });

    it('ブラウザ互換性を考慮したプレフィックス付きスタイルを生成する', () => {
      // Given
      const expectedPrefixedStyles = {
        writingMode: 'vertical-rl',
        WebkitWritingMode: 'vertical-rl',
        msWritingMode: 'tb-rl',
        textOrientation: 'upright'
      };

      // When
      const styles = layoutEngine.generateCrossBrowserVerticalStyles();

      // Then
      expect(styles).toMatchObject(expectedPrefixedStyles);
    });
  });

  describe('運勢レベル別色彩・装飾定義', () => {
    it('大吉の場合は金色ベースの豪華な装飾を返す', () => {
      // Given
      const fortuneValue = 4; // 大吉
      
      // When
      const decoration = layoutEngine.getFortuneDecoration(fortuneValue);
      
      // Then
      expect(decoration.primaryColor).toBe('#FFD700');
      expect(decoration.backgroundColor).toBe('#FFF8DC');
      expect(decoration.borderColor).toBe('#DAA520');
      expect(decoration.hasSpecialEffect).toBe(true);
      expect(decoration.shadowIntensity).toBe('high');
    });

    it('中吉の場合は橙色ベースの中程度装飾を返す', () => {
      // Given
      const fortuneValue = 3; // 中吉
      
      // When
      const decoration = layoutEngine.getFortuneDecoration(fortuneValue);
      
      // Then
      expect(decoration.primaryColor).toBe('#FF8C00');
      expect(decoration.backgroundColor).toBe('#FFF8F0');
      expect(decoration.borderColor).toBe('#CD853F');
      expect(decoration.hasSpecialEffect).toBe(false);
      expect(decoration.shadowIntensity).toBe('medium');
    });

    it('凶の場合は青色ベースの控えめな装飾を返す', () => {
      // Given
      const fortuneValue = -1; // 凶
      
      // When
      const decoration = layoutEngine.getFortuneDecoration(fortuneValue);
      
      // Then
      expect(decoration.primaryColor).toBe('#4169E1');
      expect(decoration.backgroundColor).toBe('#F0F8FF');
      expect(decoration.borderColor).toBe('#6495ED');
      expect(decoration.hasSpecialEffect).toBe(false);
      expect(decoration.shadowIntensity).toBe('low');
    });

    it('大凶の場合は暗い色調で注意喚起の装飾を返す', () => {
      // Given
      const fortuneValue = -2; // 大凶
      
      // When
      const decoration = layoutEngine.getFortuneDecoration(fortuneValue);
      
      // Then
      expect(decoration.primaryColor).toBe('#8B0000');
      expect(decoration.backgroundColor).toBe('#FFF0F5');
      expect(decoration.borderColor).toBe('#CD5C5C');
      expect(decoration.hasSpecialEffect).toBe(true);
      expect(decoration.shadowIntensity).toBe('warning');
      expect(decoration.warningIndicator).toBe(true);
    });
  });

  describe('ブラウザ互換性チェック', () => {
    it('writing-modeをサポートするブラウザではtrueを返す', () => {
      // Given
      const mockElement = {
        style: {
          writingMode: ''
        }
      };
      vi.stubGlobal('document', {
        createElement: () => mockElement
      });

      // When
      const isSupported = layoutEngine.checkWritingModeSupport();

      // Then
      expect(isSupported).toBe(true);
    });

    it('writing-modeをサポートしないブラウザではfalseを返す', () => {
      // Given
      const mockElement = {
        style: {}
      };
      vi.stubGlobal('document', {
        createElement: () => mockElement
      });

      // When
      const isSupported = layoutEngine.checkWritingModeSupport();

      // Then
      expect(isSupported).toBe(false);
    });
  });

  describe('フォールバック処理', () => {
    it('縦書き未対応の場合は横書きフォールバックスタイルを生成する', () => {
      // Given
      const expectedFallbackStyles = {
        writingMode: 'horizontal-tb',
        textAlign: 'center',
        flexDirection: 'column',
        border: '2px solid #ccc',
        padding: '20px',
        borderRadius: '8px'
      };

      // When
      const fallbackStyles = layoutEngine.generateFallbackStyles();

      // Then
      expect(fallbackStyles).toEqual(expectedFallbackStyles);
    });

    it('縦書き未対応時の代替レイアウト設定を提供する', () => {
      // Given
      // When
      const fallbackLayout = layoutEngine.getFallbackLayoutConfig();

      // Then
      expect(fallbackLayout.orientation).toBe('horizontal');
      expect(fallbackLayout.textAlign).toBe('center');
      expect(fallbackLayout.showCompatibilityWarning).toBe(true);
      expect(fallbackLayout.fallbackMessage).toBe('このブラウザでは縦書きレイアウトが利用できません。横書きで表示しています。');
    });
  });

  describe('縦書きレイアウトエンジンの統合テスト', () => {
    it('大吉の縦書きレイアウトを完全に生成できる', () => {
      // Given
      const fortuneValue = 4; // 大吉
      const content = '今日は神コードが降臨する最高の一日！';
      
      // Mock browser support for writing-mode
      const mockElement = {
        style: {
          writingMode: ''
        }
      };
      vi.stubGlobal('document', {
        createElement: () => mockElement
      });

      // When
      const completeLayout = layoutEngine.generateCompleteLayout(fortuneValue, content);

      // Then
      expect(completeLayout.styles.writingMode).toBe('vertical-rl');
      expect(completeLayout.decoration.primaryColor).toBe('#FFD700');
      expect(completeLayout.content).toBe(content);
      expect(completeLayout.isVerticalSupported).toBeDefined();
      expect(completeLayout.fallbackAvailable).toBe(true);
    });

    it('ブラウザサポート状況に応じて適切なレイアウトを選択する', () => {
      // Given
      const mockUnsupportedBrowser = vi.fn().mockReturnValue(false);
      layoutEngine.checkWritingModeSupport = mockUnsupportedBrowser;
      
      // When
      const layout = layoutEngine.generateCompleteLayout(2, 'テストコンテンツ');

      // Then
      expect(layout.isVerticalSupported).toBe(false);
      expect(layout.styles.writingMode).toBe('horizontal-tb');
      expect(layout.fallbackMessage).toBeDefined();
    });
  });
});