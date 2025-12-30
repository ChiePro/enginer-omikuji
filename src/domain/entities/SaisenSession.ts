import { Saisen } from '../valueObjects/Saisen';

export interface SaisenSessionData {
  id: string;
  currentSaisen: string | null; // Saisenの名前で保存
  usageCount: number;
  omikujiDrawCount: number;
  totalSaisenAmount: number;
  saisenHistory: string[];
}

export interface EffectStats {
  totalEffectUsages: number;
  noEffectUsages: number;
  specialEffectUsages: number;
}

export class SaisenSession {
  private constructor(
    private readonly id: string,
    private currentSaisen: Saisen | null = null,
    private usageCount: number = 0,
    private omikujiDrawCount: number = 0,
    private totalSaisenAmount: number = 0,
    private saisenHistory: Saisen[] = []
  ) {}

  static create(): SaisenSession {
    const sessionId = this.generateSessionId();
    return new SaisenSession(sessionId);
  }

  private static generateSessionId(): string {
    return `saisen-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 基本プロパティの取得
  getId(): string {
    return this.id;
  }

  hasActiveSaisen(): boolean {
    return this.currentSaisen !== null && this.shouldEffectContinue();
  }

  getCurrentSaisen(): Saisen | null {
    return this.hasActiveSaisen() ? this.currentSaisen : null;
  }

  getUsageCount(): number {
    return this.usageCount;
  }

  getOmikujiDrawCount(): number {
    return this.omikujiDrawCount;
  }

  // お賽銭の適用
  applySaisen(saisen: Saisen): void {
    this.currentSaisen = saisen;
    this.usageCount++;
    this.totalSaisenAmount += saisen.getAmount();
    this.saisenHistory.push(saisen);
    this.omikujiDrawCount = 0; // お賽銭適用時にカウントリセット
  }

  // 効果のリセット
  resetSaisenEffect(): void {
    this.currentSaisen = null;
  }

  // おみくじ回数カウント
  incrementOmikujiDrawCount(): void {
    this.omikujiDrawCount++;
    
    // 効果期間が終了した場合、自動リセット
    if (!this.shouldEffectContinue()) {
      this.resetSaisenEffect();
    }
  }

  // 効果継続判定
  shouldEffectContinue(): boolean {
    if (!this.currentSaisen) {
      return false;
    }

    const maxDrawCount = this.getMaxDrawCountForSaisen(this.currentSaisen);
    return this.omikujiDrawCount < maxDrawCount;
  }

  private getMaxDrawCountForSaisen(saisen: Saisen): number {
    if (saisen === Saisen.DEBUG_BUG) {
      return 5; // バグ効果は5回まで
    }
    if (saisen === Saisen.FIVE_HUNDRED_YEN) {
      return 3; // 500円は3回まで
    }
    return 1; // その他は1回まで
  }

  // 統計情報
  getTotalSaisenAmount(): number {
    return this.totalSaisenAmount;
  }

  getEffectStats(): EffectStats {
    const effectUsages = this.saisenHistory.filter(saisen => saisen.hasEffect() && !saisen.isSpecial()).length;
    const noEffectUsages = this.saisenHistory.filter(saisen => !saisen.hasEffect()).length;
    const specialEffectUsages = this.saisenHistory.filter(saisen => saisen.isSpecial()).length;

    return {
      totalEffectUsages: effectUsages,
      noEffectUsages,
      specialEffectUsages
    };
  }

  // シリアライズ・デシリアライズ
  serialize(): SaisenSessionData {
    return {
      id: this.id,
      currentSaisen: this.currentSaisen?.getName() || null,
      usageCount: this.usageCount,
      omikujiDrawCount: this.omikujiDrawCount,
      totalSaisenAmount: this.totalSaisenAmount,
      saisenHistory: this.saisenHistory.map(saisen => saisen.getName())
    };
  }

  static deserialize(data: SaisenSessionData): SaisenSession {
    const session = new SaisenSession(
      data.id,
      null,
      data.usageCount,
      data.omikujiDrawCount,
      data.totalSaisenAmount,
      []
    );

    // currentSaisenの復元
    if (data.currentSaisen) {
      session.currentSaisen = this.findSaisenByName(data.currentSaisen);
    }

    // saisenHistoryの復元
    session.saisenHistory = data.saisenHistory.map(name => this.findSaisenByName(name));

    return session;
  }

  private static findSaisenByName(name: string): Saisen {
    const allSaisen = Saisen.getAllPredefinedSaisen();
    const found = allSaisen.find(saisen => saisen.getName() === name);
    
    if (!found) {
      // フォールバック: 5円（ご縁）を返す
      return Saisen.GOEN;
    }
    
    return found;
  }
}