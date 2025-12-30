'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SaisenEffectDisplayProps } from './types';
import { Saisen } from '../../../../domain/valueObjects/Saisen';
import { SaisenEffectCalculatorService } from '../../../../domain/services/SaisenEffectCalculatorService';
import { findSaisenById } from '../../utils/saisenConverter';

export const SaisenEffectDisplay: React.FC<SaisenEffectDisplayProps> = ({
  currentSaisen,
  remainingDraws,
  showAnimation = false,
  onReset
}) => {
  // お賽銭効果が適用されていない場合は何も表示しない
  if (!currentSaisen) {
    return null;
  }

  const getSaisenFromName = (name: string): Saisen | null => {
    const allSaisen = Saisen.getAllPredefinedSaisen();
    return allSaisen.find(saisen => saisen.getName() === name) || null;
  };

  const saisen = getSaisenFromName(currentSaisen);
  if (!saisen) {
    return null;
  }

  const getTitle = (): string => {
    if (saisen.isSpecial()) {
      return '特殊効果発動中';
    }
    if (saisen.hasEffect()) {
      return '運気上昇中';
    }
    return 'お賽銭投入済み';
  };

  const getEffectDescription = (): string => {
    return SaisenEffectCalculatorService.getEffectDescription(saisen);
  };

  const getStyleClasses = (): string => {
    const baseClasses = 'p-4 rounded-lg border-2';
    
    if (saisen.isSpecial()) {
      return `${baseClasses} bg-purple-50 border-purple-200`;
    }
    if (saisen === Saisen.FIVE_HUNDRED_YEN) {
      return `${baseClasses} bg-yellow-50 border-yellow-200`;
    }
    if (saisen.hasEffect()) {
      return `${baseClasses} bg-blue-50 border-blue-200`;
    }
    return `${baseClasses} bg-gray-50 border-gray-200`;
  };

  const getAnimationClasses = (): string => {
    return showAnimation ? 'animate-pulse' : '';
  };

  const buildAriaLabel = (): string => {
    let label = `${currentSaisen}のお賽銭効果が適用中。${getEffectDescription()}`;
    
    if (remainingDraws !== undefined && remainingDraws > 0) {
      label += `。あと${remainingDraws}回有効`;
    }
    
    return label;
  };

  return (
    <motion.section 
      role="region" 
      aria-label="現在のお賽銭効果"
      data-testid="saisen-effect-display"
      className={`${getStyleClasses()} ${getAnimationClasses()}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div aria-label={buildAriaLabel()} className="sr-only">
        {buildAriaLabel()}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-bold text-lg text-gray-800">
              {getTitle()}
            </h4>
            
            {saisen.isSpecial() && (
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
            )}
            
            {saisen.hasSpecialAnimation() && !saisen.isSpecial() && (
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping" />
            )}
          </div>
          
          <div className="text-sm text-gray-600 mb-1">
            <span className="font-medium">{currentSaisen}</span>
          </div>
          
          <div className="text-sm text-gray-700">
            {getEffectDescription()}
          </div>
          
          {remainingDraws !== undefined && remainingDraws > 0 && (
            <div className="text-xs text-blue-600 font-medium mt-2">
              あと{remainingDraws}回有効
            </div>
          )}
        </div>
        
        {onReset && (
          <button
            aria-label="効果をリセット"
            onClick={onReset}
            className={`
              ml-4 p-2 rounded-full text-gray-500 hover:text-gray-700 
              hover:bg-gray-100 transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
            `}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
      </div>
    </motion.section>
  );
};