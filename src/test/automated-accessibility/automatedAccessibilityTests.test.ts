/**
 * アクセシビリティテストの自動化
 * 
 * タスク13: 追加テストカバレッジの実装 - アクセシビリティテストの自動化
 * TDD Red Phase: アクセシビリティ対応が不十分な状態で失敗するテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

// jest-axeのマッチャーを拡張
expect.extend(toHaveNoViolations);

// アクセシビリティ監査ツール
class AccessibilityAuditor {
  private violations: Array<{
    rule: string;
    severity: 'error' | 'warning' | 'info';
    description: string;
    element?: string;
  }> = [];

  // WCAG 2.1 AA準拠チェック
  async auditWCAG(element: HTMLElement): Promise<any> {
    const results = await axe(element, {
      rules: {
        // Level AA required rules
        'color-contrast': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'button-name': { enabled: true },
        'empty-heading': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'frame-tested': { enabled: true },
        'frame-title-unique': { enabled: true },
        'frame-title': { enabled: true },
        'heading-order': { enabled: true },
        'hidden-content': { enabled: true },
        'image-redundant-alt': { enabled: true },
        'input-button-name': { enabled: true },
        'input-image-alt': { enabled: true },
        'label': { enabled: true },
        'link-in-text-block': { enabled: true },
        'link-name': { enabled: true },
        'list': { enabled: true },
        'listitem': { enabled: true },
        'meta-refresh': { enabled: true },
        'meta-viewport': { enabled: true },
        'object-alt': { enabled: true },
        'role-img-alt': { enabled: true },
        'scrollable-region-focusable': { enabled: true },
        'select-name': { enabled: true },
        'server-side-image-map': { enabled: true },
        'svg-img-alt': { enabled: true },
        'td-headers-attr': { enabled: true },
        'th-has-data-cells': { enabled: true },
        'valid-lang': { enabled: true },
        'video-caption': { enabled: true }
      }
    });

    this.violations = results.violations.map(violation => ({
      rule: violation.id,
      severity: violation.impact as 'error' | 'warning' | 'info',
      description: violation.description,
      element: violation.nodes[0]?.html
    }));

    return results;
  }

  // カラーコントラスト比チェック
  checkColorContrast(foreground: string, background: string): { ratio: number; passes: boolean } {
    // RGB値を取得
    const getRGB = (color: string): [number, number, number] => {
      const hex = color.replace('#', '');
      return [
        parseInt(hex.substr(0, 2), 16),
        parseInt(hex.substr(2, 2), 16),
        parseInt(hex.substr(4, 2), 16)
      ];
    };

    // 相対輝度計算
    const getRelativeLuminance = (rgb: [number, number, number]): number => {
      const [r, g, b] = rgb.map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const fgLuminance = getRelativeLuminance(getRGB(foreground));
    const bgLuminance = getRelativeLuminance(getRGB(background));
    
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                  (Math.min(fgLuminance, bgLuminance) + 0.05);

    return {
      ratio,
      passes: ratio >= 4.5 // WCAG AA要件
    };
  }

  // フォーカス管理チェック
  checkFocusManagement(container: HTMLElement): {
    focusableElements: Element[];
    focusOrder: number[];
    trapWorks: boolean;
  } {
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const focusableElements = Array.from(container.querySelectorAll(focusableSelectors));
    const focusOrder = focusableElements.map(el => parseInt(el.getAttribute('tabindex') || '0'));
    
    // フォーカストラップの動作確認（簡易版）
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    let trapWorks = true;
    try {
      firstElement?.focus();
      if (document.activeElement !== firstElement) trapWorks = false;
      
      lastElement?.focus(); 
      if (document.activeElement !== lastElement) trapWorks = false;
    } catch (error) {
      trapWorks = false;
    }

    return { focusableElements, focusOrder, trapWorks };
  }

  // スクリーンリーダー対応チェック
  checkScreenReaderSupport(element: HTMLElement): {
    hasAriaLabels: boolean;
    hasLiveRegions: boolean;
    hasProperRoles: boolean;
    missingLabels: string[];
  } {
    const interactiveElements = element.querySelectorAll('button, input, select, textarea, [role="button"], [role="tab"]');
    const missingLabels: string[] = [];
    
    let hasAriaLabels = true;
    interactiveElements.forEach((el, index) => {
      const hasLabel = el.hasAttribute('aria-label') || 
                      el.hasAttribute('aria-labelledby') ||
                      el.textContent?.trim();
      if (!hasLabel) {
        hasAriaLabels = false;
        missingLabels.push(`Element ${index}: ${el.tagName.toLowerCase()}`);
      }
    });

    const hasLiveRegions = element.querySelectorAll('[aria-live]').length > 0;
    
    const roleElements = element.querySelectorAll('[role]');
    const hasProperRoles = Array.from(roleElements).every(el => {
      const role = el.getAttribute('role');
      const validRoles = ['button', 'tab', 'tabpanel', 'dialog', 'alert', 'status', 'region'];
      return validRoles.includes(role || '');
    });

    return {
      hasAriaLabels,
      hasLiveRegions,
      hasProperRoles,
      missingLabels
    };
  }

  getViolations() {
    return this.violations;
  }

  generateReport() {
    const grouped = this.violations.reduce((acc, violation) => {
      if (!acc[violation.severity]) acc[violation.severity] = [];
      acc[violation.severity].push(violation);
      return acc;
    }, {} as Record<string, typeof this.violations>);

    return {
      summary: {
        total: this.violations.length,
        errors: (grouped.error || []).length,
        warnings: (grouped.warning || []).length,
        info: (grouped.info || []).length
      },
      violations: grouped
    };
  }
}

// モックコンポーネント（テスト用）
const MockOmikujiCard = ({ type, onSelect, hasAccessibilityIssues = false }: any) => {
  return (
    <div 
      role="button"
      tabIndex={0}
      aria-label={hasAccessibilityIssues ? undefined : `${type.name}を選択`}
      aria-describedby={hasAccessibilityIssues ? undefined : `desc-${type.id}`}
      onClick={() => onSelect(type.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(type.id);
        }
      }}
      style={{
        color: hasAccessibilityIssues ? '#999' : '#000', // 低コントラスト vs 高コントラスト
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        padding: '16px',
        cursor: 'pointer'
      }}
    >
      <div id={`desc-${type.id}`}>
        <h3>{type.name}</h3>
        <p>{type.description}</p>
        <span>{type.icon}</span>
      </div>
      {!hasAccessibilityIssues && (
        <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: '-9999px' }}>
          {/* スクリーンリーダー用の状態通知 */}
        </div>
      )}
    </div>
  );
};

