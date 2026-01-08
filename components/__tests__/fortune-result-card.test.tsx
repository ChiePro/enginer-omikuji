/**
 * FortuneResultCardコンポーネントのテスト
 *
 * Props受け渡し、カラーマッピング、アニメーション、タイムスタンプ表示、
 * アクセシビリティをテストします。
 * TDD原則に従い、実装前にテストを作成します（RED phase）。
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FortuneResultCard } from '../fortune-result-card';
import { FortuneLevel } from '@/lib/fortune-data';

describe('FortuneResultCard', () => {
  const mockFortuneLevel: FortuneLevel = {
    id: 'daikichi',
    name: '大吉',
    weight: 16,
    rank: 1,
  };

  const defaultProps = {
    level: mockFortuneLevel,
    message: 'テストメッセージ: 今日は最高の1日です！',
    omikujiName: '今日の運勢',
    drawnAt: '2025-12-31T12:34:56.789Z',
  };

  describe('Props rendering', () => {
    it('should render level name correctly', () => {
      render(<FortuneResultCard {...defaultProps} />);
      expect(screen.getByText('大吉')).toBeInTheDocument();
    });

    it('should render message correctly', () => {
      render(<FortuneResultCard {...defaultProps} />);
      expect(screen.getByText(/今日は最高の1日です/)).toBeInTheDocument();
    });

    it('should render omikujiName correctly', () => {
      render(<FortuneResultCard {...defaultProps} />);
      expect(screen.getByText('今日の運勢')).toBeInTheDocument();
    });

    it('should render all props together', () => {
      render(<FortuneResultCard {...defaultProps} />);
      expect(screen.getByText('大吉')).toBeInTheDocument();
      expect(screen.getByText(/今日は最高の1日です/)).toBeInTheDocument();
      expect(screen.getByText('今日の運勢')).toBeInTheDocument();
    });
  });

  describe('Fortune level color mapping', () => {
    const allFortuneLevels: FortuneLevel[] = [
      { id: 'daikichi', name: '大吉', weight: 16, rank: 1 },
      { id: 'kichi', name: '吉', weight: 23, rank: 2 },
      { id: 'chukichi', name: '中吉', weight: 34, rank: 3 },
      { id: 'shokichi', name: '小吉', weight: 12, rank: 4 },
      { id: 'suekichi', name: '末吉', weight: 8, rank: 5 },
      { id: 'kyo', name: '凶', weight: 5, rank: 6 },
      { id: 'daikyo', name: '大凶', weight: 2, rank: 7 },
    ];

    it.each(allFortuneLevels)(
      'should render $name with appropriate color mapping',
      (level) => {
        const { container } = render(
          <FortuneResultCard {...defaultProps} level={level} />
        );
        expect(container.firstChild).toBeInTheDocument();
        // カラーマッピングが適用されることを確認（詳細なクラステストは後で）
      }
    );

    it('should render daikichi with yellow gradient', () => {
      const { container } = render(<FortuneResultCard {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('from-yellow');
    });

    it('should render kichi with green gradient', () => {
      const kichiLevel: FortuneLevel = {
        id: 'kichi',
        name: '吉',
        weight: 23,
        rank: 2,
      };
      const { container } = render(
        <FortuneResultCard {...defaultProps} level={kichiLevel} />
      );
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('from-green');
    });

    it('should render appropriate icon for each fortune level', () => {
      const { rerender } = render(<FortuneResultCard {...defaultProps} />);
      expect(screen.getByText('🌟')).toBeInTheDocument(); // daikichi

      const kichiLevel: FortuneLevel = {
        id: 'kichi',
        name: '吉',
        weight: 23,
        rank: 2,
      };
      rerender(<FortuneResultCard {...defaultProps} level={kichiLevel} />);
      expect(screen.getByText('✨')).toBeInTheDocument(); // kichi
    });
  });

  describe('Timestamp formatting', () => {
    it('should format ISO 8601 timestamp to human-readable Japanese format', () => {
      render(<FortuneResultCard {...defaultProps} />);
      // ISO 8601: 2025-12-31T12:34:56.789Z
      // Expected: 2025年12月31日 21:34 (JST, UTC+9)
      expect(screen.getByText(/2025年12月31日/)).toBeInTheDocument();
    });

    it('should handle different timestamp formats', () => {
      const props = {
        ...defaultProps,
        drawnAt: '2026-01-01T00:00:00.000Z',
      };
      render(<FortuneResultCard {...props} />);
      expect(screen.getByText(/2026年1月1日/)).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should apply animation classes when enableAnimation is true', () => {
      const { container } = render(
        <FortuneResultCard {...defaultProps} enableAnimation={true} />
      );
      const card = container.firstChild as HTMLElement;
      // アニメーションクラスが含まれることを確認
      expect(card.className).toMatch(/transition|animate|duration/);
    });

    it('should apply animation classes by default (enableAnimation not specified)', () => {
      const { container } = render(<FortuneResultCard {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toMatch(/transition|animate|duration/);
    });

    it('should not apply animation classes when enableAnimation is false', () => {
      const { container } = render(
        <FortuneResultCard {...defaultProps} enableAnimation={false} />
      );
      const card = container.firstChild as HTMLElement;
      // アニメーションクラスが含まれないことを確認
      expect(card.className).not.toMatch(/transition|animate|duration/);
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria-label', () => {
      const { container } = render(<FortuneResultCard {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('aria-label');
      expect(card.getAttribute('aria-label')).toContain('大吉');
    });

    it('should use semantic HTML (article tag)', () => {
      const { container } = render(<FortuneResultCard {...defaultProps} />);
      expect(container.querySelector('article')).toBeInTheDocument();
    });

    it('should have role attribute for screen readers', () => {
      const { container } = render(<FortuneResultCard {...defaultProps} />);
      const article = container.querySelector('article');
      expect(article).toHaveAttribute('role', 'article');
    });

    it('should provide accessible time element', () => {
      render(<FortuneResultCard {...defaultProps} />);
      const timeElement = screen.getByText(/2025年12月31日/).closest('time');
      expect(timeElement).toBeInTheDocument();
      expect(timeElement).toHaveAttribute('dateTime', defaultProps.drawnAt);
    });
  });

  describe('Responsive design', () => {
    it('should have responsive padding classes', () => {
      const { container } = render(<FortuneResultCard {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toMatch(/p-\d+|px-\d+|py-\d+/);
    });

    it('should have responsive text size classes', () => {
      const { container } = render(<FortuneResultCard {...defaultProps} />);
      expect(container.innerHTML).toMatch(/text-(sm|base|lg|xl|2xl|3xl)/);
    });
  });

  describe('Reduced motion support', () => {
    it('should include motion-reduce prefix for animation classes', () => {
      const { container } = render(
        <FortuneResultCard {...defaultProps} enableAnimation={true} />
      );
      const card = container.firstChild as HTMLElement;
      // motion-reduce:プレフィックスが含まれることを確認
      expect(card.className).toContain('motion-reduce:');
    });
  });
});
