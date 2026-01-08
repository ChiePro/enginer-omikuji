/**
 * 運勢抽選統合機能
 *
 * おみくじIDを受け取り、運勢レベルとメッセージを含む結果オブジェクトを返します。
 * ランダム選択ロジックとメッセージ取得機能を統合し、
 * 既存のOmikuji型定義と統合可能な設計を提供します。
 */

import { FortuneLevel } from './fortune-data';
import { selectRandomFortune } from './fortune-selector';
import { getFortuneMessage } from './fortune-message-getter';
import { omikujiList } from './omikuji-data';

/**
 * 運勢抽選結果を表すインターフェース
 *
 * @property level - 選ばれた運勢レベル（大吉、吉、中吉、小吉、末吉、凶、大凶のいずれか）
 * @property message - 運勢レベルとおみくじタイプに対応したメッセージ
 */
export interface FortuneResult {
  level: FortuneLevel;
  message: string;
}

/**
 * 運勢を抽選し、運勢レベルとメッセージを含む結果を返す
 *
 * 重み付き確率分布を使用して運勢レベルをランダムに選択し、
 * おみくじタイプと運勢レベルに対応するメッセージを取得します。
 *
 * @param omikujiId - おみくじの一意識別子（例: 'daily-luck', 'code-review'）
 * @returns 運勢レベルとメッセージを含む結果オブジェクト
 * @throws {Error} おみくじIDが不正な場合、またはメッセージが見つからない場合
 *
 * @example
 * const result = drawFortune('daily-luck');
 * console.log(result.level.name); // '大吉', '吉', '中吉', etc.
 * console.log(result.message); // '今日は最高の1日！コードもレビューもスムーズに進み、素晴らしい成果が出せるでしょう。'
 */
export function drawFortune(omikujiId: string): FortuneResult {
  // おみくじIDの妥当性チェック
  if (!omikujiId || typeof omikujiId !== 'string') {
    throw new Error(`Invalid omikuji ID: ${omikujiId}`);
  }

  // おみくじIDが存在するか確認
  const omikujiExists = omikujiList.some((omikuji) => omikuji.id === omikujiId);
  if (!omikujiExists) {
    throw new Error(`Invalid omikuji ID: "${omikujiId}"`);
  }

  // 1. ランダムに運勢レベルを選択
  const fortuneLevel = selectRandomFortune();

  // 2. 選ばれた運勢レベルとおみくじIDから対応するメッセージを取得
  const message = getFortuneMessage(omikujiId, fortuneLevel.id);

  // 3. 結果オブジェクトを返す
  return {
    level: fortuneLevel,
    message: message,
  };
}
