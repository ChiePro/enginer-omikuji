import { describe, it, expect } from 'vitest'
import { 
  MysteriousAppearance,
  HoverEffects, 
  SmoothTransitions,
  AnimationOptimizer,
  ShrineAnimationSystem,
  AnimationHelpers
} from './index'

describe('アニメーションシステム統合テスト', () => {
  it('アニメーションシステム全体がエクスポートされている', () => {
    expect(MysteriousAppearance).toBeDefined()
    expect(HoverEffects).toBeDefined()
    expect(SmoothTransitions).toBeDefined()
    expect(AnimationOptimizer).toBeDefined()
    expect(ShrineAnimationSystem).toBeDefined()
    expect(AnimationHelpers).toBeDefined()
  })

  it('デフォルト設定が正しく定義されている', () => {
    expect(ShrineAnimationSystem.defaults.duration).toBe(0.6)
    expect(ShrineAnimationSystem.defaults.ease).toEqual([0.25, 0.1, 0.25, 1])
    expect(ShrineAnimationSystem.defaults.stagger).toBe(0.1)
    expect(ShrineAnimationSystem.defaults.respectMotionPreference).toBe(true)
  })

  it('パフォーマンスプロファイルが段階的に設定されている', () => {
    const { high, medium, low } = ShrineAnimationSystem.performance
    
    expect(high.maxConcurrentAnimations).toBe(10)
    expect(medium.maxConcurrentAnimations).toBe(6)
    expect(low.maxConcurrentAnimations).toBe(3)
    
    expect(high.enableBlur).toBe(true)
    expect(medium.enableBlur).toBe(false)
    expect(low.enableBlur).toBe(false)
  })

  it('神社テーマプリセットが利用可能', () => {
    const presets = ShrineAnimationSystem.presets
    
    expect(presets.entrance).toBeDefined()
    expect(presets.mistFade).toBeDefined()
    expect(presets.ripple).toBeDefined()
    expect(presets.saisenboxHover).toBeDefined()
    expect(presets.pageEntrance).toBeDefined()
  })

  it('アニメーションヘルパーが機能する', () => {
    // デバイス最適化
    const deviceConfig = AnimationHelpers.optimizeForDevice()
    expect(deviceConfig).toHaveProperty('enableBlur')
    expect(deviceConfig).toHaveProperty('duration')
    expect(deviceConfig).toHaveProperty('maxConcurrentAnimations')
    
    // アクセシビリティ対応
    const accessibleConfig = AnimationHelpers.createAccessibleAnimations()
    expect(accessibleConfig.respectMotionPreference).toBe(true)
    expect(accessibleConfig.reducedMotion).toBeDefined()
    expect(accessibleConfig.normal).toBeDefined()
    
    // GPU最適化
    const gpuTransform = AnimationHelpers.optimizeTransform(100, -50, 1.1)
    expect(gpuTransform.transform).toContain('translate3d')
    expect(gpuTransform.willChange).toBe('transform')
  })

  it('システム間の連携が正常に動作する', () => {
    // パフォーマンス測定 → 最適化 → アニメーション適用の流れ
    const capability = AnimationOptimizer.measureDeviceCapability()
    const optimizedConfig = AnimationOptimizer.adaptToDevice({
      performanceLevel: capability.performanceLevel,
      reducedMotionPreference: capability.reducedMotionPreference
    })
    
    // 測定結果に基づいてアニメーション設定が調整される
    expect(optimizedConfig.duration).toBeGreaterThan(0)
    expect(optimizedConfig.maxConcurrentAnimations).toBeGreaterThan(0)
    
    // アニメーション設定がプリセットと互換性がある
    const entrance = MysteriousAppearance.getEntranceAnimation()
    expect(entrance.initial).toBeDefined()
    expect(entrance.animate).toBeDefined()
  })

  it('レスポンシブ対応が一貫している', () => {
    // 神秘的出現アニメーションのモバイル対応
    const mobileAnimation = MysteriousAppearance.getMobileOptimizedAnimation()
    expect(mobileAnimation.duration).toBe(0.4)
    expect(mobileAnimation.reducedMotion).toBe(true)
    
    // 遷移アニメーションのモバイル対応  
    const mobileTransitions = SmoothTransitions.getMobileOptimizedTransitions()
    expect(mobileTransitions.duration).toBe(0.3)
    expect(mobileTransitions.reducedEffects).toBe(true)
    
    // パフォーマンス最適化による低性能デバイス対応
    const lowEndConfig = AnimationOptimizer.adaptToDevice({
      performanceLevel: 'low',
      reducedMotionPreference: false
    })
    expect(lowEndConfig.duration).toBe(0.15)
    expect(lowEndConfig.complexity).toBe('minimal')
  })

  it('アクセシビリティ要件が満たされている', () => {
    // 削減モーション設定
    const reducedMotion = MysteriousAppearance.getReducedMotionAnimation()
    expect(reducedMotion.respectsMotionPreference).toBe(true)
    expect(reducedMotion.effects).toEqual(['fade'])
    
    // キーボードナビゲーション対応
    const focusEffect = HoverEffects.getFocusEffect()
    expect(focusEffect.whileFocus).toBeDefined()
    expect(focusEffect.whileHover).toBeDefined()
    
    // アクセシブルホバー効果
    const accessibleHover = HoverEffects.getAccessibleHover({
      reduceMotion: true
    })
    expect(accessibleHover.respectsMotionPreference).toBe(true)
  })
})