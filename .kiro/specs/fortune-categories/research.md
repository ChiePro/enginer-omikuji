# Research & Design Decisions

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

**Usage**:
- Log research activities and outcomes during the discovery phase.
- Document design decision trade-offs that are too detailed for `design.md`.
- Provide references and evidence for future audits or reuse.
---

## Summary
- **Feature**: `fortune-categories`
- **Discovery Scope**: Extension
- **Key Findings**:
  - 既存の運勢システム（fortune-types）は /lib/ に実装済みで、運勢レベル定義と確率選択ロジックが完全にテスト済み（88テストパス）
  - FortuneLevel型、fortuneLevels配列、selectRandomFortune()関数が再利用可能
  - イミュータブルなデータ構造（as const, readonly）と純粋関数パターンが確立済み
  - TDD方式（RED-GREEN-REFACTOR-VERIFY）で実装され、/lib/__tests__/ にテストが配置されている

## Research Log

### 既存fortune-typesシステムの分析

#### Context
fortune-categoriesは既存のfortune-typesシステムを拡張するため、既存実装の構造と再利用可能なコンポーネントを特定する必要があった。

#### Sources Consulted
- `/lib/fortune-data.ts` - 運勢レベルとメッセージのマスターデータ
- `/lib/fortune-selector.ts` - 重み付き確率選択ロジック
- `/lib/draw-fortune.ts` - 統合関数
- `/lib/fortune-message-getter.ts` - メッセージ取得ロジック
- `/lib/omikuji-data.ts` - おみくじタイプ定義

#### Findings

**再利用可能なコンポーネント**:
1. **FortuneLevel型とfortuneLevels配列**
   - 7段階の運勢レベル（大吉、吉、中吉、小吉、末吉、凶、大凶）
   - 重み付き確率分布（16%, 23%, 34%, 12%, 8%, 4%, 3%）
   - イミュータブル（`as const`）で型安全
   - 総合運勢の決定にそのまま利用可能

2. **selectRandomFortune()関数**
   - 累積確率配列を使用した線形探索による選択
   - パフォーマンス最適化済み（事前計算された累積確率）
   - 純粋関数、副作用なし
   - カテゴリシステムでも総合運勢の選択に使用可能

3. **データ定義パターン**
   - `as const`による型レベルイミュータビリティ
   - `readonly`配列による実行時イミュータビリティ
   - interface定義による型安全性の保証

**新規実装が必要な領域**:
1. **カテゴリメッセージプールデータ**
   - 6カテゴリ × 2タイプ(positive/negative) × 5メッセージ = 60パターン
   - fortuneMessagesと同様のイミュータブル構造

2. **総合運勢メッセージデータ**
   - 7運勢レベル × 5パターン = 35メッセージ
   - 古風な言い回しスタイル

3. **確率的カテゴリ選択ロジック**
   - 運勢レベルに応じた確率分布（95%→80%→65%→55%→50%→20%→5%）
   - カテゴリごとに独立した確率判定

4. **統合結果データ構造**
   - 総合運勢レベル + 総合運勢メッセージ + 6カテゴリアドバイス

#### Implications
- **Architecture**: 既存のfortune-dataとfortune-selectorを再利用し、新規にcategory-data、category-selector、integrated-fortuneモジュールを追加
- **Testing**: 既存のテストパターン（ユニット、統合、パフォーマンス）を踏襲
- **Implementation**: TDD方式で実装、/lib/__tests__/に配置

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: 既存fortuneモジュールを拡張 | fortune-data.tsにカテゴリデータを追加 | 単一ファイルで完結、シンプル | データ量が多く可読性低下、責務の境界が曖昧 | 60+35=95メッセージパターン追加で肥大化 |
| B: 独立したcategoryモジュール作成 | category-data.ts等を新規作成し、既存モジュールは再利用 | 責務分離、可読性維持、テスト容易性 | ファイル数増加 | **選択**: 既存パターンと整合性が高く、保守性向上 |
| C: 統合モジュールで全てラップ | 新規モジュールで既存と新規を統合 | APIシンプル化 | 抽象化レイヤー追加、複雑性増加 | オーバーエンジニアリング、要件に不適合 |

## Design Decisions

### Decision: カテゴリシステムを独立モジュールとして実装

- **Context**:
  - 既存のfortune-typesシステムは4種類のおみくじ × 7運勢 = 28メッセージを管理
  - 新規のcategoryシステムは95メッセージパターン（総合35 + カテゴリ60）を追加
  - 単一ファイルに統合すると123メッセージパターンで可読性が著しく低下

- **Alternatives Considered**:
  1. **Option A**: fortune-data.tsにカテゴリデータを追加
  2. **Option B**: category-data.ts、category-selector.ts等を新規作成（独立モジュール）
  3. **Option C**: integrated-fortune.ts で既存と新規を完全に統合

- **Selected Approach**: **Option B - 独立モジュール作成**
  - `category-data.ts`: カテゴリ定義とメッセージプール
  - `overall-fortune-data.ts`: 総合運勢メッセージ（35パターン）
  - `category-selector.ts`: 確率的カテゴリアドバイス選択ロジック
  - `integrated-fortune.ts`: 総合運勢 + カテゴリアドバイスの統合関数

