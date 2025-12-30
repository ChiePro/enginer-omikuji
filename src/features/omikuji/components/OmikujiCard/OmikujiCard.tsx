'use client';

import React from 'react';
import { OmikujiCardProps } from './types';
import { motion } from 'framer-motion';

export const OmikujiCard: React.FC<OmikujiCardProps> = ({
  omikujiType,
  onSelect,
  isDisabled = false
}) => {
  const handleClick = () => {
    if (!isDisabled) {
      onSelect(omikujiType.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDisabled && (e.key === 'Enter' || e.key === ' ' || e.code === 'Space')) {
      e.preventDefault();
      onSelect(omikujiType.id);
    }
  };

  return (
    <motion.button
      role="button"
      aria-label={`${omikujiType.name}を選択`}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      className={`
        relative w-full p-6 rounded-lg border-2 border-opacity-20
        bg-[${omikujiType.color.primary}] border-[${omikujiType.color.secondary}]
        text-white font-medium text-left transition-all
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${omikujiType.color.secondary}]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${!isDisabled ? 'hover:scale-105 hover:shadow-lg cursor-pointer' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      initial={{ scale: 1, y: 0 }}
      whileHover={!isDisabled ? { 
        scale: 1.05, 
        y: -8,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20
        }
      } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
    >
      <div className="flex items-start space-x-4">
        <div className="text-3xl">{omikujiType.icon}</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{omikujiType.name}</h3>
          <p className="text-white text-opacity-90 text-sm mb-4">
            {omikujiType.description}
          </p>
          <div className={`
            inline-block px-4 py-2 bg-white bg-opacity-20 rounded-md
            text-sm font-medium border border-white border-opacity-30
          `}>
            このおみくじを引く
          </div>
        </div>
      </div>
    </motion.button>
  );
};