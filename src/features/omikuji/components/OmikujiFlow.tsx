'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OmikujiCard } from './OmikujiCard/OmikujiCard';
import { OmikujiResultDisplay } from './OmikujiResultDisplay';
import { OmikujiLoadingIndicator } from './OmikujiLoadingIndicator/OmikujiLoadingIndicator';
import { SmoothTransitions } from '@/animations/transitions/SmoothTransitions';
import { OmikujiResult } from '@/domain/entities/OmikujiResult';
import { OmikujiType } from '@/domain/entities/OmikujiType';
import { Fortune } from '@/domain/valueObjects/Fortune';

interface OmikujiTypeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: {
    primary: string;
    secondary: string;
  };
}

interface ApiOmikujiResult {
  id: string;
  omikujiType: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: {
      primary: string;
      secondary: string;
    };
  };
  fortune: {
    id: string;
    japaneseName: string;
    englishName: string;
    description: string;
    value: number;
    probability: number;
    color?: {
      primary: string;
      secondary: string;
      background: string;
    };
    effects?: {
      glow: boolean;
      sparkle: boolean;
      animation: string | null;
    };
  };
  createdAt: string;
}

interface OmikujiFlowProps {
  omikujiTypes: OmikujiTypeData[];
  enableSaisenSelection?: boolean;
  onFlowComplete?: (result: OmikujiResult) => void;
  onError?: (error: string) => void;
}

type FlowState = 'selection' | 'transitioning' | 'loading' | 'result' | 'error';

// Helper function to convert API response to domain entities
function convertApiResultToDomain(apiResult: ApiOmikujiResult): OmikujiResult {
  // Create Fortune domain entity
  const fortune = Fortune.fromData({
    id: apiResult.fortune.id,
    englishName: apiResult.fortune.englishName,
    japaneseName: apiResult.fortune.japaneseName,
    description: apiResult.fortune.description,
    value: apiResult.fortune.value,
    probability: apiResult.fortune.probability,
    color: apiResult.fortune.color || {
      primary: '#000000',
      secondary: '#666666',
      background: '#ffffff'
    },
    effects: apiResult.fortune.effects || {
      glow: false,
      sparkle: false,
      animation: null
    }
  });

  // Create OmikujiType domain entity
  const omikujiType = OmikujiType.create({
    id: apiResult.omikujiType.id,
    name: apiResult.omikujiType.name,
    description: apiResult.omikujiType.description,
    icon: apiResult.omikujiType.icon,
    color: {
      primary: apiResult.omikujiType.color.primary,
      secondary: apiResult.omikujiType.color.secondary
    },
    sortOrder: 0
  });

  // Create OmikujiResult domain entity
  return new OmikujiResult(
    omikujiType,
    fortune,
    apiResult.id,
    new Date(apiResult.createdAt)
  );
}

