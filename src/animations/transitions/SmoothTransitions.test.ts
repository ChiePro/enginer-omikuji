import { describe, it, expect } from 'vitest'
import { SmoothTransitions } from './SmoothTransitions'

describe('SmoothTransitions', () => {
  describe('ページ遷移アニメーション', () => {
    it('神社への入場をイメージした導入遷移が定義されている', () => {
      const transition = SmoothTransitions.getPageEntranceTransition()
      
      expect(transition.initial).toEqual({
        opacity: 0,
        scale: 0.95,
        filter: 'blur(4px)'
      })
      
      expect(transition.animate).toEqual({
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
          duration: 0.6,
          ease: [0.25, 0.1, 0.25, 1]
        }
      })
    })

    it('神社からの退場をイメージした終了遷移が定義されている', () => {
      const transition = SmoothTransitions.getPageExitTransition()
      
      expect(transition.exit).toEqual({
        opacity: 0,
        scale: 1.05,
        filter: 'blur(4px)',
        transition: {
          duration: 0.4,
          ease: [0.4, 0, 0.6, 1]
        }
      })
    })
  })

  describe('おみくじ選択遷移', () => {
    it('カード選択から結果画面への遷移アニメーションが定義されている', () => {
      const transition = SmoothTransitions.getOmikujiSelectionTransition()
      
      expect(transition.cardExit).toEqual({
        scale: 1.2,
        opacity: 0,
        rotateY: 180,
        transition: {
          duration: 0.8,
          ease: 'easeInOut'
        }
      })
      
      expect(transition.resultEntrance).toEqual({
        initial: { opacity: 0, y: 50, rotateX: -90 },
        animate: { 
          opacity: 1, 
          y: 0, 
          rotateX: 0,
          transition: {
            duration: 1.0,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.4
          }
        }
      })
    })

    it('レアリティに応じた特別な遷移エフェクトを生成する', () => {
      const legendaryTransition = SmoothTransitions.getRarityTransition('legendary')
      
      expect(legendaryTransition.sparkleEffect).toEqual({
        initial: { scale: 0, opacity: 0 },
        animate: {
          scale: [0, 1.5, 1],
          opacity: [0, 1, 0.8],
          transition: {
            duration: 1.5,
            ease: 'easeOut'
          }
        }
      })
      
      expect(legendaryTransition.goldGlow).toEqual({
        boxShadow: [
          '0 0 0 rgba(255, 179, 0, 0)',
          '0 0 30px rgba(255, 179, 0, 0.8)',
          '0 0 20px rgba(255, 179, 0, 0.6)'
        ],
        transition: {
          duration: 2.0,
          repeat: Infinity,
          repeatType: 'reverse'
        }
      })
    })
  })

  describe('モーダル・オーバーレイ遷移', () => {
    it('お賽銭モーダルの出現アニメーションが定義されている', () => {
      const modal = SmoothTransitions.getSaisenModalTransition()
      
      expect(modal.backdrop).toEqual({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 }
      })
      
      expect(modal.content).toEqual({
        initial: { 
          scale: 0.8, 
          opacity: 0,
          y: -50
        },
        animate: { 
          scale: 1, 
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 25
          }
        },
        exit: { 
          scale: 0.8, 
          opacity: 0,
          y: 50,
          transition: { duration: 0.2 }
        }
      })
    })
  })

  describe('スクロールベースアニメーション', () => {
    it('視差効果による神社の奥行き表現を生成する', () => {
      const parallax = SmoothTransitions.getParallaxEffect([
        { element: 'background', speed: 0.5 },
        { element: 'midground', speed: 0.8 },
        { element: 'foreground', speed: 1.0 }
      ])
      
      expect(parallax).toEqual({
        background: {
          transform: 'translateY(var(--scroll-y) * 0.5)',
          willChange: 'transform'
        },
        midground: {
          transform: 'translateY(var(--scroll-y) * 0.8)',
          willChange: 'transform'
        },
        foreground: {
          transform: 'translateY(var(--scroll-y) * 1.0)',
          willChange: 'transform'
        }
      })
    })

    it('要素の段階的表示用のスクロールトリガーを生成する', () => {
      const scrollTriggers = SmoothTransitions.createScrollTriggers([
        { selector: '.hero-title', threshold: 0.3 },
        { selector: '.omikuji-cards', threshold: 0.2 },
        { selector: '.rarity-preview', threshold: 0.1 }
      ])
      
      expect(scrollTriggers).toEqual([
        {
          selector: '.hero-title',
          threshold: 0.3,
          animation: 'slideInFromBottom'
        },
        {
          selector: '.omikuji-cards',
          threshold: 0.2,
          animation: 'staggeredFadeIn'
        },
        {
          selector: '.rarity-preview', 
          threshold: 0.1,
          animation: 'mysticalAppear'
        }
      ])
    })
  })

  describe('カスタムイージング関数', () => {
    it('神秘的な動きのためのカスタムイージングが定義されている', () => {
      const easings = SmoothTransitions.getCustomEasings()
      
      expect(easings.mystical).toEqual([0.25, 0.1, 0.25, 1])
      expect(easings.shrine).toEqual([0.4, 0, 0.2, 1])
      expect(easings.divine).toEqual([0.68, -0.55, 0.265, 1.55])
      expect(easings.gentle).toEqual([0.25, 0.46, 0.45, 0.94])
    })

    it('パフォーマンス最適化されたイージングを生成する', () => {
      const optimized = SmoothTransitions.getOptimizedEasing('mystical')
      
      expect(optimized.useGpu).toBe(true)
      expect(optimized.curve).toEqual([0.25, 0.1, 0.25, 1])
      expect(optimized.properties).toEqual(['transform', 'opacity'])
    })
  })

  describe('レスポンシブ遷移調整', () => {
    it('デバイス性能に応じた遷移設定を生成する', () => {
      const mobileTransitions = SmoothTransitions.getMobileOptimizedTransitions()
      
      expect(mobileTransitions.duration).toBe(0.3) // デスクトップより短縮
      expect(mobileTransitions.reducedEffects).toBe(true)
      expect(mobileTransitions.preferredProperties).toEqual(['opacity', 'transform'])
    })

    it('ローエンドデバイス向けの最小限遷移を生成する', () => {
      const minimal = SmoothTransitions.getMinimalTransitions()
      
      expect(minimal.duration).toBe(0.15)
      expect(minimal.properties).toEqual(['opacity'])
      expect(minimal.disableBlur).toBe(true)
    })
  })
})