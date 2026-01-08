import { FortuneCategory } from '../valueObjects/FortuneCategory';
import { OmikujiResult } from '../entities/OmikujiResult';
import { OmikujiType } from '../entities/OmikujiType';
import { Fortune } from '../valueObjects/Fortune';

/**
 * FortuneCategory値オブジェクト互換性レイヤー
 * 
 * Task 5.2: 既存FortuneCategory構造の変更なしでランダム化実装
 * 
 * 責務：
 * - 既存OmikujiResultエンティティ形式での結果返却
 * - ドメイン境界とトランザクション整合性の維持
 * - 下位互換性の完全保持
 * 
 * 設計原則：
 * - FortuneCategory値オブジェクトは既存インターフェースを完全保持
 * - OmikujiResultの拡張はサブクラス化により非侵入的に実装
 * - シリアライゼーション/デシリアライゼーション対応で永続化互換性確保
 */
export class FortuneCategoryCompatibility {

  /**
   * 既存OmikujiResultにランダム化カテゴリを統合した互換結果を作成
   */
  createCompatibleResult(
    baseResult: OmikujiResult,
    randomizedCategories: FortuneCategory[] | null
  ): OmikujiResult {
    // Create extended result that maintains OmikujiResult interface
    const extended = new ExtendedOmikujiResult(
      baseResult.getOmikujiType(),
      baseResult.getFortune(),
      randomizedCategories,
      baseResult.getId(),
      baseResult.getCreatedAt()
    );

    return extended;
  }

  /**
   * 拡張結果からランダム化カテゴリを取得
   */
  getRandomizedCategories(result: OmikujiResult): FortuneCategory[] | null {
    if (result instanceof ExtendedOmikujiResult) {
      return result.getRandomizedCategories();
    }
    return null;
  }

  /**
   * トランザクション内での操作を実行
   */
  executeWithinTransaction<T>(operation: () => T): T {
    // Simple transaction simulation for compatibility testing
    try {
      return operation();
    } catch (error) {
      throw new Error(`Transaction failed: ${(error as Error).message}`);
    }
  }

  /**
   * シリアライズ可能な形式に変換
   */
  toSerializableFormat(result: OmikujiResult): SerializableOmikujiResult {
    const categories = this.getRandomizedCategories(result);
    
    return {
      id: result.getId(),
      omikujiType: {
        id: result.getOmikujiType().id.getValue(),
        name: result.getOmikujiType().name,
        description: result.getOmikujiType().description,
        icon: result.getOmikujiType().icon,
        color: {
          primary: result.getOmikujiType().color.getPrimary(),
          secondary: result.getOmikujiType().color.getSecondary(),
          accent: result.getOmikujiType().color.getAccent()
        },
        sortOrder: result.getOmikujiType().sortOrder
      },
      fortune: {
        id: result.getFortune().getId(),
        englishName: result.getFortune().getEnglishName(),
        japaneseName: result.getFortune().getJapaneseName(),
        description: result.getFortune().getDescription(),
        probability: result.getFortune().getProbability(),
        value: result.getFortune().getValue(),
        color: result.getFortune().getColor(),
        effects: result.getFortune().getEffects()
      },
      createdAt: result.getCreatedAt().toISOString(),
      randomizedCategories: categories?.map(cat => ({
        id: cat.getId(),
        displayName: cat.getDisplayName(),
        description: cat.getDescription(),
        required: cat.isRequired(),
        fortuneLevel: cat.getFortuneLevel()
      })) || null
    };
  }

  /**
   * シリアライズ可能な形式から復元
   */
  fromSerializableFormat(data: SerializableOmikujiResult): OmikujiResult {
    // Recreate OmikujiType
    const omikujiType = OmikujiType.create({
      id: data.omikujiType.id,
      name: data.omikujiType.name,
      description: data.omikujiType.description,
      icon: data.omikujiType.icon,
      color: data.omikujiType.color,
      sortOrder: data.omikujiType.sortOrder
    });

    // Recreate Fortune
    const fortune = Fortune.fromData({
      id: data.fortune.id,
      englishName: data.fortune.englishName,
      japaneseName: data.fortune.japaneseName,
      description: data.fortune.description,
      probability: data.fortune.probability,
      value: data.fortune.value,
      color: data.fortune.color,
      effects: data.fortune.effects
    });

    // Recreate categories if they exist
    let categories: FortuneCategory[] | null = null;
    if (data.randomizedCategories) {
      categories = data.randomizedCategories.map(catData => {
        const createResult = FortuneCategory.create(
          catData.id,
          catData.displayName,
          catData.description,
          catData.required
        );
        
        if (!createResult.isSuccess) {
          throw new Error(`Failed to recreate category: ${createResult.error.message}`);
        }

        const category = createResult.value;
        return catData.fortuneLevel 
          ? category.withFortuneLevel(catData.fortuneLevel)
          : category;
      });
    }

    return this.createCompatibleResult(
      new OmikujiResult(omikujiType, fortune, data.id, new Date(data.createdAt)),
      categories
    );
  }
}

/**
 * OmikujiResultを拡張しつつ既存インターフェースを完全に保持
 */
class ExtendedOmikujiResult extends OmikujiResult {
  constructor(
    omikujiType: OmikujiType,
    fortune: Fortune,
    private readonly randomizedCategories: FortuneCategory[] | null,
    id?: string,
    createdAt?: Date
  ) {
    super(omikujiType, fortune, id, createdAt);
  }

  getRandomizedCategories(): FortuneCategory[] | null {
    return this.randomizedCategories;
  }
}

// Type definitions for serialization
export interface SerializableOmikujiResult {
  id: string;
  omikujiType: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: any;
    sortOrder: number;
  };
  fortune: {
    id: string;
    englishName: string;
    japaneseName: string;
    description: string;
    probability: number;
    value: number;
    color: any;
    effects: any;
  };
  createdAt: string;
  randomizedCategories: {
    id: string;
    displayName: string;
    description: string;
    required: boolean;
    fortuneLevel?: string;
  }[] | null;
}