- **Rationale**:
  - **責務の分離**: カテゴリシステムと既存おみくじシステムは異なる目的（伝統的おみくじ vs おみくじタイプ別）
  - **可読性**: 各ファイルが単一責務に集中し、メッセージパターンが管理しやすい
  - **テスト容易性**: カテゴリロジックを独立してテスト可能
  - **Steering準拠**: structure.mdの「Flat Structure」「Colocation」原則に合致

- **Trade-offs**:
  - **Benefits**: 保守性向上、テスト容易性、拡張性（将来的なカテゴリ追加）
  - **Compromises**: ファイル数が4つ増加（category-data.ts, overall-fortune-data.ts, category-selector.ts, integrated-fortune.ts）

- **Follow-up**:
  - 実装時にファイル間の依存関係を最小化
  - 各モジュールが純粋関数として独立動作することを検証

### Decision: 確率的メッセージ選択アルゴリズム

- **Context**:
  - 各カテゴリでpositive/negativeメッセージをランダムに選択
  - 総合運勢レベルに応じた確率分布が必要（大吉95% positive → 大凶5% positive）

- **Alternatives Considered**:
  1. **Option A**: Math.random() < probability で判定し、対応プールからランダム選択
  2. **Option B**: 重み付き配列を作成し、selectRandomFortune()パターンを再利用
  3. **Option C**: 確率テーブルとルックアップによる決定論的選択

- **Selected Approach**: **Option A - 単純確率判定 + ランダムプール選択**
  ```typescript
  function selectCategoryAdvice(fortuneLevel: FortuneLevel, category: Category): string {
    const probability = getPositiveProbability(fortuneLevel);
    const isPositive = Math.random() < probability;
    const pool = isPositive ? category.positiveMessages : category.negativeMessages;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  ```

- **Rationale**:
  - **シンプル性**: ロジックが明快で理解しやすい
  - **パフォーマンス**: 2段階のMath.random()呼び出しのみ、累積配列不要
  - **要件適合**: 各カテゴリ独立判定という要件に直接対応
  - **テスト容易性**: 確率分布の統計的検証が容易

- **Trade-offs**:
  - **Benefits**: コードの可読性、実装の簡潔性、パフォーマンス（1ms以下を達成可能）
  - **Compromises**: selectRandomFortune()の累積確率パターンを再利用しない（ただし今回は不要）

- **Follow-up**:
  - 10,000回の抽選による統計的検証テストで確率分布を検証
  - 各カテゴリの独立性を確認するテストケース追加

### Decision: 総合運勢メッセージの分離

- **Context**:
  - 要件では総合運勢メッセージは「古風な言い回し」で各レベル5パターン
  - 既存のfortuneMessagesは「今日の運勢」「コードレビュー運」等のおみくじタイプ別メッセージ
  - 用途とスタイルが異なる

- **Alternatives Considered**:
  1. **Option A**: fortuneMessagesにomikujiId='overall-fortune'として追加
  2. **Option B**: overall-fortune-data.tsとして独立ファイル作成
  3. **Option C**: category-data.ts内にネストした構造で管理

- **Selected Approach**: **Option B - 独立ファイル（overall-fortune-data.ts）**

- **Rationale**:
  - **スタイルの違い**: 古風な言い回し vs エンジニア向けカジュアルな表現
  - **用途の違い**: 伝統的おみくじの総合運勢 vs おみくじタイプ別メッセージ
  - **データ量**: 35メッセージパターンで独立管理が適切
  - **将来拡張性**: 総合運勢メッセージのパターン追加が容易

- **Trade-offs**:
  - **Benefits**: データの意図が明確、メンテナンス性向上
  - **Compromises**: ファイル数増加（ただし責務明確化のメリットが上回る）

- **Follow-up**:
  - 実装時に5パターン×7レベル=35メッセージの品質確認
  - 「古風な言い回し」スタイルガイドの一貫性チェック

## Risks & Mitigations

- **Risk 1: メッセージパターン数が多く（95個）、データ定義ミスが発生しやすい**
  - **Mitigation**: TypeScript strict modeでの型チェック、テストでの全パターン検証、データ構造の一貫性チェック関数実装

- **Risk 2: 確率的選択のため、低確率イベント（大凶で5% positive）の検証が困難**
  - **Mitigation**: 統計的テスト（10,000回抽選）で確率分布を検証、許容誤差範囲（±2%）を設定

- **Risk 3: 既存fortune-typesとの統合時に型の不整合が発生**
  - **Mitigation**: FortuneLevel型の再利用、TypeScript strict modeでのコンパイル時型チェック、統合テスト実装

- **Risk 4: パフォーマンス要件（2ms以下）の未達**
  - **Mitigation**: 純粋関数実装、配列アクセスの最適化、パフォーマンステストでの継続的検証

## References

### 既存実装
- `/lib/fortune-data.ts` - FortuneLevel型、fortuneLevels配列、fortuneMessages配列の参考実装
- `/lib/fortune-selector.ts` - selectRandomFortune()関数の重み付き確率選択パターン
- `/lib/draw-fortune.ts` - drawFortune()統合関数の参考実装

### プロジェクトガイドライン
- `.kiro/steering/structure.md` - /lib/ディレクトリパターン、TDD方式、イミュータブルデータ構造の原則
- `.kiro/steering/tech.md` - TypeScript strict mode、Jest 30.2.0、テスト配置パターン
- `.kiro/steering/product.md` - おみくじの種類（4種類）と運勢レベル（7段階）の定義

### 技術仕様
- TypeScript Handbook - Type Inference with `as const`
- Jest Documentation - Unit Testing Best Practices
