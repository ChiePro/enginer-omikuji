# おみくじ結果表示システム - 開発者ガイド

## 概要

おみくじ結果表示システムは、エンジニア向けおみくじサービスにおいて、各おみくじタイプと運勢の組み合わせに対して多様で魅力的な結果コンテンツを管理・表示するシステムです。

## 特徴

- **多様なバリエーション**: 各おみくじタイプ・運勢組み合わせに複数の結果パターンを提供
- **感情属性システム**: ポジティブ・ネガティブ・ニュートラルによる確率的結果選択
- **エンジニア特化**: 技術用語とエンジニア文化に特化したユーモアあふれる内容
- **クリーンアーキテクチャ**: ドメイン駆動設計に基づく保守性の高い設計
- **型安全性**: TypeScriptによる厳密な型定義

## アーキテクチャ

### ドメイン層

#### エンティティ
- `OmikujiResult`: おみくじ結果の中心的なエンティティ
- `OmikujiType`: おみくじタイプの定義

#### 値オブジェクト
- `TitlePhrase`: タイトルフレーズ（20-40文字制限）
- `Description`: 説明文（100-300文字制限）
- `EmotionAttribute`: 感情属性（positive/neutral/negative）
- `FortuneCategory`: 運勢カテゴリ（恋愛運、仕事運、健康運、金運、学業運）
- `FortuneCategoryCollection`: 5つのカテゴリのコレクション
- `EmotionAttributeDistribution`: 確率分布の定義

#### サービス
- `OmikujiDrawService`: おみくじ抽選の中心的なサービス
- `EmotionAttributeCalculator`: 感情属性に基づく確率計算

### インフラ層

#### リポジトリ実装
- `JsonOmikujiResultRepository`: JSONファイルベースのデータアクセス
- `JsonFortuneRepository`: 既存の運勢データアクセス

### プレゼンテーション層

#### レイアウトエンジン
- `TraditionalLayoutEngine`: 日本式縦書きレイアウトの生成

## 使用方法

### 基本的な使用例

```typescript
import {
  OmikujiDrawService,
  JsonOmikujiResultRepository,
  JsonFortuneRepository,
  type OmikujiType,
  type DrawResult
} from '@/src';

// リポジトリのインスタンス化
const resultRepository = new JsonOmikujiResultRepository();
const fortuneRepository = new JsonFortuneRepository();

// サービスのインスタンス化
const drawService = new OmikujiDrawService(resultRepository, fortuneRepository);

// おみくじ抽選の実行
async function drawOmikuji(type: OmikujiType, saisenAmount: number) {
  const result = await drawService.draw(type, saisenAmount);
  
  if (result.isSuccess) {
    const { fortune, omikujiResult } = result.value;
    console.log('運勢:', fortune.name);
    console.log('タイトル:', omikujiResult.getTitlePhrase().getValue());
    console.log('説明:', omikujiResult.getDescription().getValue());
    
    // カテゴリ別運勢の表示
    omikujiResult.getCategories().getItems().forEach(category => {
      console.log(`${category.getName()}: ${category.getContent()}`);
    });
  } else {
    console.error('抽選エラー:', result.error.message);
  }
}

// 使用例
drawOmikuji('engineer-fortune', 500);
```

### API エンドポイント

```typescript
// POST /api/omikuji/draw
interface OmikujiDrawRequest {
  omikujiType: OmikujiType;
  monetaryAmount: number;
}

interface OmikujiDrawResponse {
  success: boolean;
  result?: {
    fortune: Fortune;
    omikujiResult: OmikujiResult;
  };
  error?: {
    code: string;
    message: string;
  };
}
```

### レスポンス例

```json
{
  "success": true,
  "result": {
    "fortune": {
      "id": "daikichi",
      "name": "大吉",
      "description": "最高の運勢です",
      "rank": 1
    },
    "omikujiResult": {
      "id": { "value": "engineer-daikichi-001" },
      "titlePhrase": { "value": "完璧なコードレビューで開発チーム全員が幸せになる奇跡の日！" },
      "description": { "value": "今日はあなたの書いたコードが..." },
      "emotionAttribute": "positive",
      "categories": {
        "items": [
          {
            "name": "恋愛運",
            "content": "ペアプログラミングで素敵な出会いが...",
            "emotionTone": "positive"
          }
        ]
      }
    }
  }
}
```

## データ構造

### JSONデータファイル

結果データは `data/results/` ディレクトリに各おみくじタイプごとに配置：

```
data/
└── results/
    ├── engineer-fortune.json
    ├── tech-selection.json
    ├── debug-fortune.json
    ├── code-review-fortune.json
    └── deploy-fortune.json
```

### データファイルの構造

