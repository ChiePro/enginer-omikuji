/**
 * Omikuji Result Data Type Definitions
 * 
 * These types define the structure for omikuji result data files
 * and validation interfaces used in task 4.2
 */

export type EmotionAttribute = 'positive' | 'neutral' | 'negative';

export type CategoryName = '恋愛運' | '仕事運' | '健康運' | '金運' | '学業運';

export type FileStatus = 'active' | 'draft' | 'deprecated';

export interface FortuneCategory {
  name: CategoryName;
  content: string;
  emotionTone: EmotionAttribute;
}

export interface OmikujiResult {
  id: string;
  titlePhrase: string;
  description: string;
  emotionAttribute: EmotionAttribute;
  categories: FortuneCategory[];
}

export interface EmotionDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

export interface OmikujiResultMetadata {
  lastUpdated: string; // ISO 8601 date string
  contentVersion: string; // Semantic version
  totalVariations: number;
  status: FileStatus;
  emotionDistributionRules?: Record<string, EmotionDistribution>;
}

export interface OmikujiResultData {
  omikujiTypeId: string;
  results: Record<string, OmikujiResult[]>; // fortuneId -> OmikujiResult[]
  metadata: OmikujiResultMetadata;
}

// Validation types
export interface ValidationError {
  type: string;
  message: string;
  context?: Record<string, any>;
}

export interface ValidationWarning {
  type: string;
  message: string;
  context?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface DirectoryValidationResult {
  isValid: boolean;
  validatedFiles: string[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
}