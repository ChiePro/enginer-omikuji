import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CTAButton } from './CTAButton';

describe('CTAButton', () => {
  describe('基本表示', () => {
    it('子要素が正しく表示される', () => {
      // Arrange & Act
      render(<CTAButton>テストボタン</CTAButton>);
      
      // Assert
      expect(screen.getByText('テストボタン')).toBeInTheDocument();
    });

    it('基本的なCSSクラスが適用される', () => {
      // Arrange & Act
      render(<CTAButton>テストボタン</CTAButton>);
      
      // Assert
      const button = screen.getByText('テストボタン');
      expect(button).toHaveClass('inline-block');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
      expect(button).toHaveClass('transition-all');
    });
  });

  describe('バリアント', () => {
    it('primaryバリアントのスタイルが適用される', () => {
      // Arrange & Act
      render(<CTAButton variant="primary">プライマリボタン</CTAButton>);
      
      // Assert
      const button = screen.getByText('プライマリボタン');
      expect(button).toHaveClass('bg-white');
      expect(button).toHaveClass('bg-opacity-20');
      expect(button).toHaveClass('border-white');
    });

    it('secondaryバリアントのスタイルが適用される', () => {
      // Arrange & Act
      render(<CTAButton variant="secondary">セカンダリボタン</CTAButton>);
      
      // Assert
      const button = screen.getByText('セカンダリボタン');
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('border-current');
      expect(button).toHaveClass('opacity-80');
    });

    it('デフォルトではprimaryバリアントが適用される', () => {
      // Arrange & Act
      render(<CTAButton>デフォルトボタン</CTAButton>);
      
      // Assert
      const button = screen.getByText('デフォルトボタン');
      expect(button).toHaveClass('bg-white');
      expect(button).toHaveClass('bg-opacity-20');
    });
  });

  describe('無効状態', () => {
    it('無効状態で適切なスタイルが適用される', () => {
      // Arrange & Act
      render(<CTAButton isDisabled={true}>無効ボタン</CTAButton>);
      
      // Assert
      const button = screen.getByText('無効ボタン');
      expect(button).toHaveClass('opacity-50');
      expect(button).toHaveClass('cursor-not-allowed');
    });

    it('有効状態ではpointerカーソルが表示される', () => {
      // Arrange & Act
      render(<CTAButton isDisabled={false}>有効ボタン</CTAButton>);
      
      // Assert
      const button = screen.getByText('有効ボタン');
      expect(button).toHaveClass('cursor-pointer');
    });
  });

  describe('インタラクション', () => {
    it('クリック時にonClickコールバックが呼ばれる', async () => {
      // Arrange
      const onClick = vi.fn();
      render(<CTAButton onClick={onClick}>クリック可能</CTAButton>);
      
      // Act
      await userEvent.click(screen.getByText('クリック可能'));
      
      // Assert
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('無効状態ではクリックイベントが発生しない', async () => {
      // Arrange
      const onClick = vi.fn();
      render(
        <CTAButton onClick={onClick} isDisabled={true}>
          無効クリック
        </CTAButton>
      );
      
      // Act
      await userEvent.click(screen.getByText('無効クリック'));
      
      // Assert
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('カスタマイズ', () => {
    it('カスタムクラス名が適用される', () => {
      // Arrange & Act
      render(
        <CTAButton className="custom-class">
          カスタム
        </CTAButton>
      );
      
      // Assert
      const button = screen.getByText('カスタム');
      expect(button).toHaveClass('custom-class');
    });

    it('基本クラスとカスタムクラスが併用される', () => {
      // Arrange & Act
      render(
        <CTAButton className="extra-margin">
          併用ボタン
        </CTAButton>
      );
      
      // Assert
      const button = screen.getByText('併用ボタン');
      expect(button).toHaveClass('inline-block'); // 基本クラス
      expect(button).toHaveClass('extra-margin'); // カスタムクラス
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なHTML構造が生成される', () => {
      // Arrange & Act
      render(<CTAButton>アクセシブル</CTAButton>);
      
      // Assert
      const button = screen.getByText('アクセシブル');
      expect(button.tagName).toBe('DIV'); // プレゼンテーション要素として動作
    });

    it('親要素の一部として適切に機能する', () => {
      // Arrange & Act
      render(
        <div role="button" tabIndex={0}>
          <CTAButton>内部CTA</CTAButton>
        </div>
      );
      
      // Assert
      const parentButton = screen.getByRole('button');
      const ctaButton = screen.getByText('内部CTA');
      expect(parentButton).toContainElement(ctaButton);
    });
  });
});