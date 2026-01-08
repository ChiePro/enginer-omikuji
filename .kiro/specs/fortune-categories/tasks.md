# Implementation Plan

## タスク概要

TDD方式（RED-GREEN-REFACTOR-VERIFY）で実装。各モジュールはテストファースト、純粋関数として実装し、既存fortune-typesシステムとの統合を保証する。

## 実装タスク

- [x] 1. 総合運勢メッセージデータの実装
- [x] 1.1 (P) 総合運勢メッセージのテスト作成
  - 7運勢レベル×5パターン=35メッセージすべてが存在することを検証するテスト
  - getOverallFortuneMessage()が有効なfortuneIdで正常動作するテスト
  - 不正なfortuneIdでエラーをスローするテスト
  - ランダム選択が5パターンから均等に選ばれることの統計的検証（100回実行）
  - _Requirements: 1_

- [x] 1.2 (P) 総合運勢メッセージデータの実装
  - OverallFortuneMessage型定義（fortuneId、message）
  - 7運勢レベルに対し各5パターン、計35メッセージを古風な言い回しで作成
  - overallFortuneMessages配列をas constで定義し、イミュータブル性を保証
  - getOverallFortuneMessage()関数実装（fortuneIdから5パターンのうち1つをランダム選択）
  - fortuneId検証とエラーハンドリング
  - _Requirements: 1, 5, 6, 7_

- [x] 1.3 (P) テスト実行と検証
  - すべてのテストが成功することを確認
  - TypeScript strict modeでコンパイルエラーなし
  - ESLintでwarningなし
  - _Requirements: 7_

- [x] 2. カテゴリ定義とメッセージプールの実装
- [x] 2.1 (P) カテゴリデータのテスト作成
  - 6カテゴリ（コーディング、レビュー、デプロイ、待ち人、争い事、成長）が定義されていることを検証
  - 各カテゴリのpositive/negative各5メッセージが存在することを確認
  - メッセージ長が3-10文字であることを検証
  - CATEGORY_IDS配列が正しく6要素を持つことを確認
  - _Requirements: 2, 3_

- [x] 2.2 (P) カテゴリデータの実装
  - CategoryId型定義（6カテゴリのユニオン型）
  - CategoryMessagePool型定義（positiveMessages、negativeMessages配列）
  - Category型定義（id、name、messagePool）
  - 6カテゴリの定義とメッセージプール作成（positive/negative各5、計60パターン）
  - エンジニア業務のあるあるとユーモアを含むメッセージ作成
  - categories配列とCATEGORY_IDS配列をas constで定義
  - _Requirements: 2, 3, 5, 6, 7_

- [x] 2.3 (P) テスト実行と検証
  - すべてのテストが成功することを確認
  - TypeScript strict modeでコンパイルエラーなし
  - ESLintでwarningなし
  - _Requirements: 7_

- [x] 3. 確率的カテゴリ選択ロジックの実装
- [x] 3.1 確率的選択のテスト作成（タスク1と2の完了が前提）
  - getPositiveProbability()が各運勢レベルに対し正しい確率を返すテスト（大吉95%、吉80%、中吉65%、小吉55%、末吉50%、凶20%、大凶5%）
  - selectCategoryAdvice()がpositive/negativeメッセージを返すことの検証
  - 不正なfortuneLevelでエラーをスローするテスト
  - 統計的確率検証（各運勢レベルで10,000回実行し、positive選択率が期待値±2%以内）
  - カテゴリ間の独立性検証（複数カテゴリで同時実行し、結果が独立していることを確認）
  - _Requirements: 4_

- [x] 3.2 確率的選択ロジックの実装
  - POSITIVE_PROBABILITY_MAP定義（7運勢レベルの確率マッピング）
  - getPositiveProbability()関数実装（fortuneLevelから確率を取得）
  - selectCategoryAdvice()関数実装（確率判定 → プール選択 → ランダムメッセージ選択）
  - fortuneLevel検証とエラーハンドリング
  - _Requirements: 4, 5, 6, 7_

