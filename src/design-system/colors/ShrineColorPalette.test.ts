import { describe, it, expect } from 'vitest'
import { ShrineColorPalette } from './ShrineColorPalette'

describe('ShrineColorPalette', () => {
  describe('和風基本色の定義', () => {
    it('朱色（Shu）が定義されている', () => {
      expect(ShrineColorPalette.shu.primary).toBe('#E53935')
      expect(ShrineColorPalette.shu.secondary).toBe('#C62828')
      expect(ShrineColorPalette.shu.light).toBe('#FF6659')
    })

    it('金色（Kin）が定義されている', () => {
      expect(ShrineColorPalette.kin.primary).toBe('#FFB300')
      expect(ShrineColorPalette.kin.secondary).toBe('#FF8F00')
      expect(ShrineColorPalette.kin.light).toBe('#FFC947')
    })

    it('墨色（Sumi）が定義されている', () => {
      expect(ShrineColorPalette.sumi.primary).toBe('#212121')
      expect(ShrineColorPalette.sumi.secondary).toBe('#424242')
      expect(ShrineColorPalette.sumi.light).toBe('#616161')
    })

    it('白（Shiro）が定義されている', () => {
      expect(ShrineColorPalette.shiro.primary).toBe('#FFFFFF')
      expect(ShrineColorPalette.shiro.secondary).toBe('#F5F5F5')
      expect(ShrineColorPalette.shiro.light).toBe('#FAFAFA')
    })
  })

  describe('テクノロジー融合色の定義', () => {
    it('サイバー青が定義されている', () => {
      expect(ShrineColorPalette.cyber.primary).toBe('#2196F3')
      expect(ShrineColorPalette.cyber.secondary).toBe('#1976D2')
      expect(ShrineColorPalette.cyber.accent).toBe('#00BCD4')
    })

    it('ネオン緑が定義されている', () => {
      expect(ShrineColorPalette.neon.primary).toBe('#4CAF50')
      expect(ShrineColorPalette.neon.secondary).toBe('#388E3C')
      expect(ShrineColorPalette.neon.accent).toBe('#00E676')
    })
  })

  describe('グラデーション生成', () => {
    it('伝統から現代への融合グラデーションを生成する', () => {
      const gradient = ShrineColorPalette.createTechFusionGradient('shu', 'cyber')
      
      expect(gradient).toContain('linear-gradient')
      expect(gradient).toContain('#E53935') // 朱色
      expect(gradient).toContain('#2196F3') // サイバー青
    })

    it('金色からネオン緑へのグラデーションを生成する', () => {
      const gradient = ShrineColorPalette.createTechFusionGradient('kin', 'neon')
      
      expect(gradient).toContain('linear-gradient')
      expect(gradient).toContain('#FFB300') // 金色
      expect(gradient).toContain('#4CAF50') // ネオン緑
    })
  })

  describe('Tailwind CSS変換', () => {
    it('朱色をTailwind CSSクラスに変換する', () => {
      const tailwindClasses = ShrineColorPalette.toTailwindClasses('shu')
      
      expect(tailwindClasses).toEqual({
        bg: 'bg-shrine-shu',
        text: 'text-shrine-shu',
        border: 'border-shrine-shu',
        bgSecondary: 'bg-shrine-shu-secondary',
        bgLight: 'bg-shrine-shu-light'
      })
    })

    it('サイバー青をTailwind CSSクラスに変換する', () => {
      const tailwindClasses = ShrineColorPalette.toTailwindClasses('cyber')
      
      expect(tailwindClasses).toEqual({
        bg: 'bg-shrine-cyber',
        text: 'text-shrine-cyber',
        border: 'border-shrine-cyber',
        bgSecondary: 'bg-shrine-cyber-secondary',
        bgAccent: 'bg-shrine-cyber-accent'
      })
    })
  })

  describe('コントラスト検証', () => {
    it('朱色は白色との十分なコントラストを持つ', () => {
      const hasGoodContrast = ShrineColorPalette.hasAccessibleContrast('shu', 'shiro')
      expect(hasGoodContrast).toBe(true)
    })

    it('墨色は白色との十分なコントラストを持つ', () => {
      const hasGoodContrast = ShrineColorPalette.hasAccessibleContrast('sumi', 'shiro')
      expect(hasGoodContrast).toBe(true)
    })
  })
})