# Research & Design Decisions Template

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

**Usage**:
- Log research activities and outcomes during the discovery phase.
- Document design decision trade-offs that are too detailed for `design.md`.
- Provide references and evidence for future audits or reuse.
---

## Summary
- **Feature**: `omikuji-result`
- **Discovery Scope**: Extension
- **Key Findings**:
  - 既存の運勢システム（`drawFortune`, `drawIntegratedFortune`）が確立されており、型定義も完備
  - React 19とNext.js App Routerのベストプラクティスに従ったClient Component設計が必要
  - localStorage/sessionStorageの型安全な実装パターンが確立されている（2025年のベストプラクティス）

## Research Log
Document notable investigation steps and their outcomes. Group entries by topic for readability.

### 既存システムの統合ポイント分析
- **Context**: おみくじ結果表示機能が既存の運勢抽選システムとどのように統合するか調査
- **Sources Consulted**:
  - `/lib/draw-fortune.ts` - 基本運勢抽選
  - `/lib/integrated-fortune.ts` - 統合運勢抽選
  - `/lib/fortune-data.ts` - 型定義とマスターデータ
- **Findings**:
  - `FortuneResult`インターフェース（`level: FortuneLevel`, `message: string`）が基本型として確立
  - `IntegratedFortuneResult`インターフェース（`level`, `overallMessage`, `categoryAdvice`）が統合運勢用に定義済み
  - 両システムとも純粋関数として実装され、副作用なし
  - `drawFortune(omikujiId)` と `drawIntegratedFortune()` が主要なエントリーポイント
- **Implications**:
  - 結果表示コンポーネントは既存の型定義を再利用可能
  - 新しい型定義の導入は最小限に抑えられる
  - ストレージに保存するデータも既存型をベースに設計できる

