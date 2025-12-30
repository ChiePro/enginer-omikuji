interface WCAGComplianceOptions {
  role?: string;
  label?: string;
  description?: string;
}

interface ColorBlindAccessibilityOptions {
  primaryIndicator: 'icon' | 'pattern' | 'text';
  secondaryIndicator?: 'icon' | 'pattern' | 'text';
  textAlternative: string;
}

interface FocusTrap {
  activate: () => void;
  deactivate: () => void;
}

export class AccessibilityManager {
  private liveRegions: Map<string, HTMLElement> = new Map();
  private savedFocus: HTMLElement | null = null;
  private focusTraps: Map<HTMLElement, FocusTrap> = new Map();

  constructor() {
    this.initializeGlobalAccessibilityFeatures();
  }

  private initializeGlobalAccessibilityFeatures(): void {
    // グローバルなアクセシビリティ設定の初期化
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
    }
  }

  private handleGlobalKeydown(event: KeyboardEvent): void {
    // グローバルなキーボードショートカット（例：Alt + 1でメインコンテンツにジャンプ）
    if (event.altKey && event.key === '1') {
      const mainContent = document.querySelector('main, [role="main"]') as HTMLElement;
      if (mainContent) {
        this.setFocus(mainContent);
        event.preventDefault();
      }
    }
  }

  // ARIA属性管理
  setAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
  }

  setAriaDescribedBy(element: HTMLElement, describedById: string): void {
    element.setAttribute('aria-describedby', describedById);
  }

  setAriaExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', expanded.toString());
  }

  setAriaPressed(element: HTMLElement, pressed: boolean): void {
    element.setAttribute('aria-pressed', pressed.toString());
  }

  setAriaDisabled(element: HTMLElement, disabled: boolean): void {
    element.setAttribute('aria-disabled', disabled.toString());
  }

  // キーボードナビゲーション
  makeFocusable(element: HTMLElement): void {
    element.tabIndex = 0;
  }

  makeNotFocusable(element: HTMLElement): void {
    element.tabIndex = -1;
  }

  setFocus(element: HTMLElement): void {
    element.focus();
  }

  addKeyboardHandler(element: HTMLElement, handler: (event: KeyboardEvent) => void): void {
    element.addEventListener('keydown', handler);
  }

  enableEnterKeyActivation(element: HTMLElement, clickHandler: () => void): void {
    this.addKeyboardHandler(element, (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        clickHandler();
      }
    });
  }

  enableSpaceKeyActivation(element: HTMLElement, clickHandler: () => void): void {
    this.addKeyboardHandler(element, (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        clickHandler();
      }
    });
  }

  enableFullKeyboardSupport(element: HTMLElement, clickHandler: () => void): void {
    this.makeFocusable(element);
    this.enableEnterKeyActivation(element, clickHandler);
    this.enableSpaceKeyActivation(element, clickHandler);
  }

  // スクリーンリーダー対応
  createLiveRegion(id: string, politeness: 'polite' | 'assertive' = 'polite'): HTMLElement {
    if (typeof document === 'undefined') {
      // サーバーサイドでは何もしない
      return {} as HTMLElement;
    }

    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('id', id);
    liveRegion.setAttribute('aria-live', politeness);
    liveRegion.setAttribute('aria-atomic', 'true');
    
    // スクリーンリーダー専用（視覚的に非表示）
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.top = 'auto';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';

    document.body.appendChild(liveRegion);
    this.liveRegions.set(id, liveRegion);
    
    return liveRegion;
  }

  announceToScreenReader(message: string, regionId: string): void {
    const region = this.liveRegions.get(regionId);
    if (region) {
      region.textContent = message;
    }
  }

  announceUrgent(message: string, regionId: string): void {
    let region = this.liveRegions.get(regionId);
    if (!region) {
      region = this.createLiveRegion(regionId, 'assertive');
    } else {
      region.setAttribute('aria-live', 'assertive');
    }
    region.textContent = message;
  }

  addScreenReaderText(element: HTMLElement, text: string): void {
    element.setAttribute('aria-description', text);
  }

  // フォーカス管理
  createFocusTrap(container: HTMLElement): FocusTrap {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab (backward)
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab (forward)
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    const trap: FocusTrap = {
      activate: () => {
        container.addEventListener('keydown', handleKeydown);
        if (firstElement) {
          firstElement.focus();
        }
      },
      deactivate: () => {
        container.removeEventListener('keydown', handleKeydown);
      }
    };

    this.focusTraps.set(container, trap);
    return trap;
  }

  saveFocus(element: HTMLElement): void {
    this.savedFocus = element;
  }

  restoreFocus(): void {
    if (this.savedFocus) {
      this.savedFocus.focus();
      this.savedFocus = null;
    }
  }

  findFirstFocusableElement(container?: HTMLElement): HTMLElement | null {
    const root = container || document;
    return root.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
  }

  // カラーコントラスト対応
  detectHighContrastMode(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  detectDarkModePreference(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  detectReducedMotionPreference(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // WCAG 2.1 AA準拠
  ensureWCAGCompliance(element: HTMLElement, options: WCAGComplianceOptions): void {
    if (options.role) {
      element.setAttribute('role', options.role);
    }
    if (options.label) {
      this.setAriaLabel(element, options.label);
    }
    if (options.description) {
      this.addScreenReaderText(element, options.description);
    }

    // フォーカス可能な要素に適切なtabIndexを設定
    if (['button', 'link', 'menuitem'].includes(options.role || '')) {
      this.makeFocusable(element);
    }
  }

  // 色覚多様性への配慮
  addColorBlindAccessibilitySupport(element: HTMLElement, options: ColorBlindAccessibilityOptions): void {
    // 色だけに依存しない情報伝達のための代替手段を追加
    element.setAttribute('data-color-blind-alt', options.textAlternative);

    // アイコンやパターンによる視覚的手がかりを追加
    if (options.primaryIndicator === 'icon') {
      element.classList.add('has-icon-indicator');
    } else if (options.primaryIndicator === 'pattern') {
      element.classList.add('has-pattern-indicator');
    }

    if (options.secondaryIndicator) {
      if (options.secondaryIndicator === 'icon') {
        element.classList.add('has-icon-indicator');
      } else if (options.secondaryIndicator === 'pattern') {
        element.classList.add('has-pattern-indicator');
      }
    }

    // スクリーンリーダー用の代替テキストを設定
    this.addScreenReaderText(element, options.textAlternative);
  }

  // リソースのクリーンアップ
  destroy(): void {
    // ライブリージョンの削除
    this.liveRegions.forEach((region) => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
    this.liveRegions.clear();

    // フォーカストラップの無効化
    this.focusTraps.forEach((trap) => {
      trap.deactivate();
    });
    this.focusTraps.clear();

    // グローバルイベントリスナーの削除
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.handleGlobalKeydown.bind(this));
    }
  }
}

// シングルトンインスタンス
export const accessibilityManager = new AccessibilityManager();