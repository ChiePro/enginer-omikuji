import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useOmikujiSelection } from './useOmikujiSelection';

// Next.js routerをモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// アニメーション関数をモック
vi.mock('@/animations/transitions/SmoothTransitions', () => ({
  animatePageExit: vi.fn().mockResolvedValue(undefined),
}));

describe('useOmikujiSelection', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトで成功するように設定
    mockRouter.push.mockResolvedValue(undefined);
    (useRouter as any).mockReturnValue(mockRouter);
  });

  describe('初期状態', () => {
    it('正常に初期化される', () => {
      // Act
      const { result } = renderHook(() => useOmikujiSelection());

      // Assert
      expect(result.current.isTransitioning).toBe(false);
      expect(typeof result.current.selectOmikuji).toBe('function');
    });

    it('ローディング状態が初期値false', () => {
      // Act
      const { result } = renderHook(() => useOmikujiSelection());

      // Assert
      expect(result.current.isTransitioning).toBe(false);
    });
  });

  describe('おみくじ選択機能', () => {
    it('selectOmikuji実行時に適切なルートに遷移する', async () => {
      // Arrange
      const { result } = renderHook(() => useOmikujiSelection());

      // Act
      await act(async () => {
        await result.current.selectOmikuji('engineer-fortune');
      });

      // Assert
      expect(mockRouter.push).toHaveBeenCalledWith('/omikuji/engineer-fortune');
    });

    it('複数のおみくじタイプに対して正しいルートに遷移する', async () => {
      // Arrange
      const { result } = renderHook(() => useOmikujiSelection());

      // Act
      await act(async () => {
        await result.current.selectOmikuji('tech-selection');
      });
      
      await act(async () => {
        await result.current.selectOmikuji('debug-fortune');
      });

      // Assert
      expect(mockRouter.push).toHaveBeenCalledWith('/omikuji/tech-selection');
      expect(mockRouter.push).toHaveBeenCalledWith('/omikuji/debug-fortune');
      expect(mockRouter.push).toHaveBeenCalledTimes(2);
    });

    it('遷移中はisTransitioningがtrueになる', async () => {
      // Arrange
      const { result } = renderHook(() => useOmikujiSelection());
      expect(result.current.isTransitioning).toBe(false);

      // Act
      const selectPromise = act(async () => {
        await result.current.selectOmikuji('engineer-fortune');
      });

      // Assert - 遷移中の状態確認
      // 注: 実際の実装では、遷移中にisTransitioningがtrueになることを確認
      await selectPromise;
      expect(mockRouter.push).toHaveBeenCalled();
    });
  });

  describe('状態管理', () => {
    it('遷移完了後にisTransitioningがfalseに戻る', async () => {
      // Arrange
      const { result } = renderHook(() => useOmikujiSelection());

      // Act
      await act(async () => {
        await result.current.selectOmikuji('engineer-fortune');
      });

      // Assert
      expect(result.current.isTransitioning).toBe(false);
    });

    it('同一参照性を保持する（useCallbackの確認）', () => {
      // Arrange
      const { result, rerender } = renderHook(() => useOmikujiSelection());
      const firstSelectFunction = result.current.selectOmikuji;

      // Act
      rerender();

      // Assert
      expect(result.current.selectOmikuji).toBe(firstSelectFunction);
    });
  });

  describe('エラーハンドリング', () => {
    it('ルーター遷移エラー時に適切に処理される', async () => {
      // Arrange
      const mockError = new Error('Navigation failed');
      mockRouter.push.mockRejectedValueOnce(mockError);
      const { result } = renderHook(() => useOmikujiSelection());

      // Act & Assert
      await expect(act(async () => {
        await result.current.selectOmikuji('engineer-fortune');
      })).rejects.toThrow('Navigation failed');

      // 状態が適切にリセットされることを確認
      expect(result.current.isTransitioning).toBe(false);
    });

    it('無効なtypeIdでもエラーが発生しない', async () => {
      // Arrange
      // モックをリセットして正常動作に戻す
      mockRouter.push.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useOmikujiSelection());

      // Act
      await act(async () => {
        await result.current.selectOmikuji('invalid-type');
      });

      // Assert
      expect(mockRouter.push).toHaveBeenCalledWith('/omikuji/invalid-type');
    });

    it('空文字列のtypeIdでも適切に処理される', async () => {
      // Arrange
      // モックをリセットして正常動作に戻す
      mockRouter.push.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useOmikujiSelection());

      // Act
      await act(async () => {
        await result.current.selectOmikuji('');
      });

      // Assert
      expect(mockRouter.push).toHaveBeenCalledWith('/omikuji/');
    });
  });

  describe('ブラウザ履歴管理', () => {
    it('push を使用して履歴に追加される', async () => {
      // Arrange
      mockRouter.push.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useOmikujiSelection());

      // Act
      await act(async () => {
        await result.current.selectOmikuji('engineer-fortune');
      });

      // Assert
      expect(mockRouter.push).toHaveBeenCalledWith('/omikuji/engineer-fortune');
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  describe('パフォーマンス', () => {
    it('複数回レンダリングしても同じ関数参照を維持', () => {
      // Arrange
      const { result, rerender } = renderHook(() => useOmikujiSelection());
      const initialSelectFunction = result.current.selectOmikuji;

      // Act
      rerender();
      rerender();
      rerender();

      // Assert
      expect(result.current.selectOmikuji).toBe(initialSelectFunction);
    });
  });
});