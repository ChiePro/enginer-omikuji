import { describe, it, expect } from 'vitest'
import { 
  ShrineColorPalette,
  ShrineDesignTokens,
  ShrineSpacing,
  ShrineDesignSystem 
} from './index'

describe('デザインシステム統合テスト', () => {
  it('デザインシステム全体がエクスポートされている', () => {
    expect(ShrineColorPalette).toBeDefined()
    expect(ShrineDesignTokens).toBeDefined()
    expect(ShrineSpacing).toBeDefined()
    expect(ShrineDesignSystem).toBeDefined()
  })

  it('テーマ設定が正しく定義されている', () => {
    expect(ShrineDesignSystem.themes.light.primary).toBe('#E53935')
    expect(ShrineDesignSystem.themes.dark.background).toBe('#212121')
    expect(ShrineDesignSystem.themes.cyber.secondary).toBe('#4CAF50')
  })

  it('ブレークポイントが設定されている', () => {
    expect(ShrineDesignSystem.breakpoints.mobile).toBe('0px')
    expect(ShrineDesignSystem.breakpoints.tablet).toBe('768px')
    expect(ShrineDesignSystem.breakpoints.desktop).toBe('1024px')
  })

  it('システム全体の一貫性が保たれている', () => {
    // カラーパレットとデザインシステムのテーマが一致
    expect(ShrineDesignSystem.themes.light.primary).toBe(ShrineColorPalette.shu.primary)
    expect(ShrineDesignSystem.themes.light.secondary).toBe(ShrineColorPalette.kin.primary)
    
    // スペーシングシステムとデザイントークンが連携
    const cardSpacing = ShrineSpacing.getContentSpacing('card')
    expect(cardSpacing.padding).toBe(ShrineSpacing.scale.md)
  })

  it('融合スタイルが正常に生成される', () => {
    // 技術とデザインの融合例
    const fusionGradient = ShrineColorPalette.createTechFusionGradient('shu', 'cyber')
    const fusionTokens = ShrineDesignTokens.createFusionStyle('torii', 'terminal')
    
    expect(fusionGradient).toContain('#E53935')
    expect(fusionGradient).toContain('#2196F3')
    
    expect(fusionTokens.borderColor).toBe('#E53935') // 鳥居の朱色
    expect(fusionTokens.backgroundColor).toContain('rgba(33, 33, 33, 0.9)') // ターミナル背景
  })
})