/**
 * useLocalStorageカスタムフックのテスト
 *
 * SSR対応、JSON serialization、エラーハンドリングをテストします。
 * TDD原則に従い、実装前にテストを作成します（RED phase）。
 *
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../use-local-storage';

describe('useLocalStorage', () => {
  // localStorageのモック
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // localStorageをモック
    localStorageMock = {};

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => localStorageMock[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete localStorageMock[key];
        }),
        clear: jest.fn(() => {
          localStorageMock = {};
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should return initialValue when localStorage is empty', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      expect(result.current.storedValue).toBe('initial');
      expect(result.current.error).toBeNull();
    });

    it('should return initialValue for different types', () => {
      const { result: numberResult } = renderHook(() =>
        useLocalStorage('number-key', 42)
      );
      expect(numberResult.current.storedValue).toBe(42);

      const { result: objectResult } = renderHook(() =>
        useLocalStorage('object-key', { foo: 'bar' })
      );
      expect(objectResult.current.storedValue).toEqual({ foo: 'bar' });

      const { result: arrayResult } = renderHook(() =>
        useLocalStorage('array-key', [1, 2, 3])
      );
      expect(arrayResult.current.storedValue).toEqual([1, 2, 3]);
    });
  });

  describe('Reading from localStorage', () => {
    it('should read and deserialize JSON from localStorage', () => {
      localStorageMock['test-key'] = JSON.stringify({ name: 'Test', value: 123 });

      const { result } = renderHook(() =>
        useLocalStorage('test-key', { name: '', value: 0 })
      );

      expect(result.current.storedValue).toEqual({ name: 'Test', value: 123 });
    });

    it('should handle primitive values', () => {
      localStorageMock['string-key'] = JSON.stringify('hello');
      localStorageMock['number-key'] = JSON.stringify(42);
      localStorageMock['boolean-key'] = JSON.stringify(true);

      const { result: stringResult } = renderHook(() =>
        useLocalStorage('string-key', '')
      );
      expect(stringResult.current.storedValue).toBe('hello');

      const { result: numberResult } = renderHook(() =>
        useLocalStorage('number-key', 0)
      );
      expect(numberResult.current.storedValue).toBe(42);

      const { result: booleanResult } = renderHook(() =>
        useLocalStorage('boolean-key', false)
      );
      expect(booleanResult.current.storedValue).toBe(true);
    });
  });

  describe('setValue function', () => {
    it('should update storedValue and save to localStorage', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current.setValue('updated');
      });

      expect(result.current.storedValue).toBe('updated');
      expect(localStorageMock['test-key']).toBe(JSON.stringify('updated'));
    });

    it('should handle function updater', () => {
      const { result } = renderHook(() => useLocalStorage('counter', 0));

      act(() => {
        result.current.setValue((prev) => prev + 1);
      });

      expect(result.current.storedValue).toBe(1);

      act(() => {
        result.current.setValue((prev) => prev + 1);
      });

      expect(result.current.storedValue).toBe(2);
    });

    it('should handle complex object updates', () => {
      const { result } = renderHook(() =>
        useLocalStorage('user', { name: 'John', age: 30 })
      );

      act(() => {
        result.current.setValue({ name: 'Jane', age: 25 });
      });

      expect(result.current.storedValue).toEqual({ name: 'Jane', age: 25 });
      expect(JSON.parse(localStorageMock['user'])).toEqual({
        name: 'Jane',
        age: 25,
      });
    });
  });

  describe('removeValue function', () => {
    it('should remove value from localStorage and reset to initialValue', () => {
      localStorageMock['test-key'] = JSON.stringify('stored');

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      // 初期状態ではストレージの値が読み込まれている
      expect(result.current.storedValue).toBe('stored');

      act(() => {
        result.current.removeValue();
      });

      expect(result.current.storedValue).toBe('initial');
      expect(localStorageMock['test-key']).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should handle JSON.parse errors and fallback to initialValue', () => {
      localStorageMock['test-key'] = 'invalid json{';

      const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));

      expect(result.current.storedValue).toBe('fallback');
      expect(result.current.error).not.toBeNull();
    });

    it('should handle localStorage.setItem errors', () => {
      // localStorageのsetItemがエラーをスローするようにモック
      (window.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current.setValue('new value');
      });

      // エラーが発生しても状態は更新される（UX優先）
      expect(result.current.storedValue).toBe('new value');
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('QuotaExceededError');
    });

    it('should handle localStorage.removeItem errors', () => {
      (window.localStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current.removeValue();
      });

      expect(result.current.error).not.toBeNull();
    });
  });

  describe('SSR compatibility', () => {
    it('should handle window undefined case', () => {
      // windowをundefinedにシミュレート
      const originalWindow = global.window;
      // @ts-expect-error - SSRシミュレーションのため意図的にundefinedを設定
      delete global.window;

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      expect(result.current.storedValue).toBe('initial');
      expect(result.current.error).toBeNull();

      // windowを復元
      global.window = originalWindow;
    });
  });

  describe('Type safety', () => {
    it('should maintain type safety with generics', () => {
      interface User {
        name: string;
        age: number;
      }

      const { result } = renderHook(() =>
        useLocalStorage<User>('user', { name: 'John', age: 30 })
      );

      // TypeScriptの型チェックで保証されるが、ランタイムでも検証
      expect(result.current.storedValue).toHaveProperty('name');
      expect(result.current.storedValue).toHaveProperty('age');
      expect(typeof result.current.storedValue.name).toBe('string');
      expect(typeof result.current.storedValue.age).toBe('number');
    });

    it('should work with complex nested types', () => {
      interface ComplexType {
        id: string;
        data: {
          items: string[];
          meta: { count: number };
        };
      }

      const initialValue: ComplexType = {
        id: 'test',
        data: { items: [], meta: { count: 0 } },
      };

      const { result } = renderHook(() =>
        useLocalStorage<ComplexType>('complex', initialValue)
      );

      act(() => {
        result.current.setValue({
          id: 'updated',
          data: { items: ['a', 'b'], meta: { count: 2 } },
        });
      });

      expect(result.current.storedValue.data.items).toEqual(['a', 'b']);
      expect(result.current.storedValue.data.meta.count).toBe(2);
    });
  });
});
