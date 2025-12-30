# Research & Design Decisions

---
**Purpose**: トップページ機能の設計発見と技術的決定の記録

**Usage**: 既存Next.jsアプリケーションへのトップページ機能追加における設計判断の根拠を提供
---

## Summary
- **Feature**: `top-page`
- **Discovery Scope**: Extension（既存Next.jsアプリケーションへの機能追加）
- **Key Findings**:
  - 既存のNext.js App Router構造が整備されており、Server Componentパターンを活用可能
  - Tailwind CSS 4とGeistフォントが既に設定済みで、デザインシステムの一貫性を保持可能
  - おみくじデータの管理方法（静的データ vs 動的データ）が設計上の重要な決定点

## Research Log

### 既存アプリケーション構造の分析
- **Context**: トップページを既存のNext.jsアプリケーションに統合する際の拡張ポイントを特定
- **Sources Consulted**:
  - `app/layout.tsx` - ルートレイアウトとフォント設定
  - `app/page.tsx` - 現在のホームページ実装
  - `app/globals.css` - グローバルスタイル設定
  - `package.json` - 技術スタック確認
- **Findings**:
  - Next.js 16.1.1（App Router）とReact 19.2.3を使用
  - Tailwind CSS 4が設定済み（`@theme inline`構文を使用）
  - Geist Sans/Monoフォントが既にロード済み
  - ダークモード対応の設定が存在（`prefers-color-scheme`）
  - TypeScript strict modeが有効
  - `app/page.tsx`が既存のホームページとして存在（上書き対象）
- **Implications**:
  - `app/page.tsx`を完全に置き換える形でトップページを実装
  - 既存のレイアウトとフォント設定はそのまま活用
  - Tailwind CSSのユーティリティクラスを使用した一貫したスタイリング
  - Server Componentをデフォルトとし、必要に応じてClient Componentを使用

### おみくじデータの管理戦略
- **Context**: おみくじ一覧を表示するためのデータソースと管理方法を決定
- **重要**: 本セクションで定義するデータモデルは**初期実装のための仮のモデル**です。将来的な拡張性（アイコン、カテゴリ、難易度、メタデータ等）を考慮した設計とします
- **Alternatives Considered**:
  1. **静的データ（TypeScript定数）** - シンプルで初期実装に適している
  2. **JSONファイル** - 設定ファイルとして管理しやすい
  3. **外部API** - 動的な管理が可能だが、初期段階では過剰
  4. **データベース** - 最も柔軟だが、認証不要の公開サービスには不要
- **Selected Approach**: 静的データ（TypeScript定数）
- **Rationale**:
  - プロジェクトは認証不要の公開型サービス（steering/product.md参照）
  - 初期段階では固定のおみくじセットで十分
  - TypeScript strict modeによる型安全性を最大限活用
  - サーバーサイドレンダリングのパフォーマンスを最適化
  - 将来的にJSONファイルやAPIへの移行も容易（型定義を維持）
- **Trade-offs**:
  - **利点**: 実装がシンプル、型安全、ビルド時最適化、デプロイが容易
  - **制約**: データ更新にはコード変更とデプロイが必要
- **Follow-up**: 将来的におみくじの追加頻度が高くなった場合、`lib/omikuji-data.json`への移行を検討

### Next.js App Router のルーティング戦略
- **Context**: おみくじ詳細ページへのナビゲーション実装
- **Sources Consulted**:
  - Next.js 16.1公式ドキュメント（App Router）
  - steering/structure.md - プロジェクト構造方針
- **Findings**:
  - Next.js App Routerはファイルベースルーティング
  - `next/link`コンポーネントによるクライアントサイドナビゲーション
  - Dynamic Routesパターン（`app/omikuji/[id]/page.tsx`）を使用可能
- **Implications**:
  - トップページでは`next/link`を使用してナビゲーション実装
  - おみくじIDをslugとして使用（例: `/omikuji/daily-luck`）
  - 将来の詳細ページ実装を考慮したURL設計

### アクセシビリティとSEO対応
- **Context**: Requirement 5（パフォーマンスとアクセシビリティ）の技術的実装方針
- **Sources Consulted**: Next.js Metadata API、WCAG 2.1ガイドライン
- **Findings**:
  - Next.js Metadata APIによるSEO最適化が標準装備
  - セマンティックHTML（`<nav>`, `<main>`, `<article>`）の使用が推奨
  - キーボードナビゲーションは`next/link`で自動サポート
- **Implications**:
  - `metadata`オブジェクトでページタイトル、description、OGPタグを設定
  - `<nav>`要素でおみくじ一覧をマークアップ
  - ARIA属性は最小限に抑え、セマンティックHTMLを優先

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Server Component Only | トップページ全体をServer Componentとして実装 | SSRによる高速初期表示、SEO最適化、ゼロJavaScript | インタラクティブ要素（ホバーエフェクト）の実装制約 | Requirement 3.3（ホバーエフェクト）のためClient Component化が必要 |
| Hybrid (Server + Client) | メインページはServer Component、インタラクティブ部分のみClient Component | パフォーマンスと機能性のバランス、部分的なインタラクティブ機能初期化 | コンポーネント分割の複雑性 | **選択** - OmikujiCardコンポーネントのみClient Component化 |
| Client Component Only | トップページ全体をClient Componentとして実装 | 実装がシンプル、全機能がクライアントサイド | JavaScript依存、初期ロード遅延、SEO不利 | steering/tech.mdの「Server Components First」方針に反する |

