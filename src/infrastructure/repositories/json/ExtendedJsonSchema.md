# Extended JSON Schema Documentation

## 概要

ExtendedJsonSchemaは、おみくじシステムのカテゴリコンテンツをランダム化するための拡張データ構造です。既存のJSON形式との完全な下位互換性を保ちながら、新しいプール管理機能を追加します。

## 主な特徴

1. **カテゴリプール構造**: カテゴリ別・感情属性別のコンテンツ管理
2. **下位互換性**: 既存データ形式をそのまま使用可能
3. **段階的移行**: 一部カテゴリのみプール化も可能
4. **重み付き選択**: 各コンテンツに選択確率の重みを設定可能

## データ構造

### 基本構造

```typescript
interface ExtendedOmikujiResultData {
  omikujiTypeId: string;
  results?: { /* 既存フォーマット（オプショナル） */ };
  categoryPools?: { /* 新規プール構造（オプショナル） */ };
  metadata: ExtendedMetadata;
}
```

### カテゴリプール構造

```typescript
categoryPools: {
  [categoryName]: {
    positive: CategoryContent[],
    neutral: CategoryContent[],
    negative: CategoryContent[]
  }
}
```

### CategoryContent

```typescript
interface CategoryContent {
  id: string;              // 一意識別子
  content: string;         // 表示テキスト
  weight?: number;         // 選択確率の重み（デフォルト: 1.0）
  metadata?: {            // 追加メタデータ
    tags?: string[];
    author?: string;
    [key: string]: unknown;
  };
}
```

## 使用方法

### 1. プール機能を有効にする

```json
{
  "metadata": {
    "poolEnabled": true
  }
}
```

### 2. カテゴリプールを定義する

```json
{
  "categoryPools": {
    "恋愛運": {
      "positive": [
        {
          "id": "love-pos-001",
          "content": "素敵な出会いがある",
          "weight": 1.0
        }
      ],
      "neutral": [],
      "negative": []
    }
  }
}
```

### 3. 既存データとの併用（フォールバック）

```json
{
  "results": { /* 既存データ */ },
  "categoryPools": { /* 新規プール */ },
  "metadata": {
    "poolEnabled": true
  }
}
```

## SchemaValidator ユーティリティ

### プール使用判定

```typescript
const shouldUsePool = SchemaValidator.shouldUsePool(data);
const isLegacy = SchemaValidator.isLegacyFormat(data);
```

### 統計情報の取得

```typescript
const stats = SchemaValidator.calculatePoolStatistics(data.categoryPools);
// => カテゴリ別のアイテム数、感情属性分布など
```

### 重みの正規化

```typescript
const normalized = SchemaValidator.normalizeWeights(contents);
// => 重みの合計が1.0になるように調整
```

## 移行ガイド

### 段階1: 既存データはそのまま

poolEnabled を false または未定義にすることで、既存の動作を維持

### 段階2: 一部カテゴリのプール化

特定のカテゴリのみ categoryPools に追加

### 段階3: 完全移行

全カテゴリをプール化し、results はフォールバック用に維持

## ベストプラクティス

1. **重みの設定**: よく使われるコンテンツには高い重みを設定
2. **メタデータの活用**: タグや作者情報でコンテンツを分類
3. **段階的移行**: 一度に全て移行せず、段階的に実施
4. **統計監視**: SchemaValidator で分布を定期的に確認

## サンプルファイル

`data/results/engineer-fortune-extended.example.json` に完全な実装例があります。