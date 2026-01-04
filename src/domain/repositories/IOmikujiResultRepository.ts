import { OmikujiResult } from '../entities/OmikujiResult';

export type RepositoryError = 
  | { type: 'FILE_NOT_FOUND'; typeId: string }
  | { type: 'PARSE_ERROR'; message: string }
  | { type: 'NO_RESULTS_FOUND'; typeId: string; fortuneId: string };

export type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface IOmikujiResultRepository {
  findByTypeAndFortune(typeId: string, fortuneId: string): Promise<Result<OmikujiResult[], RepositoryError>>;
  findAll(typeId: string): Promise<Result<OmikujiResult[], RepositoryError>>;
}