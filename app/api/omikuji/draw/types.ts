/**
 * Types for /api/omikuji/draw endpoint
 */

export interface OmikujiDrawRequest {
  typeId: string;
  saisenLevel?: number; // 0-5, optional, defaults to 0
}

export interface OmikujiDrawResponse {
  success: boolean;
  data?: OmikujiResultData;
  error?: ApiError;
}

export interface OmikujiResultData {
  id: string;
  omikujiType: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: {
      primary: string;
      secondary: string;
    };
  };
  fortune: {
    id: string;
    japaneseName: string;
    englishName: string;
    description: string;
    value: number;
    probability: number;
  };
  createdAt: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export type ApiErrorCode = 
  | 'VALIDATION_ERROR'
  | 'FORTUNE_DATA_NOT_FOUND'
  | 'RESULT_DATA_NOT_FOUND'
  | 'INVALID_PROBABILITY_DISTRIBUTION'
  | 'REPOSITORY_ERROR'
  | 'INTERNAL_ERROR'
  | 'INVALID_JSON';