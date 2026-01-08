import { ISessionDuplicationGuardService, Result, SessionError } from './ISessionDuplicationGuardService';
import { CategoryContent } from '../../infrastructure/repositories/json/ExtendedJsonSchema';
import { InMemorySessionStore } from '../../infrastructure/session/InMemorySessionStore';

/**
 * セッション重複制御サービス
 * 
 * セッション内でのコンテンツ重複を防ぐためのフィルタリングと記録機能を提供
 */
export class SessionDuplicationGuardService implements ISessionDuplicationGuardService {
  constructor(
    private readonly sessionStore: InMemorySessionStore
  ) {}

  /**
   * 利用可能コンテンツから選択済みコンテンツを除外
   */
  async filterAvailableContent(
    sessionId: string,
    availableContent: CategoryContent[]
  ): Promise<Result<CategoryContent[], SessionError>> {
    try {
      // セッションが存在するかチェック
      const sessionExists = await this.sessionStore.exists(sessionId);
      if (!sessionExists.success) {
        return {
          success: false,
          error: {
            type: 'SESSION_STORAGE_ERROR',
            message: `Failed to check session existence: ${sessionExists.error}`
          }
        };
      }

      // セッションが存在しない場合、すべてのコンテンツが利用可能
      if (!sessionExists.data) {
        return { success: true, data: availableContent };
      }

      // 選択済みコンテンツIDを取得
      const selectedResult = await this.sessionStore.getSelectedContent(sessionId);
      if (!selectedResult.success) {
        // セッションが見つからない場合はすべてのコンテンツが利用可能
        if (selectedResult.error.type === 'SESSION_NOT_FOUND') {
          return { success: true, data: availableContent };
        }
        
        return {
          success: false,
          error: {
            type: 'SESSION_STORAGE_ERROR',
            message: `Failed to get selected content: ${selectedResult.error.type}`
          }
        };
      }

      const selectedIds = new Set(selectedResult.data);
      
      // 選択済みコンテンツを除外してフィルタリング
      const filteredContent = availableContent.filter(content => 
        !selectedIds.has(content.id)
      );

      return { success: true, data: filteredContent };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'SESSION_STORAGE_ERROR',
          message: `Filter operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  /**
   * 選択されたコンテンツをセッションに記録
   */
  async recordSelectedContent(
    sessionId: string,
    selectedContent: CategoryContent[]
  ): Promise<Result<void, SessionError>> {
    try {
      // セッションが存在するかチェック
      const sessionExists = await this.sessionStore.exists(sessionId);
      if (!sessionExists.success) {
        return {
          success: false,
          error: {
            type: 'SESSION_STORAGE_ERROR',
            message: `Failed to check session existence: ${sessionExists.error}`
          }
        };
      }

      // セッションが存在しない場合は作成
      if (!sessionExists.data) {
        const createResult = await this.sessionStore.createSession(sessionId);
        if (!createResult.success) {
          return {
            success: false,
            error: {
              type: 'SESSION_STORAGE_ERROR',
              message: `Failed to create session: ${createResult.error.type}`
            }
          };
        }
      }

      // コンテンツIDを抽出
      const contentIds = selectedContent.map(content => content.id);
      
      // 空の場合でも記録処理を実行（セッション作成は完了済み）
      if (contentIds.length === 0) {
        return { success: true, data: undefined };
      }

      // セッションにコンテンツIDを記録
      const addResult = await this.sessionStore.addSelectedContent(sessionId, contentIds);
      if (!addResult.success) {
        return {
          success: false,
          error: {
            type: 'SESSION_STORAGE_ERROR',
            message: `Failed to record content: ${addResult.error.type}`
          }
        };
      }

      return { success: true, data: undefined };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'SESSION_STORAGE_ERROR',
          message: `Record operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  /**
   * セッションを削除（選択履歴をクリア）
   */
  async clearSession(sessionId: string): Promise<Result<void, SessionError>> {
    try {
      const deleteResult = await this.sessionStore.deleteSession(sessionId);
      if (!deleteResult.success) {
        return {
          success: false,
          error: {
            type: 'SESSION_STORAGE_ERROR',
            message: `Failed to clear session: ${deleteResult.error.type}`
          }
        };
      }

      return { success: true, data: undefined };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'SESSION_STORAGE_ERROR',
          message: `Clear operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  /**
   * セッションの統計情報を取得（デバッグ・監視用）
   */
  async getSessionStats(sessionId: string): Promise<Result<SessionStats, SessionError>> {
    try {
      const sessionExists = await this.sessionStore.exists(sessionId);
      if (!sessionExists.success) {
        return {
          success: false,
          error: {
            type: 'SESSION_STORAGE_ERROR',
            message: 'Failed to check session existence'
          }
        };
      }

      if (!sessionExists.data) {
        return {
          success: true,
          data: {
            sessionExists: false,
            selectedContentCount: 0,
            createdAt: null,
            lastAccessedAt: null
          }
        };
      }

      const sessionInfo = await this.sessionStore.getSessionInfo(sessionId);
      if (!sessionInfo.success) {
        return {
          success: false,
          error: {
            type: 'SESSION_STORAGE_ERROR',
            message: `Failed to get session info: ${sessionInfo.error.type}`
          }
        };
      }

      return {
        success: true,
        data: {
          sessionExists: true,
          selectedContentCount: sessionInfo.data.selectedContentCount,
          createdAt: new Date(sessionInfo.data.createdAt),
          lastAccessedAt: new Date(sessionInfo.data.lastAccessedAt)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'SESSION_STORAGE_ERROR',
          message: `Stats operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }
}

// Additional types
export interface SessionStats {
  sessionExists: boolean;
  selectedContentCount: number;
  createdAt: Date | null;
  lastAccessedAt: Date | null;
}