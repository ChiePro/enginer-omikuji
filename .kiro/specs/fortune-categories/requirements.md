# Requirements Document

## Project Description (Input)
運勢カテゴリシステム: 伝統的なおみくじ形式で、総合運勢と6つのカテゴリ（コーディング、レビュー、デプロイ、待ち人、争い事、成長）を表示。各カテゴリはpositive/negativeメッセージプールから確率的に選択され、運勢レベルに応じた確率分布で決定される。

## Introduction
本機能は、既存の運勢システム（fortune-types）を拡張し、伝統的なおみくじの形式を採用した運勢カテゴリシステムを提供する。ユーザーがおみくじを引くと、総合運勢（7段階）と6つのカテゴリ別運勢アドバイスが表示される。各カテゴリのアドバイスは、positive/negativeメッセージプールから確率的に選択され、総合運勢レベルに応じた確率分布で決定される。これにより、毎回異なる組み合わせの結果が得られ、リアルで面白いおみくじ体験を提供する。

## Requirements

### Requirement 1: 総合運勢の表示
**Objective**: エンジニアユーザーとして、おみくじを引いた際に総合運勢レベルとメインメッセージを受け取りたい。これにより、今日の全体的な運勢を把握できる。

#### Acceptance Criteria
1. When ユーザーがおみくじを引く, the 運勢システムshall 既存の7段階の運勢レベル（大吉、吉、中吉、小吉、末吉、凶、大凶）のいずれかを返す
2. When 総合運勢レベルが決定される, the 運勢システムshall その運勢レベルに対応する5つのメッセージパターンのうち1つをランダムに選択する
3. The 総合運勢メッセージshall 古風な言い回しを使用し、100文字程度の長さである
4. The 総合運勢の確率分布shall 既存のfortune-typesシステムと同じ重み付き確率（大吉16%, 吉23%, 中吉34%, 小吉12%, 末吉8%, 凶4%, 大凶3%）を使用する

### Requirement 2: 運勢カテゴリの定義
**Objective**: エンジニアユーザーとして、業務に関連した6つのカテゴリ別の運勢アドバイスを受け取りたい。これにより、具体的な業務シーンでの運勢を把握できる。

#### Acceptance Criteria
1. The 運勢システムshall 以下の6つのカテゴリを提供する: コーディング運、レビュー運、デプロイ運、待ち人、争い事、成長運
2. The コーディング運shall 実装作業の捗り具合に関するアドバイスを提供する
3. The レビュー運shall コードレビューの通りやすさに関するアドバイスを提供する
4. The デプロイ運shall リリースの成功率に関するアドバイスを提供する
5. The 待ち人shall 承認・マージ・返信など期待している反応に関するアドバイスを提供する（伝統的おみくじの「待ち人」を踏襲）
6. The 争い事shall コンフリクト・技術的議論・対立に関するアドバイスを提供する（伝統的おみくじの「争い事」を踏襲）
7. The 成長運shall 学習・スキルアップに関するアドバイスを提供する

### Requirement 3: メッセージプールの構成
**Objective**: 開発者として、各カテゴリにpositive/negativeメッセージプールを定義したい。これにより、多様なアドバイスを提供できる。

#### Acceptance Criteria
1. The 運勢システムshall 各カテゴリに対してpositive/negativeメッセージプールをそれぞれ5つずつ持つ
2. The メッセージshall エンジニア業務のあるあるとユーモアを取り入れた文言である
3. The positiveメッセージshall 励ましや成功を示唆する内容である
4. The negativeメッセージshall 注意喚起や慎重さを促す内容である
5. The メッセージshall 3-10文字程度の短いアドバイス形式である
6. When メッセージを選択する際, the 運勢システムshall メッセージプール内からランダムに1つを選択する

### Requirement 4: 確率的メッセージ選択
**Objective**: エンジニアユーザーとして、総合運勢レベルに応じて各カテゴリのpositive/negativeアドバイスが確率的に決定されることを期待する。これにより、よりリアルで自然な運勢結果を得られる。

