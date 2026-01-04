import fs from 'fs/promises';
import path from 'path';
import type { 
  OmikujiResultData,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  DirectoryValidationResult,
  EmotionDistribution,
  CategoryName,
  EmotionAttribute,
  FileStatus
} from '../../types/omikujiResultData';

/**
 * Omikuji Result Data Validation Script
 * 
 * Validates the structure and content of omikuji result data files
 * following TDD approach for task 4.2
 */

const REQUIRED_CATEGORIES: CategoryName[] = ['恋愛運', '仕事運', '健康運', '金運', '学業運'];
const ENGINEER_TERMS = [
  'コード', 'バグ', 'デプロイ', 'リファクタ', 'マージ', 'プルリク',
  'CI/CD', 'パイプライン', 'リリース', 'レビュー', 'コミット',
  'フレームワーク', 'アーキテクチャ', 'API', 'GitHub', 'ペアプロ'
];

const VALID_STATUSES: FileStatus[] = ['active', 'draft', 'deprecated'];

/**
 * 単一のおみくじ結果ファイルを検証する
 */
export function validateOmikujiResultFile(data: OmikujiResultData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // メタデータの検証
  validateMetadata(data.metadata, errors);

  // 各結果の検証
  for (const [fortuneId, results] of Object.entries(data.results)) {
    // バリエーション数の警告
    if (results.length < 3) {
      warnings.push({
        type: 'INSUFFICIENT_VARIATIONS',
        message: `運勢「${fortuneId}」には3つ以上のバリエーションを用意することを推奨します。現在: ${results.length}個`,
        context: { fortuneId, variationCount: results.length }
      });
    }

    for (const result of results) {
      validateSingleResult(result, errors, warnings);
    }
  }

  // 感情属性確率分布の検証
  if (data.metadata.emotionDistributionRules) {
    validateEmotionDistributionRules(data.metadata.emotionDistributionRules, errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 指定されたおみくじタイプのすべての結果ファイルを検証する
 */
export async function validateAllResultFiles(
  omikujiTypes: string[],
  resultsDir: string = 'data/results'
): Promise<DirectoryValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const validatedFiles: string[] = [];

  for (const typeId of omikujiTypes) {
    const fileName = `${typeId}.json`;
    const filePath = path.join(process.cwd(), resultsDir, fileName);

    try {
      // ファイルの存在確認
      await fs.access(filePath);
      
      // ファイル内容の読み込みと検証
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data: OmikujiResultData = JSON.parse(fileContent);
      
      const validation = validateOmikujiResultFile(data);
      
      if (validation.isValid) {
        validatedFiles.push(fileName);
      } else {
        // ファイル固有のエラーにファイル情報を追加
        validation.errors.forEach(error => {
          errors.push({
            ...error,
            context: { ...error.context, fileName }
          });
        });
      }

      // 警告も収集
      validation.warnings.forEach(warning => {
        warnings.push({
          ...warning,
          context: { ...warning.context, fileName }
        });
      });

    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        errors.push({
          type: 'FILE_NOT_FOUND',
          message: `結果ファイル「${fileName}」が見つかりません`,
          context: { fileName, typeId }
        });
      } else {
        errors.push({
          type: 'FILE_READ_ERROR',
          message: `ファイル「${fileName}」の読み込みに失敗しました: ${(error as Error).message}`,
          context: { fileName, typeId, error: error as Error }
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    validatedFiles,
    errors,
    warnings
  };
}

/**
 * メタデータの検証
 */
function validateMetadata(metadata: any, errors: ValidationError[]): void {
  // lastUpdated の検証
  if (!metadata.lastUpdated || !isValidISODate(metadata.lastUpdated)) {
    errors.push({
      type: 'INVALID_DATE_FORMAT',
      message: 'lastUpdatedは有効なISO 8601形式の日付である必要があります',
      context: { lastUpdated: metadata.lastUpdated }
    });
  }

  // totalVariations の検証
  if (typeof metadata.totalVariations !== 'number' || metadata.totalVariations < 0) {
    errors.push({
      type: 'INVALID_TOTAL_VARIATIONS',
      message: 'totalVariationsは0以上の数値である必要があります',
      context: { totalVariations: metadata.totalVariations }
    });
  }

  // status の検証
  if (!VALID_STATUSES.includes(metadata.status)) {
    errors.push({
      type: 'INVALID_STATUS',
      message: `statusは次のいずれかである必要があります: ${VALID_STATUSES.join(', ')}`,
      context: { status: metadata.status }
    });
  }
}

/**
 * 単一の結果の検証
 */
function validateSingleResult(result: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
  // タイトルフレーズの文字数検証
  const titleLength = result.titlePhrase?.trim().length || 0;
  if (titleLength < 20) {
    errors.push({
      type: 'TITLE_TOO_SHORT',
      message: `タイトルフレーズは20文字以上必要です。現在: ${titleLength}文字`,
      context: { resultId: result.id, titleLength, title: result.titlePhrase }
    });
  } else if (titleLength > 40) {
    errors.push({
      type: 'TITLE_TOO_LONG',
      message: `タイトルフレーズは40文字以下にしてください。現在: ${titleLength}文字`,
      context: { resultId: result.id, titleLength, title: result.titlePhrase }
    });
  }

  // 説明文の文字数検証
  const descriptionLength = result.description?.trim().length || 0;
  if (descriptionLength < 100) {
    errors.push({
      type: 'DESCRIPTION_TOO_SHORT',
      message: `説明文は100文字以上必要です。現在: ${descriptionLength}文字`,
      context: { resultId: result.id, descriptionLength }
    });
  } else if (descriptionLength > 300) {
    errors.push({
      type: 'DESCRIPTION_TOO_LONG',
      message: `説明文は300文字以下にしてください。現在: ${descriptionLength}文字`,
      context: { resultId: result.id, descriptionLength }
    });
  }

  // カテゴリの検証
  validateCategories(result.categories, result.id, errors);

  // エンジニア特化表現の検証（警告）
  checkEngineerTerms(result, warnings);
}

/**
 * カテゴリの検証
 */
function validateCategories(categories: any[], resultId: string, errors: ValidationError[]): void {
  if (!categories || !Array.isArray(categories)) {
    errors.push({
      type: 'INVALID_CATEGORIES',
      message: 'categoriesは配列である必要があります',
      context: { resultId }
    });
    return;
  }

  const presentCategories = categories.map(c => c.name);
  const missingCategories = REQUIRED_CATEGORIES.filter(
    required => !presentCategories.includes(required)
  );

  if (missingCategories.length > 0) {
    errors.push({
      type: 'MISSING_REQUIRED_CATEGORIES',
      message: `以下の必須カテゴリが不足しています: ${missingCategories.join(', ')}`,
      context: { resultId, missingCategories, presentCategories }
    });
  }
}

/**
 * エンジニア特化表現の検証
 */
function checkEngineerTerms(result: any, warnings: ValidationWarning[]): void {
  const combinedText = `${result.titlePhrase} ${result.description} ${
    result.categories?.map((c: any) => c.content).join(' ') || ''
  }`;

  const hasEngineerTerms = ENGINEER_TERMS.some(term => combinedText.includes(term));

  if (!hasEngineerTerms) {
    warnings.push({
      type: 'MISSING_ENGINEER_TERMS',
      message: 'エンジニア特化の表現が含まれていません。技術用語を含めることを推奨します',
      context: { resultId: result.id }
    });
  }
}

/**
 * 感情属性確率分布の検証
 */
function validateEmotionDistributionRules(
  rules: Record<string, EmotionDistribution>,
  errors: ValidationError[]
): void {
  for (const [fortuneId, distribution] of Object.entries(rules)) {
    const total = distribution.positive + distribution.neutral + distribution.negative;
    
    if (Math.abs(total - 1.0) > 0.0001) {
      errors.push({
        type: 'INVALID_EMOTION_DISTRIBUTION',
        message: `運勢「${fortuneId}」の感情属性確率の合計は1.0である必要があります。現在: ${total}`,
        context: { fortuneId, distribution, total }
      });
    }

    // 各確率が0.0-1.0の範囲内かチェック
    const probabilities = [distribution.positive, distribution.neutral, distribution.negative];
    if (probabilities.some(p => p < 0 || p > 1)) {
      errors.push({
        type: 'INVALID_PROBABILITY_RANGE',
        message: `運勢「${fortuneId}」の確率は0.0から1.0の範囲内である必要があります`,
        context: { fortuneId, distribution }
      });
    }
  }
}

/**
 * ISO 8601日付形式の検証
 */
function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date.toISOString() === dateString;
  } catch {
    return false;
  }
}

/**
 * CLI実行用のメイン関数
 */
export async function main(): Promise<void> {
  const expectedOmikujiTypes = [
    'engineer-fortune',
    'tech-selection',
    'debug-fortune', 
    'code-review-fortune',
    'deploy-fortune'
  ];

  console.log('🔍 Omikuji Result Data Validation Starting...\n');

  const result = await validateAllResultFiles(expectedOmikujiTypes);

  if (result.isValid) {
    console.log('✅ All validation passed!');
    console.log(`📁 Validated files: ${result.validatedFiles.join(', ')}`);
  } else {
    console.log('❌ Validation failed:');
    result.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.type}: ${error.message}`);
      if (error.context) {
        console.log(`     Context: ${JSON.stringify(error.context, null, 2)}`);
      }
    });
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning.type}: ${warning.message}`);
    });
  }

  process.exit(result.isValid ? 0 : 1);
}

// CLI実行時の処理
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Validation script error:', error);
    process.exit(1);
  });
}