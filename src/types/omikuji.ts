/**
 * Omikuji System Type Definitions
 * 
 * Core types for the omikuji drawing system and API
 */

export type OmikujiType = 
  | 'engineer-fortune'
  | 'tech-selection'
  | 'debug-fortune'
  | 'code-review-fortune'
  | 'deploy-fortune';

export type FortuneType = 
  | 'daikichi'   // 大吉
  | 'chukichi'   // 中吉
  | 'kichi'      // 吉
  | 'shokichi'   // 小吉
  | 'suekichi'   // 末吉
  | 'kyo'        // 凶
  | 'daikyo'     // 大凶
  | 'kyou';      // Alternative spelling for kyo

export type EmotionAttribute = 'positive' | 'neutral' | 'negative';

export interface Fortune {
  id: string;
  name: string;
  description: string;
  rank: number;
}

export interface Category {
  name: string;
  content: string;
  emotionTone: EmotionAttribute;
}

export interface OmikujiResult {
  id: { value: string };
  titlePhrase: { value: string };
  description: { value: string };
  emotionAttribute: EmotionAttribute;
  categories: { items: Category[] };
}

// API Request/Response Types
export interface OmikujiDrawRequest {
  omikujiType: OmikujiType;
  monetaryAmount: number;
  
  // Legacy support
  typeId?: string;
  saisenLevel?: number;
}

export interface OmikujiDrawResponse {
  success: boolean;
  result?: {
    fortune: Fortune;
    omikujiResult: OmikujiResult;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface DrawResult {
  fortune: Fortune;
  omikujiResult: OmikujiResult;
}

export interface DrawError {
  message: string;
  code?: string;
}

// Result Types for Services
export interface SuccessResult<T> {
  isSuccess: true;
  isFailure: false;
  value: T;
}

export interface FailureResult<E> {
  isSuccess: false;
  isFailure: true;
  error: E;
}

export type Result<T, E = DrawError> = SuccessResult<T> | FailureResult<E>;