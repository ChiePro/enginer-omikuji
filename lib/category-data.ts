/**
 * カテゴリデータ
 *
 * 伝統的なおみくじ形式の6つのカテゴリ定義とメッセージプールを提供します。
 * エンジニア業務に関連したpositive/negativeメッセージを各カテゴリに5パターンずつ管理します。
 */

/**
 * カテゴリ識別子
 */
export type CategoryId =
  | 'coding' // コーディング運
  | 'review' // レビュー運
  | 'deploy' // デプロイ運
  | 'waiting' // 待ち人
  | 'conflict' // 争い事
  | 'growth'; // 成長運

/**
 * カテゴリメッセージプール
 *
 * @property positiveMessages - 励ましや成功を示唆するメッセージ（5パターン）
 * @property negativeMessages - 注意喚起や慎重さを促すメッセージ（5パターン）
 */
export interface CategoryMessagePool {
  positiveMessages: readonly string[];
  negativeMessages: readonly string[];
}

/**
 * カテゴリ定義
 *
 * @property id - カテゴリ識別子
 * @property name - 表示名（例: "コーディング運"）
 * @property messagePool - positive/negativeメッセージプール
 */
export interface Category {
  id: CategoryId;
  name: string;
  messagePool: CategoryMessagePool;
}

/**
 * カテゴリマスターデータ（6カテゴリ）
 *
 * エンジニア業務に関連した6つのカテゴリを定義し、
 * 各カテゴリにpositive/negative各5メッセージ、計60パターンを提供します。
 * エンジニアの「あるある」とユーモアを含んだ短いアドバイス形式です。
 */
export const categories: readonly Category[] = [
  {
    id: 'coding',
    name: 'コーディング運',
    messagePool: {
      positiveMessages: [
        'スムーズに進む',
        '実装が捗る',
        'バグなく書ける',
        'リファクタ日和',
        'コードが美しい',
      ],
      negativeMessages: [
        '要件を注意深く',
        '設計を見直せ',
        '焦らず慎重に',
        'テスト先に書け',
        '明日にするがよい',
      ],
    },
  },
  {
    id: 'review',
    name: 'レビュー運',
    messagePool: {
      positiveMessages: [
        'すぐ承認される',
        'LGTM多し',
        '指摘少なめ',
        '一発承認の兆し',
        '建設的な議論',
      ],
      negativeMessages: [
        'セルフレビューせよ',
        '説明を丁寧に',
        'PR分割せよ',
        '時間かかるべし',
        '待ち長し',
      ],
    },
  },
  {
    id: 'deploy',
    name: 'デプロイ運',
    messagePool: {
      positiveMessages: [
        '本番も安定',
        '午前にやるがよい',
        'すんなり成功',
        'ロールバック不要',
        '監視も平穏',
      ],
      negativeMessages: [
        '午後は明日が吉',
        '金曜は避けよ',
        '入念な確認を',
        'staging必須',
        'rollback準備',
      ],
    },
  },
  {
    id: 'waiting',
    name: '待ち人',
    messagePool: {
      positiveMessages: [
        'Approve来る',
        '返信早し',
        'マージされる',
        '承認すぐ下る',
        '連絡あり',
      ],
      negativeMessages: [
        '焦らず待て',
        'remind必要',
        '来たらず辛抱',
        '気長に待つべし',
        '時間を要す',
      ],
    },
  },
  {
    id: 'conflict',
    name: '争い事',
    messagePool: {
      positiveMessages: [
        'なし穏やか',
        'マージ競合なし',
        '意見一致',
        '平和に進む',
        '対立なし',
      ],
      negativeMessages: [
        'pull忘れるな',
        '冷静に対処せよ',
        '感情抑えよ',
        '論理的に話せ',
        'conflict注意',
      ],
    },
  },
  {
    id: 'growth',
    name: '成長運',
    messagePool: {
      positiveMessages: [
        '理解が早い',
        '学び多し',
        '新技術習得',
        'スキルアップ',
        '知見が深まる',
      ],
      negativeMessages: [
        '基礎を固めよ',
        '焦らず学べ',
        '復習を怠るな',
        'doc読め',
        '地道に積み上げよ',
      ],
    },
  },
] as const;

/**
 * カテゴリID配列（型安全な反復処理用）
 *
 * ループ処理やカテゴリの順序保証に使用します。
 */
export const CATEGORY_IDS: readonly CategoryId[] = [
  'coding',
  'review',
  'deploy',
  'waiting',
  'conflict',
  'growth',
] as const;
