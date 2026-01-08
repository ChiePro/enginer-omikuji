# DeterministicTestEnvironment 使用例

## 基本的な使用方法

```typescript
import { DeterministicTestEnvironment } from './DeterministicTestEnvironment';

const testEnv = new DeterministicTestEnvironment();

// 決定論的テスト実行
await testEnv.isolatedTest('my-randomization-test', async (env) => {
  const rng = env.getRandom();
  const randomValue = rng(); // 毎回同じ値
  expect(randomValue).toBe(0.12345); // 予期される値
});
```

## ランダム化サービスとの統合

```typescript
// CategoryRandomizationServiceの決定論的テスト
await testEnv.reproducibleIntegrationTest('randomization-flow', async (env) => {
  const seed = env.generateSeed('category-random');
  
  const result = await categoryRandomizationService.randomizeCategories(
    fortune,
    sessionId,
    seed
  );
  
  // 毎回同じ結果が得られることを保証
  expect(result.data).toEqual(expectedCategories);
});
```

## 統計的検証

```typescript
await testEnv.reproducibleIntegrationTest('probability-distribution', async (env) => {
  const rng = env.getRandom();
  const samples = env.generateStatisticalSamples(10000, rng);
  
  const mean = samples.reduce((sum, val) => sum + val) / samples.length;
  expect(mean).toBeCloseTo(0.5, 2); // 期待される平均値
});
```

## Requirements Coverage

- ✅ 5.2: 決定論的テスト (seedrandom統合)
- ✅ 5.4: 再現可能な結果セット生成
- ✅ テスト用シード管理
- ✅ テストアイソレーション機能
- ✅ 統合テスト対応