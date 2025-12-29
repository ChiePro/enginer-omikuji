# 技術仕様

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **アニメーション**: Framer Motion
- **状態管理**: Zustand（必要に応じて）

### バックエンド
- **API**: Next.js API Routes
- **データベース**: 
  - 初期: インメモリ/JSONファイル（Repositoryパターン経由）
  - 将来: Supabase（PostgreSQL）
- **認証**: 
  - 初期: 不要
  - 将来: Supabase Auth

### インフラ・デプロイ
- **ホスティング**: Vercel
- **CDN**: Vercel Edge Network
- **環境**: 開発・ステージング・本番

### 開発ツール
- **パッケージマネージャー**: pnpm
- **リンター**: ESLint
- **フォーマッター**: Prettier
- **Git hooks**: Husky + lint-staged
- **テスト**: Jest + React Testing Library + Vitest

## アーキテクチャ設計

### クリーンアーキテクチャ（DDD準拠）
Eric EvansのDomain Driven Designに基づいたクリーンアーキテクチャを採用。ビジネスロジックをフレームワークから独立させる。

### ディレクトリ構造
```
src/
├── app/                    # Next.js App Router（プレゼンテーション層）
├── components/            # 再利用可能なUIコンポーネント
├── domain/               # ドメイン層（ビジネスロジック）
│   ├── entities/         # エンティティ
│   ├── valueObjects/     # 値オブジェクト
│   ├── repositories/     # リポジトリインターフェース
│   └── services/         # ドメインサービス
├── application/          # アプリケーション層
│   └── useCases/        # ユースケース
├── infrastructure/       # インフラストラクチャ層
│   ├── repositories/     # リポジトリ実装
│   └── external/         # 外部サービス連携
├── features/             # 機能別のプレゼンテーション層
│   ├── omikuji/         # おみくじ機能UI
│   └── share/           # シェア機能UI
├── lib/                  # ユーティリティ関数
├── hooks/               # カスタムフック
├── types/               # 共通TypeScript型定義
└── styles/              # グローバルスタイル
```

### データフロー（クリーンアーキテクチャ）
1. **プレゼンテーション層**: クライアントからのリクエスト受信
2. **アプリケーション層**: ユースケースの実行
3. **ドメイン層**: ビジネスロジックの処理（おみくじ生成）
4. **インフラストラクチャ層**: 必要に応じてデータ永続化
5. **プレゼンテーション層**: 結果をクライアントに返却

### DDD設計

#### エンティティ
- `Omikuji`: おみくじエンティティ（ID、結果、レアリティを持つ）
- `OmikujiSession`: おみくじセッション（お賽銭情報を保持）

#### 値オブジェクト
- `OmikujiType`: おみくじの種類
- `Rarity`: レアリティ（Common, Rare, Epic, Legendary）
- `Fortune`: 運勢（大吉、吉、中吉、小吉、末吉、凶）
- `Saisen`: お賽銭金額

#### ドメインサービス
- `OmikujiDrawService`: おみくじ抽選ロジック
- `RarityCalculator`: レアリティ計算サービス

#### リポジトリインターフェース
- `IOmikujiRepository`: おみくじデータの永続化インターフェース
- `IOmikujiResultRepository`: おみくじ結果の取得インターフェース

### データアクセス層の設計

#### 初期実装（インメモリ/JSON）
```typescript
// リポジトリインターフェース
interface IOmikujiResultRepository {
  findByTypeAndId(type: OmikujiType, id: string): Promise<OmikujiResult | null>
  findAllByType(type: OmikujiType): Promise<OmikujiResult[]>
}

// 初期実装（JSONファイルから読み込み）
class JsonOmikujiResultRepository implements IOmikujiResultRepository {
  // data/omikuji-results.json から読み込み
}
```

#### 将来実装（Supabase）
```typescript
// 同じインターフェースを実装
class SupabaseOmikujiResultRepository implements IOmikujiResultRepository {
  // Supabaseクライアントを使用してDBアクセス
}
```

#### データ管理方針
- 初期: `data/omikuji/`以下にJSONファイルで管理
- おみくじ結果データはバージョン管理に含める
- Repositoryインターフェースは変更せず、実装のみ差し替え
- 依存性注入でRepository実装を切り替え可能に

## パフォーマンス要件
- First Contentful Paint: < 1.2秒
- Time to Interactive: < 2.5秒
- Core Web Vitals準拠

## セキュリティ
- CSP（Content Security Policy）の設定
- Rate Limitingの実装（API保護）
- 環境変数の適切な管理

## 開発規約

### テスト駆動開発（TDD）
t-wadaのTDD手法に基づいた開発プロセスを採用。

#### TDDサイクル
1. **Red**: 失敗するテストを書く
2. **Green**: テストを通る最小限のコードを書く
3. **Refactor**: コードをリファクタリングする

#### テスト方針
- **テストファースト**: 実装前にテストを書く
- **小さなステップ**: 一度に一つのことだけをテストする
- **明確な名前**: テストケースは日本語で記述可
- **AAA原則**: Arrange（準備）、Act（実行）、Assert（検証）
- **テストダブル**: モックよりもスタブを優先

#### テストの種類
1. **ユニットテスト**: ドメイン層、アプリケーション層
2. **統合テスト**: インフラストラクチャ層、API Routes
3. **E2Eテスト**: クリティカルなユーザーフロー（Playwright）

### コーディング規約
- コミットメッセージ: Conventional Commits
- ブランチ戦略: GitHub Flow
- コードレビュー必須
- TypeScript strictモード有効
- 依存性逆転の原則（DIP）の遵守
- ドメイン層はフレームワークに依存しない