/**
 * レアリティプレビューコンポーネント（統合用簡易版）
 */

import React from 'react';

interface RarityTier {
  rarity: string;
  label: string;
  probability: number;
  color: string;
  effects?: {
    glow?: boolean;
    sparkle?: boolean;
    animation?: string;
  };
}

interface RarityPreviewProps {
  'data-testid'?: string;
  tiers: RarityTier[];
  showProbabilities?: boolean;
  animateOnScroll?: boolean;
}

const RarityPreview: React.FC<RarityPreviewProps> = ({
  'data-testid': testId,
  tiers,
  showProbabilities = false,
  animateOnScroll = false
}) => {
  return (
    <div data-testid={testId} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiers.map((tier) => (
          <div
            key={tier.rarity}
            className={`
              p-3 rounded-lg text-center transition-all duration-300
              rarity-${tier.rarity}
              ${tier.effects?.glow ? 'animate-glow' : ''}
              ${tier.effects?.sparkle ? 'animate-sparkle' : ''}
              ${animateOnScroll ? 'transform hover:scale-105' : ''}
            `}
            style={{ backgroundColor: tier.color + '20', borderColor: tier.color }}
          >
            <div className="font-bold text-sm" style={{ color: tier.color }}>
              {tier.label}
            </div>
            {showProbabilities && (
              <div className="text-xs text-gray-600 mt-1">
                {Math.round(tier.probability * 100)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RarityPreview;