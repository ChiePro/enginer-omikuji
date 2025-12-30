/**
 * 運勢 Value Object
 * 
 * おみくじの結果として出る運勢（小吉、吉、中吉、大吉など）を表現する
 * JSONデータベースの運勢定義を基に構築される
 */

export interface FortuneData {
  id: string;
  englishName: string;
  japaneseName: string;
  description: string;
  probability: number;
  value: number;
  color: {
    primary: string;
    secondary: string;
    background: string;
  };
  effects: {
    glow: boolean;
    sparkle: boolean;
    animation: string | null;
  };
  disabled?: boolean;
}

export interface FortuneColorScheme {
  primary: string;
  secondary: string;
  background: string;
}

export interface FortuneEffects {
  glow: boolean;
  sparkle: boolean;
  animation: string | null;
}

export class Fortune {
  private constructor(
    private readonly id: string,
    private readonly englishName: string,
    private readonly japaneseName: string,
    private readonly description: string,
    private readonly probability: number,
    private readonly value: number,
    private readonly color: FortuneColorScheme,
    private readonly effects: FortuneEffects,
    private readonly disabled: boolean = false
  ) {}

  /**
   * JSONデータから運勢インスタンスを作成
   */
  static fromData(data: FortuneData): Fortune {
    return new Fortune(
      data.id,
      data.englishName,
      data.japaneseName,
      data.description,
      data.probability,
      data.value,
      data.color,
      data.effects,
      data.disabled || false
    );
  }

  /**
   * 複数の運勢データから運勢インスタンス配列を作成
   */
  static fromDataArray(dataArray: FortuneData[]): Fortune[] {
    return dataArray.map(data => Fortune.fromData(data));
  }

  /**
   * 有効な運勢のみを取得（disabledでないもの）
   */
  static getActiveFortunes(fortunes: Fortune[]): Fortune[] {
    return fortunes.filter(fortune => !fortune.disabled);
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getEnglishName(): string {
    return this.englishName;
  }

  getJapaneseName(): string {
    return this.japaneseName;
  }

  getDescription(): string {
    return this.description;
  }

  getProbability(): number {
    return this.probability;
  }

  getValue(): number {
    return this.value;
  }

  getColor(): FortuneColorScheme {
    return this.color;
  }

  getEffects(): FortuneEffects {
    return this.effects;
  }

  isDisabled(): boolean {
    return this.disabled;
  }

  // 振る舞い：価値による比較
  isMoreValuableThan(other: Fortune): boolean {
    return this.value > other.value;
  }

  // 振る舞い：特別エフェクトの有無
  hasSpecialEffects(): boolean {
    return this.effects.glow || this.effects.sparkle || this.effects.animation !== null;
  }

  // 振る舞い：良い運勢かどうか（正の値）
  isGoodFortune(): boolean {
    return this.value > 0;
  }

  // 振る舞い：悪い運勢かどうか（負の値）
  isBadFortune(): boolean {
    return this.value < 0;
  }

  // 振る舞い：CSS クラス名を生成
  getCssClassName(): string {
    return `fortune-${this.id}`;
  }

  // 振る舞い：確率のパーセンテージ表示（開発用）
  getProbabilityPercentage(): string {
    return `${Math.round(this.probability * 100)}%`;
  }

  // 振る舞い：おみくじらしい稀少性表現
  getRarityDescription(): string {
    const rarityDescriptions: { [key: string]: string } = {
      'daikichi': '✨ 稀なり ✨',
      'chukichi': '🌟 時々',
      'kichi': '🌸 よくあり',
      'shokichi': '🍃 よくあり',
      'kyo': '⚠️ 注意',
      'daikyo': '💀 極稀'
    };

    return rarityDescriptions[this.id] || '❓ 不明';
  }

  // 振る舞い：おみくじらしい期待感を煽る表現
  getExpectationText(): string {
    const expectationTexts: { [key: string]: string } = {
      'daikichi': '最高の運気が舞い降りる',
      'chukichi': '良き風が吹いている',
      'kichi': '穏やかな幸せが訪れそう',
      'shokichi': '小さな幸運に気づこう',
      'kyo': '慎重な歩みが肝要',
      'daikyo': '試練の時、されど学びあり'
    };

    return expectationTexts[this.id] || 'あなたの運命は神のみぞ知る';
  }

  // 振る舞い：レガシーサポート（既存のRarityとの互換性）
  getLegacyRarityName(): string {
    return this.englishName;
  }

  // 振る舞い：同一性の判定
  equals(other: Fortune): boolean {
    return this.id === other.id;
  }

  // 振る舞い：表示用の完全な名前（エフェクトがある場合は装飾）
  getDisplayName(): string {
    if (this.hasSpecialEffects()) {
      return `✨ ${this.japaneseName} ✨`;
    }
    return this.japaneseName;
  }

  // 振る舞い：デバッグ用の文字列表現
  toString(): string {
    return `Fortune(${this.id}: ${this.japaneseName}, value: ${this.value}, prob: ${this.getProbabilityPercentage()})`;
  }

  // 静的メソッド：IDによる検索
  static findById(fortunes: Fortune[], id: string): Fortune | null {
    return fortunes.find(fortune => fortune.id === id) || null;
  }

  // 静的メソッド：英語名による検索
  static findByEnglishName(fortunes: Fortune[], englishName: string): Fortune | null {
    return fortunes.find(fortune => fortune.englishName === englishName) || null;
  }

  // 静的メソッド：値による並び替え（昇順）
  static sortByValue(fortunes: Fortune[]): Fortune[] {
    return [...fortunes].sort((a, b) => a.value - b.value);
  }

  // 静的メソッド：確率による並び替え（降順）
  static sortByProbability(fortunes: Fortune[]): Fortune[] {
    return [...fortunes].sort((a, b) => b.probability - a.probability);
  }
}