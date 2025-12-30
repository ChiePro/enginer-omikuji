import { describe, it, expect } from 'vitest'
import { ShrineDesignTokens } from './ShrineDesignTokens'

describe('ShrineDesignTokens', () => {
  describe('神社建築要素のトークン化', () => {
    it('鳥居（Torii）の要素が定義されている', () => {
      expect(ShrineDesignTokens.architecture.torii).toEqual({
        borderRadius: '0px', // 直線的な構造
        borderWidth: '4px',
        shadowColor: 'rgba(229, 57, 53, 0.3)', // 朱色ベース
        aspectRatio: '16/9' // 横長の比率
      })
    })

    it('社殿（Shaden）の要素が定義されている', () => {
      expect(ShrineDesignTokens.architecture.shaden).toEqual({
        borderRadius: '8px', // 軽い丸み
        borderWidth: '2px',
        shadowColor: 'rgba(255, 179, 0, 0.2)', // 金色ベース
        aspectRatio: '4/3' // 正方形に近い比率
      })
    })

    it('お賽銭箱（Saisenbox）の要素が定義されている', () => {
      expect(ShrineDesignTokens.architecture.saisenbox).toEqual({
        borderRadius: '12px',
        borderWidth: '3px', 
        shadowColor: 'rgba(33, 33, 33, 0.4)', // 墨色ベース
        aspectRatio: '3/2' // 横長の箱型
      })
    })
  })

  describe('技術要素のトークン化', () => {
    it('ターミナル風UIの要素が定義されている', () => {
      expect(ShrineDesignTokens.tech.terminal).toEqual({
        fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
        borderRadius: '4px',
        backgroundColor: 'rgba(33, 33, 33, 0.9)',
        borderColor: '#00BCD4', // ネオンアクセント
        fontSize: {
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem'
        }
      })
    })

    it('コード表示の要素が定義されている', () => {
      expect(ShrineDesignTokens.tech.code).toEqual({
        fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
        borderRadius: '6px',
        backgroundColor: 'rgba(33, 37, 41, 0.95)',
        syntaxHighlight: {
          keyword: '#FF6B6B',    // 明るい赤
          string: '#4ECDC4',     // ティール
          comment: '#95A5A6',    // グレー
          function: '#F39C12'    // オレンジ
        }
      })
    })
  })

  describe('融合パターンの生成', () => {
    it('鳥居とターミナルの融合スタイルを生成する', () => {
      const fusionStyle = ShrineDesignTokens.createFusionStyle('torii', 'terminal')
      
      expect(fusionStyle).toEqual({
        borderRadius: '2px', // 鳥居とターミナルの中間
        borderWidth: '4px', // 鳥居の特徴を保持
        backgroundColor: 'rgba(33, 33, 33, 0.9)', // ターミナルの背景
        borderColor: '#E53935', // 鳥居の朱色
        boxShadow: `0 4px 16px rgba(229, 57, 53, 0.3), inset 0 1px 2px rgba(0, 188, 212, 0.1)`
      })
    })

    it('社殿とコードの融合スタイルを生成する', () => {
      const fusionStyle = ShrineDesignTokens.createFusionStyle('shaden', 'code')
      
      expect(fusionStyle).toEqual({
        borderRadius: '7px', // 社殿とコードの中間
        borderWidth: '2px', // 社殿の特徴を保持
        backgroundColor: 'rgba(33, 37, 41, 0.95)', // コードの背景
        borderColor: '#FFB300', // 社殿の金色
        boxShadow: `0 4px 16px rgba(255, 179, 0, 0.2), inset 0 1px 2px rgba(243, 156, 18, 0.1)`
      })
    })
  })

  describe('レスポンシブ適応', () => {
    it('モバイル用のトークンを生成する', () => {
      const mobileTokens = ShrineDesignTokens.getResponsiveTokens('mobile')
      
      expect(mobileTokens.borderWidth).toBe('2px') // 細い境界線
      expect(mobileTokens.borderRadius).toBe('6px') // 小さめの丸み
      expect(mobileTokens.fontSize.base).toBe('0.875rem') // 小さめのフォント
    })

    it('デスクトップ用のトークンを生成する', () => {
      const desktopTokens = ShrineDesignTokens.getResponsiveTokens('desktop')
      
      expect(desktopTokens.borderWidth).toBe('4px') // 太い境界線
      expect(desktopTokens.borderRadius).toBe('8px') // 標準の丸み
      expect(desktopTokens.fontSize.base).toBe('1rem') // 標準のフォント
    })
  })
})