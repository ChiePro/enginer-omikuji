import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OmikujiCard } from './OmikujiCard';
import { OmikujiCardProps } from './types';

describe('OmikujiCard', () => {
  const defaultProps: OmikujiCardProps = {
    omikujiType: {
      id: 'engineer-fortune',
      name: 'エンジニア運勢',
      description: '今日のコーディングを占う',
      icon: '⚡',
      color: { primary: '#3B82F6', secondary: '#1E40AF' },
      route: '/omikuji/engineer-fortune'
    },
    onSelect: vi.fn()
  };

  describe('表示内容', () => {
    it('おみくじタイプの情報が正しく表示される', () => {
      // Arrange & Act
      render(<OmikujiCard {...defaultProps} />);
      
      // Assert
      expect(screen.getByText('エンジニア運勢')).toBeInTheDocument();
      expect(screen.getByText('今日のコーディングを占う')).toBeInTheDocument();
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });

    it('CTA ボタンが表示される', () => {
      // Arrange & Act
      render(<OmikujiCard {...defaultProps} />);
      
      // Assert
      expect(screen.getByText('このおみくじを引く')).toBeInTheDocument();
    });
  });

  describe('ユーザーインタラクション', () => {
    it('クリック時にonSelectコールバックが呼ばれる', async () => {
      // Arrange
      const onSelect = vi.fn();
      render(<OmikujiCard {...defaultProps} onSelect={onSelect} />);
      
      // Act
      await userEvent.click(screen.getByRole('button'));
      
      // Assert
      expect(onSelect).toHaveBeenCalledWith('engineer-fortune');
    });

    it('キーボードのEnterキーでも選択できる', async () => {
      // Arrange
      const onSelect = vi.fn();
      render(<OmikujiCard {...defaultProps} onSelect={onSelect} />);
      
      // Act
      const card = screen.getByRole('button');
      card.focus();
      await userEvent.keyboard('{Enter}');
      
      // Assert
      expect(onSelect).toHaveBeenCalledWith('engineer-fortune');
    });

    it('スペースキーでも選択できる', async () => {
      // Arrange
      const onSelect = vi.fn();
      render(<OmikujiCard {...defaultProps} onSelect={onSelect} />);
      
      // Act
      const card = screen.getByRole('button');
      card.focus();
      await userEvent.keyboard('{ }');
      
      // Assert
      expect(onSelect).toHaveBeenCalledWith('engineer-fortune');
    });

    it('無効状態のときはクリックできない', async () => {
      // Arrange
      const onSelect = vi.fn();
      render(<OmikujiCard {...defaultProps} onSelect={onSelect} isDisabled={true} />);
      
      // Act
      await userEvent.click(screen.getByRole('button'));
      
      // Assert
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIAラベルが設定されている', () => {
      // Arrange & Act
      render(<OmikujiCard {...defaultProps} />);
      
      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'エンジニア運勢を選択');
    });

    it('フォーカス可能である', () => {
      // Arrange & Act
      render(<OmikujiCard {...defaultProps} />);
      
      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabindex', '0');
    });

    it('無効状態のときはフォーカスできない', () => {
      // Arrange & Act
      render(<OmikujiCard {...defaultProps} isDisabled={true} />);
      
      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('視覚的差別化', () => {
    it('カスタムカラーが適用される', () => {
      // Arrange
      const customProps = {
        ...defaultProps,
        omikujiType: {
          ...defaultProps.omikujiType,
          color: { primary: '#EF4444', secondary: '#991B1B' }
        }
      };
      
      // Act
      render(<OmikujiCard {...customProps} />);
      
      // Assert
      const card = screen.getByRole('button');
      expect(card).toHaveClass('bg-[#EF4444]');
    });
  });
});