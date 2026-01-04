import { Result } from '../../lib/Result';
import { ValidationError } from '../errors/ValidationErrors';

/**
 * 運勢カテゴリ値オブジェクト
 * 
 * 責務: おみくじの各運勢カテゴリ（恋愛運、仕事運など）の表現
 * 不変条件: 有効なID形式、空でない表示名と説明文
 */
export class FortuneCategory {
  private constructor(
    private readonly id: string,
    private readonly displayName: string,
    private readonly description: string,
    private readonly required: boolean = false,
    private readonly fortuneLevel?: string
  ) {}

  /**
   * カスタム運勢カテゴリを作成
   */
  static create(
    id: string,
    displayName: string,
    description: string,
    required: boolean = false
  ): Result<FortuneCategory, ValidationError> {
    // IDの検証
    if (!this.isValidId(id)) {
      return Result.error(
        ValidationError.create(
          'FORTUNE_CATEGORY_INVALID_ID',
          'カテゴリIDは英数字とアンダースコアのみで構成される必要があります'
        )
      );
    }

    // 表示名の検証
    if (!displayName || displayName.trim() === '') {
      return Result.error(
        ValidationError.create(
          'FORTUNE_CATEGORY_INVALID_DISPLAY_NAME',
          '表示名は空にできません'
        )
      );
    }

    // 説明文の検証
    if (!description || description.trim() === '') {
      return Result.error(
        ValidationError.create(
          'FORTUNE_CATEGORY_INVALID_DESCRIPTION',
          '説明文は空にできません'
        )
      );
    }

    return Result.success(new FortuneCategory(
      id,
      displayName.trim(),
      description.trim(),
      required
    ));
  }

  /**
   * IDの形式が有効かチェック
   */
  private static isValidId(id: string): boolean {
    return /^[a-zA-Z0-9_]+$/.test(id) && id.length > 0;
  }

  /**
   * 恋愛運カテゴリを作成
   */
  static createLove(): FortuneCategory {
    return new FortuneCategory(
      'love',
      '恋愛運',
      'あなたの恋愛に関する運勢。新しい出会い、既存の関係の発展、恋人との関係性について',
      true
    );
  }

  /**
   * 仕事運カテゴリを作成
   */
  static createWork(): FortuneCategory {
    return new FortuneCategory(
      'work',
      '仕事運',
      'あなたの仕事に関する運勢。業務の成果、同僚との関係、キャリアアップの可能性について',
      true
    );
  }

  /**
   * 健康運カテゴリを作成
   */
  static createHealth(): FortuneCategory {
    return new FortuneCategory(
      'health',
      '健康運',
      'あなたの健康に関する運勢。体調管理、病気予防、心身の調子について',
      true
    );
  }

  /**
   * 金運カテゴリを作成
   */
  static createMoney(): FortuneCategory {
    return new FortuneCategory(
      'money',
      '金運',
      'あなたの金銭に関する運勢。収入、支出、投資、臨時収入の可能性について',
      true
    );
  }

  /**
   * 学業運カテゴリを作成
   */
  static createStudy(): FortuneCategory {
    return new FortuneCategory(
      'study',
      '学業運',
      'あなたの学習に関する運勢。スキル習得、資格取得、知識の定着について',
      true
    );
  }

  /**
   * 全必須カテゴリを取得
   */
  static getAllRequiredCategories(): FortuneCategory[] {
    return [
      this.createLove(),
      this.createWork(),
      this.createHealth(),
      this.createMoney(),
      this.createStudy()
    ];
  }

  /**
   * 運勢レベルを設定した新しいインスタンスを返す
   */
  withFortuneLevel(level: string): FortuneCategory {
    return new FortuneCategory(
      this.id,
      this.displayName,
      this.description,
      this.required,
      level
    );
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getDisplayName(): string {
    return this.displayName;
  }

  getDescription(): string {
    return this.description;
  }

  isRequired(): boolean {
    return this.required;
  }

  getFortuneLevel(): string | undefined {
    return this.fortuneLevel;
  }

  hasFortuneLevel(): boolean {
    return this.fortuneLevel !== undefined;
  }

  /**
   * 同一性の判定（IDベース）
   */
  equals(other: FortuneCategory): boolean {
    return this.id === other.id;
  }

  /**
   * CSS用のクラス名を生成
   */
  getCssClassName(): string {
    return `fortune-category-${this.id}`;
  }

  /**
   * デバッグ用の文字列表現
   */
  toString(): string {
    const levelPart = this.fortuneLevel ? `, level: ${this.fortuneLevel}` : '';
    return `FortuneCategory(${this.id}: ${this.displayName}${levelPart})`;
  }
}