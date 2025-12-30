import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaisenEffectDisplay } from './SaisenEffectDisplay';

describe('SaisenEffectDisplay', () => {
  const mockOnReset = vi.fn();

  beforeEach(() => {
    mockOnReset.mockClear();
  });

  describe('効果なしの状態', () => {
    it('お賽銭効果が適用されていない場合、何も表示されない', () => {
      // Act
      const { container } = render(<SaisenEffectDisplay currentSaisen={null} />);
      
      // Assert
      expect(container.firstChild).toBeNull();
    });
  });

  describe('効果適用時の表示', () => {
    it('100円のお賽銭効果が表示される', () => {
      // Act
      render(<SaisenEffectDisplay currentSaisen="100円" />);
      
      // Assert
      expect(screen.getByText('運気上昇中')).toBeInTheDocument();
      expect(screen.getByText('100円')).toBeInTheDocument();
      expect(screen.getByText('レア以上の確率が10%アップ')).toBeInTheDocument();
    });

    it('500円のお賽銭効果と残り回数が表示される', () => {
      // Act
      render(<SaisenEffectDisplay currentSaisen="500円" remainingDraws={2} />);
      
      // Assert
      expect(screen.getByText('運気上昇中')).toBeInTheDocument();
      expect(screen.getByText('500円')).toBeInTheDocument();
      expect(screen.getByText('エピック以上の確率が15%アップ')).toBeInTheDocument();
      expect(screen.getByText('あと2回有効')).toBeInTheDocument();
    });

    it('バグ効果が表示される', () => {
      // Act
      render(<SaisenEffectDisplay currentSaisen="賽銭箱にバグを投げ込む" remainingDraws={4} />);
      
      // Assert
      expect(screen.getByText('特殊効果発動中')).toBeInTheDocument();
      expect(screen.getByText('賽銭箱にバグを投げ込む')).toBeInTheDocument();
      expect(screen.getByText('特殊なレアリティ分布が適用される')).toBeInTheDocument();
      expect(screen.getByText('あと4回有効')).toBeInTheDocument();
    });

    it('5円（ご縁）の場合でも表示される（効果なしの説明付き）', () => {
      // Act
      render(<SaisenEffectDisplay currentSaisen="5円（ご縁）" />);
      
      // Assert
      expect(screen.getByText('お賽銭投入済み')).toBeInTheDocument();
      expect(screen.getByText('5円（ご縁）')).toBeInTheDocument();
      expect(screen.getByText('効果なし')).toBeInTheDocument();
    });
  });

  describe('アニメーション', () => {
    it('アニメーションが有効の場合、アニメーションクラスが適用される', () => {
      // Act
      const { container } = render(
        <SaisenEffectDisplay 
          currentSaisen="100円" 
          showAnimation={true} 
        />
      );
      
      // Assert
      const effectDisplay = container.querySelector('[data-testid="saisen-effect-display"]');
      expect(effectDisplay).toHaveClass('animate-pulse');
    });

    it('アニメーションが無効の場合、アニメーションクラスが適用されない', () => {
      // Act
      const { container } = render(
        <SaisenEffectDisplay 
          currentSaisen="100円" 
          showAnimation={false} 
        />
      );
      
      // Assert
      const effectDisplay = container.querySelector('[data-testid="saisen-effect-display"]');
      expect(effectDisplay).not.toHaveClass('animate-pulse');
    });
  });

  describe('リセット機能', () => {
    it('リセットボタンが表示される', () => {
      // Act
      render(<SaisenEffectDisplay currentSaisen="100円" onReset={mockOnReset} />);
      
      // Assert
      expect(screen.getByLabelText('効果をリセット')).toBeInTheDocument();
    });

    it('リセットボタンクリックでonResetコールバックが呼ばれる', async () => {
      // Act
      render(<SaisenEffectDisplay currentSaisen="100円" onReset={mockOnReset} />);
      
      // Act
      await userEvent.click(screen.getByLabelText('効果をリセット'));
      
      // Assert
      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('onResetが未設定の場合、リセットボタンが表示されない', () => {
      // Act
      render(<SaisenEffectDisplay currentSaisen="100円" />);
      
      // Assert
      expect(screen.queryByLabelText('効果をリセット')).not.toBeInTheDocument();
    });
  });

  describe('視覚的スタイル', () => {
    it('通常のお賽銭は青系のスタイルが適用される', () => {
      // Act
      const { container } = render(<SaisenEffectDisplay currentSaisen="100円" />);
      
      // Assert
      const effectDisplay = container.querySelector('[data-testid="saisen-effect-display"]');
      expect(effectDisplay).toHaveClass('bg-blue-50', 'border-blue-200');
    });

    it('500円お賽銭は金系のスタイルが適用される', () => {
      // Act
      const { container } = render(<SaisenEffectDisplay currentSaisen="500円" />);
      
      // Assert
      const effectDisplay = container.querySelector('[data-testid="saisen-effect-display"]');
      expect(effectDisplay).toHaveClass('bg-yellow-50', 'border-yellow-200');
    });

    it('バグ効果は紫系のスタイルが適用される', () => {
      // Act
      const { container } = render(<SaisenEffectDisplay currentSaisen="賽銭箱にバグを投げ込む" />);
      
      // Assert
      const effectDisplay = container.querySelector('[data-testid="saisen-effect-display"]');
      expect(effectDisplay).toHaveClass('bg-purple-50', 'border-purple-200');
    });

    it('効果なし（5円）はグレー系のスタイルが適用される', () => {
      // Act
      const { container } = render(<SaisenEffectDisplay currentSaisen="5円（ご縁）" />);
      
      // Assert
      const effectDisplay = container.querySelector('[data-testid="saisen-effect-display"]');
      expect(effectDisplay).toHaveClass('bg-gray-50', 'border-gray-200');
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なセマンティック構造が設定されている', () => {
      // Act
      render(<SaisenEffectDisplay currentSaisen="100円" />);
      
      // Assert
      const section = screen.getByRole('region', { name: '現在のお賽銭効果' });
      expect(section).toBeInTheDocument();
    });

    it('効果の説明が適切にアナウンスされる', () => {
      // Act
      render(<SaisenEffectDisplay currentSaisen="500円" remainingDraws={3} />);
      
      // Assert
      const announcement = screen.getByLabelText('500円のお賽銭効果が適用中。エピック以上の確率が15%アップ。あと3回有効');
      expect(announcement).toBeInTheDocument();
    });
  });
});