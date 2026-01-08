# Infrastructure Services

このディレクトリには、インフラストラクチャ層のサービスが含まれています。

## TestRandomSeedService

決定論的な乱数生成を提供するサービスです。テスト環境で再現可能な結果を生成するために使用されます。

### 主な機能

1. **シード付き乱数生成**: `seedableRandom(seed)`
   - 同じシードで常に同じ乱数列を生成
   - 0以上1未満の値を返す

2. **再現可能テスト環境**: `reproducibleTest(seed, testFn)`
   - テスト関数に決定論的乱数生成器を提供
   - 非同期関数もサポート

3. **重み付きランダム選択**: `weightedRandom(items, weights, rng)`
   - 確率分布に基づいたアイテム選択
   - 統計的精度を保証

### 使用例

```typescript
import { TestRandomSeedService } from '@/infrastructure/services';

const service = new TestRandomSeedService();

// 基本的な使用
const rng = service.seedableRandom('test-seed');
const value = rng(); // 常に同じ値

// テストでの使用
const result = await service.reproducibleTest('test', (rng) => {
  const fortunes = ['大吉', '吉', '凶'];
  const weights = [0.3, 0.5, 0.2];
  return service.weightedRandom(fortunes, weights, rng);
});
```

### 実装の詳細

- **依存関係**: seedrandom ライブラリ (v3.0.5+)
- **TypeScript**: 完全な型定義サポート
- **テストカバレッジ**: ユニットテストと統合テストで100%カバー

### 関連ファイル

- `TestRandomSeedService.ts` - メイン実装
- `TestRandomSeedService.test.ts` - ユニットテスト
- `TestRandomSeedService.integration.test.ts` - 統合テスト
- `TestRandomSeedService.example.ts` - 使用例

### 設計原則

1. **決定論的動作**: 同じシードは常に同じ結果を生成
2. **統計的精度**: 重み付き選択は±5%以内の精度を保証
3. **テストファースト**: TDDアプローチで開発
4. **ドメイン非依存**: インフラストラクチャ層として独立