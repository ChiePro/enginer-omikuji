/**
 * 型安全なlocalStorageカスタムフック
 *
 * TypeScript Genericsによる型安全なlocalStorageアクセスを提供します。
 * SSR対応、JSON自動シリアライズ・デシリアライズ、エラーハンドリングを実装します。
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * localStorageカスタムフックの戻り値
 */
export interface UseLocalStorageReturn<T> {
  /** 保存された値（初回はinitialValue） */
  storedValue: T;

  /** 値を更新する関数 */
  setValue: (value: T | ((prev: T) => T)) => void;

  /** 値を削除する関数 */
  removeValue: () => void;

  /** エラー状態 */
  error: Error | null;
}

/**
 * 型安全なlocalStorageカスタムフック
 *
 * SSR対応、JSON自動シリアライズ・デシリアライズ、エラーハンドリングを提供します。
 *
 * @param key - ストレージキー
 * @param initialValue - 初期値（デフォルト値）
 * @returns UseLocalStorageReturn<T>
 *
 * @example
 * ```typescript
 * const { storedValue, setValue, removeValue, error } = useLocalStorage('user', { name: 'John' });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> {
  // エラー状態を管理
  const [error, setError] = useState<Error | null>(null);

  // 状態を管理（初期値はlocalStorageから読み込むか、initialValueを使用）
  const [storedValue, setStoredValue] = useState<T>(() => {
    // SSR対応: window未定義の場合はinitialValueを返す
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);

      if (item) {
        // JSON.parseでデシリアライズ
        return JSON.parse(item) as T;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // JSON.parseエラーまたはlocalStorageアクセスエラー
      // エラー状態はuseEffectで設定する必要がある（lazy initializationではsetStateできない）
      // エラー発生時はinitialValueにフォールバック
    }

    return initialValue;
  });

  // 初期化時のエラーハンドリング
  useEffect(() => {
    // SSR対応: window未定義の場合はスキップ
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const item = window.localStorage.getItem(key);

      if (item) {
        // JSON.parseのテスト（エラーチェックのみ）
        JSON.parse(item);
      }
    } catch (err) {
      // JSON.parseエラーまたはlocalStorageアクセスエラー
      const error =
        err instanceof Error ? err : new Error('Failed to read from localStorage');
      setError(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 値を更新する関数
   *
   * @param value - 新しい値、または前の値から新しい値を計算する関数
   */
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      // 関数の場合は前の値を渡して計算
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // 状態を更新
      setStoredValue(valueToStore);

      // SSR対応: window未定義の場合はスキップ
      if (typeof window !== 'undefined') {
        // localStorageに保存（JSON.stringifyでシリアライズ）
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }

      // 成功時はエラーをクリア
      setError(null);
    } catch (err) {
      // ストレージ容量超過エラーまたはJSON.stringifyエラー
      const error =
        err instanceof Error ? err : new Error('Failed to write to localStorage');
      setError(error);
      // エラー発生時でも状態は更新される（UX優先）
    }
  };

  /**
   * 値を削除する関数
   */
  const removeValue = () => {
    try {
      // 状態を初期値にリセット
      setStoredValue(initialValue);

      // SSR対応: window未定義の場合はスキップ
      if (typeof window !== 'undefined') {
        // localStorageから削除
        window.localStorage.removeItem(key);
      }

      // 成功時はエラーをクリア
      setError(null);
    } catch (err) {
      // localStorageアクセスエラー
      const error =
        err instanceof Error ? err : new Error('Failed to remove from localStorage');
      setError(error);
    }
  };

  return {
    storedValue,
    setValue,
    removeValue,
    error,
  };
}
