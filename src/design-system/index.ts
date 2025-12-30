/**
 * 神社テーマデザインシステム
 * 
 * エンジニア向けおみくじサービスの一貫したデザイン言語を提供。
 * 伝統的な神社建築とモダンなテクノロジーを融合した視覚的アイデンティティ。
 */

// カラーパレット
export { ShrineColorPalette } from './colors/ShrineColorPalette'
export type { ColorVariant } from './colors/ShrineColorPalette'

// デザイントークン
export { ShrineDesignTokens } from './tokens/ShrineDesignTokens'
export type { 
  ArchitectureElement, 
  TechElement, 
  DeviceSize as TokenDeviceSize 
} from './tokens/ShrineDesignTokens'

// スペーシングシステム
export { ShrineSpacing } from './spacing/ShrineSpacing'
export type { 
  SpacingScale, 
  DeviceSize as SpacingDeviceSize, 
  ContentType 
} from './spacing/ShrineSpacing'

// インポート後にコンフィギュレーションを定義
import { ShrineColorPalette } from './colors/ShrineColorPalette'

/**
 * デザインシステム全体のコンフィギュレーション
 */
export const ShrineDesignSystem = {
  /**
   * テーマバリアント
   */
  themes: {
    light: {
      primary: ShrineColorPalette.shu.primary,
      secondary: ShrineColorPalette.kin.primary,
      background: ShrineColorPalette.shiro.primary,
      text: ShrineColorPalette.sumi.primary
    },
    dark: {
      primary: ShrineColorPalette.shu.light,
      secondary: ShrineColorPalette.kin.light,
      background: ShrineColorPalette.sumi.primary,
      text: ShrineColorPalette.shiro.primary
    },
    cyber: {
      primary: ShrineColorPalette.cyber.primary,
      secondary: ShrineColorPalette.neon.primary,
      background: ShrineColorPalette.sumi.secondary,
      text: ShrineColorPalette.shiro.primary
    }
  },

  /**
   * ブレークポイント
   */
  breakpoints: {
    mobile: '0px',
    tablet: '768px', 
    desktop: '1024px'
  },

  /**
   * アニメーション継続時間
   */
  animations: {
    fast: '150ms',
    base: '250ms',
    slow: '400ms',
    mysterious: '800ms' // 神秘的なアニメーション用
  },

  /**
   * 影とエレベーション
   */
  shadows: {
    subtle: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
    strong: '0 8px 24px rgba(0, 0, 0, 0.2)',
    shrine: '0 4px 16px rgba(229, 57, 53, 0.2), 0 2px 8px rgba(255, 179, 0, 0.1)', // 神社特有の影
    tech: '0 0 20px rgba(0, 188, 212, 0.3), 0 4px 16px rgba(33, 33, 33, 0.4)' // テック感のある影
  }
} as const

/**
 * 使用例とベストプラクティスガイド
 */
export const DesignSystemUsage = {
  /**
   * カラーの適切な使用法
   */
  colorGuidelines: {
    primary: '朱色 - CTA、重要な要素、ブランドアクセント',
    secondary: '金色 - 特別な要素、プレミアム感、装飾',
    background: '白/墨色 - 背景、カードベース',
    text: '墨色/白色 - 本文、見出し',
    accent: 'サイバー青/ネオン緑 - インタラクティブ要素、フィードバック'
  },

  /**
   * スペーシングの適切な使用法
   */
  spacingGuidelines: {
    xs: '境界線調整、微細なレイアウト',
    sm: '要素間の小さなギャップ、コンパクトなレイアウト',
    base: 'デフォルトの余白、基本的な要素間隔',
    md: '段落間、セクション内の要素間隔',
    lg: 'セクション間、大きな要素グループの分離',
    xl: 'メジャーセクション間、ページレベルの分離',
    '2xl': 'ページ全体の余白、特別なスペーシング'
  },

  /**
   * レスポンシブ対応指針
   */
  responsiveGuidelines: {
    mobile: 'コンパクト、タッチフレンドリー、縦スクロール最適化',
    tablet: '中間サイズ、読みやすさ重視、ハイブリッドインタラクション',
    desktop: 'フル機能、視覚的階層、マウス操作最適化'
  }
} as const