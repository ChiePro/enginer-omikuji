import { describe, it, expect } from 'vitest'

describe('テスト環境の検証', () => {
  it('基本的なアサーションが動作する', () => {
    expect(1 + 1).toBe(2)
  })

  it('文字列のマッチングが動作する', () => {
    const message = 'Hello, Engineer Omikuji!'
    expect(message).toContain('Engineer')
    expect(message).toMatch(/Omikuji/)
  })

  it('オブジェクトの比較が動作する', () => {
    const config = {
      environment: 'test',
      database: 'memory'
    }
    
    expect(config).toEqual({
      environment: 'test',
      database: 'memory'
    })
  })
})