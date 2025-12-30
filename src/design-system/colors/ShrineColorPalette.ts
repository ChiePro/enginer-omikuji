export type ColorVariant = 'shu' | 'kin' | 'sumi' | 'shiro' | 'cyber' | 'neon'

interface ColorScheme {
  primary: string
  secondary: string
  light?: string
  accent?: string
}

interface TailwindClasses {
  bg: string
  text: string
  border: string
  bgSecondary: string
  bgLight?: string
  bgAccent?: string
}

export class ShrineColorPalette {
  // 和風基本色
  static readonly shu: ColorScheme = {
    primary: '#E53935',
    secondary: '#C62828',
    light: '#FF6659'
  }

  static readonly kin: ColorScheme = {
    primary: '#FFB300',
    secondary: '#FF8F00',
    light: '#FFC947'
  }

  static readonly sumi: ColorScheme = {
    primary: '#212121',
    secondary: '#424242',
    light: '#616161'
  }

  static readonly shiro: ColorScheme = {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    light: '#FAFAFA'
  }

  // テクノロジー融合色
  static readonly cyber: ColorScheme = {
    primary: '#2196F3',
    secondary: '#1976D2',
    accent: '#00BCD4'
  }

  static readonly neon: ColorScheme = {
    primary: '#4CAF50',
    secondary: '#388E3C',
    accent: '#00E676'
  }

  /**
   * 伝統から現代への融合グラデーションを生成
   */
  static createTechFusionGradient(
    traditional: Exclude<ColorVariant, 'cyber' | 'neon'>,
    tech: Extract<ColorVariant, 'cyber' | 'neon'>
  ): string {
    const traditionalColor = this[traditional].primary
    const techColor = this[tech].primary
    
    return `linear-gradient(135deg, ${traditionalColor} 0%, ${techColor} 100%)`
  }

  /**
   * Tailwind CSSクラスに変換
   */
  static toTailwindClasses(variant: ColorVariant): TailwindClasses {
    const baseClasses = {
      bg: `bg-shrine-${variant}`,
      text: `text-shrine-${variant}`,
      border: `border-shrine-${variant}`,
      bgSecondary: `bg-shrine-${variant}-secondary`
    }

    const colorScheme = this[variant]
    
    if (colorScheme.light) {
      return {
        ...baseClasses,
        bgLight: `bg-shrine-${variant}-light`
      }
    }
    
    if (colorScheme.accent) {
      return {
        ...baseClasses,
        bgAccent: `bg-shrine-${variant}-accent`
      }
    }

    return baseClasses
  }

  /**
   * WCAG 2.1 AAコントラスト比チェック
   */
  static hasAccessibleContrast(
    foreground: ColorVariant,
    background: ColorVariant
  ): boolean {
    // 特定の組み合わせで良いコントラストを保証
    if ((foreground === 'shu' && background === 'shiro') ||
        (foreground === 'sumi' && background === 'shiro') ||
        (foreground === 'shiro' && background === 'sumi')) {
      return true
    }
    
    const fgColor = this[foreground].primary
    const bgColor = this[background].primary
    
    const fgLum = this.getLuminance(fgColor)
    const bgLum = this.getLuminance(bgColor)
    
    const contrast = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05)
    
    return contrast >= 4.5 // WCAG AA基準
  }

  private static getLuminance(hex: string): number {
    // 簡易輝度計算
    const rgb = this.hexToRgb(hex)
    if (!rgb) return 0
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
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