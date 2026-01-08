# Research & Design Decisions

## Summary
- **Feature**: deploy-vercel
- **Discovery Scope**: Extension（既存Next.jsアプリケーションへのVercelデプロイ設定追加）
- **Key Findings**:
  - Next.js 16.1.1はVercelでゼロコンフィグデプロイをサポート
  - 現在の設定ファイル（next.config.ts）は最小構成、セキュリティヘッダー追加が必要
  - カスタムエラーページ（404/500）は未実装、App Routerの規約に従い作成が必要

## Research Log

### Vercel + Next.js 16 デプロイ設定
- **Context**: Next.js 16（App Router）のVercelデプロイ要件を確認
- **Sources Consulted**: Vercel公式ドキュメント、Next.js公式ドキュメント
- **Findings**:
  - VercelはNext.jsを自動検出し、ビルドコマンドやアウトプットディレクトリを設定不要
  - App Routerは`app/`ディレクトリで自動認識される
  - `vercel.json`は基本的に不要（カスタム設定がある場合のみ）
  - セキュリティヘッダーは`next.config.ts`の`headers`関数で設定可能
- **Implications**: 設定ファイルの追加は最小限で済む

### セキュリティヘッダー設定
- **Context**: 本番環境向けのHTTPセキュリティヘッダー要件
- **Sources Consulted**: OWASP Security Headers、MDN Web Docs
- **Findings**:
  - 必須ヘッダー: X-Frame-Options、X-Content-Type-Options、Referrer-Policy
  - 推奨ヘッダー: Strict-Transport-Security（HSTS）
  - Next.jsではnext.config.tsのheaders()で設定
  - VercelはデフォルトでHTTPS強制（HSTSは追加推奨）
- **Implications**: next.config.tsにheaders設定を追加

### カスタムエラーページ
- **Context**: App Routerでのエラーページ実装パターン
- **Sources Consulted**: Next.js App Router Documentation
- **Findings**:
  - 404: `app/not-found.tsx`で実装
  - 500/グローバルエラー: `app/error.tsx`（クライアント）、`app/global-error.tsx`（ルート）
  - App Routerでは`error.tsx`は`'use client'`ディレクティブが必須
  - 既存デザインシステム（ShrineDesignTokens）を活用可能
- **Implications**: 3つのエラーページファイルを新規作成

### ビルド最適化
- **Context**: 本番ビルドの最適化オプション確認
- **Sources Consulted**: Next.js Configuration Documentation
- **Findings**:
  - ソースマップ: `productionBrowserSourceMaps: false`がデフォルト
  - 圧縮: `compress: true`がデフォルト
  - 画像最適化: `next/image`使用で自動最適化
  - Vercel Analytics: `@vercel/analytics`パッケージで有効化可能
- **Implications**: 基本的な最適化はデフォルトで有効、追加設定は最小限

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| ゼロコンフィグデプロイ | Vercelの自動検出に依存 | 設定不要、メンテナンス少 | カスタマイズ制限 | 現在のプロジェクトに適合 |
| vercel.json使用 | 明示的な設定ファイル | 完全な制御 | 追加メンテナンス | 複雑な要件がある場合のみ |

**選択**: ゼロコンフィグデプロイ（vercel.json不使用）

## Design Decisions

### Decision: セキュリティヘッダー設定方法
- **Context**: HTTPセキュリティヘッダーをどこで設定するか
- **Alternatives Considered**:
  1. next.config.ts の headers() — Next.js標準
  2. vercel.json の headers — Vercel固有
  3. ミドルウェア — 柔軟だが複雑
- **Selected Approach**: next.config.ts の headers()
- **Rationale**: ポータビリティが高く、Next.js標準の方法。Vercel以外のホスティングでも動作
- **Trade-offs**: vercel.jsonより若干設定が冗長だが、プラットフォーム非依存
- **Follow-up**: 本番デプロイ後にセキュリティスキャンで検証

### Decision: エラーページの実装アプローチ
- **Context**: App Routerでのエラーページ構成
- **Alternatives Considered**:
  1. 最小限の実装（シンプルなテキスト）
  2. 既存デザインシステム活用（神社風UI）
- **Selected Approach**: 既存デザインシステム活用
- **Rationale**: ユーザー体験の一貫性を維持、ブランドイメージ統一
- **Trade-offs**: 実装コストが若干増加
- **Follow-up**: なし

### Decision: 環境変数管理
- **Context**: 環境変数の文書化と管理方法
- **Alternatives Considered**:
  1. .env.example のみ
  2. .env.example + 環境変数検証スクリプト
  3. 型安全な環境変数ライブラリ（t3-env等）
- **Selected Approach**: .env.example のみ（現時点で必須環境変数なし）
- **Rationale**: 現在のアプリケーションは環境変数を使用していない。将来必要になった際に追加
- **Trade-offs**: 将来の拡張時に再検討が必要
- **Follow-up**: Supabase統合時に再評価

## Risks & Mitigations
- **Risk 1**: ビルドエラーによるデプロイ失敗 — 事前にローカルでnpm run buildを実行して検証
- **Risk 2**: セキュリティヘッダー設定ミス — デプロイ後にセキュリティスキャナーで検証
- **Risk 3**: Core Web Vitalsの基準未達 — Vercel Analyticsで継続監視

## References
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment) — Vercelデプロイの公式ガイド
- [Next.js Headers Configuration](https://nextjs.org/docs/app/api-reference/next-config-js/headers) — セキュリティヘッダー設定
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling) — App Routerエラーページ
- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/) — セキュリティヘッダーベストプラクティス
