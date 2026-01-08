'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OmikujiResult } from '@/domain/entities/OmikujiResult';
import { TraditionalLayoutEngine } from '../layout/TraditionalLayoutEngine';

interface OmikujiResultDisplayProps {
  result: OmikujiResult | null;
  onClose?: () => void;
  autoAnimate?: boolean;
  layoutEngine?: TraditionalLayoutEngine;
}

export function OmikujiResultDisplay({ 
  result, 
  onClose, 
  autoAnimate = true,
  layoutEngine: providedLayoutEngine
}: OmikujiResultDisplayProps) {
  const [animationState, setAnimationState] = useState<'hidden' | 'revealing' | 'displayed'>(
    autoAnimate ? 'revealing' : 'displayed'
  );
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const layoutEngine = providedLayoutEngine || new TraditionalLayoutEngine();

  // エラーハンドリング
  if (!result) {
    return (
      <div role="alert" className="p-4 text-center">
        おみくじ結果の表示でエラーが発生しました
      </div>
    );
  }

  // レスポンシブ対応
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // アニメーション制御
  useEffect(() => {
    if (autoAnimate && animationState === 'revealing') {
      const timer = setTimeout(() => {
        setAnimationState('displayed');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoAnimate, animationState]);

  // キーボード操作
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      } else if (event.key === 'Enter') {
        setIsDetailsExpanded(!isDetailsExpanded);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isDetailsExpanded]);

  // レイアウト情報の生成
  const fortune = result.getFortune();
  const fortuneValue = fortune.getValue();
  const layout = layoutEngine.generateCompleteLayout(
    fortuneValue, 
    fortune.getJapaneseName() // Use fortune name as title for now
  );

  // Fallback implementations for missing fields
  const titlePhrase = fortune.getJapaneseName();
  const description = fortune.getDescription();
  const categories: { name: string; content: string }[] = []; // Empty array for now

  // スクリーンリーダー用テキスト
  const screenReaderText = `おみくじ結果: ${fortune.getJapaneseName()}。${description}`;

  return (
    <AnimatePresence>
      <motion.article
        ref={containerRef}
        role="article"
        aria-label={`おみくじ結果: ${fortune.getJapaneseName()}`}
        tabIndex={0}
        className={`omikuji-result-container ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}
        data-testid="responsive-container"
        style={{
          color: layout.decoration.primaryColor,
          backgroundColor: layout.decoration.backgroundColor,
          borderColor: layout.decoration.borderColor
        }}
        initial={autoAnimate ? { opacity: 0, scale: 0.8 } : false}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5 }}
      >
        {/* アニメーション制御コンテナ */}
        <div 
          data-testid="omikuji-animation-container"
          data-animation-state={animationState}
          className="animation-container"
        >
          {/* 縦書きテキストコンテナ */}
          <div
            data-testid="vertical-text-container"
            style={{
              writingMode: layout.styles.writingMode as React.CSSProperties['writingMode'],
              textOrientation: layout.styles.textOrientation as React.CSSProperties['textOrientation'],
              direction: layout.styles.direction as React.CSSProperties['direction']
            }}
            className="vertical-text-content"
          >
            {/* 運勢表示 */}
            <motion.h1 
              className="fortune-title"
              initial={autoAnimate ? { x: 50, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {fortune.getJapaneseName()}
            </motion.h1>

            {/* タイトルフレーズ */}
            <motion.h2 
              className="title-phrase"
              initial={autoAnimate ? { x: 50, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              {titlePhrase}
            </motion.h2>

            {/* 説明 */}
            <motion.p 
              className="description"
              initial={autoAnimate ? { x: 50, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              {description}
            </motion.p>
          </div>

          {/* 特別エフェクト */}
          {layout.decoration.hasSpecialEffect && (
            <div 
              data-testid="special-effect"
              data-effect-type="high-fortune"
              className="special-effect"
            >
              ✨
            </div>
          )}

          {/* 詳細表示切り替えボタン */}
          <button
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            aria-expanded={isDetailsExpanded}
            className="details-toggle-button"
          >
            {isDetailsExpanded ? '詳細を非表示' : '詳細を表示'}
          </button>

          {/* 運勢カテゴリ詳細 */}
          <AnimatePresence>
            {isDetailsExpanded && (
              <motion.div
                data-testid="fortune-details"
                data-expanded="true"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="fortune-categories"
              >
                {categories.map((category, index) => (
                  <motion.div
                    key={category.name}
                    initial={autoAnimate ? { y: 20, opacity: 0 } : false}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="category-item"
                  >
                    <h3>{category.name}</h3>
                    <p>{category.content}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* クローズボタン */}
          {onClose && (
            <button
              onClick={onClose}
              className="close-button"
              aria-label="閉じる"
            >
              ×
            </button>
          )}

          {/* スクリーンリーダー用テキスト */}
          <div 
            className="sr-only"
            aria-label="スクリーンリーダー用おみくじ結果"
          >
            {screenReaderText}
          </div>

          {/* ブラウザ互換性警告 */}
          {!layout.isVerticalSupported && layout.fallbackMessage && (
            <div className="compatibility-warning">
              {layout.fallbackMessage}
            </div>
          )}
        </div>
      </motion.article>
    </AnimatePresence>
  );
}