### React 19とNext.js App Routerのストレージパターン
- **Context**: Client Componentでのブラウザストレージ利用のベストプラクティス調査
- **Sources Consulted**:
  - [LocalStorage and sessionStorage with React hooks](https://kloudbased.com/article/localstorage-and-sessionstorage-with-react-hooks-in-typescript/)
  - [Next.js 15: App Router — A Complete Senior-Level Guide](https://medium.com/@livenapps/next-js-15-app-router-a-complete-senior-level-guide-0554a2b820f7)
  - [Best Practices for Organizing Your Next.js 15 2025](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji)
- **Findings**:
  - **Custom Hooks推奨**: `useLocalStorage` / `useSessionStorage` カスタムフックで抽象化
  - **TypeScript Generics**: ジェネリクスを使った型安全なストレージアクセス
  - **JSON Serialization**: `JSON.stringify` / `JSON.parse` による自動シリアライズ
  - **Error Handling**: try-catchによる例外処理（SSR対応含む）
  - **useEffect統合**: Reactライフサイクルとの統合パターン
  - **Client Component**: `'use client'` ディレクティブによる明示的なClient Component化
- **Implications**:
  - カスタムフックを新規作成し、型安全なストレージアクセスを提供
  - SSR時のwindow未定義エラーを防ぐためのガード処理が必須
  - ストレージキーの命名規則を明確化（例: `omikuji-result:daily-luck`）

### UIコンポーネントパターン分析
- **Context**: 既存のUIコンポーネント設計を調査し、一貫性のあるデザインを検討
- **Sources Consulted**:
  - `/app/components/OmikujiCard.tsx` - 既存カードコンポーネント
  - `/app/page.tsx` - トップページレイアウト
- **Findings**:
  - Tailwind CSS 4を使用したユーティリティファーストスタイリング
  - ダークモード対応（`dark:` プレフィックス）
  - グラデーション背景（`bg-gradient-to-br`）とカード型UI
  - アクセシビリティ重視（`aria-label`, セマンティックHTML）
  - ホバーエフェクトとトランジションアニメーション
- **Implications**:
  - 結果表示コンポーネントも同様のデザインパターンを踏襲
  - 運勢レベルに応じた配色（大吉=ゴールド、吉=ブルー、凶=レッドなど）
  - カード型UIでの統一感を維持

### アニメーションとパフォーマンス
- **Context**: 結果表示時のアニメーション実装とパフォーマンス最適化を調査
- **Sources Consulted**:
  - Tailwind CSS transition utilities
  - CSS prefers-reduced-motion メディアクエリ
  - React 19 performance best practices
- **Findings**:
  - Tailwind CSSの`transition-all`, `duration-*`, `ease-*`ユーティリティで実装可能
  - `prefers-reduced-motion`メディアクエリによるアクセシビリティ対応
  - CSS transformsとopacityを使用したGPUアクセラレーション
  - React 19の自動バッチング機能により再レンダリング最適化
- **Implications**:
  - Tailwind CSSのみでアニメーション実装（追加ライブラリ不要）
  - `motion-reduce:` プレフィックスでアニメーション無効化対応
  - パフォーマンス目標（100ms以内のレンダリング）は達成可能

## Architecture Pattern Evaluation
List candidate patterns or approaches that were considered. Use the table format where helpful.

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Standalone Page | `/omikuji/[id]/result` ページで結果表示 | ルーティング明確、URL共有可能 | ページ遷移コスト、状態管理複雑化 | 要件の共有機能に適合 |
| Modal Overlay | 同一ページ内でモーダル表示 | UX連続性、高速表示 | URL共有不可、SEO非対応 | 要件3（ストレージ保存）でカバー可能 |
| Hybrid Approach | Client Componentでの条件付きレンダリング | 柔軟性高、段階的実装可能 | 状態管理が複雑化する可能性 | **選択**: 初期実装として最適 |

## Design Decisions
Record major decisions that influence `design.md`. Focus on choices with significant trade-offs.

### Decision: `Client Component + Custom Hook Pattern`
- **Context**: 結果表示とストレージ管理を実装するためのアーキテクチャ選択
- **Alternatives Considered**:
  1. Server Component + Cookie/URL params — サーバーサイドでの状態管理
  2. Client Component + Context API — グローバルステート管理
  3. Client Component + Custom Hook — ローカル状態 + ブラウザストレージ
- **Selected Approach**: Client Component + Custom Hook（選択肢3）
- **Rationale**:
  - ブラウザストレージ（localStorage/sessionStorage）はClient Componentでのみアクセス可能
  - カスタムフックにより再利用性と保守性が向上
  - 型安全性をTypeScript Genericsで保証
  - 既存のNext.js App Router構造に自然に統合
- **Trade-offs**:
  - **Benefits**: 型安全、再利用可能、テスタビリティ高、SSR対応
  - **Compromises**: Client Component必須（バンドルサイズ微増）、初回レンダリング時のhydration考慮必要
- **Follow-up**: カスタムフックのユニットテスト実装、SSRエラーハンドリング検証

### Decision: `LocalStorage vs SessionStorage`
- **Context**: 結果の永続化にlocalStorageとsessionStorageのどちらを使用するか
- **Alternatives Considered**:
  1. localStorage — ブラウザ閉じても永続
  2. sessionStorage — タブ閉じたら消える
  3. 両方サポート — ユーザー選択可能
- **Selected Approach**: localStorage（選択肢1）
- **Rationale**:
  - 要件3「ページをリロードしても直近のおみくじ結果を確認できる」を満たす
  - ユーザーがブラウザを閉じた後も結果を見返せる方が利便性が高い
  - 実装シンプル（sessionStorageとの切り替えは将来的に追加可能）
- **Trade-offs**:
  - **Benefits**: 永続性、ユーザー利便性高
  - **Compromises**: プライバシー考慮必要（ただしセンシティブデータなし）
- **Follow-up**: ストレージクリア機能の実装、有効期限（TTL）の検討

### Decision: `運勢レベル別カラーマッピング`
- **Context**: 7段階の運勢レベルに対する視覚的区別の実装方法
- **Alternatives Considered**:
  1. 固定カラーマッピング（大吉=金、吉=青、凶=赤など）
  2. グラデーションスケール（良→悪でカラースケール）
  3. アイコン + テキストのみ（色に依存しない）
- **Selected Approach**: 固定カラーマッピング + アイコン（選択肢1の拡張）
- **Rationale**:
  - 色覚異常ユーザーのため、色だけでなくアイコンとテキストでも識別可能にする（要件8.5）
  - 日本のおみくじ文化に合わせた直感的な配色（大吉=金、凶=暗色）
  - Tailwind CSSの既存カラーパレットで実装可能
- **Trade-offs**:
  - **Benefits**: 直感的、文化的適合、アクセシビリティ準拠
  - **Compromises**: 配色の微調整が必要、ダークモード対応
- **Follow-up**: WCAG 2.1 AAコントラスト比検証、アイコン選定

## Risks & Mitigations
- **Risk 1: SSR時のwindow/localStorage未定義エラー** — Mitigation: useEffect内でストレージアクセス、typeof window !== 'undefined'ガード
- **Risk 2: JSONシリアライズエラー（循環参照など）** — Mitigation: シンプルなデータ構造、try-catch包囲、バリデーション
- **Risk 3: バンドルサイズ増加** — Mitigation: Client Component最小化、dynamic import検討、10KB以下の目標設定
- **Risk 4: ストレージ容量制限（5-10MB）** — Mitigation: 単一結果のみ保存、古い結果は上書き、サイズモニタリング

## References
Provide canonical links and citations (official docs, standards, ADRs, internal guidelines).
- [LocalStorage and sessionStorage with React hooks in TypeScript](https://kloudbased.com/article/localstorage-and-sessionstorage-with-react-hooks-in-typescript/) — Custom hooks pattern
- [React 19 localStorage best practices](https://www.robinwieruch.de/local-storage-react/) — Type-safe storage implementation
- [Next.js 15 App Router Guide](https://medium.com/@livenapps/next-js-15-app-router-a-complete-senior-level-guide-0554a2b820f7) — Client/Server Component patterns
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) — Accessibility standards
- [Tailwind CSS Transitions](https://tailwindcss.com/docs/transition-property) — Animation utilities
