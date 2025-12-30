import { describe, it, expect, beforeEach } from 'vitest';
import { SaisenSession } from './SaisenSession';
import { Saisen } from '../valueObjects/Saisen';

describe('SaisenSession', () => {
  let session: SaisenSession;

  beforeEach(() => {
    session = SaisenSession.create();
  });

  describe('セッション作成', () => {
    it('新しいセッションは初期状態で作成される', () => {
      // Act
      const newSession = SaisenSession.create();

      // Assert
      expect(newSession.getId()).toBeDefined();
      expect(newSession.hasActiveSaisen()).toBe(false);
      expect(newSession.getCurrentSaisen()).toBeNull();
      expect(newSession.getUsageCount()).toBe(0);
    });

    it('セッションIDは一意である', () => {
      // Act
      const session1 = SaisenSession.create();
      const session2 = SaisenSession.create();

      // Assert
      expect(session1.getId()).not.toBe(session2.getId());
    });
  });

  describe('お賽銭の適用', () => {
    it('お賽銭を適用できる', () => {
      // Act
      session.applySaisen(Saisen.HUNDRED_YEN);

      // Assert
      expect(session.hasActiveSaisen()).toBe(true);
      expect(session.getCurrentSaisen()).toBe(Saisen.HUNDRED_YEN);
      expect(session.getUsageCount()).toBe(1);
    });

    it('効果なしお賽銭も適用できる', () => {
      // Act
      session.applySaisen(Saisen.GOEN);

      // Assert
      expect(session.hasActiveSaisen()).toBe(true);
      expect(session.getCurrentSaisen()).toBe(Saisen.GOEN);
    });

    it('前回のお賽銭は上書きされる', () => {
      // Arrange
      session.applySaisen(Saisen.FIFTY_YEN);

      // Act
      session.applySaisen(Saisen.FIVE_HUNDRED_YEN);

      // Assert
      expect(session.getCurrentSaisen()).toBe(Saisen.FIVE_HUNDRED_YEN);
      expect(session.getUsageCount()).toBe(2);
    });
  });

  describe('効果期間の管理', () => {
    it('お賽銭の効果をリセットできる', () => {
      // Arrange
      session.applySaisen(Saisen.HUNDRED_YEN);

      // Act
      session.resetSaisenEffect();

      // Assert
      expect(session.hasActiveSaisen()).toBe(false);
      expect(session.getCurrentSaisen()).toBeNull();
      expect(session.getUsageCount()).toBe(1); // 使用回数は保持される
    });

    it('何回おみくじを引いたかをカウントできる', () => {
      // Act
      session.incrementOmikujiDrawCount();
      session.incrementOmikujiDrawCount();
      session.incrementOmikujiDrawCount();

      // Assert
      expect(session.getOmikujiDrawCount()).toBe(3);
    });

    it('一定回数おみくじを引いた後、効果が自動的にリセットされる', () => {
      // Arrange
      session.applySaisen(Saisen.FIVE_HUNDRED_YEN);
      
      // Act - お賽銭効果は3回まで有効
      session.incrementOmikujiDrawCount(); // 1回目
      session.incrementOmikujiDrawCount(); // 2回目
      expect(session.hasActiveSaisen()).toBe(true);
      
      session.incrementOmikujiDrawCount(); // 3回目
      
      // Assert
      expect(session.hasActiveSaisen()).toBe(false);
      expect(session.getCurrentSaisen()).toBeNull();
    });
  });

  describe('効果の持続性判定', () => {
    it('通常のお賽銭は1回まで有効', () => {
      // Arrange
      session.applySaisen(Saisen.HUNDRED_YEN);

      // Act & Assert
      expect(session.shouldEffectContinue()).toBe(true);
      
      session.incrementOmikujiDrawCount();
      expect(session.shouldEffectContinue()).toBe(false);
    });

    it('500円お賽銭は3回まで有効', () => {
      // Arrange
      session.applySaisen(Saisen.FIVE_HUNDRED_YEN);

      // Act & Assert
      expect(session.shouldEffectContinue()).toBe(true);
      
      session.incrementOmikujiDrawCount();
      expect(session.shouldEffectContinue()).toBe(true);
      
      session.incrementOmikujiDrawCount();
      expect(session.shouldEffectContinue()).toBe(true);
      
      session.incrementOmikujiDrawCount();
      expect(session.shouldEffectContinue()).toBe(false);
    });

    it('バグ効果は5回まで有効', () => {
      // Arrange
      session.applySaisen(Saisen.DEBUG_BUG);

      // Act & Assert
      for (let i = 0; i < 5; i++) {
        expect(session.shouldEffectContinue()).toBe(true);
        session.incrementOmikujiDrawCount();
      }
      
      expect(session.shouldEffectContinue()).toBe(false);
    });
  });

  describe('統計情報', () => {
    it('セッション中の総お賽銭額を計算できる', () => {
      // Act
      session.applySaisen(Saisen.FIFTY_YEN);
      session.applySaisen(Saisen.HUNDRED_YEN);
      session.applySaisen(Saisen.GOEN);

      // Assert
      expect(session.getTotalSaisenAmount()).toBe(155); // 50 + 100 + 5
    });

    it('効果回数の統計を取得できる', () => {
      // Arrange
      session.applySaisen(Saisen.HUNDRED_YEN);
      session.applySaisen(Saisen.FIVE_HUNDRED_YEN);
      session.applySaisen(Saisen.GOEN);

      // Act
      const stats = session.getEffectStats();

      // Assert
      expect(stats.totalEffectUsages).toBe(2); // 100円と500円のみ効果あり
      expect(stats.noEffectUsages).toBe(1);    // 5円は効果なし
      expect(stats.specialEffectUsages).toBe(0); // バグは使用していない
    });
  });

  describe('セッションの状態保持', () => {
    it('セッション状態をシリアライズできる', () => {
      // Arrange
      session.applySaisen(Saisen.HUNDRED_YEN);
      session.incrementOmikujiDrawCount();

      // Act
      const serialized = session.serialize();

      // Assert
      expect(serialized).toHaveProperty('id');
      expect(serialized).toHaveProperty('currentSaisen');
      expect(serialized).toHaveProperty('usageCount');
      expect(serialized).toHaveProperty('omikujiDrawCount');
    });

    it('シリアライズされた状態からセッションを復元できる', () => {
      // Arrange
      session.applySaisen(Saisen.FIVE_HUNDRED_YEN);
      session.incrementOmikujiDrawCount();
      const serialized = session.serialize();

      // Act
      const restoredSession = SaisenSession.deserialize(serialized);

      // Assert
      expect(restoredSession.getId()).toBe(session.getId());
      expect(restoredSession.getCurrentSaisen()).toBe(Saisen.FIVE_HUNDRED_YEN);
      expect(restoredSession.getOmikujiDrawCount()).toBe(1);
      expect(restoredSession.getUsageCount()).toBe(1);
    });
  });
});