import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OmikujiResultDisplay } from './OmikujiResultDisplay';
import { OmikujiResult } from '@/domain/entities/OmikujiResult';

const mockOmikujiResult = {
  getId: () => 'test-result-001',
  getOmikujiType: () => ({
    id: { getValue: () => 'engineer-fortune' },
    name: 'エンジニア運勢',
    description: 'プログラマーのためのおみくじ',
    icon: '💻',
    color: {
      getPrimary: () => '#FFD700',
      getSecondary: () => '#FFF8DC'
    }
  }),
  getFortune: () => ({
    getId: () => 'daikichi',
    getJapaneseName: () => '大吉',
    getEnglishName: () => 'Great Fortune',
    getDescription: () => '最高の運勢',
    getValue: () => 4,
    getProbability: () => 0.03
  }),
  getTitlePhrase: () => ({
    getValue: () => '今日は神コードが降臨する日！'
  }),
  getDescription: () => ({
    getValue: () => 'バグゼロでリリース成功、技術選定も完璧、同僚からの評価もMAXの一日になるでしょう。'
  }),
  getEmotionAttribute: () => 'positive',
  getCategories: () => ({
    getAll: () => [
      { name: '恋愛運', content: 'ペアプロで距離が縮まる', emotionTone: 'positive' },
      { name: '仕事運', content: 'コードレビューが一発承認', emotionTone: 'positive' },
      { name: '健康運', content: '良い椅子との出会いがある', emotionTone: 'positive' },
      { name: '金運', content: 'ストックオプション上昇', emotionTone: 'positive' },
      { name: '学業運', content: '新フレームワーク習得成功', emotionTone: 'positive' }
    ]
  }),
  getCreatedAt: () => new Date('2025-01-04T12:00:00Z')
} as OmikujiResult;

