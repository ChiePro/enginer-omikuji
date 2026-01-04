import { Result } from '../../lib/Result';
import { ValidationError } from '../errors/ValidationErrors';
import { FortuneCategory } from './FortuneCategory';

/**
 * 運勢カテゴリコレクション値オブジェクト
 * 
 * 責務: 複数の運勢カテゴリの管理、必須カテゴリの検証、重複の防止
 * 不変条件: カテゴリIDの一意性、必須カテゴリの充足性確認
 */
export class FortuneCategoryCollection {
  private readonly categoriesMap: Map<string, FortuneCategory>;
  private static readonly REQUIRED_CATEGORY_IDS = ['love', 'work', 'health', 'money', 'study'];

  private constructor(categories: Map<string, FortuneCategory>) {
    this.categoriesMap = new Map(categories);
  }

  /**
   * 空のコレクションを作成
   */
  static empty(): FortuneCategoryCollection {
    return new FortuneCategoryCollection(new Map());
  }

  /**
   * 必須カテゴリで初期化されたコレクションを作成
   */
  static withRequiredCategories(): FortuneCategoryCollection {
    const requiredCategories = FortuneCategory.getAllRequiredCategories();
    const categoriesMap = new Map<string, FortuneCategory>();
    
    requiredCategories.forEach(category => {
      categoriesMap.set(category.getId(), category);
    });

    return new FortuneCategoryCollection(categoriesMap);
  }

  /**
   * カテゴリ配列からコレクションを作成
   */
  static fromCategories(categories: FortuneCategory[]): Result<FortuneCategoryCollection, ValidationError> {
    const categoriesMap = new Map<string, FortuneCategory>();

    for (const category of categories) {
      if (categoriesMap.has(category.getId())) {
        return Result.error(
          ValidationError.create(
            'FORTUNE_CATEGORY_COLLECTION_DUPLICATE',
            `カテゴリID「${category.getId()}」が重複しています`
          )
        );
      }
      categoriesMap.set(category.getId(), category);
    }

    return Result.success(new FortuneCategoryCollection(categoriesMap));
  }

  /**
   * カテゴリを追加した新しいコレクションを返す
   */
  add(category: FortuneCategory): Result<FortuneCategoryCollection, ValidationError> {
    if (this.contains(category.getId())) {
      return Result.error(
        ValidationError.create(
          'FORTUNE_CATEGORY_COLLECTION_DUPLICATE',
          `カテゴリID「${category.getId()}」は既に存在します`
        )
      );
    }

    const newMap = new Map(this.categoriesMap);
    newMap.set(category.getId(), category);
    
    return Result.success(new FortuneCategoryCollection(newMap));
  }

  /**
   * カテゴリを削除した新しいコレクションを返す
   */
  remove(categoryId: string): Result<FortuneCategoryCollection, ValidationError> {
    if (!this.contains(categoryId)) {
      return Result.error(
        ValidationError.create(
          'FORTUNE_CATEGORY_COLLECTION_NOT_FOUND',
          `カテゴリID「${categoryId}」が見つかりません`
        )
      );
    }

    const newMap = new Map(this.categoriesMap);
    newMap.delete(categoryId);
    
    return Result.success(new FortuneCategoryCollection(newMap));
  }

  /**
   * 運勢レベルを設定した新しいコレクションを返す
   */
  withFortuneLevels(levels: Record<string, string>): Result<FortuneCategoryCollection, ValidationError> {
    const newMap = new Map<string, FortuneCategory>();

    // 既存のカテゴリを基にマップを作成
    for (const [id, category] of this.categoriesMap) {
      newMap.set(id, category);
    }

    // レベル設定を適用
    for (const [categoryId, level] of Object.entries(levels)) {
      const existingCategory = this.categoriesMap.get(categoryId);
      if (!existingCategory) {
        return Result.error(
          ValidationError.create(
            'FORTUNE_CATEGORY_COLLECTION_NOT_FOUND',
            `カテゴリID「${categoryId}」が見つかりません`
          )
        );
      }

      const categoryWithLevel = existingCategory.withFortuneLevel(level);
      newMap.set(categoryId, categoryWithLevel);
    }

    return Result.success(new FortuneCategoryCollection(newMap));
  }

  /**
   * IDでカテゴリを検索
   */
  findById(categoryId: string): FortuneCategory | undefined {
    return this.categoriesMap.get(categoryId);
  }

  /**
   * カテゴリが含まれているかチェック
   */
  contains(categoryId: string): boolean {
    return this.categoriesMap.has(categoryId);
  }

  /**
   * コレクションのサイズを取得
   */
  size(): number {
    return this.categoriesMap.size;
  }

  /**
   * コレクションが空かチェック
   */
  isEmpty(): boolean {
    return this.categoriesMap.size === 0;
  }

  /**
   * 必須カテゴリがすべて含まれているかチェック
   */
  hasAllRequiredCategories(): boolean {
    return FortuneCategoryCollection.REQUIRED_CATEGORY_IDS.every(
      id => this.categoriesMap.has(id)
    );
  }

  /**
   * コレクションが完全(必須カテゴリすべて含む)かチェック
   */
  isComplete(): boolean {
    return this.hasAllRequiredCategories();
  }

  /**
   * 不足している必須カテゴリIDの配列を取得
   */
  getMissingRequiredCategories(): string[] {
    return FortuneCategoryCollection.REQUIRED_CATEGORY_IDS.filter(
      id => !this.categoriesMap.has(id)
    );
  }

  /**
   * 必須カテゴリのみを取得
   */
  getRequiredCategories(): FortuneCategory[] {
    return Array.from(this.categoriesMap.values()).filter(
      category => category.isRequired()
    );
  }

  /**
   * すべてのカテゴリを配列として取得
   */
  toArray(): FortuneCategory[] {
    return Array.from(this.categoriesMap.values());
  }

  /**
   * カテゴリIDの配列を取得
   */
  getCategoryIds(): string[] {
    return Array.from(this.categoriesMap.keys());
  }

  /**
   * 同一性の判定（含まれるカテゴリが同じかどうか）
   */
  equals(other: FortuneCategoryCollection): boolean {
    if (this.size() !== other.size()) {
      return false;
    }

    for (const id of this.categoriesMap.keys()) {
      if (!other.contains(id)) {
        return false;
      }
    }

    return true;
  }

  /**
   * イテレート可能なインターフェース
   */
  [Symbol.iterator](): Iterator<FortuneCategory> {
    return this.categoriesMap.values();
  }

  /**
   * デバッグ用の文字列表現
   */
  toString(): string {
    const categoryNames = Array.from(this.categoriesMap.values())
      .map(c => c.getDisplayName())
      .join(', ');
    return `FortuneCategoryCollection(${this.size()}件: ${categoryNames})`;
  }
}