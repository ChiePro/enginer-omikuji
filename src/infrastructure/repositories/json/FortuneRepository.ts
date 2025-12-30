/**
 * 運勢データリポジトリ（JSON実装）
 * 
 * JSONファイルから運勢データを読み込み、Fortuneエンティティを提供する
 */

import { Fortune, FortuneData } from '@/domain/valueObjects/Fortune';

export interface IFortuneRepository {
  findAll(): Promise<Fortune[]>;
  findById(id: string): Promise<Fortune | null>;
  findByEnglishName(englishName: string): Promise<Fortune | null>;
  findActiveFortunes(): Promise<Fortune[]>;
}

export class JsonFortuneRepository implements IFortuneRepository {
  private fortuneDataCache: FortuneData[] | null = null;

  /**
   * JSONファイルから運勢データを読み込み
   */
  private async loadFortuneData(): Promise<FortuneData[]> {
    if (this.fortuneDataCache) {
      return this.fortuneDataCache;
    }

    try {
      // 開発環境では直接ファイルを読み込み、本番環境では別の方法で取得
      const fortuneData = await this.fetchFortuneData();
      this.fortuneDataCache = fortuneData.fortunes;
      return this.fortuneDataCache;
    } catch (error) {
      console.error('Failed to load fortune data:', error);
      // フォールバックデータを返す
      return this.getDefaultFortuneData();
    }
  }

  /**
   * 運勢データの取得（環境に応じた実装）
   */
  private async fetchFortuneData(): Promise<{ fortunes: FortuneData[] }> {
    // Node.js環境（サーバーサイド）での実装
    if (typeof window === 'undefined') {
      const fs = await import('fs');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), 'data/fortune/fortune-types.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } 
    
    // ブラウザ環境での実装（API経由）
    const response = await fetch('/api/fortune/types');
    if (!response.ok) {
      throw new Error(`Failed to fetch fortune data: ${response.status}`);
    }
    return response.json();
  }

  /**
   * フォールバックとしてのデフォルト運勢データ
   */
  private getDefaultFortuneData(): FortuneData[] {
    return [
      {
        id: "daikyo",
        englishName: "very-unlucky",
        japaneseName: "大凶",
        description: "今日は慎重に過ごしましょう",
        probability: 0.12,
        value: -2,
        color: { primary: "#991B1B", secondary: "#7F1D1D", background: "#FEE2E2" },
        effects: { glow: false, sparkle: false, animation: null }
      },
      {
        id: "kyo",
        englishName: "unlucky",
        japaneseName: "凶",
        description: "注意深く行動しましょう",
        probability: 0.15,
        value: -1,
        color: { primary: "#DC2626", secondary: "#991B1B", background: "#FECACA" },
        effects: { glow: false, sparkle: false, animation: null }
      },
      {
        id: "shokichi",
        englishName: "common",
        japaneseName: "小吉",
        description: "少しずつ良いことがありそうです",
        probability: 0.30,
        value: 1,
        color: { primary: "#9CA3AF", secondary: "#6B7280", background: "#F3F4F6" },
        effects: { glow: false, sparkle: false, animation: null }
      },
      {
        id: "kichi",
        englishName: "rare",
        japaneseName: "吉",
        description: "良いことが起こりそうな予感です",
        probability: 0.25,
        value: 2,
        color: { primary: "#3B82F6", secondary: "#1E40AF", background: "#DBEAFE" },
        effects: { glow: false, sparkle: false, animation: null }
      },
      {
        id: "chukichi",
        englishName: "epic",
        japaneseName: "中吉",
        description: "かなり良いことが期待できます",
        probability: 0.15,
        value: 3,
        color: { primary: "#8B5CF6", secondary: "#5B21B6", background: "#E0E7FF" },
        effects: { glow: true, sparkle: true, animation: null }
      },
      {
        id: "daikichi",
        englishName: "legendary",
        japaneseName: "大吉",
        description: "最高の運勢！素晴らしいことが待っています",
        probability: 0.03,
        value: 4,
        color: { primary: "#F59E0B", secondary: "#92400E", background: "#FEF3C7" },
        effects: { glow: true, sparkle: true, animation: "pulse" }
      }
    ];
  }

  /**
   * すべての運勢を取得
   */
  async findAll(): Promise<Fortune[]> {
    const fortuneDataArray = await this.loadFortuneData();
    return Fortune.fromDataArray(fortuneDataArray);
  }

  /**
   * IDによる運勢検索
   */
  async findById(id: string): Promise<Fortune | null> {
    const fortunes = await this.findAll();
    return Fortune.findById(fortunes, id);
  }

  /**
   * 英語名による運勢検索（レガシーサポート）
   */
  async findByEnglishName(englishName: string): Promise<Fortune | null> {
    const fortunes = await this.findAll();
    return Fortune.findByEnglishName(fortunes, englishName);
  }

  /**
   * 有効な運勢のみを取得（disabledでないもの）
   */
  async findActiveFortunes(): Promise<Fortune[]> {
    const allFortunes = await this.findAll();
    return Fortune.getActiveFortunes(allFortunes);
  }

  /**
   * キャッシュをクリア（テスト用）
   */
  clearCache(): void {
    this.fortuneDataCache = null;
  }
}