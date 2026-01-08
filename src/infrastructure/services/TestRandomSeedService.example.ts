/**
 * TestRandomSeedService 使用例
 * 
 * このファイルは、TestRandomSeedServiceをテストで使用する方法を示しています。
 * 実際のテストで参考にしてください。
 */

import { TestRandomSeedService } from './TestRandomSeedService';

// 例1: 基本的な使用方法
async function basicUsageExample() {
  const service = new TestRandomSeedService();
  const seed = 'my-test-seed';
  
  // シード付き乱数生成器を作成
  const rng = service.seedableRandom(seed);
  
  // 同じシードは同じ値を生成
  console.log(rng()); // 常に同じ値
  console.log(rng()); // 常に同じ値
}

// 例2: おみくじシステムでの使用例
async function omikujiTestExample() {
  const service = new TestRandomSeedService();
  
  // 運勢の定義
  const fortunes = ['大吉', '中吉', '吉', '小吉', '末吉', '凶', '大凶'];
  const weights = [0.10, 0.20, 0.25, 0.20, 0.15, 0.08, 0.02];
  
  // 再現可能なテスト
  const results = await service.reproducibleTest('omikuji-test', (rng) => {
    // 10回おみくじを引く
    return Array.from({ length: 10 }, () =>
      service.weightedRandom(fortunes, weights, rng)
    );
  });
  
  console.log('おみくじ結果:', results);
  // 同じシードで実行すると常に同じ結果
}

// 例3: カテゴリコンテンツ選択での使用例
async function categorySelectionExample() {
  const service = new TestRandomSeedService();
  
  // 大吉の場合の感情属性分布
  const emotionAttributes = ['positive', 'neutral', 'negative'];
  const daikchiWeights = [1.0, 0.0, 0.0]; // 100% positive
  
  // カテゴリごとに感情属性を選択
  const categories = ['恋愛運', '仕事運', '健康運', '金運', '学業運'];
  
  const categoryResults = await service.reproducibleTest('category-test', (rng) => {
    const results: Record<string, string> = {};
    
    for (const category of categories) {
      results[category] = service.weightedRandom(
        emotionAttributes,
        daikchiWeights,
        rng
      );
    }
    
    return results;
  });
  
  console.log('カテゴリ別感情属性:', categoryResults);
  // 大吉なので全てpositive
}

// 例4: vitest での使用例
import { describe, expect, it } from 'vitest';

describe('MyFeature with deterministic random', () => {
  const service = new TestRandomSeedService();
  
  it('should produce consistent results', async () => {
    const seed = 'test-feature';
    
    // 最初の実行
    const result1 = await service.reproducibleTest(seed, (rng) => {
      // ランダムな値を使う何かの処理
      return Math.floor(rng() * 100);
    });
    
    // 2回目の実行
    const result2 = await service.reproducibleTest(seed, (rng) => {
      // 同じ処理
      return Math.floor(rng() * 100);
    });
    
    // 同じ結果であることを確認
    expect(result1).toBe(result2);
  });
});