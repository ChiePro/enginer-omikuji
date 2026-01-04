# 実装ギャップ分析 - 運勢ランダム化機能

## 1. 現状調査

### 主要なドメイン資産

#### 既存のクリーンアーキテクチャ
- **ドメイン層**: `OmikujiResult`、`Fortune`、`FortuneCategory` エンティティ/値オブジェクト
- **アプリケーション層**: `OmikujiDrawService` - 運勢選択のコアロジック
- **インフラストラクチャ層**: `JsonOmikujiResultRepository` - JSON形式データの読み込み
- **プレゼンテーション層**: API Routes (`/api/omikuji/draw`) とReactコンポーネント

#### 確率・感情システム基盤
- **`EmotionAttributeDistribution`**: Fortune値ベースの確率分布計算（positive/neutral/negative）
- **`EmotionAttributeCalculator`**: 感情属性に基づく結果選択ロジック
- **`OmikujiDrawService`**: 既にお賽銭効果と確率調整の仕組みを実装

#### データ管理パターン
- **JSONベースリポジトリ**: `data/results/*.json` 形式で各おみくじタイプ別管理
- **カテゴリ固定構造**: 現在は各結果が完全にセットされたカテゴリ配列を保持
- **感情属性統合**: データ層で`emotionAttribute`と`emotionTone`を既に分離

### 既存の制約とパターン
- **テスト駆動開発**: 包括的なテストスイート（単体・統合・E2E・パフォーマンス）
- **TypeScript Strict**: 型安全性の徹底
- **依存性注入**: Repository Pattern経由でのデータアクセス層分離
- **EARS要件**: 検証可能な受け入れ基準によるドメインロジック定義

## 2. 要件実現可能性分析

### 技術要件マッピング

| 要件領域 | 現状のアセット | ギャップ | 制約 |
|---|---|---|---|
| **カテゴリランダム化** | `FortuneCategory`値オブジェクト | カテゴリプール管理システム | 既存の5カテゴリ必須制約 |
| **確率制御システム** | `EmotionAttributeDistribution` | カテゴリレベル確率分布 | Fortune値ベース分布は実装済み |
| **コンテンツプール** | JSON Repository | 感情属性別プール構造 | 現在の固定結果構造 |
| **アーキテクチャ互換性** | CleanArchitecture + DDD | 新サービス層の統合 | IOmikujiResultRepository互換性 |
| **パフォーマンス** | 100ms要件 | メモリ効率的選択アルゴリズム | テスト決定論的要件 |

### 主要なギャップ

#### Missing: カテゴリコンテンツプールシステム
**現状**: 各結果が固定された5カテゴリセットを持つ
**必要**: 感情属性別にプールされたカテゴリコンテンツの動的選択

#### Missing: カテゴリレベル確率分布
**現状**: Fortune全体の感情分布のみ
**必要**: 各カテゴリ（恋愛運、仕事運等）レベルでの独立した確率制御

#### Unknown: 同一セッション重複制御
**現状**: 結果レベルの選択のみ
**必要**: カテゴリコンテンツレベルでの重複回避メカニズム

#### Constraint: 既存データ形式との互換性
**制約**: `OmikujiResult`エンティティの構造を維持
**影響**: 新しいカテゴリ選択ロジックを既存インターフェースに透過的に統合

## 3. 実装アプローチ選択肢

### Option A: 既存コンポーネント拡張

**対象ファイル**:
- `EmotionAttributeCalculator.ts` - カテゴリレベル選択ロジック追加
- `JsonOmikujiResultRepository.ts` - プール形式データ読み込み対応
- `OmikujiDrawService.ts` - ランダム化フロー統合

**互換性評価**: ✅ 既存インターフェース保持
**複雑性評価**: ⚠️ `EmotionAttributeCalculator`の責務拡大リスク

**Trade-offs**:
- ✅ 最小限のファイル変更、既存パターン活用
- ✅ 既存テストスイートの大部分を再利用可能
- ❌ 単一責任原則への影響（カテゴリ選択とEmotion計算の混在）
- ❌ `JsonOmikujiResultRepository`の複雑化

### Option B: 新コンポーネント作成

**新規作成が必要なコンポーネント**:
- `CategoryContentPoolService` - カテゴリコンテンツプール管理
- `CategoryRandomizationService` - カテゴリ独立選択ロジック
- `SessionDuplicationGuardService` - セッション内重複制御

**統合ポイント**:
- `OmikujiDrawService` - 新サービス群のオーケストレーション
- `ICategoryContentRepository` - 新Repository Interface定義

**責務境界**:
- **CategoryContentPoolService**: プール管理とコンテンツ提供
- **CategoryRandomizationService**: 感情分布とランダム選択
- **SessionDuplicationGuardService**: セッション状態と重複制御

**Trade-offs**:
- ✅ 明確な責務分離、拡張性の高い設計
- ✅ 既存コンポーネントの複雑化回避
- ❌ ファイル数増加、初期実装コスト
- ❌ サービス間連携の設計が必要

### Option C: ハイブリッドアプローチ

**段階的実装戦略**:
1. **Phase 1**: `EmotionAttributeCalculator`の拡張で基本ランダム化
2. **Phase 2**: パフォーマンス最適化と専用サービス分離
3. **Phase 3**: 高度な重複制御とプール管理の導入

**統合戦略**:
- 既存テストで保護されたリファクタリング
- Feature Flag による段階的ロールアウト
- 既存API互換性の維持

**リスク軽減**:
- 各段階での動作確認とテスト実行
- 既存機能への影響最小化
- 段階的な複雑性導入

**Trade-offs**:
- ✅ 段階的リスク管理、確実な動作確認
- ✅ 既存システムへの影響最小化
- ❌ 実装期間の延長
- ❌ 段階間での一時的な設計不整合

## 4. 実装複雑性とリスク評価

### 実装規模予測
**Medium (M: 3-7日)**
- 既存パターン活用可能（DDD、Repository Pattern、EARS駆動設計）
- 新しい概念（カテゴリプール、セッション管理）の導入が必要
- 包括的テストスイートの更新・拡張

### リスク評価
**Medium Risk**
- **技術リスク**: 既知のパターンでの実装、パフォーマンス要件は達成可能
- **統合リスク**: 既存アーキテクチャとの適合性は高いが、データ形式変更の影響要考慮
- **テストリスク**: 決定論的テスト要件により乱数制御の工夫が必要

### リスク根拠
- **既存基盤活用**: `EmotionAttributeDistribution`、`OmikujiDrawService`の実績
- **アーキテクチャ整合**: Clean Architecture原則に適合した拡張
- **Performance要件**: 100ms要件は既存システムで十分達成可能

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ
**Option C (ハイブリッドアプローチ)** を推奨

**理由**:
- 既存システムへの影響最小化
- 段階的な複雑性管理
- 既存テストスイートの活用
- チーム学習コストの分散

### 設計フェーズでの調査項目

1. **データ形式設計**: 
   - カテゴリプール用JSON構造の詳細仕様
   - 既存データとの互換性戦略

2. **乱数制御方式**:
   - テスト用シード機能の実装アプローチ
   - 統計精度保証のための検証方法

3. **セッション管理**:
   - 重複制御の状態管理手法
   - メモリ効率とパフォーマンスのバランス

4. **段階的移行計画**:
   - Phase間での機能切り替え戦略
   - 既存データの移行・変換手順

### 次のステップ
设计フェーズで上記調査項目を含む詳細設計を策定し、TDD原則に基づく実装計画を作成する。