# Research & Design Decisions

---
**Purpose**: 運勢種類機能の発見フェーズで得られた調査結果、アーキテクチャ検討、設計根拠を記録する。

**Usage**:
- ライトディスカバリープロセスの実施結果を記録
- 設計決定のトレードオフを詳細に文書化
- 将来の監査や再利用のための参照情報を提供
---

## Summary
- **Feature**: `fortune-types`
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - 既存の`Omikuji`インターフェース（`lib/omikuji-data.ts`）との統合が必要
  - 運勢種類とメッセージは新規データモデルとして追加、既存の型定義パターンに準拠
  - 重み付き確率分布の実装には標準的なJavaScript乱数生成を使用、外部ライブラリ不要

## Research Log

### 既存コードベースの型定義パターン
- **Context**: 既存の`Omikuji`インターフェースとの統合方法を決定する必要がある
- **Sources Consulted**:
  - `/lib/omikuji-data.ts` - 既存のおみくじデータ型定義
  - プロジェクトのTypeScript設定（strict mode有効）
- **Findings**:
  - `Omikuji`インターフェース：`id`, `name`, `description`の3フィールド
  - readonly配列（`as const`）を使用してイミュータブルなデータを実装
  - 拡張フィールド候補がコメントで記載されており、将来の拡張性を考慮した設計
  - TypeScript strict modeで型安全性を厳格に適用
- **Implications**:
  - 運勢種類も同様のパターン（interface定義 + readonly配列）で実装すべき
  - 新規の`FortuneLevel`型と`FortuneMessage`型を定義
  - 既存の`Omikuji`型と組み合わせて使用可能な設計とする

### 重み付き確率分布の実装方法
- **Context**: 大吉・吉・中吉が多めに出る確率分布を実現する必要がある
- **Sources Consulted**:
  - JavaScript標準の`Math.random()`
  - TypeScript型安全な乱数生成パターン
- **Findings**:
  - 累積確率分布を使用した重み付き選択アルゴリズムが標準的
  - 外部ライブラリ不要で実装可能
  - テスト可能性のため、確率の重みを設定可能なデータ構造が必要
- **Implications**:
  - `FortuneLevel`に`weight`フィールドを追加
  - 累積確率配列を生成する関数を実装
  - ランダム選択ロジックは純粋関数として実装し、テストしやすくする

### ファイル配置とディレクトリ構造
- **Context**: 新規ファイルの配置場所を決定する必要がある
- **Sources Consulted**:
  - `.kiro/steering/structure.md` - プロジェクト構造の原則
  - 既存の`/lib/omikuji-data.ts`
- **Findings**:
  - `/lib/`ディレクトリにユーティリティ関数とロジックを配置するパターン
  - 既存の`omikuji-data.ts`に運勢関連の型定義が存在
- **Implications**:
  - 運勢種類とメッセージのデータは`/lib/fortune-data.ts`として新規作成
  - ランダム選択ロジックは`/lib/fortune-selector.ts`として分離
  - 既存の`omikuji-data.ts`と並列に配置し、両方をインポート可能にする

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 単一ファイルに統合 | `omikuji-data.ts`に運勢種類も追加 | ファイル数が少ない、単純 | ファイルサイズ増大、責務が曖昧 | 既存ファイルが既に明確な責務を持つため不適切 |
| 機能別ファイル分割 | `fortune-data.ts`（運勢定義）と`fortune-selector.ts`（選択ロジック）に分割 | 責務が明確、テストしやすい、拡張性が高い | ファイル数が増える | ✅ 推奨：単一責任原則に準拠 |
| モジュールディレクトリ | `/lib/fortune/`ディレクトリを作成して複数ファイルを配置 | より詳細な構造化 | 現時点では過剰設計 | 将来的な選択肢として保留 |

## Design Decisions

### Decision: 運勢種類の型定義方法
- **Context**: 7段階の運勢レベルを型安全に定義する必要がある
- **Alternatives Considered**:
  1. 文字列リテラルのUnion型 - `type FortuneLevel = '大吉' | '吉' | ...`
  2. オブジェクトインターフェース - `interface FortuneLevel { id, name, weight, rank }`
  3. enum - `enum FortuneLevel { DAIKICHI, KICHI, ... }`
- **Selected Approach**: オブジェクトインターフェース（Option 2）
- **Rationale**:
  - 重み付け（weight）と順序（rank）の情報を含める必要がある
  - 既存の`Omikuji`インターフェースパターンと一貫性がある
  - TypeScript strict modeで型安全性を保証
  - 将来的な拡張（色、アイコンなど）が容易
- **Trade-offs**:
  - 利点：型安全、拡張可能、一貫性
  - 欠点：文字列リテラルより少し冗長
- **Follow-up**: 実装時に`as const`を使用してイミュータブルな配列を作成

### Decision: メッセージのデータ構造
- **Context**: おみくじタイプ×運勢レベルの組み合わせでメッセージを取得する必要がある
- **Alternatives Considered**:
  1. ネストされたオブジェクト - `{ 'daily-luck': { 'daikichi': 'message' } }`
  2. フラットな配列 - `[{ omikujiId, fortuneId, message }]`
  3. Map構造 - `Map<string, Map<string, string>>`
- **Selected Approach**: フラットな配列（Option 2）
- **Rationale**:
  - TypeScriptの型推論がしやすい
  - 将来的なフィルタリングや拡張が容易
  - イミュータブルなデータ構造として管理しやすい
  - JSON化が簡単（将来のAPI化を考慮）
- **Trade-offs**:
  - 利点：型安全、拡張可能、JSON互換
  - 欠点：検索にO(n)の線形探索が必要（データ量が小さいため問題なし）
- **Follow-up**: メッセージ取得用のヘルパー関数を提供

### Decision: ランダム選択アルゴリズム
- **Context**: 重み付き確率分布を実装する必要がある
- **Alternatives Considered**:
  1. 累積確率分布テーブル方式
  2. 重み配列を展開して均等選択
  3. 外部ライブラリ（weighted-random等）を使用
- **Selected Approach**: 累積確率分布テーブル方式（Option 1）
- **Rationale**:
  - アルゴリズムが明確で理解しやすい
  - パフォーマンスが良い（O(n)で累積配列作成、O(log n)で二分探索）
  - 外部依存なし
  - テスト可能性が高い
- **Trade-offs**:
  - 利点：高速、依存なし、テスト可能
  - 欠点：実装が若干複雑（ただし標準的なアルゴリズム）
- **Follow-up**: ユニットテストで確率分布の正確性を検証

## Risks & Mitigations
- **Risk 1**: 確率の重み付けが意図した分布にならない可能性
  - **Mitigation**: ユニットテストで大量サンプリング（10,000回以上）して統計的に検証
- **Risk 2**: 既存の`Omikuji`型との統合で型の不整合が発生する可能性
  - **Mitigation**: TypeScript strict modeで型チェックを厳格に実施、統合テストで検証
- **Risk 3**: メッセージ数（4種類×7段階=28メッセージ）の管理が煩雑
  - **Mitigation**: TypeScriptの型定義で全組み合わせの存在をコンパイル時にチェック可能な設計とする

## References
- [TypeScript strict mode](https://www.typescriptlang.org/tsconfig#strict) - 型安全性のベストプラクティス
- [Weighted Random Selection Algorithm](https://en.wikipedia.org/wiki/Fitness_proportionate_selection) - 重み付き選択の標準アルゴリズム
- Existing codebase: `/lib/omikuji-data.ts` - 既存の型定義パターン参照
