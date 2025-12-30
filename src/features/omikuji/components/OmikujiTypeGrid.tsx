/**
 * おみくじタイプグリッドコンポーネント（統合用簡易版）
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OmikujiType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  route: string;
}

interface OmikujiTypeGridProps {
  'data-testid'?: string;
  className?: string;
  omikujiTypes: OmikujiType[];
}

const OmikujiTypeGrid: React.FC<OmikujiTypeGridProps> = ({
  'data-testid': testId,
  className,
  omikujiTypes
}) => {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);

  const handleCardSelect = async (omikujiType: OmikujiType) => {
    setIsTransitioning(true);
    setLoadingCardId(omikujiType.id);

    // アニメーション時間を考慮して遷移
    setTimeout(() => {
      router.push(omikujiType.route);
    }, 1000);
  };

  if (isTransitioning) {
    return (
      <div className="flex justify-center items-center py-20">
        <div role="status" aria-label="おみくじを準備中">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
          <div className="text-center mt-4 text-gray-600 dark:text-gray-400">
            おみくじを準備中...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid={testId} className={className}>
      {omikujiTypes.map((omikujiType) => (
        <div
          key={omikujiType.id}
          data-testid={`omikuji-card-${omikujiType.id}`}
          className="omikuji-card group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700"
          style={{
            borderTopColor: omikujiType.color.primary + '40',
            borderWidth: '3px',
          }}
        >
          {/* アイコンと名前 */}
          <div className="text-center mb-4">
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
              {omikujiType.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {omikujiType.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {omikujiType.description}
            </p>
          </div>

          {/* グラデーション装飾 */}
          <div
            className="h-1 rounded-full mb-4"
            style={{
              background: `linear-gradient(90deg, ${omikujiType.color.primary}, ${omikujiType.color.secondary})`
            }}
          />

          {/* CTAボタン */}
          <button
            onClick={() => handleCardSelect(omikujiType)}
            disabled={loadingCardId === omikujiType.id}
            className={`
              w-full py-3 px-4 rounded-lg font-medium transition-all duration-300
              ${loadingCardId === omikujiType.id
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'text-white hover:scale-105 active:scale-95 hover:shadow-lg'
              }
            `}
            style={{
              backgroundColor: loadingCardId === omikujiType.id 
                ? '#d1d5db' 
                : omikujiType.color.primary,
              boxShadow: loadingCardId !== omikujiType.id 
                ? `0 4px 12px ${omikujiType.color.primary}40` 
                : 'none'
            }}
            aria-label={`${omikujiType.name}を選択`}
          >
            {loadingCardId === omikujiType.id ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
                準備中...
              </div>
            ) : (
              'このおみくじを引く'
            )}
          </button>
        </div>
      ))}
    </div>
  );
};

export default OmikujiTypeGrid;