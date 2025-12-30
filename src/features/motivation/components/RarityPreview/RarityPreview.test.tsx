import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RarityPreview } from './RarityPreview';
import { RarityTierData } from './types';

describe('RarityPreview', () => {
  const mockTiers: RarityTierData[] = [
    {
      rarity: 'common',
      label: 'コモン',
      probability: 0.6,
      color: '#9CA3AF'
    },
    {
      rarity: 'rare',
      label: 'レア',
      probability: 0.3,
      color: '#3B82F6'
    },
    {
      rarity: 'epic',
      label: 'エピック',
      probability: 0.08,
      color: '#8B5CF6',
      effects: { glow: true, sparkle: true }
    },
    {
      rarity: 'legendary',
      label: 'レジェンダリー',
      probability: 0.02,
      color: '#F59E0B',
      effects: { glow: true, sparkle: true, animation: 'pulse' }
    }
  ];

  describe('基本表示', () => {
    it('レアリティ階層タイトルが表示される', () => {
      // Act
      render(<RarityPreview tiers={mockTiers} />);
      
      // Assert
      expect(screen.getByText('レアリティ階層')).toBeInTheDocument();
    });

    it('すべてのレアリティティアが表示される', () => {
      // Act
      render(<RarityPreview tiers={mockTiers} />);
      
      // Assert
      expect(screen.getByText('コモン')).toBeInTheDocument();
      expect(screen.getByText('レア')).toBeInTheDocument();
      expect(screen.getByText('エピック')).toBeInTheDocument();
      expect(screen.getByText('レジェンダリー')).toBeInTheDocument();
    });

    it('確率が非表示の場合、確率表示されない', () => {
      // Act
      render(<RarityPreview tiers={mockTiers} showProbabilities={false} />);
      
      // Assert
      expect(screen.queryByText('60%')).not.toBeInTheDocument();
      expect(screen.queryByText('30%')).not.toBeInTheDocument();
    });

    it('確率が表示される場合、正しいパーセンテージが表示される', () => {
      // Act
      render(<RarityPreview tiers={mockTiers} showProbabilities={true} />);
      
      // Assert
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
      expect(screen.getByText('8%')).toBeInTheDocument();
      expect(screen.getByText('2%')).toBeInTheDocument();
    });
  });

  describe('ビジュアルエフェクト', () => {
    it('エフェクト付きレアリティにはエフェクトクラスが適用される', () => {
      // Act
      const { container } = render(<RarityPreview tiers={mockTiers} />);
      
      // Assert
      const epicTier = container.querySelector('[data-rarity="epic"]');
      const legendaryTier = container.querySelector('[data-rarity="legendary"]');
      
      expect(epicTier).toHaveClass('rarity-glow', 'rarity-sparkle');
      expect(legendaryTier).toHaveClass('rarity-glow', 'rarity-sparkle', 'rarity-pulse');
    });

    it('エフェクト無しレアリティにはエフェクトクラスが適用されない', () => {
      // Act
      const { container } = render(<RarityPreview tiers={mockTiers} />);
      
      // Assert
      const commonTier = container.querySelector('[data-rarity="common"]');
      const rareTier = container.querySelector('[data-rarity="rare"]');
      
      expect(commonTier).not.toHaveClass('rarity-glow', 'rarity-sparkle');
      expect(rareTier).not.toHaveClass('rarity-glow', 'rarity-sparkle');
    });

    it('カスタムカラーが正しく適用される', () => {
      // Act
      const { container } = render(<RarityPreview tiers={mockTiers} />);
      
      // Assert
      const epicTier = container.querySelector('[data-rarity="epic"]');
      expect(epicTier).toHaveStyle('background-color: #8B5CF6');
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なセマンティック構造が設定されている', () => {
      // Act
      render(<RarityPreview tiers={mockTiers} />);
      
      // Assert
      const section = screen.getByRole('region', { name: 'レアリティシステムの概要' });
      expect(section).toBeInTheDocument();
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('レアリティ階層');
    });

    it('各レアリティティアに適切なaria-labelが設定される', () => {
      // Act
      render(<RarityPreview tiers={mockTiers} showProbabilities={true} />);
      
      // Assert
      const epicTier = screen.getByLabelText('エピック: 確率8%、特別エフェクト付き');
      const commonTier = screen.getByLabelText('コモン: 確率60%');
      
      expect(epicTier).toBeInTheDocument();
      expect(commonTier).toBeInTheDocument();
    });
  });

  describe('レスポンシブ表示', () => {
    it('グリッドレイアウトが適用される', () => {
      // Act
      const { container } = render(<RarityPreview tiers={mockTiers} />);
      const gridElement = container.querySelector('[data-testid="rarity-grid"]');
      
      // Assert
      expect(gridElement).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-4');
    });
  });

  describe('動機付けメッセージ', () => {
    it('レジェンダリー取得への動機付けメッセージが表示される', () => {
      // Act
      render(<RarityPreview tiers={mockTiers} />);
      
      // Assert
      expect(screen.getByText('レジェンダリーが出るかも？')).toBeInTheDocument();
    });
  });
});