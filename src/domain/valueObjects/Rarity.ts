export class Rarity {
  private static readonly VALUES = {
    COMMON: { value: 1, probability: 0.6, label: 'コモン', color: '#9CA3AF' },
    RARE: { value: 2, probability: 0.3, label: 'レア', color: '#3B82F6' },
    EPIC: { value: 3, probability: 0.08, label: 'エピック', color: '#8B5CF6' },
    LEGENDARY: { value: 4, probability: 0.02, label: 'レジェンダリー', color: '#F59E0B' }
  } as const;

  private constructor(
    private readonly type: keyof typeof Rarity.VALUES,
    private readonly config: typeof Rarity.VALUES[keyof typeof Rarity.VALUES]
  ) {}

  static COMMON = new Rarity('COMMON', Rarity.VALUES.COMMON);
  static RARE = new Rarity('RARE', Rarity.VALUES.RARE);
  static EPIC = new Rarity('EPIC', Rarity.VALUES.EPIC);
  static LEGENDARY = new Rarity('LEGENDARY', Rarity.VALUES.LEGENDARY);

  // 振る舞い：価値の比較
  isMoreValuableThan(other: Rarity): boolean {
    return this.config.value > other.config.value;
  }

  // 振る舞い：エフェクト有無の判定
  hasSpecialEffects(): boolean {
    return this.config.value >= 3; // EPICとLEGENDARYはエフェクトあり
  }

  // 振る舞い：確率の取得
  getProbability(): number {
    return this.config.probability;
  }

  // 振る舞い：表示色の取得
  getDisplayColor(): string {
    return this.config.color;
  }

  // 振る舞い：日本語ラベルの取得
  getLabel(): string {
    return this.config.label;
  }

  // 振る舞い：内部価値の取得
  getValue(): number {
    return this.config.value;
  }

  // 振る舞い：レアリティタイプの取得
  getType(): string {
    return this.type;
  }
}