import { describe, it, expect } from 'vitest'
import { ShrineSpacing } from './ShrineSpacing'

describe('ShrineSpacing', () => {
  describe('基本スペーシングスケール', () => {
    it('和の比率に基づく基本スケールが定義されている', () => {
      expect(ShrineSpacing.scale).toEqual({
        xs: '0.25rem',    // 4px  - 細かな調整
        sm: '0.5rem',     // 8px  - 小間隔
        base: '1rem',     // 16px - 基本単位
        md: '1.5rem',     // 24px - 中間隔（黄金比の近似）
        lg: '2.5rem',     // 40px - 大間隔
        xl: '4rem',       // 64px - 特大間隔
        '2xl': '6.5rem'   // 104px - 最大間隔（フィボナッチ近似）
      })
    })
  })

  describe('神社建築パターンのスペーシング', () => {
    it('鳥居パターンのスペーシングが定義されている', () => {
      expect(ShrineSpacing.patterns.torii).toEqual({
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
      })
    })

    it('社殿パターンのスペーシングが定義されている', () => {
      expect(ShrineSpacing.patterns.shaden).toEqual({
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
      })
    })
  })

  describe('レスポンシブスペーシング', () => {
    it('モバイル用のスペーシングスケールを生成する', () => {
      const mobileSpacing = ShrineSpacing.getResponsiveScale('mobile')
      
      expect(mobileSpacing).toEqual({
        xs: '0.125rem',  // 半分のサイズ
        sm: '0.25rem',
        base: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2.5rem',
        '2xl': '4rem'
      })
    })

    it('タブレット用のスペーシングスケールを生成する', () => {
      const tabletSpacing = ShrineSpacing.getResponsiveScale('tablet')
      
      expect(tabletSpacing).toEqual({
        xs: '0.1875rem', // 3/4 サイズ
        sm: '0.375rem',
        base: '0.875rem',
        md: '1.25rem',
        lg: '2rem',
        xl: '3.25rem',
        '2xl': '5.25rem'
      })
    })

    it('デスクトップ用は基本スケールと同じ', () => {
      const desktopSpacing = ShrineSpacing.getResponsiveScale('desktop')
      
      expect(desktopSpacing).toEqual(ShrineSpacing.scale)
    })
  })

  describe('コンテンツ領域のスペーシング', () => {
    it('カードレイアウト用のスペーシングを生成する', () => {
      const cardSpacing = ShrineSpacing.getContentSpacing('card')
      
      expect(cardSpacing).toEqual({
        padding: '1.5rem',     // カード内部の余白
        margin: '1rem',        // カード間の間隔
        gap: '0.5rem',         // 要素間のギャップ
        borderOffset: '0.25rem' // 境界線からの距離
      })
    })

    it('ヒーローセクション用のスペーシングを生成する', () => {
      const heroSpacing = ShrineSpacing.getContentSpacing('hero')
      
      expect(heroSpacing).toEqual({
        padding: '6.5rem 2.5rem', // 上下に大きな余白
        margin: '0',
        gap: '2.5rem',         // 要素間の大きなギャップ
        borderOffset: '0'
      })
    })
  })

  describe('Tailwind CSS統合', () => {
    it('基本スペーシングをTailwindクラスに変換する', () => {
      const tailwindClasses = ShrineSpacing.toTailwindClasses()
      
      expect(tailwindClasses).toEqual({
        'shrine-xs': '0.25rem',
        'shrine-sm': '0.5rem',
        'shrine-base': '1rem',
        'shrine-md': '1.5rem',
        'shrine-lg': '2.5rem',
        'shrine-xl': '4rem',
        'shrine-2xl': '6.5rem'
      })
    })

    it('レスポンシブスペーシングクラスを生成する', () => {
      const responsiveClasses = ShrineSpacing.generateResponsiveClasses('md')
      
      expect(responsiveClasses).toEqual({
        'p-shrine-md': 'padding: 1.5rem',
        'm-shrine-md': 'margin: 1.5rem',
        'gap-shrine-md': 'gap: 1.5rem',
        'space-x-shrine-md': 'margin-left: 1.5rem',
        'space-y-shrine-md': 'margin-top: 1.5rem'
      })
    })
  })
})