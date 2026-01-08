/**
 * おみくじデータ型定義とデータソース
 *
 * このモジュールはおみくじアプリケーションのコアデータ型とサンプルデータを提供します。
 * 将来的な拡張性を考慮した設計となっています。
 */

/**
 * おみくじの基本情報を表すインターフェース
 *
 * @property id - 一意識別子（URL-safe: 英数字、ハイフン、アンダースコアのみ）
 * @property name - 表示名（例: "今日の運勢"）
 * @property description - 簡潔な説明（50文字程度推奨）
 * @property usesLegacySystem - 従来のfortuneMessagesシステムを使用するかどうか（デフォルト: true）
 *
 * 将来的な拡張フィールド候補:
 * - icon?: string - おみくじのアイコンパス
 * - category?: string - カテゴリ分類（業務、コミュニケーション、技術など）
 * - difficulty?: number - 難易度や重要度
 * - metadata?: Record<string, unknown> - 拡張用メタデータ
 */
export interface Omikuji {
  id: string;
  name: string;
  description: string;
  usesLegacySystem?: boolean;
}

/**
 * おみくじデータの静的リスト
 *
 * イミュータブルな配列として定義し、データの一貫性を保証します。
 * 初期段階では3種類のエンジニア向けおみくじを提供します。
 *
 * データ更新にはコード変更とデプロイが必要です。
 * 将来的にはJSON/API化を検討します。
 */
export const omikujiList: readonly Omikuji[] = [
  {
    id: 'daily-luck',
    name: '今日の運勢',
    description: '今日1日の業務運を占います',
  },
] as const;
