// src/auto-sync-api.test.ts
// 测试自动同步 API 功能
import { getSyncStats, syncNow, setAutoSyncConfig } from '../../expo-lite-data-store';

describe('Auto Sync API Tests', () => {
  // 确保测试套件能够运行
  beforeAll(() => {
    // 初始化工作
  });

  afterAll(() => {
    // 清理工作
  });

  describe('getSyncStats API', () => {
    it('should return sync stats object', async () => {
      const stats = getSyncStats();
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
      expect(stats).toHaveProperty('syncCount');
      expect(stats).toHaveProperty('totalItemsSynced');
      expect(stats).toHaveProperty('lastSyncTime');
      expect(stats).toHaveProperty('avgSyncTime');
    });

    it('should return numeric values for all stats', async () => {
      const stats = getSyncStats();
      expect(typeof stats.syncCount).toBe('number');
      expect(typeof stats.totalItemsSynced).toBe('number');
      expect(typeof stats.lastSyncTime).toBe('number');
      expect(typeof stats.avgSyncTime).toBe('number');
    });
  });

  describe('syncNow API', () => {
    it('should not throw when called', async () => {
      await expect(syncNow()).resolves.not.toThrow();
    });

    it('should work even when no data to sync', async () => {
      await expect(syncNow()).resolves.toBeUndefined();
    });
  });

  describe('setAutoSyncConfig API', () => {
    it('should not throw when setting config', async () => {
      expect(() => {
        setAutoSyncConfig({
          enabled: true,
          interval: 10000,
          minItems: 5,
          batchSize: 200,
        });
      }).not.toThrow();
    });

    it('should accept partial config', async () => {
      expect(() => {
        setAutoSyncConfig({
          enabled: false,
        });
      }).not.toThrow();
    });

    it('should handle empty config', async () => {
      expect(() => {
        setAutoSyncConfig({});
      }).not.toThrow();
    });
  });

  describe('Integrated Auto Sync Tests', () => {
    it('should work together without conflicts', async () => {
      // 设置配置
      setAutoSyncConfig({
        enabled: true,
        interval: 5000,
        minItems: 1,
        batchSize: 100,
      });

      // 获取统计信息
      const initialStats = getSyncStats();
      expect(initialStats).toBeDefined();

      // 立即同步
      await syncNow();

      // 再次获取统计信息
      const finalStats = getSyncStats();
      expect(finalStats).toBeDefined();

      // 时间戳应该更新（或者至少不减少）
      expect(finalStats.lastSyncTime).toBeGreaterThanOrEqual(initialStats.lastSyncTime);
    });
  });
});
