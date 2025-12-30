export type Priority = 'high' | 'medium' | 'low'
export type AnimationElement = 'hero-title' | 'subtitle' | 'omikuji-cards' | 'rarity-preview'

interface AnimationConfig {
  initial: Record<string, unknown>
  animate: Record<string, unknown>
  transition?: Record<string, unknown>
}

interface StaggerConfig {
  priority: Priority
  delay: number
}

interface GuidanceItem {
  element: AnimationElement
  delay: number
}

interface MobileAnimation {
  duration: number
  reducedMotion: boolean
  effects: string[]
}

interface ReducedMotionAnimation {
  duration: number
  effects: string[]
  respectsMotionPreference: boolean
}

export class MysteriousAppearance {
  /**
   * 神社への参拝をイメージした入場アニメーション
   */
  static getEntranceAnimation(): AnimationConfig {
    return {
      initial: {
        opacity: 0,
        scale: 0.8,
        y: 50,
        filter: 'blur(8px)'
      },
      animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
          duration: 0.8,
          ease: [0.25, 0.1, 0.25, 1], // 神秘的なイージング
          staggerChildren: 0.1
        }
      }
    }
  }

  /**
   * 霧が晴れるようなフェードイン効果
   */
  static getMistFadeAnimation(): AnimationConfig {
    return {
      initial: {
        opacity: 0,
        scale: 1.2,
        filter: 'blur(12px) brightness(0.3)'
      },
      animate: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px) brightness(1)',
        transition: {
          duration: 1.2,
          ease: 'easeOut',
          delay: 0.3
        }
      }
    }
  }

  /**
   * 神社の鈴の音をイメージした波紋アニメーション
   */
  static getRippleAnimation(): AnimationConfig {
    return {
      initial: {
        scale: 0,
        opacity: 1
      },
      animate: {
        scale: [0, 1.2, 1],
        opacity: [1, 0.8, 0],
        transition: {
          duration: 1.5,
          ease: 'easeOut',
          times: [0, 0.7, 1]
        }
      }
    }
  }

  /**
   * 要素の重要度に応じた段階的表示
   */
  static createStaggeredSequence(_configs: StaggerConfig[]): AnimationConfig {
    return {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  /**
   * 視線誘導のためのアニメーション順序計算
   */
  static calculateGuidanceOrder(elements: AnimationElement[]): GuidanceItem[] {
    return elements.map((element, index) => ({
      element,
      delay: Math.round(index * 0.3 * 10) / 10 // 小数点1桁に丸める
    }))
  }

  /**
   * モバイル向けの軽量アニメーション
   */
  static getMobileOptimizedAnimation(): MobileAnimation {
    return {
      duration: 0.4,
      reducedMotion: true,
      effects: ['fade', 'scale']
    }
  }

  /**
   * プリファレンス設定による削減アニメーション
   */
  static getReducedMotionAnimation(): ReducedMotionAnimation {
    return {
      duration: 0.2,
      effects: ['fade'],
      respectsMotionPreference: true
    }
  }
}