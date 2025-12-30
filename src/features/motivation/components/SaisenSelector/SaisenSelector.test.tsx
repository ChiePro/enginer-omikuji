import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaisenSelector } from './SaisenSelector';

describe('SaisenSelector', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe('基本表示', () => {
    it('お賽銭選択のタイトルが表示される', () => {
      // Act
      render(<SaisenSelector onSelect={mockOnSelect} />);
      
      // Assert
      expect(screen.getByText('お賽銭を選ぶ')).toBeInTheDocument();
    });

    it('5種類のお賽銭オプションが表示される', () => {
      // Act
      render(<SaisenSelector onSelect={mockOnSelect} />);
      
      // Assert
      expect(screen.getByLabelText('5円（ご縁）を選択')).toBeInTheDocument();
      expect(screen.getByLabelText('50円を選択')).toBeInTheDocument();
      expect(screen.getByLabelText('100円を選択')).toBeInTheDocument();
      expect(screen.getByLabelText('500円を選択')).toBeInTheDocument();
      expect(screen.getByLabelText('賽銭箱にバグを投げ込むを選択')).toBeInTheDocument();
    });

    it('各お賽銭の説明が表示される', () => {
      // Act
      render(<SaisenSelector onSelect={mockOnSelect} showEffectDescription={true} />);
      
      // Assert
      expect(screen.getByText('効果なし（通常確率）')).toBeInTheDocument();
      expect(screen.getByText('ちょっとだけ運気アップ')).toBeInTheDocument();
      expect(screen.getByText('運気アップ')).toBeInTheDocument();
      expect(screen.getByText('大幅運気アップ')).toBeInTheDocument();
      expect(screen.getByText('特殊な結果が出る可能性')).toBeInTheDocument();
    });

    it('効果説明が非表示の場合、説明文が表示されない', () => {
      // Act
      render(<SaisenSelector onSelect={mockOnSelect} showEffectDescription={false} />);
      
      // Assert
      expect(screen.queryByText('効果なし（通常確率）')).not.toBeInTheDocument();
    });
  });

  describe('ユーザーインタラクション', () => {
    it('5円選択時に正しいIDが渡される', async () => {
      // Arrange
      render(<SaisenSelector onSelect={mockOnSelect} />);
      
      // Act
      await userEvent.click(screen.getByLabelText('5円（ご縁）を選択'));
      
      // Assert
      expect(mockOnSelect).toHaveBeenCalledWith('goen');
    });

    it('100円選択時に正しいIDが渡される', async () => {
      // Arrange
      render(<SaisenSelector onSelect={mockOnSelect} />);
      
      // Act
      await userEvent.click(screen.getByLabelText('100円を選択'));
      
      // Assert
      expect(mockOnSelect).toHaveBeenCalledWith('hundred-yen');
    });

    it('バグ選択時に正しいIDが渡される', async () => {
      // Arrange
      render(<SaisenSelector onSelect={mockOnSelect} />);
      
      // Act
      await userEvent.click(screen.getByLabelText('賽銭箱にバグを投げ込むを選択'));
      
      // Assert
      expect(mockOnSelect).toHaveBeenCalledWith('debug-bug');
    });

    it('キーボードのEnterキーでも選択できる', async () => {
      // Arrange
      render(<SaisenSelector onSelect={mockOnSelect} />);
      
      // Act
      const saisenOption = screen.getByLabelText('100円を選択');
      saisenOption.focus();
      await userEvent.keyboard('{Enter}');
      
      // Assert
      expect(mockOnSelect).toHaveBeenCalledWith('hundred-yen');
    });
  });

  describe('選択状態の表示', () => {
    it('現在の選択が視覚的に表示される', () => {
      // Act
      render(<SaisenSelector onSelect={mockOnSelect} currentSelection="hundred-yen" />);
      
      // Assert
      const selectedOption = screen.getByLabelText('100円を選択');
      expect(selectedOption).toHaveClass('selected');
    });

    it('選択されていないオプションはselectedクラスを持たない', () => {
      // Act
      render(<SaisenSelector onSelect={mockOnSelect} currentSelection="hundred-yen" />);
      
      // Assert
      const unselectedOption = screen.getByLabelText('50円を選択');
      expect(unselectedOption).not.toHaveClass('selected');
    });
  });

  describe('視覚的効果', () => {
    it('500円オプションには特別なアニメーションクラスが適用される', () => {
      // Act
      render(<SaisenSelector onSelect={mockOnSelect} />);
      
      // Assert
      const specialOption = screen.getByLabelText('500円を選択');
      expect(specialOption).toHaveClass('special-animation');
    });

    it('バグオプションには特殊エフェクトクラスが適用される', () => {
      // Act
      render(<SaisenSelector onSelect={mockOnSelect} />);
      
      // Assert
      const bugOption = screen.getByLabelText('賽銭箱にバグを投げ込むを選択');
      expect(bugOption).toHaveClass('special-effect');
    });

    it('効果のあるオプションには効果ありクラスが適用される', () => {
      // Act
      render(<SaisenSelector onSelect={mockOnSelect} />);
      
      // Assert
      const effectOption = screen.getByLabelText('50円を選択');
      expect(effectOption).toHaveClass('has-effect');
    });

    it('効果のないオプションには効果なしクラスが適用される', () => {
      // Act
      render(<SaisenSelector onSelect={mockOnSelect} />);
      
      // Assert
      const noEffectOption = screen.getByLabelText('5円（ご縁）を選択');
      expect(noEffectOption).toHaveClass('no-effect');
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なセマンティック構造が設定されている', () => {
      // Act
      render(<SaisenSelector onSelect={mockOnSelect} />);
      
      // Assert
      const section = screen.getByRole('region', { name: 'お賽銭の選択' });
      expect(section).toBeInTheDocument();
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('お賽銭を選ぶ');
    });

    it('各オプションに適切なARIAラベルが設定される', () => {
      // Act
      render(<SaisenSelector onSelect={mockOnSelect} showEffectDescription={true} />);
      
      // Assert
      const goenOption = screen.getByLabelText('5円（ご縁）を選択: 効果なし（通常確率）');
      const hundredOption = screen.getByLabelText('100円を選択: 運気アップ');
      
      expect(goenOption).toBeInTheDocument();
      expect(hundredOption).toBeInTheDocument();
    });

    it('キーボードナビゲーションが可能', () => {
      // Act
      render(<SaisenSelector onSelect={mockOnSelect} />);
      
      // Assert
      const saisenOptions = screen.getAllByRole('button');
      saisenOptions.forEach(option => {
        expect(option).toHaveAttribute('tabindex', '0');
      });
    });
  });

  describe('レスポンシブレイアウト', () => {
    it('グリッドレイアウトのクラスが適用される', () => {
      // Act
      const { container } = render(<SaisenSelector onSelect={mockOnSelect} />);
      const gridElement = container.querySelector('[data-testid="saisen-grid"]');
      
      // Assert
      expect(gridElement).toHaveClass('grid');
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).toHaveClass('sm:grid-cols-2');
      expect(gridElement).toHaveClass('lg:grid-cols-3');
    });
  });
});