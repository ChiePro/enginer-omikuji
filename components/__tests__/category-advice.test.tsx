/**
 * CategoryAdviceGrid/Itemコンポーネントのテスト
 *
 * 6カテゴリのレンダリング、トーン別配色、レスポンシブグリッド、
 * アニメーション、アクセシビリティをテストします。
 * TDD原則に従い、実装前にテストを作成します（RED phase）。
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryAdviceGrid } from '../category-advice-grid';
import { CategoryAdviceItem } from '../category-advice-item';
import { CategoryAdvice } from '@/lib/integrated-fortune';
import { FortuneLevel } from '@/lib/fortune-data';

describe('CategoryAdviceGrid', () => {
  const mockCategoryAdvice: CategoryAdvice = {
    coding: 'スムーズに進む',
    review: 'LGTM多し',
    deploy: '安全に完了する',
    waiting: '良い知らせあり',
    conflict: '心配なし',
    growth: '大きく成長する',
  };

  const mockFortuneLevel: FortuneLevel = {
    id: 'daikichi',
    name: '大吉',
    weight: 16,
    rank: 1,
  };

  describe('Rendering all categories', () => {
    it('should render all 6 categories', () => {
      render(
        <CategoryAdviceGrid
          categoryAdvice={mockCategoryAdvice}
          fortuneLevel={mockFortuneLevel}
        />
      );

      expect(screen.getByText('コーディング運')).toBeInTheDocument();
      expect(screen.getByText('レビュー運')).toBeInTheDocument();
      expect(screen.getByText('デプロイ運')).toBeInTheDocument();
      expect(screen.getByText('待ち人')).toBeInTheDocument();
      expect(screen.getByText('争い事')).toBeInTheDocument();
      expect(screen.getByText('成長運')).toBeInTheDocument();
    });

    it('should render all advice messages', () => {
      render(
        <CategoryAdviceGrid
          categoryAdvice={mockCategoryAdvice}
          fortuneLevel={mockFortuneLevel}
        />
      );

      expect(screen.getByText('スムーズに進む')).toBeInTheDocument();
      expect(screen.getByText('LGTM多し')).toBeInTheDocument();
      expect(screen.getByText('安全に完了する')).toBeInTheDocument();
      expect(screen.getByText('良い知らせあり')).toBeInTheDocument();
      expect(screen.getByText('心配なし')).toBeInTheDocument();
      expect(screen.getByText('大きく成長する')).toBeInTheDocument();
    });

    it('should render all category icons', () => {
      render(
        <CategoryAdviceGrid
          categoryAdvice={mockCategoryAdvice}
          fortuneLevel={mockFortuneLevel}
        />
      );

      expect(screen.getByText('💻')).toBeInTheDocument(); // coding
      expect(screen.getByText('👀')).toBeInTheDocument(); // review
      expect(screen.getByText('🚀')).toBeInTheDocument(); // deploy
      expect(screen.getByText('⏰')).toBeInTheDocument(); // waiting
      expect(screen.getByText('⚔️')).toBeInTheDocument(); // conflict
      expect(screen.getByText('🌱')).toBeInTheDocument(); // growth
    });
  });

  describe('Responsive grid layout', () => {
    it('should have responsive grid classes', () => {
      const { container } = render(
        <CategoryAdviceGrid
          categoryAdvice={mockCategoryAdvice}
          fortuneLevel={mockFortuneLevel}
        />
      );

      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
      expect(grid?.className).toMatch(/grid-cols-1/);
      expect(grid?.className).toMatch(/md:grid-cols-2/);
    });

    it('should have gap between items', () => {
      const { container } = render(
        <CategoryAdviceGrid
          categoryAdvice={mockCategoryAdvice}
          fortuneLevel={mockFortuneLevel}
        />
      );

      const grid = container.querySelector('[class*="grid"]');
      expect(grid?.className).toMatch(/gap-\d+/);
    });
  });

  describe('Animation', () => {
    it('should apply animation classes by default', () => {
      const { container } = render(
        <CategoryAdviceGrid
          categoryAdvice={mockCategoryAdvice}
          fortuneLevel={mockFortuneLevel}
        />
      );

      expect(container.innerHTML).toMatch(/transition|animate|duration/);
    });

    it('should not apply animation classes when enableAnimation is false', () => {
      const { container } = render(
        <CategoryAdviceGrid
          categoryAdvice={mockCategoryAdvice}
          fortuneLevel={mockFortuneLevel}
          enableAnimation={false}
        />
      );

      // アニメーションクラスが含まれないことを確認
      const items = container.querySelectorAll('[class*="transition"]');
      expect(items.length).toBe(0);
    });
  });

  describe('Accessibility', () => {
    it('should use semantic HTML (section tag)', () => {
      const { container } = render(
        <CategoryAdviceGrid
          categoryAdvice={mockCategoryAdvice}
          fortuneLevel={mockFortuneLevel}
        />
      );

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should have appropriate aria-label for grid', () => {
      const { container } = render(
        <CategoryAdviceGrid
          categoryAdvice={mockCategoryAdvice}
          fortuneLevel={mockFortuneLevel}
        />
      );

      const section = container.querySelector('section');
      expect(section).toHaveAttribute('aria-label');
    });
  });
});

describe('CategoryAdviceItem', () => {
  describe('Positive tone styling', () => {
    it('should render positive advice with green color scheme', () => {
      const { container } = render(
        <CategoryAdviceItem
          categoryId="coding"
          categoryName="コーディング運"
          advice="スムーズに進む"
          tone="positive"
        />
      );

      const item = container.firstChild as HTMLElement;
      expect(item.className).toContain('from-green');
    });
  });

  describe('Negative tone styling', () => {
    it('should render negative advice with orange color scheme', () => {
      const { container } = render(
        <CategoryAdviceItem
          categoryId="coding"
          categoryName="コーディング運"
          advice="要件を注意深く"
          tone="negative"
        />
      );

      const item = container.firstChild as HTMLElement;
      expect(item.className).toContain('from-orange');
    });
  });

  describe('Content rendering', () => {
    it('should render category name', () => {
      render(
        <CategoryAdviceItem
          categoryId="coding"
          categoryName="コーディング運"
          advice="スムーズに進む"
          tone="positive"
        />
      );

      expect(screen.getByText('コーディング運')).toBeInTheDocument();
    });

    it('should render advice message', () => {
      render(
        <CategoryAdviceItem
          categoryId="coding"
          categoryName="コーディング運"
          advice="スムーズに進む"
          tone="positive"
        />
      );

      expect(screen.getByText('スムーズに進む')).toBeInTheDocument();
    });

    it('should render category icon', () => {
      render(
        <CategoryAdviceItem
          categoryId="coding"
          categoryName="コーディング運"
          advice="スムーズに進む"
          tone="positive"
        />
      );

      expect(screen.getByText('💻')).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should apply animation classes by default', () => {
      const { container } = render(
        <CategoryAdviceItem
          categoryId="coding"
          categoryName="コーディング運"
          advice="スムーズに進む"
          tone="positive"
        />
      );

      const item = container.firstChild as HTMLElement;
      expect(item.className).toMatch(/transition|animate|duration/);
    });

    it('should not apply animation classes when enableAnimation is false', () => {
      const { container } = render(
        <CategoryAdviceItem
          categoryId="coding"
          categoryName="コーディング運"
          advice="スムーズに進む"
          tone="positive"
          enableAnimation={false}
        />
      );

      const item = container.firstChild as HTMLElement;
      expect(item.className).not.toMatch(/transition|animate|duration/);
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria-label', () => {
      const { container } = render(
        <CategoryAdviceItem
          categoryId="coding"
          categoryName="コーディング運"
          advice="スムーズに進む"
          tone="positive"
        />
      );

      const item = container.firstChild as HTMLElement;
      expect(item).toHaveAttribute('aria-label');
      expect(item.getAttribute('aria-label')).toContain('コーディング運');
    });

    it('should use semantic HTML (article tag)', () => {
      const { container } = render(
        <CategoryAdviceItem
          categoryId="coding"
          categoryName="コーディング運"
          advice="スムーズに進む"
          tone="positive"
        />
      );

      expect(container.querySelector('article')).toBeInTheDocument();
    });
  });

  describe('Tone determination', () => {
    const positiveMessages = [
      'スムーズに進む',
      '実装が捗る',
      'LGTM多し',
      '安全に完了する',
    ];

    const negativeMessages = [
      '要件を注意深く',
      '設計を見直せ',
      '焦らず慎重に',
      'リスクに注意',
    ];

    it.each(positiveMessages)(
      'should apply positive styling for positive message: %s',
      (message) => {
        const { container } = render(
          <CategoryAdviceItem
            categoryId="coding"
            categoryName="コーディング運"
            advice={message}
            tone="positive"
          />
        );

        const item = container.firstChild as HTMLElement;
        expect(item.className).toContain('green');
      }
    );

    it.each(negativeMessages)(
      'should apply negative styling for negative message: %s',
      (message) => {
        const { container } = render(
          <CategoryAdviceItem
            categoryId="coding"
            categoryName="コーディング運"
            advice={message}
            tone="negative"
          />
        );

        const item = container.firstChild as HTMLElement;
        expect(item.className).toContain('orange');
      }
    );
  });
});
