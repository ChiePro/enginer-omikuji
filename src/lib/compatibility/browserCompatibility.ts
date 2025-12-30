interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
}

interface ResponsiveSupport {
  supportsMediaQueries: boolean;
  supportsViewportMeta: boolean;
  minWidth: number;
}

interface ModernBrowserSupport {
  isModernBrowser: boolean;
  browserName: string;
  features: {
    cssGrid: boolean;
    flexbox: boolean;
    webAnimations: boolean;
    intersectionObserver: boolean;
    resizeObserver: boolean;
  };
}

interface ObserverFallback {
  observe: (element: Element) => void;
  unobserve: (element: Element) => void;
  disconnect: () => void;
}

type PolyfillLoader = (polyfillName: string) => Promise<void>;

export class BrowserCompatibilityManager {
  private supportedBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  private observedElements = new Set<Element>();
  private fallbackObservers = new Map<string, ObserverFallback>();

  constructor() {
    this.initializeCompatibility();
  }

  private initializeCompatibility(): void {
    if (typeof window !== 'undefined') {
      this.setupGlobalFallbacks();
      this.applyInitialCompatibilityClasses();
    }
  }

  private setupGlobalFallbacks(): void {
    // グローバルなフォールバック設定
    if (!this.supportsES6Modules()) {
      document.documentElement.classList.add('no-es6-modules');
    }
    
    if (this.supportsTouchEvents()) {
      document.documentElement.classList.add('touch-device');
    }
  }

  private applyInitialCompatibilityClasses(): void {
    const browserInfo = this.detectBrowser();
    document.documentElement.classList.add(`browser-${browserInfo.name.toLowerCase()}`);

    if (this.isMobileDevice()) {
      document.documentElement.classList.add('mobile-device');
    } else if (this.isTabletDevice()) {
      document.documentElement.classList.add('tablet-device');
    } else {
      document.documentElement.classList.add('desktop-device');
    }
  }

