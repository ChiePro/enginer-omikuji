import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { InMemorySessionStore } from './InMemorySessionStore';

describe('InMemorySessionStore', () => {
  let store: InMemorySessionStore;
  let mockDateNow: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = new InMemorySessionStore();
    mockDateNow = vi.fn();
    vi.stubGlobal('Date', {
      ...Date,
      now: mockDateNow
    });
    mockDateNow.mockReturnValue(1000000000); // 固定時刻
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('セッション基本操作', () => {
    it('新しいセッションを作成できる', async () => {
      const sessionId = 'test-session-001';
      const result = await store.createSession(sessionId);
      
      expect(result.success).toBe(true);
      
      // セッションが存在することを確認
      const existsResult = await store.exists(sessionId);
      expect(existsResult.success).toBe(true);
      if (existsResult.success) {
        expect(existsResult.data).toBe(true);
      }
    });

    it('既存のセッションIDで再作成を試みるとエラーを返す', async () => {
      const sessionId = 'duplicate-session';
      
      await store.createSession(sessionId);
      const result = await store.createSession(sessionId);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SESSION_ALREADY_EXISTS');
        expect(result.error.sessionId).toBe(sessionId);
      }
    });

    it('存在しないセッションの確認はfalseを返す', async () => {
      const result = await store.exists('non-existent-session');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('セッションを削除できる', async () => {
      const sessionId = 'deletable-session';
      
      await store.createSession(sessionId);
      const deleteResult = await store.deleteSession(sessionId);
      
      expect(deleteResult.success).toBe(true);
      
      // 削除後は存在しないことを確認
      const existsResult = await store.exists(sessionId);
      expect(existsResult.success).toBe(true);
      if (existsResult.success) {
        expect(existsResult.data).toBe(false);
      }
    });

    it('存在しないセッションの削除を試みてもエラーとならない', async () => {
      const result = await store.deleteSession('non-existent-session');
      expect(result.success).toBe(true);
    });
  });

  describe('セッションデータ管理', () => {
    it('セッションに選択済みコンテンツを記録できる', async () => {
      const sessionId = 'content-session';
      const contentIds = ['content-1', 'content-2', 'content-3'];
      
      await store.createSession(sessionId);
      const result = await store.addSelectedContent(sessionId, contentIds);
      
      expect(result.success).toBe(true);
    });

    it('セッションの選択済みコンテンツを取得できる', async () => {
      const sessionId = 'retrieve-session';
      const contentIds = ['content-a', 'content-b'];
      
      await store.createSession(sessionId);
      await store.addSelectedContent(sessionId, contentIds);
      
      const result = await store.getSelectedContent(sessionId);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(contentIds);
      }
    });

    it('複数回の追加で選択済みコンテンツが累積される', async () => {
      const sessionId = 'accumulate-session';
      
      await store.createSession(sessionId);
      await store.addSelectedContent(sessionId, ['content-1', 'content-2']);
      await store.addSelectedContent(sessionId, ['content-3', 'content-4']);
      
      const result = await store.getSelectedContent(sessionId);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['content-1', 'content-2', 'content-3', 'content-4']);
      }
    });

    it('重複するコンテンツIDは一度だけ記録される', async () => {
      const sessionId = 'duplicate-content-session';
      
      await store.createSession(sessionId);
      await store.addSelectedContent(sessionId, ['content-1', 'content-2']);
      await store.addSelectedContent(sessionId, ['content-2', 'content-3']); // content-2が重複
      
      const result = await store.getSelectedContent(sessionId);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['content-1', 'content-2', 'content-3']);
      }
    });

    it('存在しないセッションにコンテンツを追加しようとするとエラーを返す', async () => {
      const result = await store.addSelectedContent('non-existent', ['content-1']);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SESSION_NOT_FOUND');
      }
    });

    it('存在しないセッションからコンテンツを取得しようとするとエラーを返す', async () => {
      const result = await store.getSelectedContent('non-existent');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SESSION_NOT_FOUND');
      }
    });
  });

  describe('セッション期限管理', () => {
    it('セッションの最終アクセス時刻が更新される', async () => {
      const sessionId = 'access-time-session';
      const initialTime = 1000000000;
      const laterTime = 1000000100;
      
      mockDateNow.mockReturnValue(initialTime);
      await store.createSession(sessionId);
      
      mockDateNow.mockReturnValue(laterTime);
      await store.addSelectedContent(sessionId, ['content-1']);
      
      const result = await store.getSessionInfo(sessionId);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lastAccessedAt).toBe(laterTime);
      }
    });

    it('期限切れセッションを識別できる', async () => {
      const sessionId = 'expired-session';
      const now = 1000000000;
      const elevenMinutesLater = now + (11 * 60 * 1000); // 11分後
      
      mockDateNow.mockReturnValue(now);
      await store.createSession(sessionId);
      
      mockDateNow.mockReturnValue(elevenMinutesLater);
      const result = await store.isExpired(sessionId);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('有効期限内のセッションは期限切れとならない', async () => {
      const sessionId = 'valid-session';
      const now = 1000000000;
      const fiveMinutesLater = now + (5 * 60 * 1000); // 5分後
      
      mockDateNow.mockReturnValue(now);
      await store.createSession(sessionId);
      
      mockDateNow.mockReturnValue(fiveMinutesLater);
      const result = await store.isExpired(sessionId);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('期限切れセッションをガベージコレクションで削除できる', async () => {
      const expiredSessionId = 'expired-session';
      const validSessionId = 'valid-session';
      const now = 1000000000;
      const elevenMinutesLater = now + (11 * 60 * 1000);
      
      mockDateNow.mockReturnValue(now);
      await store.createSession(expiredSessionId);
      
      mockDateNow.mockReturnValue(now + (2 * 60 * 1000)); // 2分後に作成
      await store.createSession(validSessionId);
      
      mockDateNow.mockReturnValue(elevenMinutesLater);
      const gcResult = await store.collectGarbage();
      
      expect(gcResult.success).toBe(true);
      if (gcResult.success) {
        expect(gcResult.data.deletedSessions).toContain(expiredSessionId);
        expect(gcResult.data.deletedSessions).not.toContain(validSessionId);
      }
      
      // 期限切れセッションが削除されていることを確認
      const expiredExists = await store.exists(expiredSessionId);
      expect(expiredExists.success && expiredExists.data).toBe(false);
      
      // 有効セッションは残っていることを確認
      const validExists = await store.exists(validSessionId);
      expect(validExists.success && validExists.data).toBe(true);
    });
  });

  describe('同時アクセス制御', () => {
    it('同じセッションへの並行アクセスが適切に処理される', async () => {
      const sessionId = 'concurrent-session';
      await store.createSession(sessionId);
      
      // 並行でコンテンツを追加
      const promises = [
        store.addSelectedContent(sessionId, ['content-1']),
        store.addSelectedContent(sessionId, ['content-2']),
        store.addSelectedContent(sessionId, ['content-3'])
      ];
      
      const results = await Promise.all(promises);
      
      // すべての操作が成功することを確認
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // 最終的に全コンテンツが記録されていることを確認
      const finalResult = await store.getSelectedContent(sessionId);
      expect(finalResult.success).toBe(true);
      if (finalResult.success) {
        expect(finalResult.data).toHaveLength(3);
        expect(finalResult.data).toContain('content-1');
        expect(finalResult.data).toContain('content-2');
        expect(finalResult.data).toContain('content-3');
      }
    });
  });

  describe('メモリ管理とパフォーマンス', () => {
    it('大量のセッション作成と削除が適切に処理される', async () => {
      const sessionCount = 1000;
      const sessionIds: string[] = [];
      
      // 大量のセッションを作成
      for (let i = 0; i < sessionCount; i++) {
        const sessionId = `bulk-session-${i}`;
        sessionIds.push(sessionId);
        const result = await store.createSession(sessionId);
        expect(result.success).toBe(true);
      }
      
      // すべてのセッションが存在することを確認
      for (const sessionId of sessionIds) {
        const exists = await store.exists(sessionId);
        expect(exists.success && exists.data).toBe(true);
      }
      
      // 一括削除
      for (const sessionId of sessionIds) {
        await store.deleteSession(sessionId);
      }
      
      // すべてのセッションが削除されていることを確認
      for (const sessionId of sessionIds) {
        const exists = await store.exists(sessionId);
        expect(exists.success && exists.data).toBe(false);
      }
    });

    it('メモリ使用量監視情報を取得できる', async () => {
      await store.createSession('memory-test-1');
      await store.createSession('memory-test-2');
      await store.addSelectedContent('memory-test-1', ['content-1', 'content-2']);
      
      const result = await store.getMemoryUsage();
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalSessions).toBe(2);
        expect(result.data.totalContentItems).toBe(2);
        expect(typeof result.data.estimatedMemoryBytes).toBe('number');
        expect(result.data.estimatedMemoryBytes).toBeGreaterThan(0);
      }
    });
  });
});