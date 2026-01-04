import { Result } from '../../lib/Result';
import { ValidationError } from '../errors/ValidationErrors';

/**
 * おみくじ説明文値オブジェクト
 * 
 * 責務: 100-300文字制限の保証、適切な内容の妥当性
 * 不変条件: 文字数範囲、空白文字のみの禁止、おみくじらしい表現
 */
export class Description {
  private static readonly MIN_LENGTH = 100;
  private static readonly MAX_LENGTH = 300;

  private constructor(private readonly value: string) {}

  static create(value: string): Result<Description, ValidationError> {
    // 内容の妥当性検証（trimming前にチェック）
    if (this.isWhitespaceOnly(value) && value.length >= this.MIN_LENGTH) {
      return Result.error(
        ValidationError.create(
          'DESCRIPTION_INVALID_CONTENT',
          '説明文は空白文字のみにはできません'
        )
      );
    }

    const trimmedValue = value.trim();

    // 文字数制限の検証
    if (trimmedValue.length < this.MIN_LENGTH) {
      return Result.error(
        ValidationError.create(
          'DESCRIPTION_TOO_SHORT',
          `説明文は${this.MIN_LENGTH}文字以上必要です。現在: ${trimmedValue.length}文字`
        )
      );
    }

    if (trimmedValue.length > this.MAX_LENGTH) {
      return Result.error(
        ValidationError.create(
          'DESCRIPTION_TOO_LONG',
          `説明文は${this.MAX_LENGTH}文字以下にしてください。現在: ${trimmedValue.length}文字`
        )
      );
    }

    return Result.success(new Description(trimmedValue));
  }

  /**
   * 空白文字のみかどうかの判定
   */
  private static isWhitespaceOnly(value: string): boolean {
    return /^\s*$/.test(value);
  }

  getValue(): string {
    return this.value;
  }

  /**
   * 文字数が有効範囲内かチェック
   */
  isValidLength(): boolean {
    return this.value.length >= Description.MIN_LENGTH && 
           this.value.length <= Description.MAX_LENGTH;
  }

  /**
   * 文字数カウントを取得
   */
  getCharacterCount(): number {
    return this.value.length;
  }

  /**
   * おみくじらしい期待感のある表現が含まれるかチェック
   */
  hasFortuneExpression(): boolean {
    const fortuneExpressions = [
      '素晴らしい', '開花', '深まり', '高まる', '得られる', '予感',
      'そうです', 'でしょう', 'なりそう', '期待', '幸運', '成果',
      '順調', '理想的', '絶好', 'タイミング', '良好', '前進'
    ];
    
    return fortuneExpressions.some(expression => this.value.includes(expression));
  }

  /**
   * エンジニア関連の内容が含まれるかチェック
   */
  hasEngineerContent(): boolean {
    const engineerTerms = [
      'コード', 'バグ', 'デプロイ', 'リファクタリング', 'フレームワーク',
      'アーキテクチャ', 'パイプライン', 'テスト', 'CI/CD', 'カバレッジ',
      'レビュー', '実装', '自動化', '品質', 'アルゴリズム', 'API',
      'データベース', 'インフラ', '技術', 'プログラミング', 'システム'
    ];
    
    return engineerTerms.some(term => this.value.includes(term));
  }

  /**
   * 同一性の判定
   */
  equals(other: Description): boolean {
    return this.value === other.value;
  }

  /**
   * デバッグ用の文字列表現
   */
  toString(): string {
    return `Description(${this.value.substring(0, 30)}..., ${this.getCharacterCount()}文字)`;
  }
}