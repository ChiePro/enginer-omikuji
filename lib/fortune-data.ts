/**
 * 運勢データ型定義とデータソース
 *
 * このモジュールは運勢レベルとメッセージのマスターデータを提供します。
 * TypeScript strict modeで型安全性を保証し、イミュータブルなデータ構造を採用しています。
 */

/**
 * 運勢レベルを表すインターフェース
 *
 * @property id - 一意識別子（URL-safe: 英数字、ハイフン、アンダースコアのみ）
 * @property name - 表示名（例: "大吉", "吉"）
 * @property weight - 確率の重み（1-100の整数、合計100）
 * @property rank - 順序（1=最高、7=最低）
 */
export interface FortuneLevel {
  id: string;
  name: string;
  weight: number;
  rank: number;
}

/**
 * 運勢メッセージを表すインターフェース
 *
 * @property omikujiId - おみくじの一意識別子（例: 'daily-luck'）
 * @property fortuneId - 運勢レベルの一意識別子（例: 'daikichi'）
 * @property message - メッセージ本文（100文字程度）
 */
export interface FortuneMessage {
  omikujiId: string;
  fortuneId: string;
  message: string;
}

/**
 * 運勢レベルのマスターデータ（7種類）
 *
 * イミュータブルな配列として定義し、データの一貫性を保証します。
 * 重み付き確率分布:
 * - 中吉が最も高確率（34%）でポジティブな体験を提供
 * - 大吉・吉・中吉: 高確率（合計73%）
 * - 小吉・末吉: 通常確率（合計20%）
 * - 凶・大凶: 低確率（合計7%）
 */
export const fortuneLevels: readonly FortuneLevel[] = [
  { id: 'daikichi', name: '大吉', weight: 16, rank: 1 },
  { id: 'kichi', name: '吉', weight: 23, rank: 2 },
  { id: 'chukichi', name: '中吉', weight: 34, rank: 3 },
  { id: 'shokichi', name: '小吉', weight: 12, rank: 4 },
  { id: 'suekichi', name: '末吉', weight: 8, rank: 5 },
  { id: 'kyo', name: '凶', weight: 4, rank: 6 },
  { id: 'daikyo', name: '大凶', weight: 3, rank: 7 },
] as const;

/**
 * 運勢メッセージのマスターデータ（7パターン）
 *
 * 1種類のおみくじ×7段階の運勢=7パターンのメッセージを提供します。
 * 各メッセージはエンジニアの業務に関連した表現を含み、
 * 運勢レベルに応じた適切なトーン（大吉は励まし、凶は注意喚起）で作成されています。
 */
export const fortuneMessages: readonly FortuneMessage[] = [
  // 今日の運勢 (daily-luck) × 7運勢
  {
    omikujiId: 'daily-luck',
    fortuneId: 'daikichi',
    message: '今日は最高の1日！コードもレビューもスムーズに進み、素晴らしい成果が出せるでしょう。',
  },
  {
    omikujiId: 'daily-luck',
    fortuneId: 'kichi',
    message: '良い1日になりそうです。積極的にチャレンジすれば、順調に開発が進むでしょう。',
  },
  {
    omikujiId: 'daily-luck',
    fortuneId: 'chukichi',
    message: 'まずまず良い運勢です。集中して取り組めば、着実に進捗が出せるでしょう。',
  },
  {
    omikujiId: 'daily-luck',
    fortuneId: 'shokichi',
    message: '小さな幸運がありそうです。丁寧にコードを書けば、良い結果につながるでしょう。',
  },
  {
    omikujiId: 'daily-luck',
    fortuneId: 'suekichi',
    message: '地道な努力が報われる日。焦らず一歩ずつ進めば、成果が見えてくるでしょう。',
  },
  {
    omikujiId: 'daily-luck',
    fortuneId: 'kyo',
    message: '今日は慎重に。細かい部分の確認を怠らず、落ち着いて対応しましょう。',
  },
  {
    omikujiId: 'daily-luck',
    fortuneId: 'daikyo',
    message: '今日は注意が必要です。実装前の設計見直しとテストを念入りに行いましょう。',
  },
] as const;
