/**
 * おみくじ結果のストレージ管理型定義
 *
 * ブラウザのlocalStorageに保存するおみくじ結果の型定義を提供します。
 * TypeScript strict modeで型安全性を保証し、既存のFortuneResultと
 * IntegratedFortuneResult型を活用します。
 */

import { FortuneResult } from './draw-fortune';
import { IntegratedFortuneResult } from './integrated-fortune';

/**
 * ストレージに保存する結果データ構造
 *
 * @property type - おみくじタイプ（'basic': 基本運勢、'integrated': 統合運勢）
 * @property fortuneResult - 基本運勢結果（type='basic'の場合に存在）
 * @property integratedResult - 統合運勢結果（type='integrated'の場合に存在）
 * @property omikujiName - おみくじ名称（表示用）
 * @property drawnAt - 引いた日時（ISO 8601形式）
 */
export interface StoredFortuneResult {
  type: 'basic' | 'integrated';
  fortuneResult?: FortuneResult;
  integratedResult?: IntegratedFortuneResult;
  omikujiName: string;
  drawnAt: string;
}
