/**
 * 運勢データを扱うカスタムフック
 * 
 * コンポーネントから運勢データを簡単に取得・使用するためのフック
 */

import { useState, useEffect } from 'react';
import { Fortune } from '@/domain/valueObjects/Fortune';
import { JsonFortuneRepository } from '@/infrastructure/repositories/json/FortuneRepository';

interface UseFortunesReturn {
  fortunes: Fortune[];
  activeFortunes: Fortune[];
  loading: boolean;
  error: string | null;
  refreshFortunes: () => Promise<void>;
  getFortune: (id: string) => Fortune | null;
  getFortuneByEnglishName: (englishName: string) => Fortune | null;
}

export const useFortunes = (): UseFortunesReturn => {
  const [fortunes, setFortunes] = useState<Fortune[]>([]);
  const [activeFortunes, setActiveFortunes] = useState<Fortune[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repository = new JsonFortuneRepository();

  const loadFortunes = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allFortunes, activeFortunes] = await Promise.all([
        repository.findAll(),
        repository.findActiveFortunes()
      ]);

      setFortunes(allFortunes);
      setActiveFortunes(activeFortunes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load fortunes: ${errorMessage}`);
      console.error('Error loading fortunes:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshFortunes = async () => {
    repository.clearCache();
    await loadFortunes();
  };

  const getFortune = (id: string): Fortune | null => {
    return Fortune.findById(fortunes, id);
  };

  const getFortuneByEnglishName = (englishName: string): Fortune | null => {
    return Fortune.findByEnglishName(fortunes, englishName);
  };

  useEffect(() => {
    loadFortunes();
  }, []);

  return {
    fortunes,
    activeFortunes,
    loading,
    error,
    refreshFortunes,
    getFortune,
    getFortuneByEnglishName
  };
};

/**
 * レガシーサポート用のフック（既存のRarity互換）
 */
export const useFortunesLegacy = () => {
  const { activeFortunes, loading, error } = useFortunes();

  // 既存のRarityコンポーネント用のデータフォーマット
  const legacyTiers = activeFortunes.map(fortune => ({
    rarity: fortune.getLegacyRarityName(),
    label: fortune.getJapaneseName(),
    probability: fortune.getProbability(),
    color: fortune.getColor().primary,
    effects: {
      glow: fortune.getEffects().glow,
      sparkle: fortune.getEffects().sparkle,
      animation: fortune.getEffects().animation
    }
  }));

  return {
    tiers: legacyTiers,
    loading,
    error
  };
};