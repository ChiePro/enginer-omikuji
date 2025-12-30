import { InvalidSaisenAmountError } from '../errors/ApplicationErrors';

interface SaisenEffects {
  rarityBoost?: number;
  isSpecial?: boolean;
  hasSpecialAnimation?: boolean;
}

export class Saisen {
  private constructor(
    private readonly amount: number,
    private readonly name: string,
    private readonly description: string,
    private readonly effects: SaisenEffects
  ) {}

  // 定義済みお賽銭
  static GOEN = new Saisen(5, '5円（ご縁）', '効果なし（通常確率）', {});
  static FIFTY_YEN = new Saisen(50, '50円', 'ちょっとだけ運気アップ', { rarityBoost: 5 });
  static HUNDRED_YEN = new Saisen(100, '100円', '運気アップ', { rarityBoost: 10 });
  static FIVE_HUNDRED_YEN = new Saisen(500, '500円', '大幅運気アップ', { rarityBoost: 15, hasSpecialAnimation: true });
  // Special case: DEBUG_BUG uses a special constructor bypass
  static DEBUG_BUG = new Saisen(1, '賽銭箱にバグを投げ込む', '特殊な結果が出る可能性', { isSpecial: true, hasSpecialAnimation: true });

  // Overloaded create methods to support both simple and complex creation
  static create(amount: number): Saisen;
  static create(amount: number, name: string, description: string, effects: SaisenEffects): Saisen;
  static create(amount: number, name?: string, description?: string, effects?: SaisenEffects): Saisen {
    // Validation for boundary value tests
    if (amount <= 0) {
      throw new InvalidSaisenAmountError('お賽銭は1円以上である必要があります');
    }
    
    if (!Number.isInteger(amount)) {
      throw new InvalidSaisenAmountError('お賽銭は整数である必要があります');
    }
    
    if (!Number.isFinite(amount)) {
      throw new InvalidSaisenAmountError('お賽銭は有限数である必要があります');
    }
    
    if (Number.isNaN(amount)) {
      throw new InvalidSaisenAmountError('お賽銭は有効な数値である必要があります');
    }

    // Simple creation (for boundary tests)
    if (name === undefined) {
      return new Saisen(amount, `${amount}円`, `お賽銭${amount}円`, {});
    }

    // Complex creation (for existing functionality)
    return new Saisen(amount, name, description || '', effects || {});
  }

  // 基本プロパティの取得
  getAmount(): number {
    return this.amount;
  }
  
  // Alias for compatibility with boundary value tests
  getValue(): number {
    return this.amount;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  // 効果の判定
  hasEffect(): boolean {
    return this.effects.rarityBoost !== undefined || this.effects.isSpecial === true;
  }

  getRarityBoost(): number {
    return this.effects.rarityBoost || 0;
  }

  isSpecial(): boolean {
    return this.effects.isSpecial === true;
  }

  hasSpecialAnimation(): boolean {
    return this.effects.hasSpecialAnimation === true;
  }

  // 比較メソッド
  isMoreExpensiveThan(other: Saisen): boolean {
    return this.amount > other.amount;
  }

  isMoreEffectiveThan(other: Saisen): boolean {
    // 特殊効果 > 通常効果 > 効果なし
    if (this.isSpecial() && !other.isSpecial()) {
      return true;
    }
    if (!this.isSpecial() && other.isSpecial()) {
      return false;
    }
    // 両方とも特殊効果、または両方とも通常効果の場合はレアリティブーストで比較
    return this.getRarityBoost() > other.getRarityBoost();
  }

  // 静的メソッド
  static getAllPredefinedSaisen(): Saisen[] {
    return [
      this.GOEN,
      this.FIFTY_YEN,
      this.HUNDRED_YEN,
      this.FIVE_HUNDRED_YEN,
      this.DEBUG_BUG
    ];
  }

  static getAllSortedByAmount(): Saisen[] {
    return this.getAllPredefinedSaisen().sort((a, b) => a.amount - b.amount);
  }
}