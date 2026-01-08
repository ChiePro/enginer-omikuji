import { CategoryContent } from '../../infrastructure/repositories/json/ExtendedJsonSchema';

/**
 * セッション内重複制御サービスのインターフェース
 */
export interface ISessionDuplicationGuardService {
  /**
   * セッション内で既に選択済みのコンテンツを除外してフィルタリング
   */
  filterAvailableContent(
    sessionId: string,
    availableContent: CategoryContent[]
  ): Promise<Result<CategoryContent[], SessionError>>;
  
  /**
   * 選択されたコンテンツをセッションに記録
   */
  recordSelectedContent(
    sessionId: string,
    selectedContent: CategoryContent[]
  ): Promise<Result<void, SessionError>>;
  
  /**
   * セッションをクリア（すべての選択履歴を削除）
   */
  clearSession(sessionId: string): Promise<Result<void, SessionError>>;
}

// Type definitions
export type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

export type SessionError = 
  | { type: 'SESSION_NOT_FOUND'; sessionId: string }
  | { type: 'SESSION_STORAGE_ERROR'; message: string }
  | { type: 'CONCURRENT_MODIFICATION'; sessionId: string };