import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibilityManager } from './accessibilityManager';

// DOM Environment Mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Live Region Mock
const mockLiveRegion = {
  setAttribute: vi.fn(),
  textContent: '',
  style: { position: '', left: '', top: '', width: '', height: '', overflow: '', clip: '' },
  appendChild: vi.fn(),
  removeChild: vi.fn(),
} as any;

Object.defineProperty(document, 'createElement', {
  writable: true,
  value: vi.fn().mockReturnValue(mockLiveRegion),
});

Object.defineProperty(document.body, 'appendChild', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  writable: true,
  value: vi.fn(),
});

describe('AccessibilityManager', () => {
  let manager: AccessibilityManager;
  let mockElement: HTMLElement;
  
  beforeEach(() => {
    vi.clearAllMocks();
    manager = new AccessibilityManager();
    
    // Mock HTMLElement
    mockElement = {
      getAttribute: vi.fn(),
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      tabIndex: 0,
      style: {},
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
      },
    } as any;
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('ARIA属性管理', () => {
    it('ARIA label を設定できる', () => {
      // Act
      manager.setAriaLabel(mockElement, 'エンジニア運勢おみくじを選択');

      // Assert
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-label', 'エンジニア運勢おみくじを選択');
    });

    it('ARIA describedby を設定できる', () => {
      // Act
      manager.setAriaDescribedBy(mockElement, 'omikuji-description');

      // Assert
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-describedby', 'omikuji-description');
    });

    it('ARIA expanded 状態を管理できる', () => {
      // Act
      manager.setAriaExpanded(mockElement, true);

      // Assert
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');

      // Act
      manager.setAriaExpanded(mockElement, false);

      // Assert
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-expanded', 'false');
    });

    it('ARIA pressed 状態を管理できる', () => {
      // Act
      manager.setAriaPressed(mockElement, true);

      // Assert
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-pressed', 'true');
    });

    it('ARIA disabled 状態を管理できる', () => {
      // Act
      manager.setAriaDisabled(mockElement, true);

      // Assert
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-disabled', 'true');
    });
  });

  describe('キーボードナビゲーション', () => {
    it('フォーカス可能要素にtabIndexを設定できる', () => {
      // Act
      manager.makeFocusable(mockElement);

      // Assert
      expect(mockElement.tabIndex).toBe(0);
    });

    it('要素をフォーカス不可にできる', () => {
      // Act
      manager.makeNotFocusable(mockElement);

      // Assert
      expect(mockElement.tabIndex).toBe(-1);
    });

    it('要素にフォーカスを設定できる', () => {
      // Act
      manager.setFocus(mockElement);

      // Assert
      expect(mockElement.focus).toHaveBeenCalled();
    });

    it('キーボードナビゲーションハンドラを追加できる', () => {
      // Arrange
      const keyHandler = vi.fn();

      // Act
      manager.addKeyboardHandler(mockElement, keyHandler);

      // Assert
      expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', keyHandler);
    });

    it('Enterキーでのボタンアクティベーションをサポートできる', () => {
      // Arrange
      const clickHandler = vi.fn();
      
      // Act
      manager.enableEnterKeyActivation(mockElement, clickHandler);

      // Assert
      expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      // Simulate Enter key press
      const keydownHandler = (mockElement.addEventListener as any).mock.calls[0][1];
      const enterEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      
      keydownHandler(enterEvent);
      
      expect(clickHandler).toHaveBeenCalled();
      expect(enterEvent.preventDefault).toHaveBeenCalled();
    });

    it('Spaceキーでのボタンアクティベーションをサポートできる', () => {
      // Arrange
      const clickHandler = vi.fn();
      
      // Act
      manager.enableSpaceKeyActivation(mockElement, clickHandler);

      // Assert
      expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      // Simulate Space key press
      const keydownHandler = (mockElement.addEventListener as any).mock.calls[0][1];
      const spaceEvent = {
        key: ' ',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      
      keydownHandler(spaceEvent);
      
      expect(clickHandler).toHaveBeenCalled();
      expect(spaceEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('スクリーンリーダー対応', () => {
    it('ライブリージョンを作成できる', () => {
      // Act
      manager.createLiveRegion('omikuji-announcements');

      // Assert
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('id', 'omikuji-announcements');
      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-atomic', 'true');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLiveRegion);
    });

    it('ライブリージョンにメッセージを送信できる', () => {
      // Arrange
      manager.createLiveRegion('omikuji-announcements');

      // Act
      manager.announceToScreenReader('おみくじが選択されました', 'omikuji-announcements');

      // Assert
      expect(mockLiveRegion.textContent).toBe('おみくじが選択されました');
    });

    it('緊急メッセージを即座にアナウンスできる', () => {
      // Arrange
      manager.createLiveRegion('omikuji-urgent');

      // Act
      manager.announceUrgent('エラーが発生しました', 'omikuji-urgent');

      // Assert
      expect(mockLiveRegion.setAttribute).toHaveBeenCalledWith('aria-live', 'assertive');
      expect(mockLiveRegion.textContent).toBe('エラーが発生しました');
    });

    it('要素にスクリーンリーダー専用テキストを追加できる', () => {
      // Act
      manager.addScreenReaderText(mockElement, 'おみくじを選択してエンターキーを押してください');

      // Assert
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-description', 'おみくじを選択してエンターキーを押してください');
    });
  });

  describe('フォーカス管理', () => {
    it('フォーカストラップを作成できる', () => {
      // Arrange
      const container = {
        querySelectorAll: vi.fn().mockReturnValue([mockElement]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as any;

      // Act
      const trap = manager.createFocusTrap(container);

      // Assert - フォーカストラップオブジェクトが返される
      expect(trap).toEqual({
        activate: expect.any(Function),
        deactivate: expect.any(Function),
      });

      // Activateした時にイベントリスナーが追加される
      trap.activate();
      expect(container.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(mockElement.focus).toHaveBeenCalled();
    });

    it('フォーカス状態を復元できる', () => {
      // Arrange
      const previousElement = mockElement;

      // Act
      manager.saveFocus(previousElement);
      manager.restoreFocus();

      // Assert
      expect(mockElement.focus).toHaveBeenCalled();
    });

    it('ページ内の最初のフォーカス可能要素を見つけられる', () => {
      // Arrange
      Object.defineProperty(document, 'querySelector', {
        writable: true,
        value: vi.fn().mockReturnValue(mockElement),
      });

      // Act
      const firstElement = manager.findFirstFocusableElement();

      // Assert
      expect(document.querySelector).toHaveBeenCalledWith(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(firstElement).toBe(mockElement);
    });
  });

  describe('カラーコントラスト対応', () => {
    it('高コントラストモードを検出できる', () => {
      // Arrange
      (window.matchMedia as any).mockReturnValue({ matches: true });

      // Act
      const isHighContrast = manager.detectHighContrastMode();

      // Assert
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-contrast: high)');
      expect(isHighContrast).toBe(true);
    });

    it('ダークモード設定を検出できる', () => {
      // Arrange
      (window.matchMedia as any).mockReturnValue({ matches: true });

      // Act
      const isDarkMode = manager.detectDarkModePreference();

      // Assert
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(isDarkMode).toBe(true);
    });

    it('動きの軽減設定を検出できる', () => {
      // Arrange
      (window.matchMedia as any).mockReturnValue({ matches: true });

      // Act
      const prefersReducedMotion = manager.detectReducedMotionPreference();

      // Assert
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
      expect(prefersReducedMotion).toBe(true);
    });
  });

  describe('NFR-TOP-002 要件検証', () => {
    it('WCAG 2.1 AA準拠のためのARIA属性が設定できる', () => {
      // Act
      manager.ensureWCAGCompliance(mockElement, {
        role: 'button',
        label: 'エンジニア運勢おみくじ',
        description: '今日のコーディング運を占います'
      });

      // Assert
      expect(mockElement.setAttribute).toHaveBeenCalledWith('role', 'button');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-label', 'エンジニア運勢おみくじ');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-description', '今日のコーディング運を占います');
    });

    it('キーボードナビゲーション完全対応が確認できる', () => {
      // Arrange
      const clickHandler = vi.fn();

      // Act
      manager.enableFullKeyboardSupport(mockElement, clickHandler);

      // Assert
      expect(mockElement.tabIndex).toBe(0);
      expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('色覚多様性への配慮が実装できる', () => {
      // Act
      manager.addColorBlindAccessibilitySupport(mockElement, {
        primaryIndicator: 'icon',
        secondaryIndicator: 'pattern',
        textAlternative: '重要度: 高'
      });

      // Assert
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-color-blind-alt', '重要度: 高');
      expect(mockElement.classList.add).toHaveBeenCalledWith('has-icon-indicator');
      expect(mockElement.classList.add).toHaveBeenCalledWith('has-pattern-indicator');
    });
  });
});