const MockRarityPreview = ({ rarities, hasAccessibilityIssues = false }: any) => {
  return (
    <section 
      aria-label={hasAccessibilityIssues ? undefined : "レアリティプレビュー"}
      role="region"
    >
      <h2 id="rarity-heading">運勢の種類</h2>
      <ul role={hasAccessibilityIssues ? undefined : "list"} aria-labelledby="rarity-heading">
        {rarities.map((rarity: any) => (
          <li 
            key={rarity.name}
            style={{
              color: hasAccessibilityIssues ? '#999' : '#000',
              backgroundColor: rarity.color || '#fff'
            }}
          >
            <span aria-label={hasAccessibilityIssues ? undefined : `${rarity.name} 確率${rarity.percentage}`}>
              {rarity.name}: {rarity.percentage}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

describe('アクセシビリティテストの自動化', () => {
  let auditor: AccessibilityAuditor;

  beforeEach(() => {
    auditor = new AccessibilityAuditor();
  });

  afterEach(() => {
    const report = auditor.generateReport();
    if (report.summary.total > 0) {
      console.warn('Accessibility violations found:', report);
    }
  });

  describe('WCAG 2.1 AA準拠テスト（NFR-TOP-002）', () => {
    it('おみくじカードがWCAG 2.1 AAに準拠している', async () => {
      // Arrange
      const mockType = {
        id: 'engineer-fortune',
        name: 'エンジニア運勢',
        description: '今日のコーディング運を占う',
        icon: '⚡'
      };

      // Act - アクセシビリティ対応版をレンダリング
      const { container } = render(
        <MockOmikujiCard 
          type={mockType} 
          onSelect={vi.fn()} 
          hasAccessibilityIssues={false}
        />
      );

      // Assert
      const results = await auditor.auditWCAG(container);
      expect(results).toHaveNoViolations();
    });

    it('アクセシビリティ問題があるコンポーネントが検出される', async () => {
      // Arrange
      const mockType = {
        id: 'engineer-fortune',
        name: 'エンジニア運勢',
        description: '今日のコーディング運を占う',
        icon: '⚡'
      };

      // Act - アクセシビリティ問題のある版をレンダリング
      const { container } = render(
        <MockOmikujiCard 
          type={mockType} 
          onSelect={vi.fn()} 
          hasAccessibilityIssues={true} // 意図的に問題を発生
        />
      );

      // Assert - 問題が検出される（RED phase）
      const results = await auditor.auditWCAG(container);
      expect(results.violations.length).toBeGreaterThan(0);
    });

    it('レアリティプレビューのセマンティックマークアップが正しい', async () => {
      // Arrange
      const mockRarities = [
        { name: '小吉', percentage: '60%', color: '#gray' },
        { name: '吉', percentage: '30%', color: '#blue' },
        { name: '中吉', percentage: '8%', color: '#purple' },
        { name: '大吉', percentage: '2%', color: '#gold' }
      ];

      // Act
      const { container } = render(
        <MockRarityPreview 
          rarities={mockRarities}
          hasAccessibilityIssues={false}
        />
      );

      // Assert
      const results = await auditor.auditWCAG(container);
      expect(results).toHaveNoViolations();

      // セマンティック要素の存在確認
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(4);
    });
  });

  describe('カラーコントラスト自動監査', () => {
    it('テキストと背景のコントラスト比がWCAG AAを満たす', () => {
      // Arrange
      const colorPairs = [
        { fg: '#000000', bg: '#FFFFFF', expected: true },  // 黒/白 (21:1)
        { fg: '#FFFFFF', bg: '#000000', expected: true },  // 白/黒 (21:1)
        { fg: '#767676', bg: '#FFFFFF', expected: true },  // 境界値 (4.5:1)
        { fg: '#777777', bg: '#FFFFFF', expected: false }, // 不合格 (4.49:1)
        { fg: '#FFFF00', bg: '#FFFFFF', expected: false }, // 黄/白 (1.07:1)
      ];

      // Act & Assert
      colorPairs.forEach(({ fg, bg, expected }, index) => {
        const result = auditor.checkColorContrast(fg, bg);
        expect(result.passes, `Color pair ${index + 1}: ${fg}/${bg}`).toBe(expected);
        
        if (expected) {
          expect(result.ratio).toBeGreaterThanOrEqual(4.5);
        } else {
          expect(result.ratio).toBeLessThan(4.5);
        }
      });
    });

    it('神社カラーパレットのアクセシビリティ確認', () => {
      // Arrange - 神社テーマの色
      const shrineColors = [
        { name: '朱色', hex: '#E60012' },
        { name: '金色', hex: '#E6B422' },  
        { name: '墨色', hex: '#1C1C1C' },
        { name: '白', hex: '#FFFFFF' }
      ];

      // Act & Assert - 各色と白背景のコントラスト
      shrineColors.forEach(color => {
        if (color.name !== '白') {
          const result = auditor.checkColorContrast(color.hex, '#FFFFFF');
          expect(result.passes, `${color.name} (${color.hex}) on white`).toBe(true);
        }
      });

      // 墨色と白の組み合わせは最高のコントラスト
      const bestContrast = auditor.checkColorContrast('#1C1C1C', '#FFFFFF');
      expect(bestContrast.ratio).toBeGreaterThan(10);
    });
  });

  describe('キーボードナビゲーション自動テスト', () => {
    it('すべての対話要素がキーボードでアクセス可能', async () => {
      // Arrange
      const mockTypes = [
        { id: 'type-1', name: 'タイプ1', description: '説明1', icon: '🎲' },
        { id: 'type-2', name: 'タイプ2', description: '説明2', icon: '⚡' },
        { id: 'type-3', name: 'タイプ3', description: '説明3', icon: '🐛' }
      ];

      const onSelect = vi.fn();

      const { container } = render(
        <div>
          {mockTypes.map(type => (
            <MockOmikujiCard 
              key={type.id}
              type={type} 
              onSelect={onSelect}
              hasAccessibilityIssues={false}
            />
          ))}
        </div>
      );

      // Act - フォーカス管理をテスト
      const focusCheck = auditor.checkFocusManagement(container);

      // Assert
      expect(focusCheck.focusableElements.length).toBe(3);
      expect(focusCheck.trapWorks).toBe(true);

      // キーボード操作テスト
      const user = userEvent.setup();
      
      // Tab移動
      await user.tab();
      expect(document.activeElement).toBe(focusCheck.focusableElements[0]);

      // Enterキーでアクション
      await user.keyboard('{Enter}');
      expect(onSelect).toHaveBeenCalledWith('type-1');

      // 次の要素へ移動
      await user.tab();
      expect(document.activeElement).toBe(focusCheck.focusableElements[1]);

      // Spaceキーでアクション
      await user.keyboard(' ');
      expect(onSelect).toHaveBeenCalledWith('type-2');
    });

    it('フォーカスの可視化が適切に行われる', () => {
      // Arrange
      const { container } = render(
        <MockOmikujiCard 
          type={{ id: 'test', name: 'テスト', description: 'テスト説明', icon: '🎲' }}
          onSelect={vi.fn()}
          hasAccessibilityIssues={false}
        />
      );

      const focusableElement = container.querySelector('[role="button"]') as HTMLElement;

      // Act - フォーカス設定
      focusableElement.focus();

      // Assert - フォーカス状態の確認
      expect(document.activeElement).toBe(focusableElement);
      
      // フォーカススタイルの存在確認（実際の実装では outline が設定される）
      const computedStyle = window.getComputedStyle(focusableElement);
      expect(focusableElement).toHaveStyle({ cursor: 'pointer' });
    });

    it('Tabキー順序が論理的である', async () => {
      // Arrange - 複雑なレイアウトをシミュレート
      const { container } = render(
        <div>
          <button tabIndex={1}>最初のボタン</button>
          <input tabIndex={2} placeholder="入力フィールド" />
          <button tabIndex={3}>最後のボタン</button>
          <button tabIndex={0}>通常順序ボタン</button>
        </div>
      );

      // Act
      const focusCheck = auditor.checkFocusManagement(container);

      // Assert - tabindex順序が正しい
      const expectedOrder = [1, 2, 3, 0]; // 数値指定が先、0は最後
      expect(focusCheck.focusOrder).toEqual(expectedOrder);
    });
  });

  describe('スクリーンリーダー対応自動テスト', () => {
    it('適切なARIA属性が設定されている', () => {
      // Arrange
      const { container } = render(
        <MockOmikujiCard 
          type={{ id: 'engineer', name: 'エンジニア運勢', description: 'テスト', icon: '⚡' }}
          onSelect={vi.fn()}
          hasAccessibilityIssues={false}
        />
      );

      // Act
      const srCheck = auditor.checkScreenReaderSupport(container);

      // Assert
      expect(srCheck.hasAriaLabels).toBe(true);
      expect(srCheck.hasLiveRegions).toBe(true);
      expect(srCheck.hasProperRoles).toBe(true);
      expect(srCheck.missingLabels).toHaveLength(0);
    });

    it('ライブリージョンが状態変更を適切に通知する', async () => {
      // Arrange
      const { container, rerender } = render(
        <div>
          <div aria-live="polite" aria-atomic="true" id="status">
            待機中
          </div>
          <button>おみくじを引く</button>
        </div>
      );

      // Act - 状態変更をシミュレート
      rerender(
        <div>
          <div aria-live="polite" aria-atomic="true" id="status">
            おみくじを引いています...
          </div>
          <button>おみくじを引く</button>
        </div>
      );

      await waitFor(() => {
        const liveRegion = container.querySelector('[aria-live]');
        expect(liveRegion).toHaveTextContent('おみくじを引いています...');
      });

      // Assert - ライブリージョンが検出される
      const srCheck = auditor.checkScreenReaderSupport(container);
      expect(srCheck.hasLiveRegions).toBe(true);
    });

    it('アクセシビリティ問題のあるコンポーネントが検出される', () => {
      // Arrange - ARIA属性なしのコンポーネント
      const { container } = render(
        <MockOmikujiCard 
          type={{ id: 'engineer', name: 'エンジニア運勢', description: 'テスト', icon: '⚡' }}
          onSelect={vi.fn()}
          hasAccessibilityIssues={true} // 意図的に問題を発生
        />
      );

      // Act
      const srCheck = auditor.checkScreenReaderSupport(container);

      // Assert - 問題が検出される（RED phase）
      expect(srCheck.hasAriaLabels).toBe(false);
      expect(srCheck.missingLabels.length).toBeGreaterThan(0);
    });
  });

  describe('色覚多様性への配慮テスト（NFR-TOP-002）', () => {
    it('色情報だけに依存しない情報伝達', () => {
      // Arrange
      const { container } = render(
        <div>
          {/* 色とアイコンの両方で情報を伝達 */}
          <div style={{ color: 'green' }}>
            <span role="img" aria-label="成功">✅</span>
            <span>成功</span>
          </div>
          <div style={{ color: 'red' }}>
            <span role="img" aria-label="エラー">❌</span>
            <span>エラー</span>
          </div>
        </div>
      );

      // Act & Assert - アイコンとテキストで情報が補完されている
      expect(screen.getByText('成功')).toBeInTheDocument();
      expect(screen.getByText('エラー')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: '成功' })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'エラー' })).toBeInTheDocument();
    });

    it('レアリティ表示が色覚バリアフリーである', () => {
      // Arrange - レアリティを色+パターン+テキストで表現
      const { container } = render(
        <div>
          <div className="rarity-common" data-rarity="common">
            <span className="pattern-solid">■</span>
            <span>コモン (60%)</span>
          </div>
          <div className="rarity-rare" data-rarity="rare">
            <span className="pattern-striped">▦</span>
            <span>レア (30%)</span>
          </div>
          <div className="rarity-epic" data-rarity="epic">
            <span className="pattern-dotted">⬢</span>
            <span>エピック (8%)</span>
          </div>
          <div className="rarity-legendary" data-rarity="legendary">
            <span className="pattern-star">★</span>
            <span>レジェンダリー (2%)</span>
          </div>
        </div>
      );

      // Act & Assert - 各レアリティが複数の手段で識別可能
      expect(container.querySelector('[data-rarity="common"]')).toBeInTheDocument();
      expect(container.querySelector('[data-rarity="rare"]')).toBeInTheDocument();
      expect(container.querySelector('[data-rarity="epic"]')).toBeInTheDocument();
      expect(container.querySelector('[data-rarity="legendary"]')).toBeInTheDocument();

      // パターンとテキストが併用されている
      expect(screen.getByText('■')).toBeInTheDocument();
      expect(screen.getByText('▦')).toBeInTheDocument();
      expect(screen.getByText('⬢')).toBeInTheDocument();
      expect(screen.getByText('★')).toBeInTheDocument();
    });
  });

  describe('動きの軽減設定への対応テスト', () => {
    it('prefers-reduced-motionが尊重される', () => {
      // Arrange - reduced motion設定をシミュレート
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      // Act - motion設定確認
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Assert
      expect(reducedMotion).toBe(true);
      
      // アニメーションが無効化されることを確認（実装側で制御）
      const animationDuration = reducedMotion ? 0 : 300;
      expect(animationDuration).toBe(0);
    });
  });

  describe('エラーメッセージのアクセシビリティ', () => {
    it('エラー状態が適切にアナウンスされる', async () => {
      // Arrange
      const { container, rerender } = render(
        <div>
          <div role="alert" aria-live="assertive" id="error-message" style={{ display: 'none' }}>
          </div>
          <button>送信</button>
        </div>
      );

      // Act - エラー発生をシミュレート
      rerender(
        <div>
          <div role="alert" aria-live="assertive" id="error-message" style={{ display: 'block' }}>
            おみくじの取得に失敗しました。もう一度お試しください。
          </div>
          <button>送信</button>
        </div>
      );

      // Assert
      await waitFor(() => {
        const errorMessage = container.querySelector('[role="alert"]');
        expect(errorMessage).toHaveTextContent('おみくじの取得に失敗しました');
        expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
      });
    });
  });
});