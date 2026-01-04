/**
 * Omikuji Results Feature - Public API
 * 
 * Main entry point for the omikuji results system.
 * Exports all public types, interfaces, and services.
 */

// Core Type Definitions
export type {
  OmikujiType,
  FortuneType,
  EmotionAttribute,
  Fortune,
  Category,
  OmikujiResult,
  OmikujiDrawRequest,
  OmikujiDrawResponse,
  DrawResult,
  DrawError,
  SuccessResult,
  FailureResult,
  Result
} from './types/omikuji';

// Domain Entities
export { OmikujiResult as OmikujiResultEntity } from './domain/entities/OmikujiResult';
export { OmikujiType as OmikujiTypeEntity } from './domain/entities/OmikujiType';

// Value Objects
export { TitlePhrase } from './domain/valueObjects/TitlePhrase';
export { Description } from './domain/valueObjects/Description';
export { EmotionAttribute as EmotionAttributeVO } from './domain/valueObjects/EmotionAttribute';
export { EmotionAttributeDistribution } from './domain/valueObjects/EmotionAttributeDistribution';
export { FortuneCategory } from './domain/valueObjects/FortuneCategory';
export { FortuneCategoryCollection } from './domain/valueObjects/FortuneCategoryCollection';
export { Fortune as FortuneVO } from './domain/valueObjects/Fortune';

// Services
export { OmikujiDrawService } from './domain/services/OmikujiDrawService';
export { EmotionAttributeCalculator } from './domain/services/EmotionAttributeCalculator';
export { RarityCalculatorService } from './domain/services/RarityCalculatorService';

// Repository Interfaces
export type { 
  IOmikujiResultRepository,
  RepositoryError,
  Result as RepositoryResult
} from './domain/repositories/IOmikujiResultRepository';

// Repository Implementations
export { JsonOmikujiResultRepository } from './infrastructure/repositories/json/JsonOmikujiResultRepository';
export { JsonFortuneRepository } from './infrastructure/repositories/json/FortuneRepository';

// Layout and UI Components
export { TraditionalLayoutEngine } from './features/omikuji/layout/TraditionalLayoutEngine';

// Error Types
export type { ApplicationError } from './domain/errors/ApplicationErrors';
export type { ValidationError } from './domain/errors/ValidationErrors';

// Utility Types
export type { OmikujiResultData } from './types/omikujiResultData';

// Result Wrapper
export type { Result as UtilResult } from './lib/Result';

/**
 * Common imports for working with the omikuji results system:
 * 
 * @example
 * ```typescript
 * import {
 *   OmikujiDrawService,
 *   JsonOmikujiResultRepository,
 *   JsonFortuneRepository,
 *   type OmikujiType,
 *   type FortuneType,
 *   type DrawResult
 * } from '@/src';
 * 
 * const resultRepo = new JsonOmikujiResultRepository();
 * const fortuneRepo = new JsonFortuneRepository();
 * const drawService = new OmikujiDrawService(resultRepo, fortuneRepo);
 * 
 * const result = await drawService.draw('engineer-fortune', 500);
 * ```
 */