interface HoverEffect {
  initial?: Record<string, unknown>
  whileHover?: Record<string, unknown>
  whileTap?: Record<string, unknown>
  whileFocus?: Record<string, unknown>
  animate?: Record<string, unknown>
  respectsMotionPreference?: boolean
  performance?: string
}

interface MagneticConfig {
  strength: number
  radius: number
  smoothing?: number
  maxDistance?: number
}

interface ParticleConfig {
  count: number
  life: number
  color: string
  size?: number
  velocity?: number
  fadeOut?: boolean
}

interface AccessibleConfig {
  reduceMotion: boolean
}

interface GpuTransform {
  transform?: string
  willChange?: string
}

export class HoverEffects {
  /**
   * お賽銭箱風の浮き上がりエフェクト
   */
  static getSaisenboxHover(): HoverEffect {
    return {
      initial: {
        scale: 1,
        y: 0,
        boxShadow: '0 4px 16px rgba(229, 57, 53, 0.2)'
      },
      whileHover: {
        scale: 1.05,
        y: -8,
        boxShadow: '0 12px 32px rgba(229, 57, 53, 0.4)',
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 20
        }
      },
      whileTap: {
        scale: 0.98,
        transition: { duration: 0.1 }
      }
    }
  }

  /**
   * 鳥居風の荘厳なホバーエフェクト
   */
  static getToriiHover(): HoverEffect {
    return {
      initial: {
        scale: 1,
        filter: 'brightness(1) drop-shadow(0px 4px 8px rgba(0,0,0,0.1))'
      },
      whileHover: {
        scale: 1.02,
        filter: 'brightness(1.1) drop-shadow(0px 8px 16px rgba(229,57,53,0.3))',
        transition: {
          duration: 0.3,
          ease: 'easeOut'
        }
      }
    }
  }

  /**
   * 神秘的な光のオーラエフェクト
   */
  static getMysticalAuraEffect(): HoverEffect {
    return {
      initial: {
        backgroundImage: 'radial-gradient(circle, transparent 0%, transparent 100%)'
      },
      whileHover: {
        backgroundImage: 'radial-gradient(circle, rgba(255,179,0,0.1) 0%, transparent 70%)',
        transition: {
          duration: 0.5,
          ease: 'easeInOut'
        }
      }
    }
  }

  /**
   * サイバー風のグロウエフェクト
   */
  static getCyberGlowEffect(): HoverEffect {
    return {
      initial: {
        boxShadow: '0 0 0 rgba(0, 188, 212, 0)',
        borderColor: 'transparent'
      },
      whileHover: {
        boxShadow: '0 0 20px rgba(0, 188, 212, 0.5), 0 0 40px rgba(0, 188, 212, 0.2)',
        borderColor: '#00BCD4',
        transition: {
          duration: 0.3,
          ease: 'easeOut'
        }
      }
    }
  }

  /**
   * ターミナル風の点滅エフェクト
   */
  static getTerminalBlinkEffect(): HoverEffect {
    return {
      animate: {
        opacity: [1, 0.7, 1],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear'
        }
      }
    }
  }

  /**
   * マウス位置に反応する磁石効果
   */
  static createMagneticEffect(config: Partial<MagneticConfig>): MagneticConfig {
    return {
      strength: config.strength || 0.3,
      radius: config.radius || 100,
      smoothing: 0.15,
      maxDistance: 50
    }
  }

  /**
   * カーソル周りのパーティクル効果
   */
  static createParticleTrail(config: Partial<ParticleConfig>): ParticleConfig {
    return {
      count: config.count || 8,
      life: config.life || 800,
      color: config.color || '#FFB300',
      size: 4,
      velocity: 2,
      fadeOut: true
    }
  }

  /**
   * アクセシビリティ対応のホバー効果
   */
  static getAccessibleHover(_config: AccessibleConfig): HoverEffect {
    return {
      whileHover: {
        backgroundColor: 'rgba(229, 57, 53, 0.1)',
        transition: { duration: 0.15 }
      },
      respectsMotionPreference: true
    }
  }

  /**
   * キーボードフォーカス対応エフェクト
   */
  static getFocusEffect(): HoverEffect {
    return {
      whileFocus: {
        outline: '2px solid #2196F3',
        outlineOffset: '2px',
        transition: { duration: 0.1 }
      },
      whileHover: {
        opacity: 0.8,
        transition: { duration: 0.1 }
      }
    }
  }

  /**
   * GPU アクセラレーション対応の変換
   */
  static getGpuOptimizedTransform(): GpuTransform {
    return {
      transform: 'translateZ(0)',
      willChange: 'transform, opacity'
    }
  }

  /**
   * 大量要素用の軽量ホバー効果
   */
  static getLightweightHover(): HoverEffect {
    return {
      whileHover: {
        opacity: 0.8,
        transition: { duration: 0.1 }
      },
      performance: 'optimized'
    }
  }
}