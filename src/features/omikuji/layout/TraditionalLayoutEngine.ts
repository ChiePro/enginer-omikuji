/**
 * TraditionalLayoutEngine
 * 
 * 日本の伝統的なおみくじ表現を再現する縦書きレイアウトシステム
 * CSS writing-modeを活用した縦書きスタイル生成とブラウザ互換性対応
 */

/**
 * 運勢レベル別の色彩定義
 */
const FORTUNE_COLOR_THEMES = {
  DAIKICHI: {
    primary: '#FFD700',     // 金色
    background: '#FFF8DC',  // ベージュ
    border: '#DAA520',      // 濃い金色
    hasSpecialEffect: true,
    shadowIntensity: 'high' as const
  },
  CHUKICHI: {
    primary: '#FF8C00',     // オレンジ
    background: '#FFF8F0',  // ライトオレンジ
    border: '#CD853F',      // ペルー
    hasSpecialEffect: false,
    shadowIntensity: 'medium' as const
  },
  KICHI: {
    primary: '#32CD32',     // 緑
    background: '#F0FFF0',  // ハニーデュー
    border: '#228B22',      // 森緑
    hasSpecialEffect: false,
    shadowIntensity: 'medium' as const
  },
  SUEKICHI: {
    primary: '#FFD700',     // 金色
    background: '#FFFACD',  // レモンシフォン
    border: '#BDB76B',      // ダークカーキ
    hasSpecialEffect: false,
    shadowIntensity: 'low' as const
  },
  KYO: {
    primary: '#4169E1',     // ロイヤルブルー
    background: '#F0F8FF',  // アリスブルー
    border: '#6495ED',      // コーンフラワー
    hasSpecialEffect: false,
    shadowIntensity: 'low' as const
  },
  DAIKYO: {
    primary: '#8B0000',     // ダークレッド
    background: '#FFF0F5',  // ラベンダーブラッシュ
    border: '#CD5C5C',      // インディアンレッド
    hasSpecialEffect: true,
    shadowIntensity: 'warning' as const,
    warningIndicator: true
  }
} as const;

export interface VerticalTextStyles {
  writingMode: string;
  textOrientation?: string;
  direction?: string;
  WebkitWritingMode?: string;
  msWritingMode?: string;
}

export interface FortuneDecoration {
  primaryColor: string;
  backgroundColor: string;
  borderColor: string;
  hasSpecialEffect: boolean;
  shadowIntensity: 'low' | 'medium' | 'high' | 'warning';
  warningIndicator?: boolean;
}

export interface FallbackLayoutConfig {
  orientation: 'horizontal' | 'vertical';
  textAlign: string;
  showCompatibilityWarning: boolean;
  fallbackMessage: string;
}

export interface CompleteLayout {
  styles: VerticalTextStyles;
  decoration: FortuneDecoration;
  content: string;
  isVerticalSupported: boolean;
  fallbackAvailable: boolean;
  fallbackMessage?: string;
}

export class TraditionalLayoutEngine {
  /**
   * 基本的な縦書きCSSスタイルを生成
   */
  generateVerticalTextStyles(): VerticalTextStyles {
    return {
      writingMode: 'vertical-rl',
      textOrientation: 'upright',
      direction: 'ltr'
    };
  }

  /**
   * ブラウザ互換性を考慮したプレフィックス付き縦書きスタイルを生成
   */
  generateCrossBrowserVerticalStyles(): VerticalTextStyles {
    return {
      writingMode: 'vertical-rl',
      WebkitWritingMode: 'vertical-rl',
      msWritingMode: 'tb-rl',
      textOrientation: 'upright'
    };
  }

  /**
   * 運勢レベルに応じた色彩・装飾を取得
   * 
   * @param fortuneValue 運勢の数値 (大吉: 4, 中吉: 3, 吉: 2, 小吉: 1, 末吉: 0, 凶: -1, 大凶: -2)
   * @returns 運勢に応じた装飾設定
   */
  getFortuneDecoration(fortuneValue: number): FortuneDecoration {
    const getTheme = (theme: typeof FORTUNE_COLOR_THEMES[keyof typeof FORTUNE_COLOR_THEMES]) => ({
      primaryColor: theme.primary,
      backgroundColor: theme.background,
      borderColor: theme.border,
      hasSpecialEffect: theme.hasSpecialEffect,
      shadowIntensity: theme.shadowIntensity,
      ...(('warningIndicator' in theme) && { warningIndicator: theme.warningIndicator })
    });

    if (fortuneValue >= 4) {
      return getTheme(FORTUNE_COLOR_THEMES.DAIKICHI);
    } else if (fortuneValue === 3) {
      return getTheme(FORTUNE_COLOR_THEMES.CHUKICHI);
    } else if (fortuneValue >= 1) {
      return getTheme(FORTUNE_COLOR_THEMES.KICHI);
    } else if (fortuneValue === 0) {
      return getTheme(FORTUNE_COLOR_THEMES.SUEKICHI);
    } else if (fortuneValue === -1) {
      return getTheme(FORTUNE_COLOR_THEMES.KYO);
    } else {
      return getTheme(FORTUNE_COLOR_THEMES.DAIKYO);
    }
  }

  /**
   * ブラウザのwriting-modeサポート状況をチェック
   */
  checkWritingModeSupport(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    try {
      const testElement = document.createElement('div');
      return 'writingMode' in testElement.style;
    } catch {
      return false;
    }
  }

  /**
   * 縦書き未対応時の横書きフォールバックスタイルを生成
   */
  generateFallbackStyles(): VerticalTextStyles {
    return {
      writingMode: 'horizontal-tb',
      textAlign: 'center',
      flexDirection: 'column',
      border: '2px solid #ccc',
      padding: '20px',
      borderRadius: '8px'
    } as any;
  }

  /**
   * フォールバックレイアウト設定を取得
   */
  getFallbackLayoutConfig(): FallbackLayoutConfig {
    return {
      orientation: 'horizontal',
      textAlign: 'center',
      showCompatibilityWarning: true,
      fallbackMessage: 'このブラウザでは縦書きレイアウトが利用できません。横書きで表示しています。'
    };
  }

  /**
   * 完全なレイアウト情報を生成
   */
  generateCompleteLayout(fortuneValue: number, content: string): CompleteLayout {
    const isVerticalSupported = this.checkWritingModeSupport();
    const styles = isVerticalSupported 
      ? this.generateCrossBrowserVerticalStyles()
      : this.generateFallbackStyles();
    
    const decoration = this.getFortuneDecoration(fortuneValue);
    
    let fallbackMessage: string | undefined;
    if (!isVerticalSupported) {
      fallbackMessage = this.getFallbackLayoutConfig().fallbackMessage;
    }

    return {
      styles,
      decoration,
      content,
      isVerticalSupported,
      fallbackAvailable: true,
      fallbackMessage
    };
  }
}