describe('OmikujiResultDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示', () => {
    it('おみくじ結果が正しく表示される', () => {
      // Given
      render(<OmikujiResultDisplay result={mockOmikujiResult} />);

      // Then
      expect(screen.getByText('今日は神コードが降臨する日！')).toBeInTheDocument();
      expect(screen.getByText('大吉')).toBeInTheDocument();
      expect(screen.getByRole('article')).toHaveTextContent('バグゼロでリリース成功');
    });

    it('運勢カテゴリがすべて表示される', () => {
      // Given
      render(<OmikujiResultDisplay result={mockOmikujiResult} />);
      
      // When - 詳細を展開
      const toggleButton = screen.getByRole('button', { name: /詳細を表示/ });
      fireEvent.click(toggleButton);

      // Then
      expect(screen.getByText('恋愛運')).toBeInTheDocument();
      expect(screen.getByText('仕事運')).toBeInTheDocument();
      expect(screen.getByText('健康運')).toBeInTheDocument();
      expect(screen.getByText('金運')).toBeInTheDocument();
      expect(screen.getByText('学業運')).toBeInTheDocument();
      expect(screen.getByText('ペアプロで距離が縮まる')).toBeInTheDocument();
    });

    it('運勢レベルに応じた色彩スタイルが適用される', () => {
      // Given
      render(<OmikujiResultDisplay result={mockOmikujiResult} />);

      // Then
      const container = screen.getByRole('article');
      expect(container).toHaveStyle({
        color: '#FFD700'
      });
    });
  });

  describe('縦書きレイアウト', () => {
    it('縦書きスタイルが適用される', () => {
      // Given
      render(<OmikujiResultDisplay result={mockOmikujiResult} />);

      // Then
      const textContainer = screen.getByTestId('vertical-text-container');
      expect(textContainer).toHaveStyle({
        writingMode: 'vertical-rl',
        textOrientation: 'upright'
      });
    });

    it('ブラウザが縦書き未対応時にフォールバックが適用される', () => {
      // Given
      const mockLayoutEngine = {
        checkWritingModeSupport: vi.fn().mockReturnValue(false),
        generateCompleteLayout: vi.fn().mockReturnValue({
          styles: { writingMode: 'horizontal-tb' },
          decoration: { primaryColor: '#FFD700' },
          isVerticalSupported: false,
          fallbackMessage: 'このブラウザでは縦書きレイアウトが利用できません。'
        })
      };

      render(
        <OmikujiResultDisplay 
          result={mockOmikujiResult} 
          layoutEngine={mockLayoutEngine}
        />
      );

      // Then
      expect(screen.getByText(/このブラウザでは縦書きレイアウトが利用できません/)).toBeInTheDocument();
    });
  });

  describe('アニメーション演出', () => {
    it('初期表示時におみくじ開封アニメーションが実行される', async () => {
      // Given
      render(<OmikujiResultDisplay result={mockOmikujiResult} autoAnimate={true} />);

      // Then
      const animatedElement = screen.getByTestId('omikuji-animation-container');
      expect(animatedElement).toHaveAttribute('data-animation-state', 'revealing');

      // アニメーション完了を待つ
      await waitFor(() => {
        expect(animatedElement).toHaveAttribute('data-animation-state', 'displayed');
      }, { timeout: 3000 });
    });

    it('autoAnimate=falseの場合はアニメーションが実行されない', () => {
      // Given
      render(<OmikujiResultDisplay result={mockOmikujiResult} autoAnimate={false} />);

      // Then
      const animatedElement = screen.getByTestId('omikuji-animation-container');
      expect(animatedElement).toHaveAttribute('data-animation-state', 'displayed');
    });

    it('運勢レベルに応じた特別エフェクトが表示される', () => {
      // Given - 大吉の場合
      render(<OmikujiResultDisplay result={mockOmikujiResult} />);

      // Then
      const specialEffect = screen.getByTestId('special-effect');
      expect(specialEffect).toBeInTheDocument();
      expect(specialEffect).toHaveAttribute('data-effect-type', 'high-fortune');
    });
  });

  describe('レスポンシブ対応', () => {
    it('モバイルビューで適切なレイアウトが適用される', () => {
      // Given
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { 
        writable: true, 
        configurable: true, 
        value: 375 
      });
      window.dispatchEvent(new Event('resize'));

      render(<OmikujiResultDisplay result={mockOmikujiResult} />);

      // Then
      const mobileContainer = screen.getByTestId('responsive-container');
      expect(mobileContainer).toHaveClass('mobile-layout');
    });

    it('デスクトップビューで適切なレイアウトが適用される', () => {
      // Given
      Object.defineProperty(window, 'innerWidth', { 
        writable: true, 
        configurable: true, 
        value: 1024 
      });
      window.dispatchEvent(new Event('resize'));

      render(<OmikujiResultDisplay result={mockOmikujiResult} />);

      // Then
      const desktopContainer = screen.getByTestId('responsive-container');
      expect(desktopContainer).toHaveClass('desktop-layout');
    });
  });

  describe('アクセシビリティ対応', () => {
    it('適切なARIA属性が設定される', () => {
      // Given
      render(<OmikujiResultDisplay result={mockOmikujiResult} />);

      // Then
      const container = screen.getByRole('article');
      expect(container).toHaveAttribute('aria-label', 'おみくじ結果: 大吉');
      expect(container).toHaveAttribute('tabindex', '0');
    });

    it('スクリーンリーダー用のテキストが提供される', () => {
      // Given
      render(<OmikujiResultDisplay result={mockOmikujiResult} />);

      // Then
      const screenReaderText = screen.getByLabelText(/スクリーンリーダー用おみくじ結果/);
      expect(screenReaderText).toBeInTheDocument();
      expect(screenReaderText).toHaveTextContent(/大吉.*今日は神コードが降臨する日/);
    });

    it('キーボード操作でクローズできる', () => {
      // Given
      const onCloseMock = vi.fn();
      render(<OmikujiResultDisplay result={mockOmikujiResult} onClose={onCloseMock} />);

      // When
      const container = screen.getByRole('article');
      fireEvent.keyDown(container, { key: 'Escape' });

      // Then
      expect(onCloseMock).toHaveBeenCalledOnce();
    });

    it('Enterキーで詳細表示を切り替えできる', () => {
      // Given
      render(<OmikujiResultDisplay result={mockOmikujiResult} />);
      const container = screen.getByRole('article');

      // When
      fireEvent.keyDown(container, { key: 'Enter' });

      // Then
      const detailsContainer = screen.getByTestId('fortune-details');
      expect(detailsContainer).toHaveAttribute('data-expanded', 'true');
    });
  });

  describe('インタラクション', () => {
    it('クローズボタンクリックで適切なコールバックが呼ばれる', () => {
      // Given
      const onCloseMock = vi.fn();
      render(<OmikujiResultDisplay result={mockOmikujiResult} onClose={onCloseMock} />);

      // When
      const closeButton = screen.getByRole('button', { name: /閉じる/ });
      fireEvent.click(closeButton);

      // Then
      expect(onCloseMock).toHaveBeenCalledOnce();
    });

    it('結果をクリックで詳細の展開・折りたたみができる', () => {
      // Given
      render(<OmikujiResultDisplay result={mockOmikujiResult} />);

      // When
      const toggleButton = screen.getByRole('button', { name: /詳細を表示/ });
      fireEvent.click(toggleButton);

      // Then
      const detailsContainer = screen.getByTestId('fortune-details');
      expect(detailsContainer).toHaveAttribute('data-expanded', 'true');
      expect(screen.getByRole('button', { name: /詳細を非表示/ })).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('不正な結果データの場合はエラー表示する', () => {
      // Given
      const invalidResult = null as any;

      render(<OmikujiResultDisplay result={invalidResult} />);

      // Then
      expect(screen.getByText('おみくじ結果の表示でエラーが発生しました')).toBeInTheDocument();
    });

    it('アニメーションエラー時も基本表示は維持される', () => {
      // Given
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // When
      render(<OmikujiResultDisplay result={mockOmikujiResult} autoAnimate={true} />);

      // Then - エラーが発生しても基本コンテンツは表示される
      expect(screen.getByText('今日は神コードが降臨する日！')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });
  });
});