```json
{
  "omikujiTypeId": "engineer-fortune",
  "results": {
    "daikichi": [
      {
        "id": "engineer-daikichi-001",
        "titlePhrase": "完璧なコードレビューで開発チーム全員が幸せになる奇跡の日！",
        "description": "今日はあなたの書いたコードが...",
        "emotionAttribute": "positive",
        "categories": [
          {
            "name": "恋愛運",
            "content": "ペアプログラミングで素敵な出会いが...",
            "emotionTone": "positive"
          }
        ]
      }
    ]
  },
  "metadata": {
    "lastUpdated": "2025-01-04T07:00:00.000Z",
    "contentVersion": "1.0.0",
    "totalVariations": 7,
    "status": "active",
    "emotionDistributionRules": {
      "daikichi": { "positive": 0.80, "neutral": 0.15, "negative": 0.05 },
      "kyou": { "positive": 0.10, "neutral": 0.20, "negative": 0.70 }
    }
  }
}
```

## 感情属性システム

### 確率分布ルール

各運勢タイプに対して感情属性の確率が定義されています：

| 運勢 | ポジティブ | ニュートラル | ネガティブ |
|------|-----------|------------|-----------|
| 大吉 | 80% | 15% | 5% |
| 中吉 | 70% | 25% | 5% |
| 吉 | 60% | 30% | 10% |
| 小吉 | 50% | 35% | 15% |
| 末吉 | 40% | 40% | 20% |
| 凶 | 10% | 20% | 70% |
| 大凶 | 5% | 15% | 80% |

### 感情属性計算の使用

```typescript
import { EmotionAttributeCalculator } from '@/src';

const calculator = new EmotionAttributeCalculator();
const distribution = calculator.calculateDistribution('daikichi');
const selectedAttribute = calculator.selectByDistribution(distribution);
```

## テスト

### テストの実行

```bash
# 全テスト実行
npm test

# 統合テスト実行
npm test -- --grep "integration"

# データ整合性テスト
npm test src/test/integration/omikujiDataIntegrity.test.ts

# パフォーマンステスト
npm test src/test/integration/omikujiPerformance.test.ts
```

### テスト種別

1. **単体テスト**: 各コンポーネントの個別機能
2. **統合テスト**: システム全体の動作確認
3. **データ整合性テスト**: JSONデータの形式・内容検証
4. **パフォーマンステスト**: 1000回連続抽選での性能確認
5. **エラーシナリオテスト**: エラー処理とフォールバック動作

## 開発ワークフロー

### 新しい結果バリエーションの追加

1. 対象のJSONファイルに新しい結果データを追加
2. データ検証スクリプトで形式確認: `npm run validate:omikuji-data`
3. 統合テストを実行して動作確認
4. タイトルフレーズ・説明文の長さ制限に注意

### 新しいおみくじタイプの追加

1. `src/types/omikuji.ts` の `OmikujiType` に新しいタイプを追加
2. `data/results/` に新しいJSONファイルを作成
3. 対応するテストケースを追加
4. 統合テストで確認

### エラー処理の拡張

1. `src/domain/errors/` にエラータイプを定義
2. リポジトリまたはサービスでエラーハンドリングを実装
3. 適切なフォールバック処理を用意
4. エラーシナリオテストを追加

## パフォーマンス考慮事項

- JSONファイルは起動時に一度読み込み、メモリキャッシュを使用
- 大量の抽選処理でもGC圧迫を避けるよう設計
- 1000回連続抽選で平均10ms以下の応答時間を維持

## 後方互換性

既存の運勢システムとの互換性を保持：

- 既存のAPIエンドポイント形式をサポート
- 既存のデータベース/JSONファイル構造を維持
- 段階的な移行が可能な設計

## トラブルシューティング

### よくある問題

**1. データ検証エラー**
- タイトルフレーズが20文字未満または40文字超過
- 説明文が100文字未満または300文字超過
- 必要なカテゴリが不足（5つ必要）

**2. 感情属性エラー**
- 確率分布の合計が1.0でない
- 無効な感情属性値

**3. ファイル読み込みエラー**
- JSONファイルのパスまたは形式が正しくない
- ファイルアクセス権限の問題

### デバッグ方法

```typescript
// デバッグモードでのサービス使用
const drawService = new OmikujiDrawService(resultRepository, fortuneRepository);
drawService.setDebugMode(true); // ログ出力を有効化

// データ検証の個別実行
import { validateOmikujiResultData } from '@/src/scripts/validation/validateOmikujiResultData';
await validateOmikujiResultData('engineer-fortune');
```

## 今後の拡張予定

- リアルタイム結果共有機能
- ユーザー履歴・統計機能
- 多言語対応（英語サポート）
- 外部API連携による動的コンテンツ生成

## 貢献について

このシステムの改善や機能追加を行う際は：

1. 既存のテストが全て通ることを確認
2. 新機能には適切なテストを追加
3. ドメイン駆動設計の原則に従った実装
4. TypeScript型安全性の維持

詳細な実装仕様については `.kiro/specs/omikuji-results/` のドキュメントを参照してください。