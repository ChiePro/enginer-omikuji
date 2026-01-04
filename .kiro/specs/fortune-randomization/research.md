# Research & Design Decisions - 運勢ランダム化機能

## Summary
- **Feature**: `fortune-randomization`
- **Discovery Scope**: Complex Integration
- **Key Findings**:
  - TypeScript向けの実績ある加重ランダム選択アルゴリズムが複数存在（Alias Method、バイナリサーチ最適化）
  - セッションベースの重複回避システムには複数のアプローチが利用可能（Bloom Filter、インメモリ追跡）
  - 決定論的テストに適したseeded PRNGライブラリが成熟している（seedrandom、Prando）

## Research Log

### Weighted Random Selection Algorithms
- **Context**: 感情属性に基づく確率的カテゴリ選択の実装方法調査
- **Sources Consulted**: 
  - DEV Community articles on weighted random algorithms
  - NPM package ecosystem (seedrandom, prando, weighted-random)
  - Academic papers on probability distribution algorithms
- **Findings**: 
  - **Alias Method**: O(n)初期化、O(1)選択、最高性能を提供
  - **バイナリサーチ最適化**: 大規模アイテムセットでの高頻度サンプリングに適用可能
  - **累積確率法**: シンプルで実装容易、中小規模データセットに適している
- **Implications**: 既存のEmotionAttributeCalculatorの拡張でAlias Methodを実装可能

### Deterministic Random Number Generation for Testing
- **Context**: 5.2要件（決定論的テスト可能な乱数シード機能）の実装調査
- **Sources Consulted**: 
  - seedrandom GitHub repository and documentation
  - Node.js testing best practices for PRNG
  - TypeScript integration patterns for seeded randomization
- **Findings**:
  - **seedrandom**: 最も広く使用される、グローバル/ローカル両対応、状態管理機能あり
  - **Prando**: TypeScript対応、UI/ゲーム用途向け設計、reset機能提供
  - **テストアイソレーション**: 環境変数によるシード管理、テスト毎のインスタンス分離が推奨
- **Implications**: seedrandomライブラリの導入で決定論的テストが実現可能

### Session-Based Content Deduplication
- **Context**: 3.4要件（同一セッション内でのカテゴリコンテンツ重複抑制）の実装方式調査
- **Sources Consulted**: 
  - Session-based recommender systems research papers
  - Weighted sampling without replacement algorithms
  - Deduplication algorithms in content management systems
- **Findings**:
  - **Weighted Sampling Without Replacement**: Efraimidis-Spirakis Algorithm (A-Res)でO(n log n)実現
  - **セッションストレージ**: Redis LPUSH/LTRIMパターン、max 25k履歴管理が一般的
  - **Bloom Filter**: スケーラブルな重複検出、時間ベースフィルタリング対応
- **Implications**: インメモリセッション追跡とweighted sampling without replacementの組み合わせが最適

### Category Content Pool Management
- **Context**: 3.1要件（感情属性別コンテンツプール維持）のデータ構造設計調査
- **Sources Consulted**: 
  - Content-defined chunking algorithms research
  - Pool management patterns in recommendation systems
  - JSON data structure optimization for TypeScript
- **Findings**:
  - **階層型プール構造**: カテゴリ → 感情属性 → コンテンツアイテムの3層構造が効率的
  - **動的プール拡張**: 実行時の新規コンテンツ統合パターンが確立済み
  - **フォールバック戦略**: デフォルトコンテンツによる graceful degradation が標準
- **Implications**: 既存JSONデータ構造の拡張でプール管理システム実装可能

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Service Layer Extension | 既存EmotionAttributeCalculatorの拡張 | 最小限の変更、既存パターン活用 | 単一責任原則への影響 | Gap Analysisで推奨された段階的アプローチ |
| Dedicated Service Creation | CategoryRandomizationService新規作成 | 明確な責務分離、拡張性 | ファイル数増加、初期コスト | 将来的な拡張性を重視する場合に選択 |
| Hybrid Approach | 段階的実装（拡張→分離） | リスク軽減、確実な動作確認 | 実装期間延長 | 既存アーキテクチャパターンに最適合 |

## Design Decisions

### Decision: `Hybrid Implementation Strategy`
- **Context**: Requirements 1-5の複雑な機能要件と既存アーキテクチャとの整合性
- **Alternatives Considered**:
  1. 既存コンポーネント拡張のみ — シンプルだが複雑性増大リスク
  2. 完全新規サービス作成 — 責務分離明確だが初期コスト高
- **Selected Approach**: 段階的ハイブリッドアプローチ
  - Phase 1: EmotionAttributeCalculatorの拡張で基本ランダム化
  - Phase 2: 専用CategoryRandomizationServiceの分離
  - Phase 3: 高度なプール管理とセッション制御
- **Rationale**: 既存テストスイートの保護とリスク最小化
- **Trade-offs**: 実装期間延長 vs リスク軽減と段階的学習
- **Follow-up**: 各段階でのパフォーマンス測定と要件充足確認

### Decision: `seedrandom Library for Deterministic Testing`
- **Context**: 5.2要件（決定論的テスト可能な乱数シード機能）
- **Alternatives Considered**:
  1. Prando — TypeScript特化だが機能限定
  2. Custom PRNG — 完全制御可能だが開発コスト高
- **Selected Approach**: seedrandom library導入
- **Rationale**: 実績豊富、状態管理機能、既存テストフレームワークとの親和性
- **Trade-offs**: 外部依存追加 vs 実装コスト削減と信頼性向上
- **Follow-up**: テストスイートでのシード管理パターン確立

### Decision: `JSON Pool Structure Extension`
- **Context**: 3.1要件（感情属性別コンテンツプール維持）
- **Alternatives Considered**:
  1. 完全新規データ形式 — 最適化可能だが互換性破綻
  2. データベース移行 — スケーラブルだが実装複雑化
- **Selected Approach**: 既存JSON構造の階層的拡張
- **Rationale**: 4.4要件（JSON データ形式拡張）との整合性
- **Trade-offs**: スケーラビリティ制限 vs 既存システム互換性維持
- **Follow-up**: プール容量とパフォーマンスの監視

## Risks & Mitigations
- **Performance Risk**: 100ms要件への影響 — Alias Methodによる最適化とベンチマーク実装
- **Memory Consumption**: セッション状態管理によるメモリ増加 — 適切なセッションタイムアウトとガベージコレクション
- **Data Consistency**: JSON拡張による既存データ整合性 — 段階的移行とフォールバック機能

## References
- [seedrandom Library](https://github.com/davidbau/seedrandom) — JavaScript deterministic random number generator
- [Weighted Random Algorithms](https://dev.to/jacktt/understanding-the-weighted-random-algorithm-581p) — Implementation patterns and best practices
- [Session-Based Recommender Systems](https://arxiv.org/pdf/1902.04864) — Academic research on session management and deduplication
- [Weighted Sampling Without Replacement](https://maxhalford.github.io/blog/weighted-sampling-without-replacement/) — Algorithm implementation strategies