export function OmikujiFlow({ 
  omikujiTypes, 
  enableSaisenSelection = false,
  onFlowComplete,
  onError
}: OmikujiFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>('selection');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [saisenLevel, setSaisenLevel] = useState(0);
  const [result, setResult] = useState<OmikujiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const drawOmikuji = useCallback(async (typeId: string, saisenLevel = 0) => {
    try {
      setFlowState('transitioning');
      setSelectedType(typeId);

      // Transition animation delay (reduced for tests)
      await new Promise(resolve => setTimeout(resolve, 200));

      setFlowState('loading');

      const response = await fetch('/api/omikuji/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          typeId,
          saisenLevel,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'おみくじを引くことができませんでした');
      }

      // Convert API response to domain entities
      const apiResult = data.data as ApiOmikujiResult;
      const domainResult = convertApiResultToDomain(apiResult);
      
      setResult(domainResult);
      setFlowState('result');
      onFlowComplete?.(domainResult);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'おみくじを引くことができませんでした';
      setError(errorMessage);
      setFlowState('error');
      onError?.(errorMessage);
    }
  }, [onFlowComplete, onError]);

  const handleCardSelect = useCallback((typeId: string) => {
    drawOmikuji(typeId, saisenLevel);
  }, [drawOmikuji, saisenLevel]);

  const handleRedraw = useCallback(() => {
    setFlowState('selection');
    setSelectedType(null);
    setResult(null);
    setError(null);
  }, []);

  const handleSameTypeRedraw = useCallback(() => {
    if (selectedType) {
      drawOmikuji(selectedType, saisenLevel);
    }
  }, [selectedType, drawOmikuji, saisenLevel]);

  const handleRetry = useCallback(() => {
    if (selectedType) {
      drawOmikuji(selectedType, saisenLevel);
    }
  }, [selectedType, drawOmikuji, saisenLevel]);

  const handleResultClose = useCallback(() => {
    handleRedraw();
  }, [handleRedraw]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && flowState === 'result') {
        handleRedraw();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [flowState, handleRedraw]);

  const transitions = SmoothTransitions.getOmikujiSelectionTransition();

  return (
    <div 
      data-testid="omikuji-flow-container"
      data-state={flowState}
      data-selected-type={selectedType}
      className="omikuji-flow-container"
    >
      <AnimatePresence mode="wait" initial={false}>
        {flowState === 'selection' && (
          <motion.div
            key="selection"
            {...SmoothTransitions.getPageEntranceTransition()}
            exit={transitions.cardExit}
            className="selection-state"
          >
            {enableSaisenSelection && (
              <div className="mb-6">
                <label htmlFor="saisen-level" className="block text-sm font-medium text-gray-700 mb-2">
                  お賽銭レベル
                </label>
                <select
                  id="saisen-level"
                  name="お賽銭レベル"
                  role="combobox"
                  aria-label="お賽銭レベル"
                  value={saisenLevel}
                  onChange={(e) => setSaisenLevel(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={0}>通常（0円）</option>
                  <option value={1}>5円（ご縁）</option>
                  <option value={2}>50円</option>
                  <option value={3}>100円</option>
                  <option value={4}>500円</option>
                  <option value={5}>バグレポート</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {omikujiTypes.map((omikujiTypeData) => (
                <motion.button
                  key={omikujiTypeData.id}
                  role="button"
                  aria-label={`${omikujiTypeData.name}を選択`}
                  className="relative w-full p-6 rounded-lg border-2 border-opacity-20 text-white font-medium text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 hover:scale-105 hover:shadow-lg cursor-pointer"
                  style={{
                    backgroundColor: omikujiTypeData.color.primary,
                    borderColor: omikujiTypeData.color.secondary
                  }}
                  onClick={() => handleCardSelect(omikujiTypeData.id)}
                  whileHover={{ scale: 1.05, y: -8 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{omikujiTypeData.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{omikujiTypeData.name}</h3>
                      <p className="text-white text-opacity-90 text-sm mb-4">
                        {omikujiTypeData.description}
                      </p>
                      <div className="inline-block px-4 py-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors">
                        このおみくじを引く
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {(flowState === 'transitioning' || flowState === 'loading') && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="loading-state flex items-center justify-center min-h-[400px]"
          >
            <OmikujiLoadingIndicator
              message={flowState === 'transitioning' ? '遷移中...' : 'おみくじを引いています...'}
              size="large"
            />
          </motion.div>
        )}

        {flowState === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="result-state"
          >
            <OmikujiResultDisplay
              result={result}
              onClose={handleResultClose}
              autoAnimate={true}
            />

            <div className="mt-6 flex gap-4 justify-center">
              <button
                onClick={handleSameTypeRedraw}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                同じおみくじをもう一度
              </button>
              <button
                onClick={handleRedraw}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                再抽選
              </button>
            </div>
          </motion.div>
        )}

        {flowState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="error-state"
          >
            <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-600 text-lg font-semibold mb-2">
                エラーが発生しました
              </div>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  もう一度試す
                </button>
                <button
                  onClick={handleRedraw}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  選択画面に戻る
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}