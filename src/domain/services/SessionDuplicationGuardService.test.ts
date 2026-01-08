import { describe, expect, it, beforeEach, vi } from 'vitest';
import { SessionDuplicationGuardService } from './SessionDuplicationGuardService';
import { InMemorySessionStore } from '../../infrastructure/session/InMemorySessionStore';
import { CategoryContent } from '../../infrastructure/repositories/json/ExtendedJsonSchema';

describe('SessionDuplicationGuardService', () => {
  let service: SessionDuplicationGuardService;
  let mockSessionStore: InMemorySessionStore;

  beforeEach(() => {
    mockSessionStore = new InMemorySessionStore();
    service = new SessionDuplicationGuardService(mockSessionStore);
  });

  describe('フィルタリング機能', () => {
    it('セッションが存在しない場合、すべてのコンテンツを利用可能として返す', async () => {
      const availableContent: CategoryContent[] = [
        { id: 'content-1', content: 'コンテンツ1', weight: 1.0 },
        { id: 'content-2', content: 'コンテンツ2', weight: 1.0 },
        { id: 'content-3', content: 'コンテンツ3', weight: 1.0 }
      ];

      const result = await service.filterAvailableContent('non-existent-session', availableContent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(availableContent);
      }
    });

    it('選択済みコンテンツが記録されているセッションで重複を除外する', async () => {
      const sessionId = 'test-session';
      const availableContent: CategoryContent[] = [
        { id: 'content-1', content: 'コンテンツ1', weight: 1.0 },
        { id: 'content-2', content: 'コンテンツ2', weight: 1.0 },
        { id: 'content-3', content: 'コンテンツ3', weight: 1.0 },
        { id: 'content-4', content: 'コンテンツ4', weight: 1.0 }
      ];

      // セッションを作成して一部のコンテンツを記録
      await mockSessionStore.createSession(sessionId);
      await mockSessionStore.addSelectedContent(sessionId, ['content-1', 'content-3']);

      const result = await service.filterAvailableContent(sessionId, availableContent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data.map(c => c.id)).toEqual(['content-2', 'content-4']);
      }
    });

    it('すべてのコンテンツが選択済みの場合、空の配列を返す', async () => {
      const sessionId = 'empty-session';
      const availableContent: CategoryContent[] = [
        { id: 'content-1', content: 'コンテンツ1', weight: 1.0 },
        { id: 'content-2', content: 'コンテンツ2', weight: 1.0 }
      ];

      await mockSessionStore.createSession(sessionId);
      await mockSessionStore.addSelectedContent(sessionId, ['content-1', 'content-2']);

      const result = await service.filterAvailableContent(sessionId, availableContent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('利用可能コンテンツが空の場合、空の配列を返す', async () => {
      const sessionId = 'test-session';
      const availableContent: CategoryContent[] = [];

      await mockSessionStore.createSession(sessionId);

      const result = await service.filterAvailableContent(sessionId, availableContent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe('コンテンツ記録機能', () => {
    it('新しいセッションでコンテンツを記録できる', async () => {
      const sessionId = 'new-session';
      const selectedContent: CategoryContent[] = [
        { id: 'content-a', content: 'コンテンツA', weight: 1.0 },
        { id: 'content-b', content: 'コンテンツB', weight: 1.0 }
      ];

      const result = await service.recordSelectedContent(sessionId, selectedContent);

      expect(result.success).toBe(true);

      // セッションが自動作成され、コンテンツが記録されていることを確認
      const sessionExists = await mockSessionStore.exists(sessionId);
      expect(sessionExists.success && sessionExists.data).toBe(true);

      const recorded = await mockSessionStore.getSelectedContent(sessionId);
      expect(recorded.success && recorded.data).toEqual(['content-a', 'content-b']);
    });

    it('既存のセッションに追加でコンテンツを記録できる', async () => {
      const sessionId = 'existing-session';
      const initialContent: CategoryContent[] = [
        { id: 'content-1', content: 'コンテンツ1', weight: 1.0 }
      ];
      const additionalContent: CategoryContent[] = [
        { id: 'content-2', content: 'コンテンツ2', weight: 1.0 },
        { id: 'content-3', content: 'コンテンツ3', weight: 1.0 }
      ];

      // 初期コンテンツを記録
      await service.recordSelectedContent(sessionId, initialContent);
      
      // 追加コンテンツを記録
      const result = await service.recordSelectedContent(sessionId, additionalContent);

      expect(result.success).toBe(true);

      // すべてのコンテンツが記録されていることを確認
      const recorded = await mockSessionStore.getSelectedContent(sessionId);
      expect(recorded.success && recorded.data).toEqual(['content-1', 'content-2', 'content-3']);
    });

    it('空のコンテンツ配列でも正常に処理される', async () => {
      const sessionId = 'empty-content-session';
      const emptyContent: CategoryContent[] = [];

      const result = await service.recordSelectedContent(sessionId, emptyContent);

      expect(result.success).toBe(true);

      // セッションは作成されるが、コンテンツは空
      const recorded = await mockSessionStore.getSelectedContent(sessionId);
      expect(recorded.success && recorded.data).toEqual([]);
    });

    it('セッションストアのエラーを適切に伝播する', async () => {
      const sessionId = 'error-session';
      const selectedContent: CategoryContent[] = [
        { id: 'content-x', content: 'コンテンツX', weight: 1.0 }
      ];

      // セッションストアをモック化してエラーを発生させる
      const errorStore = {
        createSession: vi.fn().mockResolvedValue({ 
          success: false, 
          error: { type: 'SESSION_STORAGE_ERROR', message: 'Storage failure' } 
        }),
        exists: vi.fn().mockResolvedValue({ success: true, data: false }),
        addSelectedContent: vi.fn()
      } as any;

      const errorService = new SessionDuplicationGuardService(errorStore);
      const result = await errorService.recordSelectedContent(sessionId, selectedContent);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SESSION_STORAGE_ERROR');
      }
    });
  });

  describe('セッション管理機能', () => {
    it('セッションをクリアできる', async () => {
      const sessionId = 'clearable-session';
      const content: CategoryContent[] = [
        { id: 'content-clear', content: 'クリア対象', weight: 1.0 }
      ];

      // コンテンツを記録
      await service.recordSelectedContent(sessionId, content);
      
      // セッションをクリア
      const clearResult = await service.clearSession(sessionId);
      expect(clearResult.success).toBe(true);

      // セッションが削除されていることを確認
      const sessionExists = await mockSessionStore.exists(sessionId);
      expect(sessionExists.success && sessionExists.data).toBe(false);
    });

    it('存在しないセッションのクリアを試みても正常に処理される', async () => {
      const result = await service.clearSession('non-existent-session');
      expect(result.success).toBe(true);
    });

    it('セッション削除時のエラーを適切にハンドリングする', async () => {
      const sessionId = 'delete-error-session';

      // エラーを発生させるモック
      const errorStore = {
        deleteSession: vi.fn().mockResolvedValue({
          success: false,
          error: { type: 'SESSION_STORAGE_ERROR', message: 'Delete failed' }
        })
      } as any;

      const errorService = new SessionDuplicationGuardService(errorStore);
      const result = await errorService.clearSession(sessionId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SESSION_STORAGE_ERROR');
      }
    });
  });

  describe('統合テスト', () => {
    it('完全なセッション重複制御フローが正常動作する', async () => {
      const sessionId = 'integration-session';
      const allContent: CategoryContent[] = [
        { id: 'content-1', content: 'コンテンツ1', weight: 1.0 },
        { id: 'content-2', content: 'コンテンツ2', weight: 1.0 },
        { id: 'content-3', content: 'コンテンツ3', weight: 1.0 },
        { id: 'content-4', content: 'コンテンツ4', weight: 1.0 }
      ];

      // ラウンド1: すべてのコンテンツが利用可能
      const round1Available = await service.filterAvailableContent(sessionId, allContent);
      expect(round1Available.success && round1Available.data).toEqual(allContent);

      // 2つのコンテンツを選択
      const round1Selected = [allContent[0], allContent[2]];
      await service.recordSelectedContent(sessionId, round1Selected);

      // ラウンド2: 選択済みコンテンツが除外される
      const round2Available = await service.filterAvailableContent(sessionId, allContent);
      expect(round2Available.success && round2Available.data).toHaveLength(2);
      expect(round2Available.success && round2Available.data.map(c => c.id)).toEqual(['content-2', 'content-4']);

      // 残りのコンテンツを選択
      const round2Selected = round2Available.success ? round2Available.data : [];
      await service.recordSelectedContent(sessionId, round2Selected);

      // ラウンド3: すべてのコンテンツが選択済み
      const round3Available = await service.filterAvailableContent(sessionId, allContent);
      expect(round3Available.success && round3Available.data).toHaveLength(0);

      // セッションクリア
      await service.clearSession(sessionId);

      // ラウンド4: セッションクリア後はすべて利用可能
      const round4Available = await service.filterAvailableContent(sessionId, allContent);
      expect(round4Available.success && round4Available.data).toEqual(allContent);
    });

    it('複数セッション間でデータが混在しない', async () => {
      const sessionA = 'session-a';
      const sessionB = 'session-b';
      const content: CategoryContent[] = [
        { id: 'content-shared-1', content: 'シェアコンテンツ1', weight: 1.0 },
        { id: 'content-shared-2', content: 'シェアコンテンツ2', weight: 1.0 }
      ];

      // セッションAでcontent-shared-1を選択
      await service.recordSelectedContent(sessionA, [content[0]]);

      // セッションBでcontent-shared-2を選択
      await service.recordSelectedContent(sessionB, [content[1]]);

      // 各セッションで適切にフィルタリングされることを確認
      const filteredA = await service.filterAvailableContent(sessionA, content);
      expect(filteredA.success && filteredA.data.map(c => c.id)).toEqual(['content-shared-2']);

      const filteredB = await service.filterAvailableContent(sessionB, content);
      expect(filteredB.success && filteredB.data.map(c => c.id)).toEqual(['content-shared-1']);
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量のコンテンツ処理が効率的に実行される', async () => {
      const sessionId = 'performance-session';
      const largeContentSet: CategoryContent[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `content-${i}`,
        content: `大量コンテンツ${i}`,
        weight: 1.0
      }));

      // 5000個を選択済みとして記録
      const selectedContent = largeContentSet.slice(0, 5000);
      
      const startTime = performance.now();
      
      await service.recordSelectedContent(sessionId, selectedContent);
      const filterResult = await service.filterAvailableContent(sessionId, largeContentSet);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(filterResult.success).toBe(true);
      if (filterResult.success) {
        expect(filterResult.data).toHaveLength(5000);
      }

      // 大量データ処理が1秒以内に完了することを確認
      expect(processingTime).toBeLessThan(1000);
    });
  });
});