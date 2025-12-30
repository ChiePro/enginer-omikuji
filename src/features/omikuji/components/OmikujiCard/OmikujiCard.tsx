'use client';

import React from 'react';
import { OmikujiCardProps } from './types';
import { motion } from 'framer-motion';
import { CTAButton } from './CTAButton';
import { useOmikujiSelection } from '../../hooks/useOmikujiSelection';
import { OmikujiLoadingIndicator } from '../OmikujiLoadingIndicator/OmikujiLoadingIndicator';

export const OmikujiCard: React.FC<OmikujiCardProps> = ({
  omikujiType,
  onSelect,
  isDisabled = false,
  useNavigation = false
}) => {
  const { selectOmikuji, isTransitioning } = useOmikujiSelection();
  // useNavigation が false の場合は遷移状態を無視
  const actuallyTransitioning = useNavigation ? isTransitioning : false;
  const isCardDisabled = isDisabled || actuallyTransitioning;

  const handleClick = async () => {
    if (isCardDisabled) return;

    if (useNavigation) {
      // ナビゲーションフックを使用
      await selectOmikuji(omikujiType.id);
    } else if (onSelect) {
      // 従来通りコールバックを使用
      onSelect(omikujiType.id);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (isCardDisabled) return;
    
    if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      
      if (useNavigation) {
        await selectOmikuji(omikujiType.id);
      } else if (onSelect) {
        onSelect(omikujiType.id);
      }
    }
  };

  // 遷移中は専用の表示を行う
  if (actuallyTransitioning && useNavigation) {
    return (
      <motion.div
        className={`
          relative w-full p-6 rounded-lg border-2 border-opacity-20
          bg-[${omikujiType.color.primary}] border-[${omikujiType.color.secondary}]
          text-white font-medium text-left
        `}
        initial={{ scale: 1 }}
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [1, 0.8, 0.6],
          transition: { 
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse"
          }
        }}
      >
        <div className="flex items-center justify-center min-h-[120px]">
          <OmikujiLoadingIndicator 
            message="おみくじページに移動中..." 
            size="medium"
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      role="button"
      aria-label={`${omikujiType.name}を選択`}
      aria-disabled={isCardDisabled}
      tabIndex={isCardDisabled ? -1 : 0}
      className={`
        relative w-full p-6 rounded-lg border-2 border-opacity-20
        bg-[${omikujiType.color.primary}] border-[${omikujiType.color.secondary}]
        text-white font-medium text-left transition-all
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${omikujiType.color.secondary}]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${!isCardDisabled ? 'hover:scale-105 hover:shadow-lg cursor-pointer' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isCardDisabled}
      initial={{ scale: 1, y: 0 }}
      whileHover={!isCardDisabled ? { 
        scale: 1.05, 
        y: -8,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20
        }
      } : {}}
      whileTap={!isCardDisabled ? { scale: 0.98 } : {}}
    >
      <div className="flex items-start space-x-4">
        <div className="text-3xl">{omikujiType.icon}</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{omikujiType.name}</h3>
          <p className="text-white text-opacity-90 text-sm mb-4">
            {omikujiType.description}
          </p>
          <CTAButton
            isDisabled={isCardDisabled}
            variant="primary"
          >
            {actuallyTransitioning ? '移動中...' : 'このおみくじを引く'}
          </CTAButton>
        </div>
      </div>
    </motion.button>
  );
};