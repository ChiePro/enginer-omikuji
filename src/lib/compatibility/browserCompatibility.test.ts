import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserCompatibilityManager } from './browserCompatibility';

// Browser Environment Mock
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
});

// CSS Support Mock
Object.defineProperty(window, 'CSS', {
  writable: true,
  value: {
    supports: vi.fn(),
  },
});

// Feature Detection Mocks
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn(),
});

describe('BrowserCompatibilityManager', () => {
  let manager: BrowserCompatibilityManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new BrowserCompatibilityManager();
  });

  describe('ブラウザ検出', () => {
    it('Chromeブラウザを検出できる', () => {
      // Arrange
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      // Act
      const browserInfo = manager.detectBrowser();

      // Assert
      expect(browserInfo.name).toBe('Chrome');
      expect(browserInfo.isSupported).toBe(true);
    });

    it('Firefoxブラウザを検出できる', () => {
      // Arrange
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
      });

      // Act
      const browserInfo = manager.detectBrowser();

      // Assert
      expect(browserInfo.name).toBe('Firefox');
      expect(browserInfo.isSupported).toBe(true);
    });

    it('Safariブラウザを検出できる', () => {
      // Arrange
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      });

      // Act
      const browserInfo = manager.detectBrowser();

      // Assert
      expect(browserInfo.name).toBe('Safari');
      expect(browserInfo.isSupported).toBe(true);
    });

    it('Edgeブラウザを検出できる', () => {
      // Arrange
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      });

      // Act
      const browserInfo = manager.detectBrowser();

      // Assert
      expect(browserInfo.name).toBe('Edge');
      expect(browserInfo.isSupported).toBe(true);
    });

    it('サポート外ブラウザを検出できる', () => {
      // Arrange
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
      });

      // Act
      const browserInfo = manager.detectBrowser();

      // Assert
      expect(browserInfo.name).toBe('Unknown');
      expect(browserInfo.isSupported).toBe(false);
    });
  });

  describe('機能検出', () => {
    it('CSSグリッドサポートを検出できる', () => {
      // Arrange
      (window.CSS.supports as any).mockReturnValue(true);

      // Act
      const isSupported = manager.supportsCSSGrid();

      // Assert
      expect(window.CSS.supports).toHaveBeenCalledWith('display', 'grid');
      expect(isSupported).toBe(true);
    });

    it('フレックスボックスサポートを検出できる', () => {
      // Arrange
      (window.CSS.supports as any).mockReturnValue(true);

      // Act
      const isSupported = manager.supportsFlexbox();

      // Assert
      expect(window.CSS.supports).toHaveBeenCalledWith('display', 'flex');
      expect(isSupported).toBe(true);
    });

    it('IntersectionObserverサポートを検出できる', () => {
      // Act
      const isSupported = manager.supportsIntersectionObserver();

      // Assert
      expect(isSupported).toBe(true);
    });

    it('ResizeObserverサポートを検出できる', () => {
      // Act
      const isSupported = manager.supportsResizeObserver();

      // Assert
      expect(isSupported).toBe(true);
    });

    it('Web Animationsサポートを検出できる', () => {
      // Arrange
      Object.defineProperty(Element.prototype, 'animate', {
        writable: true,
        value: vi.fn(),
      });

      // Act
      const isSupported = manager.supportsWebAnimations();

      // Assert
      expect(isSupported).toBe(true);
    });

    it('ES6モジュールサポートを検出できる', () => {
      // Arrange - nomodule属性のサポート状況を模擬
      const script = {
        noModule: undefined, // ES6 modules supported
      };
      Object.defineProperty(document, 'createElement', {
        writable: true,
        value: vi.fn().mockReturnValue(script),
      });

      // Act
      const isSupported = manager.supportsES6Modules();

      // Assert
      expect(isSupported).toBe(true);
    });
  });

  describe('フォールバック実装', () => {
    it('CSSグリッド非対応時のフォールバックを提供できる', () => {
      // Arrange
      (window.CSS.supports as any).mockReturnValue(false);
      const element = {
        style: {},
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      } as any;

      // Act
      manager.applyGridFallback(element);

      // Assert
      expect(element.classList.add).toHaveBeenCalledWith('grid-fallback');
      expect(element.style.display).toBe('flex');
      expect(element.style.flexWrap).toBe('wrap');
    });

    it('フレックスボックス非対応時のフォールバックを提供できる', () => {
      // Arrange
      (window.CSS.supports as any).mockReturnValue(false);
      const element = {
        style: {},
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      } as any;

      // Act
      manager.applyFlexFallback(element);

      // Assert
      expect(element.classList.add).toHaveBeenCalledWith('flex-fallback');
      expect(element.style.display).toBe('table');
    });

    it('IntersectionObserver非対応時のフォールバックを提供できる', () => {
      // Arrange - IntersectionObserverが存在しない環境をシミュレート
      const originalIntersectionObserver = (window as any).IntersectionObserver;
      delete (window as any).IntersectionObserver;
      
      const callback = vi.fn();
      const element = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          x: 0, y: 0, width: 100, height: 100,
          top: 0, left: 0, bottom: 100, right: 100
        }),
      } as any;

      // Act
      const observer = manager.createIntersectionObserverFallback(callback);
      observer.observe(element);

      // Assert
      expect(observer).toEqual({
        observe: expect.any(Function),
        unobserve: expect.any(Function),
        disconnect: expect.any(Function),
      });

      // Cleanup
      (window as any).IntersectionObserver = originalIntersectionObserver;
    });

    it('ResizeObserver非対応時のフォールバックを提供できる', () => {
      // Arrange - ResizeObserverが存在しない環境をシミュレート
      const originalResizeObserver = (window as any).ResizeObserver;
      delete (window as any).ResizeObserver;
      
      const callback = vi.fn();
      const element = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          x: 0, y: 0, width: 100, height: 100,
          top: 0, left: 0, bottom: 100, right: 100
        }),
      } as any;

      // Act
      const observer = manager.createResizeObserverFallback(callback);
      observer.observe(element);

      // Assert
      expect(observer).toEqual({
        observe: expect.any(Function),
        unobserve: expect.any(Function),
        disconnect: expect.any(Function),
      });

      // Cleanup
      (window as any).ResizeObserver = originalResizeObserver;
    });
  });

  describe('ポリフィル適用', () => {
    it('必要なポリフィルを識別できる', () => {
      // Arrange
      (window.CSS.supports as any).mockReturnValue(false);
      const originalIntersectionObserver = (window as any).IntersectionObserver;
      delete (window as any).IntersectionObserver;

      // Act
      const polyfills = manager.getRequiredPolyfills();

      // Assert
      expect(polyfills).toContain('css-grid');
      expect(polyfills).toContain('flexbox');
      expect(polyfills).toContain('intersection-observer');

      // Cleanup
      (window as any).IntersectionObserver = originalIntersectionObserver;
    });

    it('ポリフィルを適用できる', async () => {
      // Arrange
      const polyfillLoader = vi.fn().mockResolvedValue(undefined);

      // Act
      await manager.applyPolyfills(['css-grid', 'flexbox'], polyfillLoader);

      // Assert
      expect(polyfillLoader).toHaveBeenCalledWith('css-grid');
      expect(polyfillLoader).toHaveBeenCalledWith('flexbox');
    });
  });

  describe('プログレッシブエンハンスメント', () => {
    it('基本機能の実装ができる', () => {
      // Arrange
      const element = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
        hasAttribute: vi.fn().mockReturnValue(false),
        setAttribute: vi.fn(),
        tagName: 'DIV',
      } as any;

      // Act
      manager.enableBasicFeatures(element);

      // Assert
      expect(element.classList.add).toHaveBeenCalledWith('basic-features');
      expect(element.setAttribute).toHaveBeenCalledWith('role', 'presentation');
    });

    it('拡張機能の段階的適用ができる', () => {
      // Arrange
      (window.CSS.supports as any).mockReturnValue(true);
      const element = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      } as any;

      // Act
      manager.enableEnhancedFeatures(element);

      // Assert
      expect(element.classList.add).toHaveBeenCalledWith('enhanced-features');
      expect(element.classList.add).toHaveBeenCalledWith('supports-grid');
      expect(element.classList.add).toHaveBeenCalledWith('supports-flex');
    });

    it('アニメーション機能の条件付き適用ができる', () => {
      // Arrange
      Object.defineProperty(Element.prototype, 'animate', {
        writable: true,
        value: vi.fn(),
      });
      const element = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
        animate: vi.fn(),
      } as any;

      // Act
      manager.enableAnimationFeatures(element);

      // Assert
      expect(element.classList.add).toHaveBeenCalledWith('supports-animations');
    });

    it('レスポンシブ機能の段階的適用ができる', () => {
      // Arrange
      const element = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      } as any;

      // Act
      manager.enableResponsiveFeatures(element);

      // Assert
      expect(element.classList.add).toHaveBeenCalledWith('responsive-enhanced');
    });
  });

  describe('デバイス対応', () => {
    it('モバイルデバイスを検出できる', () => {
      // Arrange
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      // Act
      const isMobile = manager.isMobileDevice();

      // Assert
      expect(isMobile).toBe(true);
    });

    it('タブレットデバイスを検出できる', () => {
      // Arrange
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      // Act
      const isTablet = manager.isTabletDevice();

      // Assert
      expect(isTablet).toBe(true);
    });

    it('タッチサポートを検出できる', () => {
      // Arrange
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        value: null,
      });

      // Act
      const hasTouch = manager.supportsTouchEvents();

      // Assert
      expect(hasTouch).toBe(true);
    });

    it('ビューポート幅に基づく対応を提供できる', () => {
      // Arrange
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 320,
      });
      const element = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      } as any;

      // Act
      manager.applyViewportBasedFeatures(element);

      // Assert
      expect(element.classList.add).toHaveBeenCalledWith('viewport-mobile');
    });
  });

  describe('NFR-TOP-003 要件検証', () => {
    it('モダンブラウザサポートが確認できる', () => {
      // Arrange - Chrome userAgentを設定
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      (window.CSS.supports as any).mockReturnValue(true);
      const supportedBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];

      // Act
      const compatibility = manager.checkModernBrowserSupport();

      // Assert
      expect(compatibility.isModernBrowser).toBe(true);
      expect(supportedBrowsers).toContain(compatibility.browserName);
    });

    it('レスポンシブデザインサポートが確認できる', () => {
      // Arrange
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockReturnValue({ matches: true }),
      });
      Object.defineProperty(document, 'querySelector', {
        writable: true,
        value: vi.fn().mockReturnValue({}), // viewport meta exists
      });

      // Act
      const responsiveSupport = manager.checkResponsiveDesignSupport();

      // Assert
      expect(responsiveSupport.supportsMediaQueries).toBe(true);
      expect(responsiveSupport.supportsViewportMeta).toBe(true);
      expect(responsiveSupport.minWidth).toBe(320);
    });

    it('CSSフォールバック機能が動作する', () => {
      // Arrange
      (window.CSS.supports as any).mockReturnValue(false);
      const element = {
        classList: { add: vi.fn(), remove: vi.fn() },
        style: {},
      } as any;

      // Act
      manager.applyCSSFallbacks(element);

      // Assert
      expect(element.classList.add).toHaveBeenCalledWith('css-fallback');
    });
  });
});