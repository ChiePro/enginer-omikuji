'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RarityPreviewProps, RarityTierData } from './types';

export const RarityPreview: React.FC<RarityPreviewProps> = ({ 
  tiers, 
  showProbabilities = false,
  animateOnScroll = false 
}) => {
  const formatProbabilityText = (probability: number): string => {
    return `${Math.round(probability * 100)}%`;
  };

  const buildAriaLabel = (tier: RarityTierData): string => {
    let label = tier.label;
    
    if (showProbabilities) {
      label += `: 確率${formatProbabilityText(tier.probability)}`;
    }
    
    if (tier.effects && (tier.effects.glow || tier.effects.sparkle)) {
      label += '、特別エフェクト付き';
    }
    
    return label;
  };

  const getEffectClasses = (tier: RarityTierData): string => {
    const classes: string[] = [];
    
    if (tier.effects?.glow) {
      classes.push('rarity-glow');
    }
    
    if (tier.effects?.sparkle) {
      classes.push('rarity-sparkle');
    }
    
    if (tier.effects?.animation) {
      classes.push(`rarity-${tier.effects.animation}`);
    }
    
    return classes.join(' ');
  };

  return (
    <section 
      role="region" 
      aria-label="レアリティシステムの概要"
      className="py-6 px-4"
    >
      <h3 className="text-2xl font-bold text-center mb-6 text-slate-800">
        レアリティ階層
      </h3>
      
      <div 
        data-testid="rarity-grid"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
      >
        {tiers.map((tier) => (
          <motion.div
            key={tier.rarity}
            data-rarity={tier.rarity}
            aria-label={buildAriaLabel(tier)}
            className={`
              relative p-4 rounded-lg text-center border-2 border-opacity-30
              text-white font-medium transition-all duration-300
              ${getEffectClasses(tier)}
            `}
            style={{ 
              backgroundColor: tier.color,
              borderColor: tier.color
            }}
            initial={animateOnScroll ? { opacity: 0, y: 20 } : {}}
            animate={animateOnScroll ? { opacity: 1, y: 0 } : {}}
            transition={{ 
              delay: tiers.indexOf(tier) * 0.1,
              duration: 0.5 
            }}
          >
            <div className="text-lg font-bold mb-2">
              {tier.label}
            </div>
            
            {showProbabilities && (
              <div className="text-sm opacity-90">
                {formatProbabilityText(tier.probability)}
              </div>
            )}
            
            {tier.effects && (tier.effects.glow || tier.effects.sparkle) && (
              <div className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden">
                {tier.effects.sparkle && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse" />
                )}
                {tier.effects.sparkle && (
                  <div className="absolute bottom-2 left-2 w-1 h-1 bg-white rounded-full opacity-80 animate-ping" />
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      <div className="text-center mt-6">
        <p className="text-lg font-medium text-amber-600 animate-pulse">
          レジェンダリーが出るかも？
        </p>
      </div>
    </section>
  );
};