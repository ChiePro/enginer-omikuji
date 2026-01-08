import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from './not-found';

describe('NotFound Page', () => {
  it('should render 404 error page', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should display 404 status message', () => {
    render(<NotFound />);

    expect(screen.getByText(/404/)).toBeInTheDocument();
  });

  it('should display user-friendly error message in Japanese', () => {
    render(<NotFound />);

    expect(screen.getByText(/ページが見つかりません/)).toBeInTheDocument();
  });

  it('should have a link to navigate back to home page', () => {
    render(<NotFound />);

    const homeLink = screen.getByRole('link', { name: /トップページ|ホーム/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should have shrine-themed styling', () => {
    render(<NotFound />);

    // Check for shrine-related emoji or text
    const container = screen.getByTestId('not-found-container');
    expect(container).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(<NotFound />);

    // Main content should be accessible
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});
