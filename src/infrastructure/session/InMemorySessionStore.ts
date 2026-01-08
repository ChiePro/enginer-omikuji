/**
 * インメモリセッションストレージ
 * 
 * セッション状態の追跡、10分間の自動期限切れ、同時アクセス制御を提供
 */
export class InMemorySessionStore {
  private sessions: Map<string, SessionData> = new Map();
  private readonly sessionTimeoutMs: number = 10 * 60 * 1000; // 10分
  private locks: Map<string, Promise<void>> = new Map();

  /**
   * 新しいセッションを作成
   */
  async createSession(sessionId: string): Promise<Result<void, SessionError>> {
    return this.withLock(sessionId, async () => {
      if (this.sessions.has(sessionId)) {
        return {
          success: false,
          error: {
            type: 'SESSION_ALREADY_EXISTS',
            sessionId
          }
        };
      }

      const now = Date.now();
      this.sessions.set(sessionId, {
        id: sessionId,
        selectedContentIds: new Set(),
        createdAt: now,
        lastAccessedAt: now
      });

      return { success: true, data: undefined };
    });
  }

  /**
   * セッションが存在するかチェック
   */
  async exists(sessionId: string): Promise<Result<boolean, SessionError>> {
    try {
      const sessionExists = this.sessions.has(sessionId);
      return { success: true, data: sessionExists };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'SESSION_STORAGE_ERROR',
          message: `Failed to check session existence: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  /**
   * セッションを削除
   */
  async deleteSession(sessionId: string): Promise<Result<void, SessionError>> {
    return this.withLock(sessionId, async () => {
      this.sessions.delete(sessionId);
      return { success: true, data: undefined };
    });
  }

  /**
   * 選択済みコンテンツをセッションに追加
   */
  async addSelectedContent(sessionId: string, contentIds: string[]): Promise<Result<void, SessionError>> {
    return this.withLock(sessionId, async () => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return {
          success: false,
          error: {
            type: 'SESSION_NOT_FOUND',
            sessionId
          }
        };
      }

      // コンテンツIDを追加（重複は自動的に排除）
      for (const contentId of contentIds) {
        session.selectedContentIds.add(contentId);
      }

      // 最終アクセス時刻を更新
      session.lastAccessedAt = Date.now();

      return { success: true, data: undefined };
    });
  }

  /**
   * セッションの選択済みコンテンツを取得
   */
  async getSelectedContent(sessionId: string): Promise<Result<string[], SessionError>> {
    return this.withLock(sessionId, async () => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return {
          success: false,
          error: {
            type: 'SESSION_NOT_FOUND',
            sessionId
          }
        };
      }

      // 最終アクセス時刻を更新
      session.lastAccessedAt = Date.now();

      return { 
        success: true, 
        data: Array.from(session.selectedContentIds)
      };
    });
  }

  /**
   * セッション情報を取得
   */
  async getSessionInfo(sessionId: string): Promise<Result<SessionInfo, SessionError>> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: {
          type: 'SESSION_NOT_FOUND',
          sessionId
        }
      };
    }

    return {
      success: true,
      data: {
        id: session.id,
        createdAt: session.createdAt,
        lastAccessedAt: session.lastAccessedAt,
        selectedContentCount: session.selectedContentIds.size
      }
    };
  }

  /**
   * セッションが期限切れかどうかチェック
   */
  async isExpired(sessionId: string): Promise<Result<boolean, SessionError>> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: {
          type: 'SESSION_NOT_FOUND',
          sessionId
        }
      };
    }

    const now = Date.now();
    const isExpired = (now - session.lastAccessedAt) > this.sessionTimeoutMs;

    return { success: true, data: isExpired };
  }

  /**
   * 期限切れセッションのガベージコレクション
   */
  async collectGarbage(): Promise<Result<GarbageCollectionResult, SessionError>> {
    try {
      const now = Date.now();
      const deletedSessions: string[] = [];
      const expiredSessionIds: string[] = [];

      // 期限切れセッションを特定
      for (const [sessionId, session] of this.sessions) {
        if ((now - session.lastAccessedAt) > this.sessionTimeoutMs) {
          expiredSessionIds.push(sessionId);
        }
      }

      // 期限切れセッションを削除
      for (const sessionId of expiredSessionIds) {
        this.sessions.delete(sessionId);
        deletedSessions.push(sessionId);
      }

      return {
        success: true,
        data: {
          deletedSessions,
          deletedCount: deletedSessions.length,
          remainingSessions: this.sessions.size
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'SESSION_STORAGE_ERROR',
          message: `Garbage collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  /**
   * メモリ使用量情報を取得
   */
  async getMemoryUsage(): Promise<Result<MemoryUsageInfo, SessionError>> {
    try {
      let totalContentItems = 0;
      for (const session of this.sessions.values()) {
        totalContentItems += session.selectedContentIds.size;
      }

      // 簡易的なメモリ使用量推定（実際のバイト数ではなく概算）
      const estimatedMemoryBytes = this.sessions.size * 100 + totalContentItems * 20;

      return {
        success: true,
        data: {
          totalSessions: this.sessions.size,
          totalContentItems,
          estimatedMemoryBytes
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'SESSION_STORAGE_ERROR',
          message: `Failed to get memory usage: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  /**
   * 同時アクセス制御のためのロック機能
   */
  private async withLock<T>(sessionId: string, operation: () => Promise<T>): Promise<T> {
    // 既存のロックがあるかチェック
    const existingLock = this.locks.get(sessionId);
    if (existingLock) {
      await existingLock;
    }

    // 新しいロックを作成
    let resolve: () => void;
    const lockPromise = new Promise<void>(r => { resolve = r; });
    this.locks.set(sessionId, lockPromise);

    try {
      const result = await operation();
      return result;
    } finally {
      // ロックを解除
      this.locks.delete(sessionId);
      resolve!();
    }
  }

  /**
   * 全セッションをクリア（テスト用）
   */
  async clearAll(): Promise<Result<void, SessionError>> {
    try {
      this.sessions.clear();
      this.locks.clear();
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'SESSION_STORAGE_ERROR',
          message: `Failed to clear all sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }
}

// Type definitions
export type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

export type SessionError = 
  | { type: 'SESSION_NOT_FOUND'; sessionId: string }
  | { type: 'SESSION_ALREADY_EXISTS'; sessionId: string }
  | { type: 'SESSION_STORAGE_ERROR'; message: string }
  | { type: 'CONCURRENT_MODIFICATION'; sessionId: string };

interface SessionData {
  id: string;
  selectedContentIds: Set<string>;
  createdAt: number;
  lastAccessedAt: number;
}

export interface SessionInfo {
  id: string;
  createdAt: number;
  lastAccessedAt: number;
  selectedContentCount: number;
}

export interface GarbageCollectionResult {
  deletedSessions: string[];
  deletedCount: number;
  remainingSessions: number;
}

export interface MemoryUsageInfo {
  totalSessions: number;
  totalContentItems: number;
  estimatedMemoryBytes: number;
}