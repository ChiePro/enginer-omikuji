/**
 * ResetButtonコンポーネントのテスト
 *
 * クリック動作、disabled状態、アクセシビリティをテストします。
 * TDD原則に従い、実装前にテストを作成します（RED phase）。
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResetButton } from '../reset-button';

describe('ResetButton', () => {
  describe('Rendering', () => {
    it('should render button with correct text', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} />);

      expect(screen.getByText('もう一度引く')).toBeInTheDocument();
    });

    it('should render button element', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Click behavior', () => {
    it('should call onClick handler when clicked', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick handler multiple times on multiple clicks', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });

    it('should not call onClick when disabled', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} disabled={true} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled state', () => {
    it('should not be disabled by default', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not be disabled when disabled prop is false', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} disabled={false} />);

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should have disabled styling when disabled', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:opacity-50');
      expect(button.className).toContain('disabled:cursor-not-allowed');
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria-label', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'もう一度引く');
    });

    it('should be keyboard accessible', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} />);

      const button = screen.getByRole('button');

      // Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      // Space key
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });

      // Note: fireEvent.keyDown doesn't trigger click by default in jsdom
      // Actual keyboard accessibility is provided by native button element
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have focus styles', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('focus:outline-none');
      expect(button.className).toContain('focus:ring-2');
      expect(button.className).toContain('focus:ring-indigo-500');
    });
  });

  describe('Styling', () => {
    it('should have transition classes', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('transition-colors');
      expect(button.className).toContain('duration-200');
    });

    it('should have hover styles', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:bg-indigo-50');
    });

    it('should have proper color scheme', () => {
      const mockOnClick = jest.fn();
      render(<ResetButton onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/border-indigo/);
      expect(button.className).toMatch(/text-indigo/);
    });
  });
});
