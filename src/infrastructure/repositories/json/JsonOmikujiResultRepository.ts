import { IOmikujiResultRepository, Result, RepositoryError } from '../../../domain/repositories/IOmikujiResultRepository';
import { OmikujiResult } from '../../../domain/entities/OmikujiResult';
import { OmikujiType } from '../../../domain/entities/OmikujiType';
import { Fortune } from '../../../domain/valueObjects/Fortune';
import * as path from 'path';
import * as fs from 'fs/promises';

interface OmikujiResultData {
  omikujiTypeId: string;
  results: {
    [fortuneId: string]: Array<{
      id: string;
      titlePhrase: string;
      description: string;
      emotionAttribute: 'positive' | 'neutral' | 'negative';
      categories: Array<{
        name: '恋愛運' | '仕事運' | '健康運' | '金運' | '学業運';
        content: string;
        emotionTone: 'positive' | 'neutral' | 'negative';
      }>;
    }>;
  };
  metadata: {
    lastUpdated: string;
    contentVersion: string;
  };
}

export class JsonOmikujiResultRepository implements IOmikujiResultRepository {
  private readonly dataDirectory = path.join(process.cwd(), 'data', 'results');

  async findByTypeAndFortune(typeId: string, fortuneId: string): Promise<Result<OmikujiResult[], RepositoryError>> {
    try {
      const filePath = path.join(this.dataDirectory, `${typeId}.json`);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return {
          success: false,
          error: { type: 'FILE_NOT_FOUND', typeId }
        };
      }

      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data: OmikujiResultData = JSON.parse(fileContent);
      
      const resultsForFortune = data.results[fortuneId] || [];
      const omikujiResults = resultsForFortune.map(resultData => this.createOmikujiResult(resultData, typeId, fortuneId));
      
      return {
        success: true,
        data: omikujiResults
      };
    } catch (error) {
      return {
        success: false,
        error: { type: 'PARSE_ERROR', message: (error as Error).message }
      };
    }
  }

  async findAll(typeId: string): Promise<Result<OmikujiResult[], RepositoryError>> {
    try {
      const filePath = path.join(this.dataDirectory, `${typeId}.json`);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return {
          success: false,
          error: { type: 'FILE_NOT_FOUND', typeId }
        };
      }

      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data: OmikujiResultData = JSON.parse(fileContent);
      
      const allResults: OmikujiResult[] = [];
      
      for (const [fortuneId, resultsForFortune] of Object.entries(data.results)) {
        const omikujiResults = resultsForFortune.map(resultData => this.createOmikujiResult(resultData, typeId, fortuneId));
        allResults.push(...omikujiResults);
      }
      
      return {
        success: true,
        data: allResults
      };
    } catch (error) {
      return {
        success: false,
        error: { type: 'PARSE_ERROR', message: (error as Error).message }
      };
    }
  }

  private createOmikujiResult(resultData: any, typeId: string, fortuneId: string): OmikujiResult {
    // Create OmikujiType based on typeId
    const omikujiType = OmikujiType.create({
      id: typeId,
      name: this.getTypeNameById(typeId),
      description: this.getTypeDescriptionById(typeId),
      icon: this.getTypeIconById(typeId),
      color: { primary: '#000000', secondary: '#FFFFFF' },
      sortOrder: 1
    });

    // Create Fortune based on fortuneId
    const fortune = Fortune.fromData({
      id: fortuneId,
      englishName: this.getFortuneEnglishNameById(fortuneId),
      japaneseName: this.getFortuneJapaneseNameById(fortuneId),
      description: this.getFortuneDescriptionById(fortuneId),
      probability: this.getFortuneProbabilityById(fortuneId),
      value: this.getFortuneValueById(fortuneId),
      color: {
        primary: '#000000',
        secondary: '#FFFFFF', 
        background: '#F0F0F0'
      },
      effects: {
        glow: false,
        sparkle: false,
        animation: null
      }
    });

    return OmikujiResult.create({
      omikujiType,
      fortune
    });
  }

  private getTypeNameById(typeId: string): string {
    const typeNames: Record<string, string> = {
      'engineer-fortune': 'エンジニア運勢',
      'tech-selection': '技術選定おみくじ'
    };
    return typeNames[typeId] || 'Unknown Type';
  }

  private getTypeDescriptionById(typeId: string): string {
    const typeDescriptions: Record<string, string> = {
      'engineer-fortune': '今日のコーディングを占う',
      'tech-selection': '次に学ぶ技術を決める'
    };
    return typeDescriptions[typeId] || 'Unknown Description';
  }

  private getTypeIconById(typeId: string): string {
    const typeIcons: Record<string, string> = {
      'engineer-fortune': '⚡',
      'tech-selection': '🎲'
    };
    return typeIcons[typeId] || '❓';
  }

  private getFortuneEnglishNameById(fortuneId: string): string {
    const englishNames: Record<string, string> = {
      'daikichi': 'legendary',
      'chukichi': 'epic',
      'kichi': 'rare',
      'shokichi': 'common',
      'kyo': 'unlucky',
      'daikyo': 'very-unlucky'
    };
    return englishNames[fortuneId] || 'unknown';
  }

  private getFortuneJapaneseNameById(fortuneId: string): string {
    const japaneseNames: Record<string, string> = {
      'daikichi': '大吉',
      'chukichi': '中吉',
      'kichi': '吉',
      'shokichi': '小吉',
      'kyo': '凶',
      'daikyo': '大凶'
    };
    return japaneseNames[fortuneId] || '不明';
  }

  private getFortuneDescriptionById(fortuneId: string): string {
    const descriptions: Record<string, string> = {
      'daikichi': '最高の運勢！素晴らしいことが待っています',
      'chukichi': 'かなり良いことが期待できます',
      'kichi': '良いことが起こりそうな予感です',
      'shokichi': '少しずつ良いことがありそうです',
      'kyo': '注意深く行動しましょう',
      'daikyo': '今日は慎重に過ごしましょう'
    };
    return descriptions[fortuneId] || '運勢不明';
  }

  private getFortuneProbabilityById(fortuneId: string): number {
    const probabilities: Record<string, number> = {
      'daikichi': 0.03,
      'chukichi': 0.15,
      'kichi': 0.25,
      'shokichi': 0.30,
      'kyo': 0.15,
      'daikyo': 0.12
    };
    return probabilities[fortuneId] || 0.1;
  }

  private getFortuneValueById(fortuneId: string): number {
    const values: Record<string, number> = {
      'daikichi': 4,
      'chukichi': 3,
      'kichi': 2,
      'shokichi': 1,
      'kyo': -1,
      'daikyo': -2
    };
    return values[fortuneId] || 0;
  }
}