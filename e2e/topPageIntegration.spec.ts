/**
 * トップページE2Eテスト
 * 
 * タスク12: エンドツーエンドのユーザーフロー検証
 * TDD Red Phase: 統合が完了していない状態で失敗するE2Eテスト
 */

import { test, expect, Page } from '@playwright/test';

test.describe('トップページ統合 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('完全なおみくじフロー - お賽銭選択からおみくじ結果まで', async ({ page }) => {
    // Step 1: ページ読み込み完了を確認
    await expect(page.getByText('エンジニアの運命を占う')).toBeVisible();
    await expect(page.getByText('今日のコーディング運は？')).toBeVisible();

    // Step 2: 5種類のおみくじが表示されることを確認
    await expect(page.getByText('エンジニア運勢')).toBeVisible();
    await expect(page.getByText('技術選定おみくじ')).toBeVisible();
    await expect(page.getByText('デバッグ運')).toBeVisible();
    await expect(page.getByText('コードレビュー運')).toBeVisible();
    await expect(page.getByText('デプロイ運')).toBeVisible();

    // Step 3: レアリティプレビューの表示確認
    await expect(page.getByText('小吉')).toBeVisible();
    await expect(page.getByText('吉')).toBeVisible();
    await expect(page.getByText('中吉')).toBeVisible();
    await expect(page.getByText('大吉')).toBeVisible();
    await expect(page.getByText('大吉が出るかも？')).toBeVisible();

    // Step 4: お賽銭選択
    await expect(page.getByText('お賽銭で運気UP')).toBeVisible();
    await page.click('button:has-text("100円")');
    
    // お賽銭効果の表示確認
    await expect(page.getByText(/運気上昇中/)).toBeVisible({ timeout: 2000 });

    // Step 5: おみくじカード選択（エンジニア運勢）
    await page.click('[data-testid="omikuji-card-engineer-fortune"] button:has-text("このおみくじを引く")');

    // Step 6: ページ遷移の確認
    await expect(page).toHaveURL(/.*\/omikuji\/engineer-fortune/);
  });

  test('キーボードナビゲーションによる操作', async ({ page }) => {
    // Tab キーでナビゲーション
    await page.keyboard.press('Tab'); // 最初の要素にフォーカス
    
    // おみくじカードにフォーカスが移動するまでTab
    let focusedElement = page.locator(':focus');
    let attempts = 0;
    while (attempts < 20) { // 最大20回タブ移動
      const role = await focusedElement.getAttribute('role');
      const ariaLabel = await focusedElement.getAttribute('aria-label');
      
      if (role === 'button' && ariaLabel?.includes('を選択')) {
        break;
      }
      
      await page.keyboard.press('Tab');
      attempts++;
    }

    // Enterキーでおみくじを選択
    await page.keyboard.press('Enter');
    
    // ページ遷移またはモーダル表示を確認
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 3000 });
  });

  test('レスポンシブデザイン - モバイルビュー', async ({ page }) => {
    // モバイルビューポートに変更
    await page.setViewportSize({ width: 375, height: 667 });

    // 必要な要素が表示されることを確認
    await expect(page.getByText('エンジニアの運命を占う')).toBeVisible();
    
    // カードがモバイル向けレイアウトで表示される
    const grid = page.getByTestId('omikuji-type-grid');
    await expect(grid).toHaveClass(/grid-cols-1/);
    
    // すべてのカードが縦並びで表示される
    const cards = page.getByTestId(/omikuji-card-/);
    expect(await cards.count()).toBe(5);
  });

  test('レスポンシブデザイン - タブレットビュー', async ({ page }) => {
    // タブレットビューポートに変更
    await page.setViewportSize({ width: 768, height: 1024 });

    await expect(page.getByText('エンジニアの運命を占う')).toBeVisible();
    
    // カードがタブレット向けレイアウト（2列）で表示される
    const grid = page.getByTestId('omikuji-type-grid');
    await expect(grid).toHaveClass(/sm:grid-cols-2/);
  });

  test('レスポンシブデザイン - デスクトップビュー', async ({ page }) => {
    // デスクトップビューポートに変更
    await page.setViewportSize({ width: 1920, height: 1080 });

    await expect(page.getByText('エンジニアの運命を占う')).toBeVisible();
    
    // カードがデスクトップ向けレイアウト（3列）で表示される
    const grid = page.getByTestId('omikuji-type-grid');
    await expect(grid).toHaveClass(/lg:grid-cols-3/);
    
    // レアリティプレビューがサイドに表示される
    await expect(page.getByTestId('rarity-preview')).toBeVisible();
  });

  test('アニメーションとインタラクション', async ({ page }) => {
    // カードホバーアニメーション
    const firstCard = page.getByTestId('omikuji-card-engineer-fortune');
    
    // ホバー前の状態を取得
    const initialTransform = await firstCard.evaluate(el => 
      window.getComputedStyle(el).transform
    );

    // ホバー
    await firstCard.hover();

    // ホバー後のアニメーション効果を確認（transform変化）
    await page.waitForTimeout(300); // アニメーション時間待機
    const hoverTransform = await firstCard.evaluate(el =>
      window.getComputedStyle(el).transform  
    );

    expect(hoverTransform).not.toBe(initialTransform);

    // クリックアニメーション
    await firstCard.click();
    
    // ローディングアニメーションの表示確認
    await expect(page.getByRole('status')).toBeVisible({ timeout: 1000 });
  });

  test('パフォーマンス要件検証', async ({ page }) => {
    const startTime = Date.now();

    // ページ読み込み
    await page.goto('/');

    // 重要な要素が表示されるまでの時間測定
    await expect(page.getByText('エンジニアの運命を占う')).toBeVisible();
    await expect(page.getByTestId('omikuji-type-grid')).toBeVisible();
    await expect(page.getByText('大吉')).toBeVisible();

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // パフォーマンス要件: First Contentful Paint < 1秒
    // Time to Interactive < 2.5秒
    expect(loadTime).toBeLessThan(2500);
  });

  test('Core Web Vitals 測定', async ({ page }) => {
    // Core Web Vitalsを測定するスクリプトを注入
    await page.addInitScript(() => {
      // LCP (Largest Contentful Paint) 測定
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        window.LCP = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // CLS (Cumulative Layout Shift) 測定  
      let clsScore = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }
        window.CLS = clsScore;
      }).observe({ entryTypes: ['layout-shift'] });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // LCPの確認 (< 2.5秒)
    const lcp = await page.evaluate(() => window.LCP);
    expect(lcp).toBeLessThan(2500);

    // CLSの確認 (< 0.1)
    const cls = await page.evaluate(() => window.CLS);
    expect(cls).toBeLessThan(0.1);
  });

  test('エラーハンドリング', async ({ page }) => {
    // ネットワークエラーをシミュレート
    await page.route('**/api/**', route => route.abort());

    await page.goto('/');

    // エラー表示またはフォールバック表示を確認
    await expect(page.getByText(/エラー|準備中|しばらくお待ち/)).toBeVisible({ timeout: 5000 });
  });

  test('アクセシビリティ', async ({ page }) => {
    await page.goto('/');

    // フォーカス順序の確認
    const focusableElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    expect(focusableElements.length).toBeGreaterThan(0);

    // 見出し階層の確認
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // alt属性の確認
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }

    // ボタンのaria-label確認
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      
      // aria-labelまたはテキストコンテンツのいずれかが必要
      expect(ariaLabel || textContent).toBeTruthy();
    }
  });

  test('ブラウザ間互換性 - 基本機能', async ({ page, browserName }) => {
    await page.goto('/');

    // ブラウザ固有の動作をテスト
    console.log(`Testing on ${browserName}`);

    // 基本要素の表示確認
    await expect(page.getByText('エンジニアの運命を占う')).toBeVisible();
    await expect(page.getByTestId('omikuji-type-grid')).toBeVisible();

    // インタラクションテスト
    const firstCard = page.getByTestId('omikuji-card-engineer-fortune');
    await firstCard.click();

    // 遷移またはローディング状態の確認
    await expect(page.getByRole('status')).toBeVisible({ timeout: 3000 });
  });
});