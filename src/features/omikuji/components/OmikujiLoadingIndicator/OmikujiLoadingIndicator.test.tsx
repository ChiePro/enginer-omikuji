import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OmikujiLoadingIndicator } from './OmikujiLoadingIndicator';

describe('OmikujiLoadingIndicator', () => {
  describe('基本表示', () => {
    it('ローディング中であることを表示する', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      expect(screen.getByText('おみくじを準備中...')).toBeInTheDocument();
    });

    it('デフォルトでローディング状態が表示される', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });

    it('ローディングスピナーが表示される', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('カスタマイズ', () => {
    it('カスタムメッセージを表示できる', () => {
      // Arrange
      const customMessage = '神社に向かっています...';

      // Act
      render(<OmikujiLoadingIndicator message={customMessage} />);

      // Assert
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('サイズ指定ができる', () => {
      // Act
      render(<OmikujiLoadingIndicator size="large" />);

      // Assert
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('h-12', 'w-12'); // large サイズ
    });

    it('小さいサイズが適用される', () => {
      // Act
      render(<OmikujiLoadingIndicator size="small" />);

      // Assert
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('h-4', 'w-4'); // small サイズ
    });

    it('デフォルトサイズが適用される', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('h-8', 'w-8'); // medium サイズ
    });
  });

  describe('神社テーマ', () => {
    it('神社風のデザインが適用される', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const container = screen.getByRole('status');
      expect(container).toHaveClass('shrine-loading'); // 神社テーマのクラス
    });

    it('朱色系のカラースキームが使用される', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('text-shrine-red'); // 神社の朱色
    });

    it('和風フォントが適用される', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const message = screen.getByText('おみくじを準備中...');
      expect(message).toHaveClass('font-japanese'); // 日本語フォント
    });
  });

  describe('アクセシビリティ', () => {
    it('スクリーンリーダー用のテキストが設定されている', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-label', 'ローディング中');
    });

    it('ライブリージョンが設定されている', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });

    it('視覚的に隠されたテキストがある', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const srOnlyText = screen.getByText('読み込み中です。しばらくお待ちください。');
      expect(srOnlyText).toBeInTheDocument();
      expect(srOnlyText).toHaveClass('sr-only');
    });
  });

  describe('アニメーション', () => {
    it('回転アニメーションが適用されている', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('フェードイン効果が適用されている', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const container = screen.getByRole('status');
      expect(container).toHaveClass('animate-fadeIn');
    });

    it('脈動効果がメッセージに適用されている', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const message = screen.getByText('おみくじを準備中...');
      expect(message).toHaveClass('animate-pulse');
    });
  });

  describe('レスポンシブ対応', () => {
    it('モバイル用スタイルが適用される', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const container = screen.getByRole('status');
      expect(container).toHaveClass('p-4', 'sm:p-6'); // モバイルとデスクトップでの余白
    });

    it('テキストサイズがレスポンシブ', () => {
      // Act
      render(<OmikujiLoadingIndicator />);

      // Assert
      const message = screen.getByText('おみくじを準備中...');
      expect(message).toHaveClass('text-sm', 'sm:text-base'); // レスポンシブテキストサイズ
    });
  });

  describe('エラー表示モード', () => {
    it('エラー状態を表示できる', () => {
      // Act
      render(<OmikujiLoadingIndicator variant="error" message="おみくじの準備に失敗しました" />);

      // Assert
      expect(screen.getByText('おみくじの準備に失敗しました')).toBeInTheDocument();
      const container = screen.getByRole('alert'); // エラー時は alert role
      expect(container).toBeInTheDocument();
    });

    it('エラー用のスタイルが適用される', () => {
      // Act
      render(<OmikujiLoadingIndicator variant="error" />);

      // Assert
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('text-red-500'); // エラー時は赤色
    });

    it('成功状態を表示できる', () => {
      // Act
      render(<OmikujiLoadingIndicator variant="success" message="おみくじの準備が完了しました" />);

      // Assert
      expect(screen.getByText('おみくじの準備が完了しました')).toBeInTheDocument();
      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });
  });
});