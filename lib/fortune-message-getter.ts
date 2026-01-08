/**
 * 運勢メッセージ取得機能
 *
 * おみくじIDと運勢IDの組み合わせから対応するメッセージを取得します。
 * 純粋関数として実装され、副作用がありません。
 */

import { fortuneMessages } from './fortune-data';

/**
 * おみくじIDと運勢IDの組み合わせから運勢メッセージを取得する
 *
 * @param omikujiId - おみくじの一意識別子（例: 'daily-luck', 'code-review'）
 * @param fortuneId - 運勢レベルの一意識別子（例: 'daikichi', 'kichi'）
 * @returns 対応する運勢メッセージ
 * @throws {Error} メッセージが見つからない場合
 *
 * @example
 * const message = getFortuneMessage('daily-luck', 'daikichi');
 * console.log(message); // '今日は最高の1日！コードもレビューもスムーズに進み、素晴らしい成果が出せるでしょう。'
 */
export function getFortuneMessage(omikujiId: string, fortuneId: string): string {
  // 線形探索でメッセージを検索（データ量が28件と少ないため効率的）
  const fortuneMessage = fortuneMessages.find(
    (msg) => msg.omikujiId === omikujiId && msg.fortuneId === fortuneId
  );

  // メッセージが見つからない場合は明確なエラーをスロー
  if (!fortuneMessage) {
    throw new Error(
      `Fortune message not found for omikujiId: "${omikujiId}", fortuneId: "${fortuneId}"`
    );
  }

  return fortuneMessage.message;
}
