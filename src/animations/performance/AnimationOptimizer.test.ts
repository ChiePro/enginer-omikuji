import { describe, it, expect } from 'vitest'
import { AnimationOptimizer } from './AnimationOptimizer'

describe('AnimationOptimizer', () => {
  describe('パフォーマンス計測', () => {
    it('デバイスのアニメーション性能を測定する', () => {
      const performance = AnimationOptimizer.measureDeviceCapability()
      
      expect(performance).toEqual({
        fps: expect.any(Number),
        gpuAcceleration: expect.any(Boolean),
        reducedMotionPreference: expect.any(Boolean),
        deviceMemory: expect.any(Number),
        hardwareConcurrency: expect.any(Number),
        performanceLevel: expect.stringMatching(/^(high|medium|low)$/)
      })
    })

    it('アニメーション実行時のフレームレートを監視する', () => {
      const monitor = AnimationOptimizer.createFrameRateMonitor()
      
      expect(monitor).toEqual({
        startMonitoring: expect.any(Function),
        stopMonitoring: expect.any(Function),
        getCurrentFPS: expect.any(Function),
        getAverageFPS: expect.any(Function),
        isPerformanceGood: expect.any(Function)
      })
    })
  })

  describe('動的最適化', () => {
    it('フレームドロップ検出時に自動で品質を下げる', () => {
      const optimizer = AnimationOptimizer.createAdaptiveOptimizer({
        targetFPS: 60,
        fallbackFPS: 30
      })
      
      expect(optimizer.onFrameDrop).toEqual({
        disableBlur: true,
        reduceComplexity: true,
        shortenDuration: 0.7,
        simplifyEasing: true
      })
    })

    it('デバイス性能に応じたアニメーション設定を適応する', () => {
      const lowEndConfig = AnimationOptimizer.adaptToDevice({
        performanceLevel: 'low',
        reducedMotionPreference: false
      })
      
      expect(lowEndConfig).toEqual({
        enableBlur: false,
        enableShadow: false,
        duration: 0.15,
        complexity: 'minimal',
        preferredProperties: ['opacity', 'transform'],
        maxConcurrentAnimations: 3
      })
    })

    it('高性能デバイス向けの拡張アニメーション設定を生成する', () => {
      const highEndConfig = AnimationOptimizer.adaptToDevice({
        performanceLevel: 'high',
        reducedMotionPreference: false
      })
      
      expect(highEndConfig).toEqual({
        enableBlur: true,
        enableShadow: true,
        enableParticles: true,
        duration: 0.8,
        complexity: 'rich',
        preferredProperties: ['opacity', 'transform', 'filter'],
        maxConcurrentAnimations: 10
      })
    })
  })

  describe('GPU アクセラレーション最適化', () => {
    it('transform3d を使用したGPU最適化を適用する', () => {
      const gpuTransform = AnimationOptimizer.applyGpuOptimization({
        x: 100,
        y: 50,
        scale: 1.1
      })
      
      expect(gpuTransform).toEqual({
        transform: 'translate3d(100px, 50px, 0) scale3d(1.1, 1.1, 1)',
        willChange: 'transform',
        backfaceVisibility: 'hidden'
      })
    })

    it('アニメーション開始時にGPUレイヤーを事前準備する', () => {
      const preparation = AnimationOptimizer.prepareGpuLayers(['card-1', 'card-2', 'header'])
      
      expect(preparation).toEqual({
        precomputedLayers: ['card-1', 'card-2', 'header'],
        strategy: 'preload',
        cleanup: expect.any(Function),
        estimatedMemoryUsage: expect.any(Number)
      })
    })
  })

  describe('メモリ管理', () => {
    it('不要なアニメーションインスタンスを自動クリーンアップする', () => {
      const cleaner = AnimationOptimizer.createMemoryCleaner()
      
      expect(cleaner).toEqual({
        registerAnimation: expect.any(Function),
        cleanup: expect.any(Function),
        getMemoryUsage: expect.any(Function),
        setAutoCleanup: expect.any(Function),
        maxInstances: 50
      })
    })

    it('アニメーション終了後のDOMクリーンアップを実行する', () => {
      const cleanup = AnimationOptimizer.createDomCleaner()
      
      expect(cleanup.cleanupProperties).toEqual([
        'willChange',
        'transform',
        'filter',
        'backfaceVisibility'
      ])
      expect(cleanup.resetOnComplete).toBe(true)
    })
  })

  describe('バッチング最適化', () => {
    it('同じフレームのアニメーション更新をバッチ処理する', () => {
      const batcher = AnimationOptimizer.createAnimationBatcher()
      
      expect(batcher).toEqual({
        queueUpdate: expect.any(Function),
        flushUpdates: expect.any(Function),
        maxBatchSize: 10,
        autoFlush: true,
        batchInterval: 16 // ~60fps
      })
    })

    it('大量要素のアニメーション処理を最適化する', () => {
      const bulkOptimizer = AnimationOptimizer.createBulkAnimator({
        elements: 100,
        staggerDelay: 0.05
      })
      
      expect(bulkOptimizer).toEqual({
        useWorker: true,
        chunkSize: 10,
        staggerDelay: 0.05,
        fallbackToCSS: true,
        maxConcurrency: 5
      })
    })
  })

  describe('アクセシビリティ統合', () => {
    it('prefers-reduced-motion を考慮したアニメーション設定を生成する', () => {
      const accessibleConfig = AnimationOptimizer.createAccessibleAnimations({
        respectMotionPreference: true,
        fallbackDuration: 0.01
      })
      
      expect(accessibleConfig.respectMotionPreference).toBe(true)
      expect(accessibleConfig.reducedMotion).toEqual({
        duration: 0.01,
        effects: ['fade'],
        disableAutoplay: true
      })
      expect(accessibleConfig.normal).toEqual({
        duration: 0.6,
        effects: ['fade', 'scale', 'blur'],
        enableAutoplay: true
      })
    })
  })

  describe('リアルタイム調整', () => {
    it('実行中のアニメーション品質を動的に調整する', () => {
      const dynamicAdjuster = AnimationOptimizer.createDynamicQualityAdjuster()
      
      expect(dynamicAdjuster).toEqual({
        adjustQuality: expect.any(Function),
        currentLevel: 'medium',
        thresholds: {
          high: { minFPS: 55, maxMemory: 50 },
          medium: { minFPS: 45, maxMemory: 100 },
          low: { minFPS: 25, maxMemory: 200 }
        }
      })
    })

    it('ネットワーク状況に応じたアニメーション調整を行う', () => {
      const networkAware = AnimationOptimizer.createNetworkAwareOptimizer()
      
      expect(networkAware.lowBandwidth).toEqual({
        preloadAssets: false,
        reduceComplexity: true,
        disableVideoBackgrounds: true
      })
      expect(networkAware.highBandwidth).toEqual({
        preloadAssets: true,
        enableRichEffects: true,
        allowVideoBackgrounds: true
      })
    })
  })
})