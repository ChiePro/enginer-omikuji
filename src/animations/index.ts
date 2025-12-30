/**
 * 神社テーマアニメーションシステム
 * 
 * 神秘的な神社体験とモダンなテクノロジーを融合した
 * 高パフォーマンスアニメーションライブラリ
 */

// 神秘的な出現アニメーション
export { MysteriousAppearance } from './mysterious/MysteriousAppearance'
export type { 
  Priority, 
  AnimationElement 
} from './mysterious/MysteriousAppearance'

// インタラクティブホバーエフェクト
export { HoverEffects } from './interactions/HoverEffects'

// スムーズな画面遷移
export { SmoothTransitions } from './transitions/SmoothTransitions'

// パフォーマンス最適化
export { AnimationOptimizer } from './performance/AnimationOptimizer'

// インポート後にプリセットを定義
import { MysteriousAppearance } from './mysterious/MysteriousAppearance'
import { HoverEffects } from './interactions/HoverEffects'
import { SmoothTransitions } from './transitions/SmoothTransitions'
import { AnimationOptimizer } from './performance/AnimationOptimizer'

/**
 * アニメーションシステム設定
 */
export const ShrineAnimationSystem = {
  /**
   * デフォルト設定
   */
  defaults: {
    duration: 0.6,
    ease: [0.25, 0.1, 0.25, 1], // 神秘的なイージング
    stagger: 0.1,
    respectMotionPreference: true
  },

  /**
   * パフォーマンスプロファイル
   */
  performance: {
    high: {
      enableBlur: true,
      enableShadows: true,
      enableParticles: true,
      maxConcurrentAnimations: 10
    },
    medium: {
      enableBlur: false,
      enableShadows: true,
      enableParticles: false,
      maxConcurrentAnimations: 6
    },
    low: {
      enableBlur: false,
      enableShadows: false,
      enableParticles: false,
      maxConcurrentAnimations: 3
    }
  },

  /**
   * 神社テーマプリセット
   */
  presets: {
    entrance: MysteriousAppearance.getEntranceAnimation(),
    mistFade: MysteriousAppearance.getMistFadeAnimation(),
    ripple: MysteriousAppearance.getRippleAnimation(),
    
    saisenboxHover: HoverEffects.getSaisenboxHover(),
    toriiHover: HoverEffects.getToriiHover(),
    mysticalAura: HoverEffects.getMysticalAuraEffect(),
    
    pageEntrance: SmoothTransitions.getPageEntranceTransition(),
    pageExit: SmoothTransitions.getPageExitTransition(),
    omikujiSelection: SmoothTransitions.getOmikujiSelectionTransition()
  }
} as const

/**
 * アニメーション最適化ヘルパー
 */
export const AnimationHelpers = {
  /**
   * デバイス性能に基づく最適化設定
   */
  optimizeForDevice: () => {
    const capability = AnimationOptimizer.measureDeviceCapability()
    return AnimationOptimizer.adaptToDevice({
      performanceLevel: capability.performanceLevel,
      reducedMotionPreference: capability.reducedMotionPreference
    })
  },

  /**
   * アクセシビリティ対応アニメーション
   */
  createAccessibleAnimations: () => {
    return AnimationOptimizer.createAccessibleAnimations({
      respectMotionPreference: true,
      fallbackDuration: 0.01
    })
  },

  /**
   * GPU最適化変換
   */
  optimizeTransform: (x: number, y: number, scale: number = 1) => {
    return AnimationOptimizer.applyGpuOptimization({ x, y, scale })
  }
}

/**
 * 使用例とベストプラクティス
 */
export const AnimationUsage = {
  examples: {
    basicEntrance: `
// 基本的な入場アニメーション
import { MysteriousAppearance } from '@/animations'

const animation = MysteriousAppearance.getEntranceAnimation()
// Framer Motion で使用
<motion.div {...animation}>コンテンツ</motion.div>
    `,

    optimizedHover: `
// パフォーマンス最適化されたホバーエフェクト  
import { HoverEffects, AnimationHelpers } from '@/animations'

const hoverEffect = HoverEffects.getSaisenboxHover()
const gpuOptimized = AnimationHelpers.optimizeTransform(0, -8, 1.05)

<motion.div {...hoverEffect} style={gpuOptimized}>
  カード
</motion.div>
    `,

    accessibleAnimation: `
// アクセシビリティ対応アニメーション
import { AnimationHelpers } from '@/animations'

const accessible = AnimationHelpers.createAccessibleAnimations()
// prefers-reduced-motion を自動考慮
    `
  },

  bestPractices: [
    '神秘的な体験のための適度なディレイと段階的表示を活用',
    'GPU アクセラレーションでスムーズなパフォーマンスを確保',
    'prefers-reduced-motion 設定を必ず考慮',
    'デバイス性能に応じた動的な品質調整を実装',
    'アニメーション完了後の適切なクリーンアップを実行'
  ]
} as const