export type ArchitectureElement = 'torii' | 'shaden' | 'saisenbox'
export type TechElement = 'terminal' | 'code'
export type DeviceSize = 'mobile' | 'tablet' | 'desktop'

interface ArchitectureTokens {
  borderRadius: string
  borderWidth: string
  shadowColor: string
  aspectRatio: string
}

interface TechTokens {
  fontFamily: string
  borderRadius: string
  backgroundColor: string
  borderColor?: string
  fontSize?: {
    sm: string
    base: string
    lg: string
  }
  syntaxHighlight?: {
    keyword: string
    string: string
    comment: string
    function: string
  }
}

interface FusionStyle {
  borderRadius: string
  borderWidth: string
  backgroundColor: string
  borderColor: string
  boxShadow: string
}

interface ResponsiveTokens {
  borderWidth: string
  borderRadius: string
  fontSize: {
    base: string
  }
}

export class ShrineDesignTokens {
  // 神社建築要素
  static readonly architecture: Record<ArchitectureElement, ArchitectureTokens> = {
    torii: {
      borderRadius: '0px',
      borderWidth: '4px',
      shadowColor: 'rgba(229, 57, 53, 0.3)',
      aspectRatio: '16/9'
    },
    shaden: {
      borderRadius: '8px',
      borderWidth: '2px',
      shadowColor: 'rgba(255, 179, 0, 0.2)',
      aspectRatio: '4/3'
    },
    saisenbox: {
      borderRadius: '12px',
      borderWidth: '3px',
      shadowColor: 'rgba(33, 33, 33, 0.4)',
      aspectRatio: '3/2'
    }
  }

  // 技術要素
  static readonly tech: Record<TechElement, TechTokens> = {
    terminal: {
      fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
      borderRadius: '4px',
      backgroundColor: 'rgba(33, 33, 33, 0.9)',
      borderColor: '#00BCD4',
      fontSize: {
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem'
      }
    },
    code: {
      fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
      borderRadius: '6px',
      backgroundColor: 'rgba(33, 37, 41, 0.95)',
      syntaxHighlight: {
        keyword: '#FF6B6B',
        string: '#4ECDC4',
        comment: '#95A5A6',
        function: '#F39C12'
      }
    }
  }

  /**
   * 神社建築と技術要素の融合スタイルを生成
   */
  static createFusionStyle(
    architecture: ArchitectureElement,
    tech: TechElement
  ): FusionStyle {
    const archTokens = this.architecture[architecture]
    const techTokens = this.tech[tech]

    // 境界線の丸みを中間値で計算
    const archRadius = parseInt(archTokens.borderRadius)
    const techRadius = parseInt(techTokens.borderRadius)
    const fusionRadius = Math.floor((archRadius + techRadius) / 2)

    // 色の抽出
    const borderColor = this.extractBorderColor(architecture)
    const accentColor = this.extractAccentColor(tech)

    return {
      borderRadius: `${fusionRadius}px`,
      borderWidth: archTokens.borderWidth, // 建築要素の特徴を保持
      backgroundColor: techTokens.backgroundColor,
      borderColor,
      boxShadow: `0 4px 16px ${archTokens.shadowColor}, inset 0 1px 2px ${this.createAccentShadow(accentColor)}`
    }
  }

  /**
   * レスポンシブ対応のトークンを生成
   */
  static getResponsiveTokens(device: DeviceSize): ResponsiveTokens {
    const baseTokens = {
      borderWidth: '4px',
      borderRadius: '8px',
      fontSize: { base: '1rem' }
    }

    switch (device) {
      case 'mobile':
        return {
          borderWidth: '2px',
          borderRadius: '6px',
          fontSize: { base: '0.875rem' }
        }
      case 'tablet':
        return {
          borderWidth: '3px',
          borderRadius: '7px',
          fontSize: { base: '0.9375rem' }
        }
      case 'desktop':
      default:
        return baseTokens
    }
  }

  private static extractBorderColor(architecture: ArchitectureElement): string {
    const colorMap = {
      torii: '#E53935',   // 朱色
      shaden: '#FFB300',  // 金色
      saisenbox: '#212121' // 墨色
    }
    return colorMap[architecture]
  }

  private static extractAccentColor(tech: TechElement): string {
    const colorMap = {
      terminal: '#00BCD4',  // ターミナルのネオンアクセント
      code: '#F39C12'      // コードの関数色
    }
    return colorMap[tech]
  }

  private static createAccentShadow(color: string): string {
    // 色を RGBA に変換してアルファ値を 0.1 に設定
    const rgb = this.hexToRgb(color)
    if (!rgb) return 'rgba(255, 255, 255, 0.1)'
    
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
}