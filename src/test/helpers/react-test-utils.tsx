import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * カスタムレンダー関数
 * 将来的にProviderやコンテキストが必要な場合のために用意
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    // 将来的にProviderを追加する場合はここで設定
    ...options,
  })
}

/**
 * ユーザーインタラクション用のヘルパー
 */
export function setupUserEvent() {
  return userEvent.setup()
}

/**
 * 非同期要素の待機ヘルパー
 */
export async function waitForElement<T>(callback: () => Promise<T>, timeout = 1000): Promise<T> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    try {
      return await callback()
    } catch {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
  
  throw new Error(`Timeout waiting for element after ${timeout}ms`)
}

// testing-libraryの関数を再エクスポート
export * from '@testing-library/react'
export { customRender as render }