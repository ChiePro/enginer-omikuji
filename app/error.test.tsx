import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Error from './error';

describe('Error Page', () => {
  const mockError = new Error('テストエラーメッセージ');
  const mockReset = vi.fn();

  beforeEach(() => {
    mockReset.mockClear();
  });

  it('should render error page', () => {
    render(<Error error={mockError} reset={mockReset} />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should display error message in Japanese', () => {
    render(<Error error={mockError} reset={mockReset} />);

    expect(screen.getByRole('heading', { level: 1, name: /エラーが発生しました/ })).toBeInTheDocument();
  });

  it('should have a retry button', () => {
    render(<Error error={mockError} reset={mockReset} />);

    const retryButton = screen.getByRole('button', { name: /やり直す|リトライ|再試行/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('should call reset function when retry button is clicked', () => {
    render(<Error error={mockError} reset={mockReset} />);

    const retryButton = screen.getByRole('button', { name: /やり直す|リトライ|再試行/i });
    fireEvent.click(retryButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('should have shrine-themed styling', () => {
    render(<Error error={mockError} reset={mockReset} />);

    const container = screen.getByTestId('error-container');
    expect(container).toBeInTheDocument();
  });

  it('should have a link to home page as fallback', () => {
    render(<Error error={mockError} reset={mockReset} />);

    const homeLink = screen.getByRole('link', { name: /トップページ|ホーム/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
