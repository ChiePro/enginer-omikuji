import { Result } from '../../lib/Result';
import { ValidationError } from '../errors/ValidationErrors';

/**
 * おみくじタイトルフレーズ値オブジェクト
 * 
 * 責務: 20-40文字制限の保証、目を引く表現の妥当性
 * 不変条件: 文字数範囲、空白文字のみの禁止
 */
export class TitlePhrase {
  private static readonly MIN_LENGTH = 20;
  private static readonly MAX_LENGTH = 40;

  private constructor(private readonly value: string) {}

  static create(value: string): Result<TitlePhrase, ValidationError> {
    const trimmedValue = value.trim();

    // 文字数制限の検証
    if (trimmedValue.length < this.MIN_LENGTH) {
      return Result.error(
        ValidationError.create(
          'TITLE_TOO_SHORT', 
          `タイトルは${this.MIN_LENGTH}文字以上必要です。現在: ${trimmedValue.length}文字`
        )
      );
    }

    if (trimmedValue.length > this.MAX_LENGTH) {
      return Result.error(
        ValidationError.create(
          'TITLE_TOO_LONG',
          `タイトルは${this.MAX_LENGTH}文字以下にしてください。現在: ${trimmedValue.length}文字`
        )
      );
    }

    // 目を引く表現の基本検証
    if (!this.isEyeCatching(trimmedValue)) {
      return Result.error(
        ValidationError.create(
          'TITLE_NOT_EYE_CATCHING',
          'タイトルは感嘆符や特徴的な表現を含む必要があります'
        )
      );
    }

    return Result.success(new TitlePhrase(trimmedValue));
  }

  /**
   * 目を引く表現の判定
   */
  private static isEyeCatching(value: string): boolean {
    const eyeCatchingPatterns = [
      /[！!]/, // 感嘆符
      /[神最高絶対完璧究極降臨]/, // 極端な表現
      /.*(今日|本日).*(日|時)/, // 時間的特別感
      /[✨🌟⚡🎯🚀💫]/, // 装飾文字
      /バグゼロ|脳汁/, // エンジニア的興奮表現
      /CI\/CD/ // 技術用語の一部
    ];
    
    return eyeCatchingPatterns.some(pattern => pattern.test(value));
  }

  getValue(): string {
    return this.value;
  }

  isValid(): boolean {
    return this.value.length >= TitlePhrase.MIN_LENGTH && 
           this.value.length <= TitlePhrase.MAX_LENGTH;
  }

  /**
   * エンジニア関連用語が含まれるかチェック
   */
  hasEngineerTerms(): boolean {
    const engineerTerms = [
      'コード', 'バグ', 'デプロイ', 'リファクタ', 'マージ', 'プルリク',
      'CI/CD', 'パイプライン', 'リリース', 'レビュー', 'コミット',
      'フレームワーク', 'アーキテクチャ', 'API', 'GitHub', 'ペアプロ'
    ];
    
    return engineerTerms.some(term => this.value.includes(term));
  }
}