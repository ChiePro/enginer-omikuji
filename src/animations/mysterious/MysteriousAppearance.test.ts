import { describe, it, expect } from 'vitest'
import { MysteriousAppearance } from './MysteriousAppearance'

describe('MysteriousAppearance', () => {
  describe('神秘的な出現アニメーション定義', () => {
    it('神社への参拝をイメージした入場アニメーションが定義されている', () => {
      const animation = MysteriousAppearance.getEntranceAnimation()
      
      expect(animation.initial).toEqual({
        opacity: 0,
        scale: 0.8,
        y: 50,
        filter: 'blur(8px)'
      })
      
      expect(animation.animate).toEqual({
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
          duration: 0.8,
          ease: [0.25, 0.1, 0.25, 1], // 神秘的なイージング
          staggerChildren: 0.1
        }
      })
    })

    it('霧が晴れるようなフェードイン効果が定義されている', () => {
      const animation = MysteriousAppearance.getMistFadeAnimation()
      
      expect(animation.initial).toEqual({
        opacity: 0,
        scale: 1.2,
        filter: 'blur(12px) brightness(0.3)'
      })
      
      expect(animation.animate).toEqual({
        opacity: 1,
        scale: 1,
        filter: 'blur(0px) brightness(1)',
        transition: {
          duration: 1.2,
          ease: 'easeOut',
          delay: 0.3
        }
      })
    })

    it('神社の鈴の音をイメージした波紋アニメーションが定義されている', () => {
      const animation = MysteriousAppearance.getRippleAnimation()
      
      expect(animation.initial).toEqual({
        scale: 0,
        opacity: 1
      })
      
      expect(animation.animate).toEqual({
        scale: [0, 1.2, 1],
        opacity: [1, 0.8, 0],
        transition: {
          duration: 1.5,
          ease: 'easeOut',
          times: [0, 0.7, 1]
        }
      })
    })
  })

  describe('段階的表示システム', () => {
    it('要素の重要度に応じた表示順序を生成する', () => {
      const sequence = MysteriousAppearance.createStaggeredSequence([
        { priority: 'high', delay: 0 },
        { priority: 'medium', delay: 0.2 },
        { priority: 'low', delay: 0.4 }
      ])
      
      expect(sequence).toEqual({
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: {
          staggerChildren: 0.15,
          delayChildren: 0.1
        }
      })
    })

    it('視線誘導のためのアニメーション順序を計算する', () => {
      const guidanceOrder = MysteriousAppearance.calculateGuidanceOrder([
        'hero-title',
        'subtitle', 
        'omikuji-cards',
        'rarity-preview'
      ])
      
      expect(guidanceOrder).toEqual([
        { element: 'hero-title', delay: 0 },
        { element: 'subtitle', delay: 0.3 },
        { element: 'omikuji-cards', delay: 0.6 },
        { element: 'rarity-preview', delay: 0.9 }
      ])
    })
  })

  describe('レスポンシブ対応', () => {
    it('モバイル向けの軽量アニメーションを生成する', () => {
      const mobileAnimation = MysteriousAppearance.getMobileOptimizedAnimation()
      
      expect(mobileAnimation.duration).toBe(0.4) // デスクトップの半分
      expect(mobileAnimation.reducedMotion).toBe(true)
      expect(mobileAnimation.effects).toEqual(['fade', 'scale']) // blurを除外
    })

    it('プリファレンス設定によるアニメーション調整', () => {
      const reducedAnimation = MysteriousAppearance.getReducedMotionAnimation()
      
      expect(reducedAnimation.duration).toBe(0.2)
      expect(reducedAnimation.effects).toEqual(['fade']) // 最小限のエフェクト
      expect(reducedAnimation.respectsMotionPreference).toBe(true)
    })
  })
})