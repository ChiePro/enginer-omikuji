/**
 * お賽銭選択コンポーネント（統合用簡易版）
 */

'use client';

import React, { useState } from 'react';

const saisenOptions = [
  { amount: 5, label: '5円', effect: 'ご縁' },
  { amount: 50, label: '50円', effect: '小吉以上+5%' },
  { amount: 100, label: '100円', effect: 'レア以上+10%' },
  { amount: 500, label: '500円', effect: 'エピック以上+15%' }
];

const SaisenSelector: React.FC = () => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showEffect, setShowEffect] = useState(false);

  const handleSaisenSelect = (amount: number) => {
    setSelectedAmount(amount);
    setShowEffect(true);
    setTimeout(() => setShowEffect(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-md mx-auto">
      {/* お賽銭箱アイコン */}
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">📦</div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          お気持ちをお納めください
        </h3>
      </div>

      {/* 効果表示 */}
      {showEffect && selectedAmount && (
        <div className="text-center mb-4 p-2 bg-green-100 dark:bg-green-900 rounded-lg animate-pulse">
          <span className="text-green-700 dark:text-green-300 font-medium">
            運気上昇中... ✨
          </span>
        </div>
      )}

      {/* お賽銭ボタン */}
      <div className="grid grid-cols-2 gap-3">
        {saisenOptions.map((option) => (
          <button
            key={option.amount}
            onClick={() => handleSaisenSelect(option.amount)}
            className={`
              p-3 rounded-lg border-2 transition-all duration-200 text-center
              ${selectedAmount === option.amount
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 text-gray-700 dark:text-gray-300'
              }
              hover:scale-105 active:scale-95
            `}
            aria-label={`${option.label}のお賽銭を選択`}
          >
            <div className="font-bold text-lg">{option.label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {option.effect}
            </div>
          </button>
        ))}
      </div>

      {selectedAmount && (
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {selectedAmount}円のお賽銭で運気が向上しました！
        </div>
      )}
    </div>
  );
};

export default SaisenSelector;