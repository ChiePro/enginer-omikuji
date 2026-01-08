import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalError from './global-error';

describe('GlobalError Page', () => {
  const mockError = new Error('グローバルエラーメッセージ');
  const mockReset = vi.fn();

  beforeEach(() => {
    mockReset.mockClear();
  });

  it('should render global error page with html and body tags', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should display error message in Japanese', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    expect(screen.getByRole('heading', { level: 1, name: /エラー|問題/i })).toBeInTheDocument();
  });

  it('should have a retry button', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    const retryButton = screen.getByRole('button', { name: /やり直す|リトライ|再試行/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('should call reset function when retry button is clicked', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    const retryButton = screen.getByRole('button', { name: /やり直す|リトライ|再試行/i });
    fireEvent.click(retryButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('should have minimal styling for fallback page', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    const container = screen.getByTestId('global-error-container');
    expect(container).toBeInTheDocument();
  });
});
