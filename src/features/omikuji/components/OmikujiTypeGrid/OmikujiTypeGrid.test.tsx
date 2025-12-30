import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OmikujiTypeGrid } from './OmikujiTypeGrid';

describe('OmikujiTypeGrid', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe('表示内容', () => {
    it('5種類のおみくじカードが表示される', () => {
      // Act
      render(<OmikujiTypeGrid onSelect={mockOnSelect} />);
      
      // Assert
      expect(screen.getByText('エンジニア運勢')).toBeInTheDocument();
      expect(screen.getByText('技術選定おみくじ')).toBeInTheDocument();
      expect(screen.getByText('デバッグ運')).toBeInTheDocument();
      expect(screen.getByText('コードレビュー運')).toBeInTheDocument();
      expect(screen.getByText('デプロイ運')).toBeInTheDocument();
    });

    it('各カードの説明が表示される', () => {
      // Act
      render(<OmikujiTypeGrid onSelect={mockOnSelect} />);
      
      // Assert
      expect(screen.getByText('今日のコーディングを占う')).toBeInTheDocument();
      expect(screen.getByText('次に学ぶ技術を決める')).toBeInTheDocument();
      expect(screen.getByText('バグ解決のヒントを得る')).toBeInTheDocument();
      expect(screen.getByText('レビューの結果を予想')).toBeInTheDocument();
      expect(screen.getByText('デプロイの成功を占う')).toBeInTheDocument();
    });

    it('各カードのアイコンが表示される', () => {
      // Act
      render(<OmikujiTypeGrid onSelect={mockOnSelect} />);
      
      // Assert
      expect(screen.getByText('⚡')).toBeInTheDocument();
      expect(screen.getByText('🎲')).toBeInTheDocument();
      expect(screen.getByText('🐛')).toBeInTheDocument();
      expect(screen.getByText('👀')).toBeInTheDocument();
      expect(screen.getByText('🚀')).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('カード選択時にonSelectコールバックが呼ばれる', async () => {
      // Arrange
      render(<OmikujiTypeGrid onSelect={mockOnSelect} />);
      
      // Act
      const engineerFortuneButton = screen.getByLabelText('エンジニア運勢を選択');
      await userEvent.click(engineerFortuneButton);
      
      // Assert
      expect(mockOnSelect).toHaveBeenCalledWith('engineer-fortune');
    });

    it('異なるカードを選択すると適切なIDが渡される', async () => {
      // Arrange
      render(<OmikujiTypeGrid onSelect={mockOnSelect} />);
      
      // Act
      const debugFortuneButton = screen.getByLabelText('デバッグ運を選択');
      await userEvent.click(debugFortuneButton);
      
      // Assert
      expect(mockOnSelect).toHaveBeenCalledWith('debug-fortune');
    });
  });

  describe('レスポンシブレイアウト', () => {
    it('グリッドレイアウトのクラスが適用される', () => {
      // Act
      const { container } = render(<OmikujiTypeGrid onSelect={mockOnSelect} />);
      const gridElement = container.querySelector('[data-testid="omikuji-type-grid"]');
      
      // Assert
      expect(gridElement).toHaveClass('grid');
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).toHaveClass('md:grid-cols-2');
      expect(gridElement).toHaveClass('lg:grid-cols-3');
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なセマンティック構造が設定されている', () => {
      // Act
      render(<OmikujiTypeGrid onSelect={mockOnSelect} />);
      
      // Assert
      const section = screen.getByRole('region', { name: 'おみくじの種類を選択' });
      expect(section).toBeInTheDocument();
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('おみくじを選ぶ');
    });

    it('キーボードナビゲーションが可能', () => {
      // Act
      render(<OmikujiTypeGrid onSelect={mockOnSelect} />);
      
      // Assert
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabindex', '0');
      });
    });
  });
});