  // ブラウザ検出
  detectBrowser(): BrowserInfo {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Edg/')) {
      return {
        name: 'Edge',
        version: this.extractVersion(userAgent, /Edg\/(\d+)/),
        isSupported: true,
      };
    } else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
      return {
        name: 'Chrome',
        version: this.extractVersion(userAgent, /Chrome\/(\d+)/),
        isSupported: true,
      };
    } else if (userAgent.includes('Firefox/')) {
      return {
        name: 'Firefox',
        version: this.extractVersion(userAgent, /Firefox\/(\d+)/),
        isSupported: true,
      };
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
      return {
        name: 'Safari',
        version: this.extractVersion(userAgent, /Version\/(\d+)/),
        isSupported: true,
      };
    }

    return {
      name: 'Unknown',
      version: '0',
      isSupported: false,
    };
  }

  private extractVersion(userAgent: string, regex: RegExp): string {
    const match = userAgent.match(regex);
    return match ? match[1] : '0';
  }

  // 機能検出
  supportsCSSGrid(): boolean {
    if (typeof window === 'undefined' || !window.CSS?.supports) {
      return false;
    }
    return window.CSS.supports('display', 'grid');
  }

  supportsFlexbox(): boolean {
    if (typeof window === 'undefined' || !window.CSS?.supports) {
      return false;
    }
    return window.CSS.supports('display', 'flex');
  }

  supportsIntersectionObserver(): boolean {
    return typeof window !== 'undefined' && 'IntersectionObserver' in window;
  }

  supportsResizeObserver(): boolean {
    return typeof window !== 'undefined' && 'ResizeObserver' in window;
  }

  supportsWebAnimations(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Element.prototype.animateの存在を確認
    return 'animate' in Element.prototype;
  }

  supportsES6Modules(): boolean {
    if (typeof document === 'undefined') return false;
    
    const script = document.createElement('script');
    return 'noModule' in script;
  }

  // フォールバック実装
  applyGridFallback(element: HTMLElement): void {
    if (!this.supportsCSSGrid()) {
      element.classList.add('grid-fallback');
      element.style.display = 'flex';
      element.style.flexWrap = 'wrap';
    }
  }

  applyFlexFallback(element: HTMLElement): void {
    if (!this.supportsFlexbox()) {
      element.classList.add('flex-fallback');
      element.style.display = 'table';
    }
  }

  createIntersectionObserverFallback(callback: IntersectionObserverCallback): ObserverFallback {
    if (this.supportsIntersectionObserver()) {
      const realObserver = new IntersectionObserver(callback);
      return {
        observe: (element: Element) => realObserver.observe(element),
        unobserve: (element: Element) => realObserver.unobserve(element),
        disconnect: () => realObserver.disconnect(),
      };
    }

    // フォールバック実装
    return {
      observe: (element: Element) => {
        this.observedElements.add(element);
        // 即座にコールバックを実行（要素が表示されているものとして扱う）
        setTimeout(() => {
          callback([{
            target: element,
            isIntersecting: true,
            intersectionRatio: 1,
            boundingClientRect: element.getBoundingClientRect(),
            rootBounds: null,
            intersectionRect: element.getBoundingClientRect(),
            time: Date.now(),
          } as IntersectionObserverEntry], this as any);
        }, 0);
      },
      unobserve: (element: Element) => {
        this.observedElements.delete(element);
      },
      disconnect: () => {
        this.observedElements.clear();
      },
    };
  }

  createResizeObserverFallback(callback: ResizeObserverCallback): ObserverFallback {
    if (this.supportsResizeObserver()) {
      const realObserver = new ResizeObserver(callback);
      return {
        observe: (element: Element) => realObserver.observe(element),
        unobserve: (element: Element) => realObserver.unobserve(element),
        disconnect: () => realObserver.disconnect(),
      };
    }

    // フォールバック実装（window.resizeイベントを使用）
    const handleResize = () => {
      const entries: ResizeObserverEntry[] = [];
      this.observedElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        entries.push({
          target: element,
          contentRect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
          } as DOMRectReadOnly,
          borderBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }] as any,
          contentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }] as any,
          devicePixelContentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }] as any,
        });
      });
      
      if (entries.length > 0) {
        callback(entries, this as any);
      }
    };

    return {
      observe: (element: Element) => {
        this.observedElements.add(element);
        if (this.observedElements.size === 1) {
          window.addEventListener('resize', handleResize);
        }
        // 初回実行
        setTimeout(handleResize, 0);
      },
      unobserve: (element: Element) => {
        this.observedElements.delete(element);
        if (this.observedElements.size === 0) {
          window.removeEventListener('resize', handleResize);
        }
      },
      disconnect: () => {
        window.removeEventListener('resize', handleResize);
        this.observedElements.clear();
      },
    };
  }

  // ポリフィル適用
  getRequiredPolyfills(): string[] {
    const polyfills: string[] = [];

    if (!this.supportsCSSGrid()) {
      polyfills.push('css-grid');
    }

    if (!this.supportsFlexbox()) {
      polyfills.push('flexbox');
    }

    if (!this.supportsIntersectionObserver()) {
      polyfills.push('intersection-observer');
    }

    if (!this.supportsResizeObserver()) {
      polyfills.push('resize-observer');
    }

    if (!this.supportsWebAnimations()) {
      polyfills.push('web-animations');
    }

    return polyfills;
  }

  async applyPolyfills(polyfills: string[], loader: PolyfillLoader): Promise<void> {
    for (const polyfill of polyfills) {
      try {
        await loader(polyfill);
      } catch (error) {
        console.warn(`Failed to load polyfill: ${polyfill}`, error);
      }
    }
  }

  // プログレッシブエンハンスメント
  enableBasicFeatures(element: HTMLElement): void {
    element.classList.add('basic-features');
    
    // 基本的なアクセシビリティ機能
    if (!element.hasAttribute('role') && element.tagName === 'DIV') {
      element.setAttribute('role', 'presentation');
    }
  }

  enableEnhancedFeatures(element: HTMLElement): void {
    element.classList.add('enhanced-features');

    if (this.supportsCSSGrid()) {
      element.classList.add('supports-grid');
    }

    if (this.supportsFlexbox()) {
      element.classList.add('supports-flex');
    }

    if (this.supportsIntersectionObserver()) {
      element.classList.add('supports-intersection-observer');
    }

    if (this.supportsResizeObserver()) {
      element.classList.add('supports-resize-observer');
    }
  }

  enableAnimationFeatures(element: HTMLElement): void {
    if (this.supportsWebAnimations()) {
      element.classList.add('supports-animations');
    } else {
      // フォールバック：CSS transitionsを使用
      element.classList.add('css-transitions-only');
    }

    // 動きの軽減設定を考慮
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.classList.add('reduced-motion');
    }
  }

  enableResponsiveFeatures(element: HTMLElement): void {
    element.classList.add('responsive-enhanced');

    // コンテナクエリサポートの確認
    if (this.supportsContainerQueries()) {
      element.classList.add('supports-container-queries');
    }

    // ビューポート単位サポートの確認
    if (this.supportsViewportUnits()) {
      element.classList.add('supports-viewport-units');
    }
  }

  private supportsContainerQueries(): boolean {
    if (typeof window === 'undefined' || !window.CSS?.supports) {
      return false;
    }
    return window.CSS.supports('container-type', 'inline-size');
  }

  private supportsViewportUnits(): boolean {
    if (typeof window === 'undefined' || !window.CSS?.supports) {
      return false;
    }
    return window.CSS.supports('width', '100vh');
  }

  // デバイス対応
  isMobileDevice(): boolean {
    const userAgent = navigator.userAgent;
    return /iPhone|iPod|Android|BlackBerry|Opera Mini|IEMobile|WPDesktop/i.test(userAgent);
  }

  isTabletDevice(): boolean {
    const userAgent = navigator.userAgent;
    return /iPad|Android(?!.*Mobile)/i.test(userAgent);
  }

  supportsTouchEvents(): boolean {
    return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }

  applyViewportBasedFeatures(element: HTMLElement): void {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    
    if (width < 576) {
      element.classList.add('viewport-mobile');
    } else if (width < 768) {
      element.classList.add('viewport-small');
    } else if (width < 992) {
      element.classList.add('viewport-medium');
    } else if (width < 1200) {
      element.classList.add('viewport-large');
    } else {
      element.classList.add('viewport-xl');
    }

    // NFR-TOP-003の最小幅要件（320px〜）
    if (width < 320) {
      element.classList.add('viewport-too-narrow');
      console.warn('Viewport width is below minimum requirement (320px)');
    }
  }

  // NFR-TOP-003 要件検証
  checkModernBrowserSupport(): ModernBrowserSupport {
    const browserInfo = this.detectBrowser();
    
    return {
      isModernBrowser: this.supportedBrowsers.includes(browserInfo.name),
      browserName: browserInfo.name,
      features: {
        cssGrid: this.supportsCSSGrid(),
        flexbox: this.supportsFlexbox(),
        webAnimations: this.supportsWebAnimations(),
        intersectionObserver: this.supportsIntersectionObserver(),
        resizeObserver: this.supportsResizeObserver(),
      },
    };
  }

  checkResponsiveDesignSupport(): ResponsiveSupport {
    return {
      supportsMediaQueries: this.supportsMediaQueries(),
      supportsViewportMeta: this.supportsViewportMeta(),
      minWidth: 320, // NFR-TOP-003要件
    };
  }

  private supportsMediaQueries(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('only screen').matches;
  }

  private supportsViewportMeta(): boolean {
    if (typeof document === 'undefined') return false;
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    return viewportMeta !== null;
  }

  applyCSSFallbacks(element: HTMLElement): void {
    element.classList.add('css-fallback');
    
    this.applyGridFallback(element);
    this.applyFlexFallback(element);
    
    // CSS custom properties fallback
    if (!this.supportsCSSCustomProperties()) {
      element.classList.add('no-custom-properties');
    }
  }

  private supportsCSSCustomProperties(): boolean {
    if (typeof window === 'undefined' || !window.CSS?.supports) {
      return false;
    }
    return window.CSS.supports('(--test: red)');
  }

  // リソースクリーンアップ
  destroy(): void {
    this.observedElements.clear();
    this.fallbackObservers.forEach((observer) => observer.disconnect());
    this.fallbackObservers.clear();
  }
}

// シングルトンインスタンス
export const browserCompatibility = new BrowserCompatibilityManager();