**用語補足: インタラクティブ機能初期化**
- サーバーで生成された静的HTMLページ（見た目だけの状態）に対して、ブラウザ側でJavaScriptを実行することで、ボタンのクリック、ホバーエフェクト、フォーム入力などの動的機能を有効化するプロセス
- 段階的な処理: ① サーバーがHTMLを生成 → ② ブラウザが見た目を表示 → ③ JavaScriptがインタラクティブ機能を追加
- Hybrid (Server + Client)パターンでは、必要最小限のコンポーネントのみをインタラクティブ化することで、初期表示の高速性を保ちつつ、ユーザー操作にも対応できる

## Design Decisions

### Decision: `おみくじデータの型定義と管理`
- **Context**: TypeScript strict modeでの型安全性を確保しつつ、将来の拡張性を考慮
- **重要な前提**: 本決定で定義する`Omikuji`型は初期実装用の最小構成（id, name, description）です。将来的にはicon、category、difficulty、metadata等のフィールド追加を想定しています
- **Alternatives Considered**:
  1. インラインオブジェクト配列 - 型推論に依存
  2. 明示的な型定義 + データ分離 - 型安全性と拡張性のバランス
- **Selected Approach**: `Omikuji`型インターフェースを定義し、`lib/omikuji-data.ts`で管理（初期は3フィールドのみ、拡張容易な設計）
- **Rationale**:
  - TypeScript strict modeによる完全な型チェック
  - 将来的なデータソース変更時の型定義再利用
  - IDEの自動補完とリファクタリングサポート
  - ユニットテスト時のモックデータ作成の容易性
- **Trade-offs**:
  - **Benefits**: 型安全性、保守性、拡張性、開発体験向上
  - **Compromises**: 小規模データに対してやや冗長
- **Follow-up**: データ量増加時のパフォーマンス監視

### Decision: `レスポンシブデザインのブレークポイント`
- **Context**: Requirement 4（レスポンシブデザイン）の実装基準
- **Alternatives Considered**:
  1. Tailwind CSS標準ブレークポイント（sm: 640px, md: 768px）
  2. カスタムブレークポイント
- **Selected Approach**: Tailwind CSS標準ブレークポイント（`md: 768px`）を採用
- **Rationale**:
  - 既存のTailwind CSS設定との一貫性
  - 一般的なモバイル/タブレット/デスクトップの区分に合致
  - Requirement 4の基準（768px）と一致
- **Trade-offs**:
  - **Benefits**: 標準的、保守性、他コンポーネントとの一貫性
  - **Compromises**: 特殊なデバイスサイズへの最適化は別途考慮が必要
- **Follow-up**: 実機テストでの検証

### Decision: `コンポーネント分割戦略`
- **Context**: Server ComponentとClient Componentの境界を最適化
- **Selected Approach**:
  - `app/page.tsx` - Server Component（ページ全体、データ取得）
  - `app/components/OmikujiCard.tsx` - Client Component（ホバーエフェクト）
  - `lib/omikuji-data.ts` - データ定義と型
- **Rationale**:
  - Next.js 19のServer Components Firstプリンシプルに準拠
  - ホバーエフェクトなどのインタラクティブ機能のみクライアント化
  - データ取得とレンダリングのサーバーサイド最適化
- **Trade-offs**:
  - **Benefits**: 初期ロードの高速化、SEO最適化、JavaScript bundle削減
  - **Compromises**: コンポーネント間の責任分離管理が必要
- **Follow-up**: パフォーマンス計測（Lighthouse、Core Web Vitals）

## Risks & Mitigations
- **Risk 1**: おみくじデータが静的であるため、頻繁な更新に対応できない
  - **Mitigation**: 初期段階では静的データで十分。将来的にデータ層を抽象化し、JSON/APIへの移行パスを確保
- **Risk 2**: ホバーエフェクトのためにClient Component化することでSSRの利点が一部失われる
  - **Mitigation**: OmikujiCardコンポーネントのみClient Component化し、ページ全体はServer Componentとして維持
- **Risk 3**: おみくじ詳細ページが未実装のため、リンク先が404になる
  - **Mitigation**: 初期段階ではリンクをプレースホルダーとして実装。詳細ページ実装時にルーティングを有効化

## References
- [Next.js 16 App Router Documentation](https://nextjs.org/docs/app) - ルーティングとServer Components
- [Tailwind CSS 4 Documentation](https://tailwindcss.com/docs) - v4の新しい`@theme inline`構文
- [React 19 Documentation](https://react.dev/) - 最新のReact機能とパターン
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - アクセシビリティ基準
