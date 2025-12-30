import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'

// テスト毎にクリーンアップ
afterEach(() => {
  cleanup()
})

// カスタムマッチャーの設定
beforeAll(() => {
  // グローバルテスト設定
})

afterAll(() => {
  // テスト終了後のクリーンアップ
})