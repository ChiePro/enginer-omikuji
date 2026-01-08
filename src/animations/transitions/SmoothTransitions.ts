import type { TargetAndTransition, Transition } from 'framer-motion';

type Rarity = 'legendary' | 'epic' | 'rare' | 'common'
type EasingName = 'mystical' | 'shrine' | 'divine' | 'gentle'

interface TransitionConfig {
  initial?: TargetAndTransition
  animate?: TargetAndTransition
  exit?: TargetAndTransition
  transition?: Transition
}

interface OmikujiSelectionTransition {
  cardExit: TargetAndTransition
  resultEntrance: { initial: TargetAndTransition; animate: TargetAndTransition }
}

interface RarityTransition {
  sparkleEffect: { initial: TargetAndTransition; animate: TargetAndTransition }
  goldGlow: TargetAndTransition
}

interface ModalTransition {
  backdrop: { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition; transition?: Transition }
  content: { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition; transition?: Transition }
}

interface ParallaxLayer {
  element: string
  speed: number
}

interface ParallaxConfig {
  [key: string]: Record<string, unknown>
}

interface ScrollTrigger {
  selector: string
  threshold: number
  animation?: string
}

interface CustomEasings {
  [key: string]: number[]
}

interface OptimizedEasing {
  useGpu: boolean
  curve: number[]
  properties: string[]
}

interface MobileTransitions {
  duration: number
  reducedEffects: boolean
  preferredProperties: string[]
}

interface MinimalTransitions {
  duration: number
  properties: string[]
  disableBlur: boolean
}

export class SmoothTransitions {
  /**
   * ページ入場遷移アニメーション
   */
  static getPageEntranceTransition(): TransitionConfig {
    return {
      initial: {
        opacity: 0,
        scale: 0.95,
        filter: 'blur(4px)'
      },
      animate: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
          duration: 0.6,
          ease: [0.25, 0.1, 0.25, 1]
        }
      }
    }
  }

  /**
   * ページ退場遷移アニメーション
   */
  static getPageExitTransition(): TransitionConfig {
    return {
      exit: {
        opacity: 0,
        scale: 1.05,
        filter: 'blur(4px)',
        transition: {
          duration: 0.4,
          ease: [0.4, 0, 0.6, 1]
        }
      }
    }
  }

  /**
   * おみくじ選択遷移
   */
  static getOmikujiSelectionTransition(): OmikujiSelectionTransition {
    return {
      cardExit: {
        scale: 1.2,
        opacity: 0,
        rotateY: 180,
        transition: {
          duration: 0.8,
          ease: 'easeInOut'
        }
      },
      resultEntrance: {
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
      }
    }
  }

  /**
   * レアリティに応じた特別遷移
   */
  static getRarityTransition(_rarity: Rarity): RarityTransition {
    return {
      sparkleEffect: {
        initial: { scale: 0, opacity: 0 },
        animate: {
          scale: [0, 1.5, 1],
          opacity: [0, 1, 0.8],
          transition: {
            duration: 1.5,
            ease: 'easeOut'
          }
        }
      },
      goldGlow: {
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
      }
    }
  }

  /**
   * お賽銭モーダルの遷移
   */
  static getSaisenModalTransition(): ModalTransition {
    return {
      backdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 }
      },
      content: {
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
      }
    }
  }

  /**
   * 視差効果の生成
   */
  static getParallaxEffect(layers: ParallaxLayer[]): ParallaxConfig {
    const config: ParallaxConfig = {}
    
    layers.forEach(layer => {
      const speed = layer.speed === 1 ? '1.0' : layer.speed.toString()
      config[layer.element] = {
        transform: `translateY(var(--scroll-y) * ${speed})`,
        willChange: 'transform'
      }
    })
    
    return config
  }

  /**
   * スクロールトリガーの作成
   */
  static createScrollTriggers(configs: ScrollTrigger[]): ScrollTrigger[] {
    return configs.map(config => {
      let animation = 'slideInFromBottom'
      
      if (config.selector.includes('cards')) {
        animation = 'staggeredFadeIn'
      } else if (config.selector.includes('rarity')) {
        animation = 'mysticalAppear'
      }
      
      return {
        ...config,
        animation
      }
    })
  }

  /**
   * カスタムイージング関数
   */
  static getCustomEasings(): CustomEasings {
    return {
      mystical: [0.25, 0.1, 0.25, 1],
      shrine: [0.4, 0, 0.2, 1],
      divine: [0.68, -0.55, 0.265, 1.55],
      gentle: [0.25, 0.46, 0.45, 0.94]
    }
  }

  /**
   * 最適化されたイージング
   */
  static getOptimizedEasing(easingName: EasingName): OptimizedEasing {
    const easings = this.getCustomEasings()
    
    return {
      useGpu: true,
      curve: easings[easingName],
      properties: ['transform', 'opacity']
    }
  }

  /**
   * モバイル最適化遷移
   */
  static getMobileOptimizedTransitions(): MobileTransitions {
    return {
      duration: 0.3,
      reducedEffects: true,
      preferredProperties: ['opacity', 'transform']
    }
  }

  /**
   * 最小限遷移
   */
  static getMinimalTransitions(): MinimalTransitions {
    return {
      duration: 0.15,
      properties: ['opacity'],
      disableBlur: true
    }
  }
}

/**
 * ページ遷移前のアニメーション実行
 */
export const animatePageExit = async (): Promise<void> => {
  // アニメーション実行のプロミスを返す
  // 実際の実装では、DOM要素に対してアニメーションを適用
  return new Promise((resolve) => {
    setTimeout(resolve, 200); // 200ms のアニメーション時間
  });
};