#### Acceptance Criteria
1. When 総合運勢が大吉である, the 運勢システムshall 各カテゴリで95%の確率でpositiveメッセージを選択する
2. When 総合運勢が吉である, the 運勢システムshall 各カテゴリで80%の確率でpositiveメッセージを選択する
3. When 総合運勢が中吉である, the 運勢システムshall 各カテゴリで65%の確率でpositiveメッセージを選択する
4. When 総合運勢が小吉である, the 運勢システムshall 各カテゴリで55%の確率でpositiveメッセージを選択する
5. When 総合運勢が末吉である, the 運勢システムshall 各カテゴリで50%の確率でpositiveメッセージを選択する（完全にランダム）
6. When 総合運勢が凶である, the 運勢システムshall 各カテゴリで20%の確率でpositiveメッセージを選択する
7. When 総合運勢が大凶である, the 運勢システムshall 各カテゴリで5%の確率でpositiveメッセージを選択する
8. The 各カテゴリの確率判定shall 独立して行われる（カテゴリごとに個別に判定）

### Requirement 5: 運勢結果のデータ構造
**Objective**: 開発者として、運勢結果を適切なデータ構造で表現したい。これにより、UI層での表示が容易になる。

#### Acceptance Criteria
1. The 運勢結果shall 総合運勢レベル（FortuneLevel型）を含む
2. The 運勢結果shall 総合運勢メッセージ（文字列）を含む
3. The 運勢結果shall 6つのカテゴリアドバイス（各文字列）をオブジェクトとして含む
4. The データ構造shall TypeScript strict modeで型安全に定義される
5. The データ構造shall 既存のfortune-types実装と統合可能な設計である

### Requirement 6: 既存システムとの統合
**Objective**: 開発者として、既存のfortune-typesシステム（運勢レベル、確率分布、データ定義）を再利用したい。これにより、実装の一貫性を保てる。

#### Acceptance Criteria
1. The 運勢システムshall 既存のfortuneLevels（7段階の運勢レベル定義）を使用する
2. The 運勢システムshall 既存のselectRandomFortune()（重み付き確率選択ロジック）を使用する
3. The カテゴリシステムshall /lib/ディレクトリに配置され、既存のfortune-typesと同様のパターンで実装される
4. The カテゴリシステムshall イミュータブルなデータ構造（as const, readonly）を使用する
5. The カテゴリシステムshall 純粋関数として実装され、副作用を持たない

### Requirement 7: 技術的制約
**Objective**: 開発者として、プロジェクトの技術標準に準拠した実装を行いたい。これにより、コード品質と保守性を維持できる。

#### Acceptance Criteria
1. The 実装shall TypeScript strict modeでエラーなくコンパイルできる
2. The 実装shall ESLint (eslint-config-next) でwarningなく検証できる
3. The 実装shall TDD (Test-Driven Development) 方式で実装される（RED-GREEN-REFACTOR-VERIFY）
4. The テストshall Jest 30.2.0を使用し、ユニットテスト・統合テスト・パフォーマンステストを含む
5. The テストshall lib/__tests__/ディレクトリに配置される
6. The 実装shall /lib/ディレクトリに配置される

### Requirement 8: パフォーマンスとテスト性
**Objective**: 開発者として、高速でテスト可能な実装を提供したい。これにより、ユーザー体験と開発効率を向上できる。

#### Acceptance Criteria
1. The カテゴリアドバイス選択処理shall 1ms以下で完了する
2. The 総合運勢抽選とカテゴリ選択を含む統合処理shall 2ms以下で完了する
3. The 確率分布shall 統計的に検証可能である（10,000回の抽選で検証）
4. When 1,000回連続で呼び出される, the 運勢システムshall メモリリークを起こさない
5. The 実装shall 純粋関数として実装され、同じ入力に対して決定論的な確率分布を保証する

## Notes
- 本機能は既存のfortune-typesシステムを拡張するものであり、運勢レベルと確率分布の定義を再利用する
- 伝統的なおみくじの形式（総合運勢 + カテゴリ別アドバイス）を採用し、エンジニア向けにカスタマイズする
- UI実装は別specで対応し、本specではデータ層とロジック層のみを対象とする
