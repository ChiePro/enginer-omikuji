'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SaisenSelectorProps, SaisenOptionData } from './types';
import { Saisen } from '../../../../domain/valueObjects/Saisen';
import { convertSaisenListToOptionData } from '../../utils/saisenConverter';

export const SaisenSelector: React.FC<SaisenSelectorProps> = ({
  onSelect,
  currentSelection,
  showEffectDescription = false
}) => {
  const saisenOptions = convertSaisenListToOptionData(Saisen.getAllSortedByAmount());

  const handleSelect = (saisenId: string) => {
    onSelect(saisenId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, saisenId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(saisenId);
    }
  };

  const buildAriaLabel = (option: SaisenOptionData): string => {
    let label = `${option.name}を選択`;
    
    if (showEffectDescription) {
      label += `: ${option.description}`;
    }
    
    return label;
  };

  const getOptionClasses = (option: SaisenOptionData): string => {
    const baseClasses = `
      relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300
      text-left bg-white border-gray-200 hover:border-gray-300 hover:shadow-md
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    `;
    
    const effectClasses = option.hasEffect ? 'has-effect' : 'no-effect';
    const specialClasses = option.isSpecial ? 'special-effect' : '';
    const animationClasses = option.hasSpecialAnimation ? 'special-animation' : '';
    const selectedClasses = currentSelection === option.id ? 'selected border-blue-500 bg-blue-50' : '';
    
    return `${baseClasses} ${effectClasses} ${specialClasses} ${animationClasses} ${selectedClasses}`.trim();
  };

  const renderAmountBadge = (option: SaisenOptionData) => {
    if (option.amount === 0) {
      return (
        <div className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
          特殊
        </div>
      );
    }
    
    return (
      <div className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
        {option.amount}円
      </div>
    );
  };

  const renderEffectIndicator = (option: SaisenOptionData) => {
    if (!option.hasEffect) {
      return null;
    }

    return (
      <div className="absolute top-2 right-2">
        {option.isSpecial ? (
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
        ) : (
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
        )}
      </div>
    );
  };

  return (
    <section 
      role="region" 
      aria-label="お賽銭の選択"
      className="py-6 px-4"
    >
      <h3 className="text-2xl font-bold text-center mb-6 text-slate-800">
        お賽銭を選ぶ
      </h3>
      
      <div 
        data-testid="saisen-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto"
      >
        {saisenOptions.map((option) => (
          <motion.button
            key={option.id}
            role="button"
            aria-label={buildAriaLabel(option)}
            tabIndex={0}
            className={getOptionClasses(option)}
            onClick={() => handleSelect(option.id)}
            onKeyDown={(e) => handleKeyDown(e, option.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: saisenOptions.indexOf(option) * 0.1,
              duration: 0.3 
            }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-bold text-lg mb-2 text-gray-800">
                  {option.name}
                </div>
                
                {showEffectDescription && (
                  <div className="text-sm text-gray-600 mb-3">
                    {option.description}
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  {renderAmountBadge(option)}
                  
                  {option.hasEffect && (
                    <div className="text-xs text-blue-600 font-medium">
                      効果あり
                    </div>
                  )}
                </div>
              </div>
              
              {renderEffectIndicator(option)}
            </div>
            
            {option.hasSpecialAnimation && (
              <div className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden">
                <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full opacity-60 animate-ping" />
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-yellow-300 rounded-full opacity-80 animate-pulse" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
      
      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">
          お賽銭の効果で運気をアップできます
        </p>
      </div>
    </section>
  );
};