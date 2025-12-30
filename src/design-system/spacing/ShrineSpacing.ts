export type SpacingScale = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl'
export type DeviceSize = 'mobile' | 'tablet' | 'desktop'
export type ContentType = 'card' | 'hero'

interface SpacingValues {
  xs: string
  sm: string
  base: string
  md: string
  lg: string
  xl: string
  '2xl': string
}

interface ToriiPattern {
  pillars: {
    gap: string
    width: string
    height: string
  }
  crossbar: {
    top: string
    bottom: string
    overhang: string
  }
}

interface ShadenPattern {
  foundation: {
    height: string
    margin: string
  }
  roof: {
    slope: string
    eaves: string
    ridge: string
  }
  interior: {
    padding: string
    altar: string
  }
}

interface ContentSpacing {
  padding: string
  margin: string
  gap: string
  borderOffset: string
}

interface TailwindSpacing {
  [key: string]: string
}

interface ResponsiveClasses {
  [key: string]: string
}

export class ShrineSpacing {
  // 和の比率に基づく基本スペーシングスケール
  static readonly scale: SpacingValues = {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    base: '1rem',     // 16px
    md: '1.5rem',     // 24px - 黄金比近似
    lg: '2.5rem',     // 40px
    xl: '4rem',       // 64px
    '2xl': '6.5rem'   // 104px - フィボナッチ近似
  }

  // 神社建築パターンに基づくスペーシング
  static readonly patterns = {
    torii: {
      pillars: {
        gap: '4rem',        // 柱間の距離
        width: '0.5rem',    // 柱の幅
        height: '6.5rem'    // 柱の高さ
      },
      crossbar: {
        top: '1rem',        // 上部横木の位置
        bottom: '1.5rem',   // 下部横木の位置
        overhang: '0.5rem'  // はみ出し部分
      }
    } as ToriiPattern,

    shaden: {
      foundation: {
        height: '1.5rem',   // 基壇の高さ
        margin: '1rem'      // 周囲のマージン
      },
      roof: {
        slope: '2.5rem',    // 屋根の傾斜
        eaves: '1rem',      // 軒の出
        ridge: '0.5rem'     // 棟の高さ
      },
      interior: {
        padding: '2.5rem',  // 内部の余白
        altar: '4rem'       // 祭壇までの距離
      }
    } as ShadenPattern
  }

  /**
   * デバイスサイズに応じたレスポンシブスペーシングスケールを生成
   */
  static getResponsiveScale(device: DeviceSize): SpacingValues {
    switch (device) {
      case 'mobile':
        return {
          xs: '0.125rem',   // 半分のサイズ
          sm: '0.25rem',
          base: '0.75rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2.5rem',
          '2xl': '4rem'
        }

      case 'tablet':
        return {
          xs: '0.1875rem',  // 3/4 サイズ
          sm: '0.375rem',
          base: '0.875rem',
          md: '1.25rem',
          lg: '2rem',
          xl: '3.25rem',
          '2xl': '5.25rem'
        }

      case 'desktop':
      default:
        return this.scale
    }
  }

  /**
   * コンテンツタイプに応じたスペーシングを生成
   */
  static getContentSpacing(contentType: ContentType): ContentSpacing {
    switch (contentType) {
      case 'card':
        return {
          padding: this.scale.md,      // 1.5rem
          margin: this.scale.base,     // 1rem
          gap: this.scale.sm,          // 0.5rem
          borderOffset: this.scale.xs   // 0.25rem
        }

      case 'hero':
        return {
          padding: `${this.scale['2xl']} ${this.scale.lg}`, // 6.5rem 2.5rem
          margin: '0',
          gap: this.scale.lg,          // 2.5rem
          borderOffset: '0'
        }

      default:
        return {
          padding: this.scale.base,
          margin: this.scale.base,
          gap: this.scale.sm,
          borderOffset: this.scale.xs
        }
    }
  }

  /**
   * 基本スペーシングをTailwind CSSクラスに変換
   */
  static toTailwindClasses(): TailwindSpacing {
    return {
      'shrine-xs': this.scale.xs,
      'shrine-sm': this.scale.sm,
      'shrine-base': this.scale.base,
      'shrine-md': this.scale.md,
      'shrine-lg': this.scale.lg,
      'shrine-xl': this.scale.xl,
      'shrine-2xl': this.scale['2xl']
    }
  }

  /**
   * レスポンシブスペーシングクラスを生成
   */
  static generateResponsiveClasses(scale: SpacingScale): ResponsiveClasses {
    const value = this.scale[scale]
    
    return {
      [`p-shrine-${scale}`]: `padding: ${value}`,
      [`m-shrine-${scale}`]: `margin: ${value}`,
      [`gap-shrine-${scale}`]: `gap: ${value}`,
      [`space-x-shrine-${scale}`]: `margin-left: ${value}`,
      [`space-y-shrine-${scale}`]: `margin-top: ${value}`
    }
  }
}