# プロジェクト構造

## 現在の状態
- Next.jsボイラーテンプレートで初期化済み
- 基本的な設定（ESLint, TypeScript等）は完了
- Volta pinによるNode.js/pnpmバージョン管理設定済み

## 主要ディレクトリ構成

```
enginer-omikuji/
├── .kiro/                    # Kiro SDD関連
│   ├── steering/            # プロジェクトステアリング
│   └── specs/              # 機能仕様
├── src/                     # ソースコード
│   ├── app/                # Next.js App Router（プレゼンテーション層）
│   │   ├── layout.tsx      # ルートレイアウト
│   │   ├── page.tsx        # ホームページ
│   │   ├── api/           # APIルート
│   │   └── omikuji/       # おみくじページ
│   ├── domain/            # ドメイン層（ビジネスロジック）
│   │   ├── entities/      # エンティティ
│   │   ├── valueObjects/  # 値オブジェクト
│   │   ├── repositories/  # リポジトリインターフェース
│   │   └── services/      # ドメインサービス
│   ├── application/       # アプリケーション層
│   │   └── useCases/     # ユースケース
│   ├── infrastructure/    # インフラストラクチャ層
│   │   ├── repositories/  # リポジトリ実装
│   │   │   └── json/     # JSON実装
│   │   └── external/      # 外部サービス連携
│   ├── components/        # 共通UIコンポーネント
│   │   ├── ui/           # 基本UIコンポーネント
│   │   └── layout/       # レイアウトコンポーネント
│   ├── features/          # 機能別プレゼンテーション層
│   │   ├── omikuji/      # おみくじ機能UI
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   └── share/        # シェア機能UI
│   ├── lib/              # 共通ライブラリ
│   ├── hooks/            # 共通カスタムフック
│   ├── types/            # 共通型定義
│   └── styles/           # グローバルスタイル
├── public/               # 静的ファイル
├── data/                # 初期データファイル
│   └── omikuji/        # おみくじ結果データ
│       ├── engineer-fortune.json    # エンジニア運勢
│       ├── tech-selection.json      # 技術選定おみくじ
│       ├── debug-fortune.json       # デバッグ運
│       ├── review-fortune.json      # コードレビュー運
│       └── deploy-fortune.json      # デプロイ運
├── tests/               # テストファイル
└── package.json         # プロジェクト設定
```

## モジュール設計

### おみくじ機能 (`features/omikuji/`)
- `OmikujiSelector`: おみくじ種類選択コンポーネント
- `OmikujiDrawer`: おみくじを引くコンポーネント
- `OmikujiResult`: 結果表示コンポーネント
- `useOmikuji`: おみくじロジックのカスタムフック
- `omikujiData`: おみくじデータ定義

### シェア機能 (`features/share/`)
- `ShareButtons`: SNSシェアボタン群
- `ShareModal`: シェア用モーダル
- `useShare`: シェア機能のカスタムフック

## APIエンドポイント設計

```
/api/omikuji/
├── draw/              # おみくじを引く
│   └── POST: { type: string } => { result: OmikujiResult }
├── types/             # おみくじの種類一覧
│   └── GET: => { types: OmikujiType[] }
└── stats/             # 統計情報（将来的）
    └── GET: => { stats: Statistics }
```

## 型定義構造

```typescript
// おみくじタイプ
interface OmikujiType {
  id: string
  name: string
  description: string
  icon: string
}

// おみくじ結果
interface OmikujiResult {
  id: string
  type: string
  fortune: string      // 運勢（大吉、中吉など）
  message: string      // メッセージ
  advice: string       // アドバイス
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  shareText: string    // シェア用テキスト
}
```

## 開発フロー
1. `.kiro/specs/`に機能仕様を作成
2. 仕様に基づいて実装
3. PRを作成してレビュー
4. mainブランチにマージ
5. Vercelで自動デプロイ