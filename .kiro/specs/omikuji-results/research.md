# Research & Design Decisions Template

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

**Usage**:
- Log research activities and outcomes during the discovery phase.
- Document design decision trade-offs that are too detailed for `design.md`.
- Provide references and evidence for future audits or reuse.
---

## Summary
- **Feature**: omikuji-results
- **Discovery Scope**: Complex Integration
- **Key Findings**:
  - 既存システムには優れた運勢データ基盤があるが、実際の結果生成・表示機能が不足
  - 確率重み付きランダム選択アルゴリズムの実装が必要
  - 日本の伝統的なおみくじ表示のためのCSS縦書きレイアウトが効果的
  - TypeScript Result型パターンを使用したエラーハンドリングがベストプラクティス

## Research Log

### 既存システムアーキテクチャ分析
- **Context**: おみくじ結果システムを既存のドメイン層・インフラ層に統合する必要性
- **Sources Consulted**: 
  - `/src/domain/valueObjects/Fortune.ts` - 運勢値オブジェクト
  - `/src/infrastructure/repositories/json/FortuneRepository.ts` - JSON実装パターン
  - `/src/domain/services/RarityCalculatorService.ts` - 確率計算サービス
  - `/app/api/fortune/types/route.ts` - API Routes実装パターン
- **Findings**: 
  - Clean Architecture + DDDパターンが徹底されている
  - Repositoryパターンによるデータアクセス抽象化済み
  - 既存のFortune値オブジェクトは豊富な振る舞いを持つ
  - JSON -> API Routes -> Frontend fetchの一貫したデータフロー
- **Implications**: 新しい結果システムは既存パターンを踏襲し、Fortune値オブジェクトを活用できる

### 確率重み付き選択アルゴリズム調査
- **Context**: 運勢に応じた複数結果からの確率的選択実装方針
- **Sources Consulted**: 
  - WebSearch: "weighted random selection algorithm javascript best practices"
  - 累積重み法 vs 反復法 vs バイナリサーチ法の比較
- **Findings**:
  - 累積重み法（Cumulative Weights Method）が性能とシンプルさのバランスで最適
  - メモリ効率を考慮し、前処理による累積配列生成が推奨される
  - 大規模データセットではO(log n)のバイナリサーチ最適化を検討
  - 10,000回以上のイテレーションによる分布テストが必要
- **Implications**: RarityCalculatorServiceパターンを拡張し、新しいOmikujiResultSelectionServiceを実装

### 感情属性による確率分布設計
- **Context**: 要件で指定された感情属性（ポジティブ・ネガティブ・ニュートラル）による重み付き選択
- **Sources Consulted**: 要件5の確率分布仕様
- **Findings**:
  - 大吉系: ポジティブ80%, ニュートラル15%, ネガティブ5%
  - 凶系: ネガティブ60%, ニュートラル25%, ポジティブ15%
  - 運勢レベルごとに異なる確率分布マトリックスが必要
- **Implications**: 二段階選択ロジック（運勢選択 → 感情属性による結果選択）の実装が必要

### 日本式縦書きUI実装調査
- **Context**: 要件4で指定された日本の伝統的なおみくじ表示
- **Sources Consulted**: 
  - WebSearch: "omikuji result display japanese traditional layout vertical text CSS"
  - W3C国際化仕様、日本語組版要件
- **Findings**:
  - `writing-mode: vertical-rl`と`text-orientation: mixed`の組み合わせが基本
  - ルビ（フリガナ）サポートに`<ruby>`タグとCSS設定
  - 伝統的な配色（金色、朱色、茶色）と視覚効果
  - モバイル対応のためのレスポンシブ縦書きレイアウト
- **Implications**: 新しいOmikujiResultDisplayコンポーネントで縦書きレイアウト専用実装

### エラーハンドリングパターン調査  
- **Context**: 結果選択失敗、データ不整合等のエラー対応設計
- **Sources Consulted**: WebSearch: "typescript discriminated unions error handling result type patterns 2024"
- **Findings**:
  - Result<T, E>型による明示的エラーハンドリングが2024年のベストプラクティス
  - `{ type: 'success'; data: T } | { type: 'error'; error: E }`パターンが推奨
  - exhaustiveness checkingによるコンパイル時安全性確保
  - ts-patternライブラリーによるパターンマッチング強化
