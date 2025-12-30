/**
 * 総合運勢メッセージデータ
 *
 * 伝統的なおみくじ形式の総合運勢メッセージを提供します。
 * 古風な言い回しを使用し、7運勢レベル×5パターン=35メッセージを管理します。
 */

/**
 * 総合運勢メッセージを表すインターフェース
 *
 * @property fortuneId - 運勢レベルの一意識別子（例: 'daikichi'）
 * @property message - 古風な言い回しのメッセージ（100文字程度）
 */
export interface OverallFortuneMessage {
  fortuneId: string;
  message: string;
}

/**
 * 総合運勢メッセージのマスターデータ（35パターン）
 *
 * 7運勢レベル×5パターンのメッセージを提供します。
 * イミュータブルな配列として定義し、データの一貫性を保証します。
 */
export const overallFortuneMessages: readonly OverallFortuneMessage[] = [
  // 大吉 × 5パターン
  {
    fortuneId: 'daikichi',
    message:
      '大いなる吉兆なり。今日の業務、すべて順調に運び、コードもレビューもスムーズに進むべし。チーム内の評価も高まり、実に目出度き一日となるであろう。',
  },
  {
    fortuneId: 'daikichi',
    message:
      '誠に目出度き日なり。コードも思うがままに進み、難解なる問題も解決の糸口見えるべし。デプロイも滞りなく、成功の喜び感じる日となるであろう。',
  },
  {
    fortuneId: 'daikichi',
    message:
      '運勢最高なり。実装も捗り、レビューも一発承認の兆し見ゆ。新たなる技術習得にも好機なれば、積極的に学ぶべし。大いなる成長の日となるであろう。',
  },
  {
    fortuneId: 'daikichi',
    message:
      '天の時、地の利、人の和、すべて揃いたり。バグなく実装進み、チームとの協力も絶好調なるべし。本日の成果、後々まで評価さるる吉日なり。',
  },
  {
    fortuneId: 'daikichi',
    message:
      '最上の吉運なり。待ち人来たり、承認も早く下るべし。コンフリクトも起こらず、平穏無事に業務進むであろう。迷わず前進せよ、成功確実なり。',
  },

  // 吉 × 5パターン
  {
    fortuneId: 'kichi',
    message:
      '吉運なり。本日の業務、概ね順調に進むべし。レビューにて多少の指摘あるも、建設的なるフィードバックにて成長の糧となるであろう。',
  },
  {
    fortuneId: 'kichi',
    message:
      '良き日なり。コーディングは捗り、小さき問題は素早く解決できるであろう。積極的にチャレンジすれば、望む成果を得られるべし。',
  },
  {
    fortuneId: 'kichi',
    message:
      '運気上々なり。デプロイも無事成功し、待ち人も遠からず来るべし。焦らず着実に進めば、良き結果を得られる日となるであろう。',
  },
  {
    fortuneId: 'kichi',
    message:
      '幸先良き日なり。技術的議論も建設的に進み、新たなる知見得られるべし。争い事なく、平和に業務進むは喜ばしきことなり。',
  },
  {
    fortuneId: 'kichi',
    message:
      '吉兆の日なり。実装に集中すれば、思いのほか捗るべし。レビュー待ちも長引かず、スムーズに承認下るであろう。前向きに進むべし。',
  },

  // 中吉 × 5パターン
  {
    fortuneId: 'chukichi',
    message:
      'まずまずの吉運なり。業務は平穏に進むも、時折小さき障害あるやもしれず。されど慌てず対処すれば、問題なく乗り越えられるであろう。',
  },
  {
    fortuneId: 'chukichi',
    message:
      '中程の吉なり。コードレビューにていくつか指摘あるも、丁寧に対応すれば承認得られるべし。焦らず着実に進めるが吉なり。',
  },
  {
    fortuneId: 'chukichi',
    message:
      '安定せる運勢なり。大きな成果は望めねど、堅実に業務こなせば確実に前進できるべし。地道な努力が実を結ぶ日となるであろう。',
  },
  {
    fortuneId: 'chukichi',
    message:
      '可もなく不可もなき日なり。待ち人は来るも時間を要するべし。急がず焦らず、自らの実装に集中するが得策なり。',
  },
  {
    fortuneId: 'chukichi',
    message:
      '普通の吉運なり。デプロイは成功するも、事前の確認を怠るべからず。準備万端整えれば、安心して進められるであろう。',
  },

  // 小吉 × 5パターン
  {
    fortuneId: 'shokichi',
    message:
      'わずかなる吉運あり。本日は大きな進展望めねど、小さな成功積み重ねることで道は開けるべし。一歩一歩確実に進むべし。',
  },
  {
    fortuneId: 'shokichi',
    message:
      '小さき幸運の日なり。レビューにて多くの指摘あるやもしれねど、学びの機会と捉えるべし。謙虚に受け止め、改善に努めるが吉なり。',
  },
  {
    fortuneId: 'shokichi',
    message:
      '些細なる吉兆なり。バグに遭遇する可能性あるも、丁寧にデバッグすれば解決の道見えるべし。慎重に進めることが肝要なり。',
  },
  {
    fortuneId: 'shokichi',
    message:
      'ささやかな吉運なり。待ち人はなかなか来たらねど、その間に己の実装を磨くべし。準備万端整えれば、後に良き結果訪れるであろう。',
  },
  {
    fortuneId: 'shokichi',
    message:
      '控えめなる吉なり。デプロイは慎重に行うべし。チェックリスト確認し、段階的に進めれば、無事成功するであろう。',
  },

  // 末吉 × 5パターン
  {
    fortuneId: 'suekichi',
    message:
      '末なる吉運なり。今は芳しからねど、地道な努力続ければ、後に花開く時来るべし。焦らず着実に歩を進めることが肝要なり。',
  },
  {
    fortuneId: 'suekichi',
    message:
      '吉の終わりなり。本日は忍耐の日と心得よ。レビューに時間を要するも、粘り強く対応すれば、必ずや道は開けるであろう。',
  },
  {
    fortuneId: 'suekichi',
    message:
      'わずかに吉兆残るのみ。デバッグに時間かかるやもしれねど、ログを丁寧に読み解けば、真因に辿り着くべし。諦めず進むべし。',
  },
  {
    fortuneId: 'suekichi',
    message:
      '末の幸運なり。待ち人は遅れるべし。されど焦りは禁物なり。その間に己の技を磨き、準備を怠らねば、後に良き時訪れるであろう。',
  },
  {
    fortuneId: 'suekichi',
    message:
      'かすかなる吉なり。デプロイには入念な準備を要す。ステージング環境にて十分に検証し、慎重に本番へ進めるが賢明なり。',
  },

  // 凶 × 5パターン
  {
    fortuneId: 'kyo',
    message:
      '凶なり。本日は慎重を期すべし。コードレビューにて厳しき指摘あるやもしれねど、それを糧として成長の機会と捉えるべし。',
  },
  {
    fortuneId: 'kyo',
    message:
      '凶運の日なり。バグに遭遇する可能性高し。されど落ち着いてデバッグに臨めば、必ずや解決の糸口見つかるべし。焦りは禁物なり。',
  },
  {
    fortuneId: 'kyo',
    message:
      '運気芳しからず。デプロイは今日を避けるが賢明なり。明日以降に延期し、今日は設計の見直しとテストに注力すべし。',
  },
  {
    fortuneId: 'kyo',
    message:
      '凶兆あり。待ち人来たらず、争い事起こる可能性あり。されど冷静さを保ち、建設的な議論心がければ、災い転じて福となすべし。',
  },
  {
    fortuneId: 'kyo',
    message:
      '不運の日なり。実装前に要件を入念に確認すべし。思い込みによる手戻りを避けるため、不明点は必ず質問するが吉なり。',
  },

  // 大凶 × 5パターン
  {
    fortuneId: 'daikyo',
    message:
      '大凶なり。本日は慎重の上にも慎重を期すべし。新規実装は避け、既存コードのレビューやドキュメント整備に努めるが賢明なり。',
  },
  {
    fortuneId: 'daikyo',
    message:
      '最も凶なる日なり。デプロイは断じて行うべからず。設定ファイルとデータベースマイグレーションを念入りに確認し、明日以降に備えよ。',
  },
  {
    fortuneId: 'daikyo',
    message:
      '大いなる凶兆なり。重大なるバグに遭遇する可能性あり。ペアプログラミングを活用し、複数の目でコード確認するべし。',
  },
  {
    fortuneId: 'daikyo',
    message:
      '運気最悪なり。レビューにて多数の指摘受けるべし。されど落胆せず、学びの機会と捉え、セルフレビューを徹底するが今後の糧となるであろう。',
  },
  {
    fortuneId: 'daikyo',
    message:
      '大凶の日なり。争い事起こりやすし。技術的議論にては感情を抑え、事実と論理に基づき冷静に対応すべし。忍耐が肝要なり。',
  },
] as const;

/**
 * 運勢レベルIDから総合運勢メッセージを取得する
 *
 * 指定された運勢レベルに対応する5パターンのメッセージから
 * ランダムに1つを選択して返します。
 *
 * @param fortuneId - 運勢レベルの一意識別子（例: 'daikichi', 'kichi'）
 * @returns 選択された総合運勢メッセージ
 * @throws {Error} fortuneIdが不正な場合、またはメッセージが見つからない場合
 *
 * @example
 * const message = getOverallFortuneMessage('daikichi');
 * console.log(message); // '大いなる吉兆なり。今日の業務、すべて順調に運び...'
 */
export function getOverallFortuneMessage(fortuneId: string): string {
  // fortuneIdに対応するメッセージをフィルタリング
  const messages = overallFortuneMessages.filter(
    (m) => m.fortuneId === fortuneId
  );

  // メッセージが見つからない場合はエラー
  if (messages.length === 0) {
    throw new Error(
      `No overall fortune message found for fortuneId: "${fortuneId}"`
    );
  }

  // 5パターンからランダムに1つを選択
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex].message;
}