- [x] 3.3 パフォーマンステストの作成と実行
  - selectCategoryAdvice()を1,000回実行し、平均実行時間が1ms以下であることを検証
  - メモリリーク検証（1,000回連続実行でメモリ増加なし）
  - _Requirements: 8_

- [x] 3.4 テスト実行と検証
  - すべてのテスト（ユニット、統計、パフォーマンス）が成功することを確認
  - TypeScript strict modeでコンパイルエラーなし
  - ESLintでwarningなし
  - _Requirements: 7, 8_

- [x] 4. 統合運勢抽選機能の実装
- [x] 4.1 統合運勢抽選のテスト作成（タスク1、2、3の完了が前提）
  - drawIntegratedFortune()がIntegratedFortuneResult型を返すことを検証
  - level、overallMessage、categoryAdviceすべてのフィールドが有効な値であることを確認
  - 6カテゴリアドバイスがすべて設定されていることを検証
  - fortuneLevelが既存fortuneLevelsのいずれかであることを確認
  - overallMessageが対応する運勢レベルのメッセージであることを検証
  - categoryAdviceの各フィールドが該当カテゴリのメッセージプールから選ばれていることを確認
  - _Requirements: 5, 6_

- [x] 4.2 統合運勢抽選の実装
  - CategoryAdvice型定義（6カテゴリのフィールド）
  - IntegratedFortuneResult型定義（level、overallMessage、categoryAdvice）
  - drawIntegratedFortune()関数実装（selectRandomFortune() → getOverallFortuneMessage() → 6カテゴリループでselectCategoryAdvice()）
  - 既存fortune-selectorのselectRandomFortune()を再利用
  - 純粋関数として実装（副作用なし）
  - _Requirements: 5, 6, 7_

- [x] 4.3 統合テストの実行
  - 複数回drawIntegratedFortune()を実行し、カテゴリ間でpositive/negativeの組み合わせが多様であることを確認
  - 既存fortune-typesシステムとの整合性確認（FortuneLevel型の互換性）
  - _Requirements: 6_

- [x] 4.4 パフォーマンステストの作成と実行
  - drawIntegratedFortune()を1,000回実行し、平均実行時間が2ms以下であることを検証
  - メモリリーク検証（1,000回連続実行でメモリ増加なし）
  - _Requirements: 8_

- [x] 4.5 最終検証
  - すべてのテスト（ユニット、統合、パフォーマンス）が成功することを確認
  - TypeScript strict modeでコンパイルエラーなし
  - ESLintでwarningなし
  - 全要件カバレッジの確認
  - _Requirements: 7, 8_

## 要件カバレッジマトリクス

| 要件ID | 要件概要 | 対応タスク |
|--------|---------|----------|
| 1 | 総合運勢の表示 | 1.1, 1.2 |
| 2 | 運勢カテゴリの定義 | 2.1, 2.2 |
| 3 | メッセージプールの構成 | 2.1, 2.2 |
| 4 | 確率的メッセージ選択 | 3.1, 3.2 |
| 5 | 運勢結果のデータ構造 | 1.2, 2.2, 3.2, 4.1, 4.2 |
| 6 | 既存システムとの統合 | 1.2, 2.2, 3.2, 4.1, 4.2, 4.3 |
| 7 | 技術的制約 | 1.2, 1.3, 2.2, 2.3, 3.2, 3.4, 4.2, 4.5 |
| 8 | パフォーマンスとテスト性 | 3.3, 3.4, 4.4, 4.5 |

## 実装順序の理由

1. **タスク1（総合運勢メッセージ）**: データ層の基礎、他のモジュールから独立
2. **タスク2（カテゴリデータ）**: データ層の基礎、他のモジュールから独立
3. **タスク3（確率的選択ロジック）**: ロジック層、タスク1と2のデータを使用
4. **タスク4（統合運勢抽選）**: 統合層、すべてのモジュールを統合

タスク1と2は並列実行可能（データ依存なし、ファイル競合なし）。タスク3は1と2の完了が前提。タスク4は1、2、3の完了が前提。
