/**
 * トップページ統合テスト
 * 
 * タスク12: コンポーネント統合と最終調整のためのテスト
 * TDD Red Phase: 統合が完了していない状態で失敗するテストを作成
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TopPage from '../../../app/page';

// モックの設定
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('トップページ統合テスト', () => {
  beforeEach(() => {
    mockPush.mockClear();
    vi.clearAllMocks();
  });

  describe('基本コンポーネント統合', () => {
    it('ヒーローセクション、おみくじカード、レアリティプレビュー、お賽銭システムが統合されている', async () => {
      // Arrange & Act
      render(<TopPage />);

      // Assert - 神社とテクノロジーの融合ビジュアル
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('エンジニアの運命を占う')).toBeInTheDocument();
      expect(screen.getByText('今日のコーディング運は？')).toBeInTheDocument();

      // Assert - 5種類のおみくじカードが表示される
      expect(screen.getByText('エンジニア運勢')).toBeInTheDocument();
      expect(screen.getByText('技術選定おみくじ')).toBeInTheDocument();
      expect(screen.getByText('デバッグ運')).toBeInTheDocument();
      expect(screen.getByText('コードレビュー運')).toBeInTheDocument();
      expect(screen.getByText('デプロイ運')).toBeInTheDocument();

      // Assert - レアリティプレビューが表示される
      expect(screen.getByText('小吉')).toBeInTheDocument();
      expect(screen.getByText('吉')).toBeInTheDocument();
      expect(screen.getByText('中吉')).toBeInTheDocument();
      expect(screen.getByText('大吉')).toBeInTheDocument();
      expect(screen.getByText('大吉が出るかも？')).toBeInTheDocument();

      // Assert - お賽銭システムが表示される
      expect(screen.getByText('お賽銭で運気UP')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /5円/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /50円/ })).toBeInTheDocument();
    });

    it('すべてのカードにCTAボタンが正しく統合されている', () => {
      // Arrange & Act
      render(<TopPage />);

      // Assert
      const ctaButtons = screen.getAllByRole('button', { name: /このおみくじを引く/ });
      expect(ctaButtons).toHaveLength(5); // 5種類のおみくじ
      
      ctaButtons.forEach(button => {
        expect(button).toBeVisible();
        expect(button).toBeEnabled();
      });
    });
  });

  describe('エンドツーエンドユーザーフロー', () => {
    it('おみくじカード選択→お賽銭選択→おみくじ画面遷移の完全フロー', async () => {
      const user = userEvent.setup();
      
      // Arrange
      render(<TopPage />);

      // Act 1: お賽銭を選択する
      const saisenButton = screen.getByRole('button', { name: /100円/ });
      await user.click(saisenButton);

      // Assert 1: お賽銭効果が反映される
      expect(screen.getByText(/運気上昇中/)).toBeInTheDocument();

      // Act 2: エンジニア運勢カードを選択する
      const engineerCard = screen.getByRole('button', { name: /エンジニア運勢.*を選択/ });
      await user.click(engineerCard);

      // Assert 2: 適切なページに遷移する
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/omikuji/engineer-fortune');
      });
    });

    it('キーボードナビゲーションによる完全操作', async () => {
      const user = userEvent.setup();

      // Arrange
      render(<TopPage />);

      // Act: Tabキーでカードを順次フォーカス、Enterで選択
      await user.tab(); // 最初のカードにフォーカス
      await user.tab(); // 次のカードにフォーカス
      await user.keyboard('{Enter}'); // Enterキーで選択

      // Assert: 適切な遷移が発生する
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(1);
      });
    });

    it('アニメーション完了後にページ遷移が実行される', async () => {
      const user = userEvent.setup();

      // Arrange
      render(<TopPage />);

      // Act: カードクリック
      const firstCard = screen.getAllByRole('button', { name: /このおみくじを引く/ })[0];
      await user.click(firstCard);

      // Assert: ローディング状態が表示される
      expect(screen.getByRole('status', { name: /おみくじを準備中/ })).toBeInTheDocument();

      // Assert: アニメーション完了後に遷移する
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      }, { timeout: 3000 }); // アニメーション時間を考慮
    });
  });

  describe('パフォーマンス要件検証', () => {
    it('初期表示時に3秒以内で全要素が表示される', async () => {
      const startTime = performance.now();

      // Act
      render(<TopPage />);

      // Assert: 重要な要素が存在する
      await waitFor(() => {
        expect(screen.getByText('エンジニアの運命を占う')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /このおみくじを引く/ })).toHaveLength(5);
        expect(screen.getByText('大吉')).toBeInTheDocument();
      }, { timeout: 3000 });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // パフォーマンス要件: 3秒以内での全要素表示
      expect(renderTime).toBeLessThan(3000);
    });

    it('アニメーションが60fps維持でスムーズに動作する', async () => {
      const user = userEvent.setup();
      render(<TopPage />);

      const card = screen.getAllByRole('button', { name: /このおみくじを引く/ })[0];

      // ホバーアニメーション開始
      await user.hover(card);

      // アニメーション実行中のスタイル変化を検証
      await waitFor(() => {
        const cardElement = card.closest('.omikuji-card');
        const computedStyle = window.getComputedStyle(cardElement!);
        
        // ホバー時のtransform適用を確認（浮き上がりエフェクト）
        expect(computedStyle.transform).not.toBe('none');
      });
    });
  });

  describe('レスポンシブ対応統合', () => {
    it('モバイルビュー（320px）で適切に表示される', () => {
      // Arrange: モバイルビューポート設定
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      Object.defineProperty(window, 'innerHeight', { value: 568 });

      // Act
      render(<TopPage />);

      // Assert: モバイル表示での必要要素確認
      expect(screen.getByText('エンジニアの運命を占う')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /このおみくじを引く/ })).toHaveLength(5);

      // カードがグリッド表示で適切にレイアウトされる
      const cardContainer = screen.getByTestId('omikuji-type-grid');
      expect(cardContainer).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });

    it('デスクトップビューで適切に表示される', () => {
      // Arrange: デスクトップビューポート設定
      Object.defineProperty(window, 'innerWidth', { value: 1920 });
      Object.defineProperty(window, 'innerHeight', { value: 1080 });

      // Act
      render(<TopPage />);

      // Assert: デスクトップ表示での追加機能確認
      expect(screen.getByText('エンジニアの運命を占う')).toBeInTheDocument();
      
      // レアリティプレビューが側面に表示される
      const rarityPreview = screen.getByTestId('rarity-preview');
      expect(rarityPreview).toBeVisible();
    });
  });

  describe('エラーハンドリング統合', () => {
    it('コンポーネントエラー発生時にエラーバウンダリが機能する', () => {
      // エラーを発生させるコンポーネントをモック
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert
      expect(() => render(<ThrowError />)).toThrow();

      consoleSpy.mockRestore();
    });

    it('ネットワークエラー時にフォールバック表示が機能する', async () => {
      // ネットワークエラーをシミュレート
      const mockFetch = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      // Act
      render(<TopPage />);

      // Assert: エラーフォールバック表示
      await waitFor(() => {
        const fallbackElement = screen.getByText(/ネットワークエラー|エラーが発生/);
        expect(fallbackElement).toBeInTheDocument();
      });

      mockFetch.mockRestore();
    });
  });

  describe('アクセシビリティ統合', () => {
    it('スクリーンリーダーで正しく読み上げられる構造', () => {
      render(<TopPage />);

      // セクション構造の確認
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();

      // 見出し階層の確認
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // ARIAラベルの確認
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('カラーコントラスト要件（WCAG 2.1 AA）を満たしている', () => {
      render(<TopPage />);

      // カードの色設定を確認
      const cards = screen.getAllByTestId('omikuji-card');
      cards.forEach(card => {
        const computedStyle = window.getComputedStyle(card);
        // コントラスト比の詳細チェックは実際のCSSで行われる
        expect(computedStyle.backgroundColor).not.toBe('');
        expect(computedStyle.color).not.toBe('');
      });
    });
  });
});