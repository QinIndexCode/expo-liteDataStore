// src/auto-sync-integration.test.ts
// 测试自动同步 API 与数据库操作的集成
import {
  createTable,
  insert,
  read,
  getSyncStats,
  syncNow,
  setAutoSyncConfig,
  deleteTable,
  hasTable,
} from '../../expo-lite-data-store';

describe('Auto Sync Integration Tests', () => {
  const TEST_TABLE = 'test_auto_sync_integration_table';

  // 测试前清理
  beforeEach(async () => {
    // 删除测试表（如果存在）
    if (await hasTable(TEST_TABLE)) {
      await deleteTable(TEST_TABLE);
    }
  });

  // 测试后清理
  afterEach(async () => {
    // 删除测试表（如果存在）
    if (await hasTable(TEST_TABLE)) {
      await deleteTable(TEST_TABLE);
    }
  });

  describe('Auto Sync Integration with Database Operations', () => {
    it('should reflect sync operations in stats', async () => {
      // 获取初始统计信息
      const initialStats = getSyncStats();
      expect(initialStats).toBeDefined();

      // 创建表并插入数据
      await createTable(TEST_TABLE);

      // 插入数据会触发自动同步（在测试环境中）
      const testData = [
        { id: 1, name: 'User 1', age: 25 },
        { id: 2, name: 'User 2', age: 30 },
      ];

      await insert(TEST_TABLE, testData);

      // 立即同步
      await syncNow();

      // 获取更新后的统计信息
      const updatedStats = getSyncStats();
      expect(updatedStats).toBeDefined();

      // 验证时间戳已更新
      expect(updatedStats.lastSyncTime).toBeGreaterThanOrEqual(initialStats.lastSyncTime);
    });

    it('should allow configuring auto sync behavior', async () => {
      // 设置自动同步配置
      setAutoSyncConfig({
        enabled: true,
        interval: 2000, // 2秒
        minItems: 1,
        batchSize: 50,
      });

      // 验证配置已被接受（通过不抛出异常来验证）
      expect(() => {
        setAutoSyncConfig({
          enabled: false,
        });
      }).not.toThrow();

      // 恢复默认配置
      setAutoSyncConfig({
        enabled: true,
        interval: 5000, // 5秒
        minItems: 1,
        batchSize: 100,
      });
    });

    it('should work with normal database operations', async () => {
      // 创建表
      await createTable(TEST_TABLE);

      // 插入数据
      const testData = [
        { id: 1, name: 'Alice', age: 28 },
        { id: 2, name: 'Bob', age: 32 },
      ];

      await insert(TEST_TABLE, testData);

      // 读取数据
      const result = await read(TEST_TABLE);
      expect(result).toHaveLength(2);
      // 注意：由于数据存储的顺序可能不同，我们只验证数据存在
      const alice = result.find((item: Record<string, any>) => item.name === 'Alice');
      const bob = result.find((item: Record<string, any>) => item.name === 'Bob');
      expect(alice).toMatchObject({ id: 1, name: 'Alice' });
      expect(bob).toMatchObject({ id: 2, name: 'Bob' });

      // 同步数据
      await syncNow();

      // 验证同步统计信息
      const stats = getSyncStats();
      expect(stats).toBeDefined();
      expect(typeof stats.syncCount).toBe('number');
      expect(typeof stats.totalItemsSynced).toBe('number');
    });
  });
});
