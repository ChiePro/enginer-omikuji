/**
 * おみくじ結果ページ（動的ルーティング）
 *
 * Next.js App Routerの動的ルーティング機能を使用して、
 * おみくじIDに基づく結果表示ページを提供します。
 *
 * URL: /omikuji/[id]
 * 例: /omikuji/daily-luck
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { omikujiList } from '@/lib/omikuji-data';
import { drawFortune } from '@/lib/draw-fortune';
import { drawIntegratedFortune } from '@/lib/integrated-fortune';
import { useLocalStorage } from '@/lib/use-local-storage';
import { getStorageKey, createStoredResult } from '@/lib/fortune-storage-service';
import { StoredFortuneResult } from '@/lib/fortune-storage-types';
import { FortuneResultCard } from '@/components/fortune-result-card';
import { CategoryAdviceGrid } from '@/components/category-advice-grid';
import { ResetButton } from '@/components/reset-button';
import { ResultPageState, determineOmikujiType } from '../result-page.types';

/**
 * おみくじ結果ページコンポーネント
 *
 * ページマウント時に保存済み結果を復元、なければ自動抽選を実行します。
 * エラー発生時は適切なフォールバック処理を行います。
 */
export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const omikujiId = params.id as string;

  // おみくじの妥当性チェック
  const omikuji = omikujiList.find((o) => o.id === omikujiId);

  // おみくじタイプの判定
  const omikujiType = omikuji ? determineOmikujiType(omikujiId) : 'basic';

  // ストレージキーの生成
  const storageKey = getStorageKey(omikujiId);

  // localStorageとの統合
  const { storedValue, setValue, removeValue } = useLocalStorage<StoredFortuneResult | null>(
    storageKey,
    null
  );

  // 状態管理
  const [state, setState] = useState<ResultPageState>({
    fortuneResult: null,
    integratedResult: null,
    isLoading: true,
    error: null,
    omikujiType,
  });

  // 初期化とデータ読み込み
  useEffect(() => {
    // おみくじIDの妥当性チェック
    if (!omikuji) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: `おみくじID「${omikujiId}」が見つかりません。`,
      }));
      return;
    }

    // 保存済み結果の復元を試みる
    if (storedValue) {
      try {
        if (omikujiType === 'basic' && storedValue.fortuneResult) {
          setState({
            fortuneResult: storedValue.fortuneResult,
            integratedResult: null,
            isLoading: false,
            error: null,
            omikujiType: 'basic',
          });
          return;
        } else if (omikujiType === 'integrated' && storedValue.integratedResult) {
          setState({
            fortuneResult: null,
            integratedResult: storedValue.integratedResult,
            isLoading: false,
            error: null,
            omikujiType: 'integrated',
          });
          return;
        }
      } catch (err) {
        // ストレージ読み込みエラーは無視して新規抽選に進む
        console.error('Failed to restore fortune result:', err);
      }
    }

    // 新規抽選を実行
    try {
      if (omikujiType === 'basic') {
        const result = drawFortune(omikujiId);
        const storedResult = createStoredResult(omikujiId, result, 'basic');

        setState({
          fortuneResult: result,
          integratedResult: null,
          isLoading: false,
          error: null,
          omikujiType: 'basic',
        });

        setValue(storedResult);
      } else {
        const result = drawIntegratedFortune();
        const storedResult = createStoredResult(omikujiId, result, 'integrated');

        setState({
          fortuneResult: null,
          integratedResult: result,
          isLoading: false,
          error: null,
          omikujiType: 'integrated',
        });

        setValue(storedResult);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '抽選に失敗しました。';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [omikujiId]);

  // リセット処理
  const handleReset = () => {
    removeValue();
    router.push('/');
  };

  // ローディング状態の表示
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 dark:text-gray-300">抽選中...</p>
        </div>
      </div>
    );
  }

  // エラー状態の表示
  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-700 rounded-xl p-6 mb-6">
            <p className="text-xl text-red-900 dark:text-red-100 mb-2">⚠️ エラー</p>
            <p className="text-red-800 dark:text-red-200">{state.error}</p>
          </div>
          <ResetButton onClick={handleReset} />
        </div>
      </div>
    );
  }

  // 結果表示
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {omikuji?.name || 'おみくじ結果'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {omikuji?.description || ''}
          </p>
        </header>

        {/* 結果表示 */}
        <div className="space-y-8">
          {/* 基本運勢の表示 */}
          {state.fortuneResult && (
            <FortuneResultCard
              level={state.fortuneResult.level}
              message={state.fortuneResult.message}
              omikujiName={omikuji?.name || 'おみくじ'}
              drawnAt={storedValue?.drawnAt || new Date().toISOString()}
              enableAnimation={true}
            />
          )}

          {/* 統合運勢の表示 */}
          {state.integratedResult && (
            <>
              <FortuneResultCard
                level={state.integratedResult.level}
                message={state.integratedResult.overallMessage}
                omikujiName={omikuji?.name || 'おみくじ'}
                drawnAt={storedValue?.drawnAt || new Date().toISOString()}
                enableAnimation={true}
              />

              {/* カテゴリアドバイスグリッド */}
              <CategoryAdviceGrid
                categoryAdvice={state.integratedResult.categoryAdvice}
                fortuneLevel={state.integratedResult.level}
                enableAnimation={true}
              />
            </>
          )}
        </div>

        {/* リセットボタン */}
        <div className="mt-12 text-center">
          <ResetButton onClick={handleReset} />
        </div>
      </main>
    </div>
  );
}
