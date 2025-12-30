import { test, expect } from '@playwright/test'

test('基本的なページロードテスト', async ({ page }) => {
  await page.goto('/')

  // ページタイトルの検証
  await expect(page).toHaveTitle(/Engineer Omikuji/i)
  
  // 基本的な要素の存在確認（将来実装予定のため、現在は仮の検証）
  await expect(page.locator('body')).toBeVisible()
})

test('レスポンシブ対応の検証', async ({ page }) => {
  // モバイル表示
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()

  // デスクトップ表示
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
})