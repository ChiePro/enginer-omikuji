import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OmikujiFlow } from './OmikujiFlow';

// Mock the API call
const mockApiResponse = {
  success: true,
  data: {
    id: 'test-result-001',
    omikujiType: {
      id: 'engineer-fortune',
      name: 'エンジニア運勢',
      description: 'プログラマーのためのおみくじ',
      icon: '💻',
      color: {
        primary: '#1E40AF',
        secondary: '#FFFFFF'
      }
    },
    fortune: {
      id: 'daikichi',
      japaneseName: '大吉',
      englishName: 'Great Fortune',
      description: '最高の運勢',
      value: 4,
      probability: 0.03
    },
    createdAt: '2025-01-04T12:00:00Z'
  }
};

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock SmoothTransitions
vi.mock('@/animations/transitions/SmoothTransitions', () => ({
  SmoothTransitions: {
    getOmikujiSelectionTransition: () => ({
      cardExit: { scale: 1.2, opacity: 0 },
      resultEntrance: { 
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 }
      }
    }),
    getPageEntranceTransition: () => ({
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    })
  }
}));

const mockOmikujiTypes = [
  {
    id: 'engineer-fortune',
    name: 'エンジニア運勢',
    description: 'プログラマーのためのおみくじ',
    icon: '💻',
    color: { primary: '#1E40AF', secondary: '#FFFFFF' }
  },
  {
    id: 'debug-fortune',
    name: 'デバッグ運',
    description: 'バグ解決の運を試す',
    icon: '🐛',
    color: { primary: '#DC2626', secondary: '#FFFFFF' }
  }
];

