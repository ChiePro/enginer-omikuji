'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { animatePageExit } from '@/animations/transitions/SmoothTransitions';

export interface OmikujiSelectionHook {
  selectOmikuji: (typeId: string) => Promise<void>;
  isTransitioning: boolean;
}

export const useOmikujiSelection = (): OmikujiSelectionHook => {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const selectOmikuji = useCallback(async (typeId: string) => {
    try {
      setIsTransitioning(true);
      
      // ページ遷移前のアニメーション実行
      await animatePageExit();
      
      // Next.js Routerで遷移
      await router.push(`/omikuji/${typeId}`);
      
      // 正常完了時は状態をリセット
      setIsTransitioning(false);
    } catch (error) {
      // エラーが発生した場合は状態をリセットしてエラーを再スロー
      setIsTransitioning(false);
      throw error;
    }
  }, [router]);

  return {
    selectOmikuji,
    isTransitioning,
  };
};