- **Implications**: 新しいドメインサービスでResult型を採用し、型安全なエラーハンドリング実装

### 既存テスト基盤統合分析
- **Context**: 新機能のテスト戦略と既存テスト基盤の活用
- **Sources Consulted**: `/src/test/` ディレクトリ構造、Vitest設定
- **Findings**:
  - ユニット（Vitest）、統合（React Testing Library）、E2E（Playwright）環境整備済み
  - `/src/test/helpers/omikuji-test-helpers.ts`による共通テストユーティリティ
  - 自動アクセシビリティ・パフォーマンステスト基盤
- **Implications**: 既存のテストパターンとヘルパー関数を活用し、確率的テストの追加実装

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 既存Clean Architecture拡張 | ドメイン層にOmikujiResult、OmikujiResultSelectionService追加 | 一貫性、既存パターン活用、テスト容易性 | 新機能による複雑度増加 | 既存システムとの統合性最高 |
| マイクロサービス分離 | 結果システムを独立サービス化 | 独立性、スケーラビリティ | インフラ複雑化、既存統合困難 | MVP段階では過剰 |
| Component-First実装 | UI層から実装開始 | 迅速なプロトタイプ、視覚的確認 | ビジネスロジック散在、保守性低下 | DDDポリシーに反する |

## Design Decisions

### Decision: 二段階確率選択アルゴリズム
- **Context**: 運勢選択後に感情属性による結果選択が要件で指定されている
- **Alternatives Considered**:
  1. 単一段階選択 - 全結果を平坦に配置し一度に選択
  2. 二段階選択 - 運勢決定後、感情属性確率で結果選択
- **Selected Approach**: 二段階選択を採用
- **Rationale**: 要件の確率分布仕様に正確に対応、運勢と感情属性の独立性保持
- **Trade-offs**: 複雑度増加 vs 要件準拠と柔軟性向上
- **Follow-up**: 確率分布テストケース作成、性能ベンチマーク測定

### Decision: JSON-First結果データ管理
- **Context**: 結果コンテンツの管理・更新方法
- **Alternatives Considered**:
  1. データベース管理 - Supabase PostgreSQLで結果データ管理
  2. JSON-First - 既存パターンを踏襲し、JSONファイル + Repository
  3. Hardcoded - TypeScriptファイル内定義
- **Selected Approach**: JSON-Firstアプローチを継続
- **Rationale**: 既存システム一貫性、MVP迅速実装、コンテンツ管理者による更新容易性
- **Trade-offs**: スケーラビリティ制約 vs 実装・運用シンプルさ
- **Follow-up**: 将来のDB移行パスの設計検討

### Decision: TypeScript Result型エラーハンドリング
- **Context**: 結果選択失敗、確率計算エラー等の処理方針
- **Alternatives Considered**:
  1. Exception-based - try/catch例外処理
  2. Result型 - 明示的Success/Error判別共用体
  3. Null/Undefined返却 - エラー時はnull返却
- **Selected Approach**: Result<T, E>型パターンを採用
- **Rationale**: 型安全性、明示的エラーハンドリング、関数型プログラミングベストプラクティス
- **Trade-offs**: 学習コスト・実装コスト vs 安全性・保守性向上
- **Follow-up**: 共通Result型定義、エラーメッセージ国際化検討

## Risks & Mitigations

- 確率分布の実装ミス → 包括的な統計テストケース実装、10,000回イテレーション検証
- 縦書きレイアウトのブラウザ互換性 → Progressive Enhancement、フォールバック横書き対応
- JSONファイルサイズ増大 → 結果データの圧縮、遅延ロード検討
- 感情属性確率の複雑な設定ミス → 確率分布の可視化ツール、設定バリデーション実装

## References
- [Weighted Random Algorithm in JavaScript - DEV Community](https://dev.to/trekhleb/weighted-random-algorithm-in-javascript-1pdc) — 累積重み法実装パターン
- [Styling vertical Chinese, Japanese, Korean and Mongolian text - W3C](https://www.w3.org/International/articles/vertical-text/) — CSS縦書きレイアウト仕様  
- [TypeScript: Documentation - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — 判別共用体とResult型パターン
- [Requirements for Japanese Text Layout - W3C](https://w3c.github.io/jlreq/?lang=en) — 日本語組版処理要件