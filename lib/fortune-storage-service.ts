/**
 * おみくじ結果のストレージ管理サービス
 *
 * localStorageキーの生成、結果データの作成、バリデーション機能を提供します。
 * 純粋関数として実装し、副作用なし、テスト可能性を確保します。
 */

import { FortuneResult } from './draw-fortune';
import { IntegratedFortuneResult } from './integrated-fortune';
import { StoredFortuneResult } from './fortune-storage-types';
import { omikujiList } from './omikuji-data';

/**
 * ストレージキーを生成
 *
 * おみくじIDから一意のストレージキーを生成します。
 * キー形式: `omikuji-result:{omikujiId}`
 *
 * @param omikujiId - おみくじの一意識別子
 * @returns ストレージキー
 *
 * @example
 * getStorageKey('daily-luck') // => 'omikuji-result:daily-luck'
 */
export function getStorageKey(omikujiId: string): string {
  return `omikuji-result:${omikujiId}`;
}

/**
 * ストレージ保存用の結果データを作成
 *
 * おみくじ結果にメタデータ（タイムスタンプ、おみくじ名称）を付与し、
 * ストレージ保存用のデータ構造を生成します。
 *
 * @param omikujiId - おみくじの一意識別子
 * @param result - 運勢抽選結果（FortuneResult | IntegratedFortuneResult）
 * @param type - おみくじタイプ（'basic' | 'integrated'）
 * @returns ストレージ保存用データ
 *
 * @example
 * const result = drawFortune('daily-luck');
 * const stored = createStoredResult('daily-luck', result, 'basic');
 */
export function createStoredResult(
  omikujiId: string,
  result: FortuneResult | IntegratedFortuneResult,
  type: 'basic' | 'integrated'
): StoredFortuneResult {
  // おみくじ名称を取得
  const omikuji = omikujiList.find((o) => o.id === omikujiId);
  const omikujiName = omikuji?.name || 'おみくじ';

  // 現在時刻をISO 8601形式で取得
  const drawnAt = new Date().toISOString();

  // 型に応じてデータ構造を構築
  if (type === 'basic') {
    return {
      type: 'basic',
      fortuneResult: result as FortuneResult,
      omikujiName,
      drawnAt,
    };
  } else {
    return {
      type: 'integrated',
      integratedResult: result as IntegratedFortuneResult,
      omikujiName,
      drawnAt,
    };
  }
}

/**
 * ストレージデータの型ガード関数
 *
 * unknownデータがStoredFortuneResult型に適合するかを検証します。
 * ランタイムでの型安全性を保証します。
 *
 * @param data - 検証対象のデータ
 * @returns データが有効なStoredFortuneResult型の場合true
 *
 * @example
 * const data = JSON.parse(localStorage.getItem(key) || '');
 * if (validateStoredResult(data)) {
 *   // dataはStoredFortuneResult型として扱える
 * }
 */
export function validateStoredResult(data: unknown): data is StoredFortuneResult {
  // null/undefinedチェック
  if (data === null || data === undefined) {
    return false;
  }

  // オブジェクトチェック
  if (typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // 必須フィールドのチェック
  if (
    typeof obj.type !== 'string' ||
    typeof obj.omikujiName !== 'string' ||
    typeof obj.drawnAt !== 'string'
  ) {
    return false;
  }

  // typeフィールドの値チェック
  if (obj.type !== 'basic' && obj.type !== 'integrated') {
    return false;
  }

  // 型に応じた結果データのチェック
  if (obj.type === 'basic') {
    // basicタイプの場合、fortuneResultが必須
    if (!obj.fortuneResult || typeof obj.fortuneResult !== 'object') {
      return false;
    }

    const fortuneResult = obj.fortuneResult as Record<string, unknown>;

    // fortuneResult内のlevelとmessageチェック
    if (
      !fortuneResult.level ||
      typeof fortuneResult.level !== 'object' ||
      typeof fortuneResult.message !== 'string'
    ) {
      return false;
    }

    // integratedResultが存在しないことを確認
    if (obj.integratedResult !== undefined) {
      return false;
    }
  } else {
    // integratedタイプの場合、integratedResultが必須
    if (!obj.integratedResult || typeof obj.integratedResult !== 'object') {
      return false;
    }

    const integratedResult = obj.integratedResult as Record<string, unknown>;

    // integratedResult内のlevel、overallMessage、categoryAdviceチェック
    if (
      !integratedResult.level ||
      typeof integratedResult.level !== 'object' ||
      typeof integratedResult.overallMessage !== 'string' ||
      !integratedResult.categoryAdvice ||
      typeof integratedResult.categoryAdvice !== 'object'
    ) {
      return false;
    }

    // fortuneResultが存在しないことを確認
    if (obj.fortuneResult !== undefined) {
      return false;
    }
  }

  return true;
}