describe('OmikujiFlow', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    // Mock window.matchMedia for responsive tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    });
  });

  afterAll(() => {
    cleanup();
  });

  describe('基本的なフロー', () => {
    it('おみくじカード選択から結果表示までの完全フローが動作する', async () => {
      // Given
      render(<OmikujiFlow omikujiTypes={mockOmikujiTypes} />);

      // When - おみくじカードを選択
      const engineerCard = screen.getByRole('button', { name: /エンジニア運勢を選択/ });
      await user.click(engineerCard);

      // Then - APIが呼ばれることを確認
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/omikuji/draw',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ typeId: 'engineer-fortune', saisenLevel: 0 })
          })
        );
      });

      // Then - 結果が表示される
      await waitFor(() => {
        expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'おみくじ結果: 大吉');
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      });
    });

    it('カード選択時に適切な遷移アニメーションが実行される', async () => {
      // Given
      render(<OmikujiFlow omikujiTypes={mockOmikujiTypes} />);

      // When
      const engineerCard = screen.getByRole('button', { name: /エンジニア運勢を選択/ });
      await user.click(engineerCard);

      // Then - アニメーション状態の確認
      await waitFor(() => {
        const flowContainer = screen.getByTestId('omikuji-flow-container');
        expect(flowContainer).toHaveAttribute('data-state', 'transitioning');
      });

      // 結果表示後にアニメーション状態がリセットされる
      await waitFor(() => {
        const flowContainer = screen.getByTestId('omikuji-flow-container');
        expect(flowContainer).toHaveAttribute('data-state', 'result');
      });
    });

    it('ローディング中は適切なインディケータが表示される', async () => {
      // Given
      // APIのレスポンスを遅延させる
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => mockApiResponse
          }), 100)
        )
      );

      render(<OmikujiFlow omikujiTypes={mockOmikujiTypes} />);

      // When
      const engineerCard = screen.getByRole('button', { name: /エンジニア運勢を選択/ });
      await user.click(engineerCard);

      // Then - ローディング状態になることを確認
      await waitFor(() => {
        const flowContainer = screen.getByTestId('omikuji-flow-container');
        expect(flowContainer).toHaveAttribute('data-state', 'loading');
      });

      // 完了後に結果状態になることを確認
      await waitFor(() => {
        const flowContainer = screen.getByTestId('omikuji-flow-container');
        expect(flowContainer).toHaveAttribute('data-state', 'result');
      });
    });
  });

  describe('再抽選フロー', () => {
    it('結果表示後に再抽選ボタンから元の選択画面に戻れる', async () => {
      // Given - 結果が表示されている状態
      render(<OmikujiFlow omikujiTypes={mockOmikujiTypes} />);
      const engineerCard = screen.getByRole('button', { name: /エンジニア運勢を選択/ });
      await user.click(engineerCard);
      
      await waitFor(() => {
        expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'おみくじ結果: 大吉');
      });

      // When - 再抽選ボタンをクリック
      const redrawButton = screen.getByRole('button', { name: /再抽選/ });
      await user.click(redrawButton);

      // Then - カード選択画面に戻る
      await waitFor(() => {
        const flowContainer = screen.getByTestId('omikuji-flow-container');
        expect(flowContainer).toHaveAttribute('data-state', 'selection');
        expect(screen.getByRole('button', { name: /エンジニア運勢を選択/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /デバッグ運を選択/ })).toBeInTheDocument();
      });
    });

    it('同じおみくじタイプで再抽選ができる', async () => {
      // Given - 結果が表示されている状態
      render(<OmikujiFlow omikujiTypes={mockOmikujiTypes} />);
      const engineerCard = screen.getByRole('button', { name: /エンジニア運勢を選択/ });
      await user.click(engineerCard);
      
      await waitFor(() => {
        expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'おみくじ結果: 大吉');
      });

      // 異なる結果をモック
      const newApiResponse = {
        ...mockApiResponse,
        data: {
          ...mockApiResponse.data,
          id: 'test-result-002',
          fortune: {
            ...mockApiResponse.data.fortune,
            id: 'chukichi',
            japaneseName: '中吉'
          }
        }
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newApiResponse
      });

      // When - 同じタイプで再抽選
      const sameTypeRedrawButton = screen.getByRole('button', { name: /同じおみくじをもう一度/ });
      await user.click(sameTypeRedrawButton);

      // Then - 新しい結果が表示される
      await waitFor(() => {
        expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'おみくじ結果: 中吉');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('お賽銭レベル統合', () => {
    it('お賽銭レベルを設定してからおみくじを引ける', async () => {
      // Given
      render(<OmikujiFlow omikujiTypes={mockOmikujiTypes} enableSaisenSelection={true} />);

      // When - お賽銭レベルを選択
      const saisenSelector = screen.getByRole('combobox', { name: /お賽銭レベル/ });
      await user.selectOptions(saisenSelector, '3');

      // おみくじカードを選択
      const engineerCard = screen.getByRole('button', { name: /エンジニア運勢を選択/ });
      await user.click(engineerCard);

      // Then - お賽銭レベルがAPIに送信される
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/omikuji/draw',
          expect.objectContaining({
            body: JSON.stringify({ typeId: 'engineer-fortune', saisenLevel: 3 })
          })
        );
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('APIエラー時に適切なエラーメッセージが表示される', async () => {
      // Given
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));
      render(<OmikujiFlow omikujiTypes={mockOmikujiTypes} />);

      // When
      const engineerCard = screen.getByRole('button', { name: /エンジニア運勢を選択/ });
      await user.click(engineerCard);

      // Then
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Network Error|おみくじを引くことができませんでした/)).toBeInTheDocument();
      });
    });

    it('APIが失敗レスポンスを返した場合の処理', async () => {
      // Given
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: {
            code: 'FORTUNE_DATA_NOT_FOUND',
            message: '指定されたおみくじタイプが見つかりません'
          }
        })
      });

      render(<OmikujiFlow omikujiTypes={mockOmikujiTypes} />);

      // When
      const engineerCard = screen.getByRole('button', { name: /エンジニア運勢を選択/ });
      await user.click(engineerCard);

      // Then
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('指定されたおみくじタイプが見つかりません')).toBeInTheDocument();
      });
    });

    it('エラー状態からリトライできる', async () => {
      // Given - 最初はエラー、次は成功
      mockFetch
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        });

      render(<OmikujiFlow omikujiTypes={mockOmikujiTypes} />);
      
      const engineerCard = screen.getByRole('button', { name: /エンジニア運勢を選択/ });
      await user.click(engineerCard);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // When - リトライボタンをクリック
      const retryButton = screen.getByRole('button', { name: /もう一度試す/ });
      await user.click(retryButton);

      // Then - 成功する
      await waitFor(() => {
        expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'おみくじ結果: 大吉');
      });
    });
  });

  describe('キーボード操作', () => {
    it('キーボードでカード選択からフロー完了まで操作できる', async () => {
      // Given
      render(<OmikujiFlow omikujiTypes={mockOmikujiTypes} />);

      // When - Tab で最初のカードにフォーカス
      await user.tab();
      expect(screen.getByRole('button', { name: /エンジニア運勢を選択/ })).toHaveFocus();

      // Enter で選択
      await user.keyboard('{Enter}');

      // Then - 結果表示まで進む
      await waitFor(() => {
        expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'おみくじ結果: 大吉');
      });

      // Escape で再抽選画面に戻る
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /エンジニア運勢を選択/ })).toBeInTheDocument();
      });
    });
  });

  describe('状態管理', () => {
    it('フロー状態が適切に管理される', async () => {
      // Given
      render(<OmikujiFlow omikujiTypes={mockOmikujiTypes} />);
      const flowContainer = screen.getByTestId('omikuji-flow-container');

      // 初期状態
      expect(flowContainer).toHaveAttribute('data-state', 'selection');

      // When - カード選択
      const engineerCard = screen.getByRole('button', { name: /エンジニア運勢を選択/ });
      await user.click(engineerCard);

      // 遷移中状態
      expect(flowContainer).toHaveAttribute('data-state', 'transitioning');

      // Then - 結果表示状態
      await waitFor(() => {
        expect(flowContainer).toHaveAttribute('data-state', 'result');
      });
    });

    it('選択されたおみくじタイプが適切に記録される', async () => {
      // Given
      render(<OmikujiFlow omikujiTypes={mockOmikujiTypes} />);

      // When
      const debugCard = screen.getByRole('button', { name: /デバッグ運を選択/ });
      await user.click(debugCard);

      // Then - 選択されたタイプが記録されている
      await waitFor(() => {
        const flowContainer = screen.getByTestId('omikuji-flow-container');
        expect(flowContainer).toHaveAttribute('data-selected-type', 'debug-fortune');
      });
    });
  });
});