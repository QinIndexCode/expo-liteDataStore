// src/core/db.ts
// 数据库实例初始化文件，负责创建和导出数据库实例
// 根据环境配置决定是否使用加密存储
// 创建于: 2025-11-23
// 最后修改: 2025-12-11

import storage from './adapter/FileSystemStorageAdapter';
import { EncryptedStorageAdapter } from './EncryptedStorageAdapter';

/**
 * 是否启用加密存储
 * 生产环境建议设置为 true，开发环境可设置为 false 以便调试
 * 测试环境自动禁用加密，避免复杂的加密依赖问题
 */
const USE_ENCRYPTION = !(typeof process !== 'undefined' && process.env.NODE_ENV === 'test') && true;

/**
 * 初始化配置文件
 * 仅在 Node.js 环境中运行，在浏览器环境中跳过
 */
async function initializeConfig() {
  // 检查是否在 Node.js 环境中
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      // 动态导入配置生成器，避免在浏览器环境中加载 fs 模块
      const { ConfigGenerator } = await import('../utils/configGenerator');

      // 生成配置文件（如果不存在）
      await ConfigGenerator.generateConfig();
    } catch (error) {
      console.debug('初始化配置文件失败:', error);
      // 配置文件生成失败不影响数据库初始化，使用默认配置
    }
  }
}

// 初始化配置文件
initializeConfig();

/**
 * 默认数据库实例
 * 根据 USE_ENCRYPTION 配置决定使用加密存储还是普通存储
 */
export const db = USE_ENCRYPTION ? new EncryptedStorageAdapter() : storage;

/**
 * 明文存储实例（用于调试）
 * 开发时可以直接查看明文数据，便于调试
 */
export const plainStorage = storage;
