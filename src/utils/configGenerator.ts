import fs from 'fs';
import path from 'path';

/**
 * 配置生成器
 * 在首次使用时生成配置文件
 */

export class ConfigGenerator {
  private static readonly DEFAULT_CONFIG_CONTENT = `/**
 * LiteStore 配置文件
 * 用于自定义 LiteStore 的行为
 * 
 * 如何使用：
 * 1. 在应用入口文件中导入此配置
 * 2. 使用 setConfig 方法将配置应用到 LiteStore
 * 
 * 示例：
 * import { setConfig } from 'expo-lite-data-store';
 * import liteStoreConfig from './liteStore.config';
 * 
 * // 在应用启动时设置配置
 * setConfig(liteStoreConfig);
 */
import { LiteStoreConfig } from 'expo-lite-data-store';

const config: LiteStoreConfig = {
  // 基础配置
  chunkSize: 5 * 1024 * 1024, // 5MB - 分片大小
  storageFolder: 'expo-litedatastore',
  sortMethods: 'default', // fast, counting, merge, slow
  timeout: 10000, // 10s

  // ==================== 加密配置（完整版） ====================
  encryption: {
    // --- 核心加密参数（新增，强烈推荐显式声明）---
    algorithm: 'AES-CTR', // 明确声明使用 CTR 模式（支持并行，适合移动端）
    keySize: 256, // 明确使用 AES-256（最高安全强度）

    // --- HMAC 完整性保护 ---
    hmacAlgorithm: 'SHA-512', // 推荐 SHA-512（抗长度扩展攻击）

    // --- 密钥派生（抗暴力破解）---
    keyIterations: 120_000, // 2025年推荐值：≥120,000

    // --- 字段级加密 ---
    enableFieldLevelEncryption: false, // 暂时禁用，使用完整数据加密
    encryptedFields: [
      // 明确列出需要加密的字段
      'password',
      'email',
      'phone',
      'idCard',
      'bankCard',
      'realName',
      'token',
      'refreshToken',
    ],

    // --- 密钥缓存优化 ---
    cacheTimeout: 30_000, // 30秒后自动清除内存中的 masterKey
    maxCacheSize: 50, // LRU 缓存最多保留50个派生密钥

    // --- 批量操作 ---
    useBulkOperations: true, // 保持开启，性能提升 5~10 倍
  },

  // 性能配置
  performance: {
    enableQueryOptimization: true, // 建议开启！查询优化（索引）
    maxConcurrentOperations: 5, // 最大并发操作数（建议根据设备性能调整）
    enableBatchOptimization: true, // 建议开启！批量操作优化（批量写入/删除）
    memoryWarningThreshold: 0.8, // 80% 内存使用触发警告（建议根据设备性能调整）
  },

  // 缓存配置
  cache: {
    maxSize: 1000,
    defaultExpiry: 3600_000, // 1小时
    enableCompression: false, // 启用缓存数据压缩（建议根据设备性能调整）
    cleanupInterval: 300_000, // 5分钟
    memoryWarningThreshold: 0.8, // 80% 内存使用触发警告
    // 自动同步配置
    autoSync: {
      enabled: true, // 启用自动同步
      interval: 5000, // 5秒同步一次
      minItems: 1, // 至少1个脏项才同步
      batchSize: 100, // 每次最多同步100个项目
    },
  },

  // API配置
  api: {
    rateLimit: {
      enabled: true, // 建议开启！API 速率限制（防止滥用）
      requestsPerSecond: 20, // 建议根据实际场景调整（20-50之间）
      burstCapacity: 40, // 建议根据实际场景调整（40-80之间）
    },
    retry: {
      maxAttempts: 3, // 最大重试次数（建议根据实际场景调整）
      backoffMultiplier: 2, // 建议根据实际场景调整（2-4之间）
    },
  },

  // 监控配置
  monitoring: {
    enablePerformanceTracking: true, // 建议开启！性能跟踪（监控查询性能）
    enableHealthChecks: true, // 建议开启！健康检查（监控数据库状态）
    metricsRetention: 86_400_000, // 24小时
  },
};

export default config;`;

  /**
   * 生成配置文件
   * @param targetPath 目标路径，默认为项目根目录
   * @returns Promise<string> 生成的配置文件路径
   */
  public static async generateConfig(targetPath: string = process.cwd()): Promise<string> {
    // 当从包的postinstall脚本调用时，process.cwd()是包目录，而不是用户项目目录
    // 所以我们需要检查是否在postinstall上下文中运行
    const isPostinstall = process.env.npm_lifecycle_event === 'postinstall';
    let finalTargetPath = targetPath;

    if (isPostinstall) {
      // 在postinstall上下文中，找到调用者的项目目录
      // 当使用npm install时，调用者的目录是process.env.INIT_CWD
      const initCwd = process.env.INIT_CWD;
      if (initCwd && initCwd !== process.cwd()) {
        finalTargetPath = initCwd;
        console.log(`🔍 检测到postinstall上下文，切换目标路径到: ${finalTargetPath}`);
      }
    }

    const configPath = path.join(finalTargetPath, 'liteStore.config.ts');

    // 检查配置文件是否已存在
    if (fs.existsSync(configPath)) {
      return configPath; // 配置文件已存在，直接返回路径
    }

    try {
      // 写入配置文件
      fs.writeFileSync(configPath, this.DEFAULT_CONFIG_CONTENT, 'utf8');
      console.log(`✅ 配置文件已生成: ${configPath}`);
      return configPath;
    } catch (error) {
      console.error('❌ 生成配置文件失败:', error);
      return '';
    }
  }

  /**
   * 检查配置文件是否存在
   * @param targetPath 目标路径，默认为项目根目录
   * @returns boolean 配置文件是否存在
   */
  public static hasConfig(targetPath: string = process.cwd()): boolean {
    const configPath = path.join(targetPath, 'liteStore.config.ts');
    return fs.existsSync(configPath);
  }

  /**
   * 读取配置文件
   * @param targetPath 目标路径，默认为项目根目录
   * @returns T | null 配置对象或null
   */
  public static readConfig<T>(targetPath: string = process.cwd()): T | null {
    const configPath = path.join(targetPath, 'liteStore.config.ts');

    if (!fs.existsSync(configPath)) {
      return null;
    }

    try {
      // 使用动态导入读取配置
      // 注意：在浏览器环境中无法使用fs，此方法仅在Node.js环境中可用
      const config = require(configPath);
      return config.default || config;
    } catch (error) {
      console.error('❌ 读取配置文件失败:', error);
      return null;
    }
  }
}

/**
 * 默认配置对象
 * 当没有配置文件时使用
 */
export const defaultConfig = {
  // 基础配置
  chunkSize: 5 * 1024 * 1024, // 5MB - 分片大小
  storageFolder: 'expo-litedatastore',
  sortMethods: 'default', // fast, counting, merge, slow
  timeout: 10000, // 10s

  // ==================== 加密配置（完整版） ====================
  encryption: {
    // --- 核心加密参数（新增，强烈推荐显式声明）---
    algorithm: 'AES-CTR', // 明确声明使用 CTR 模式（支持并行，适合移动端）
    keySize: 256, // 明确使用 AES-256（最高安全强度）

    // --- HMAC 完整性保护 ---
    hmacAlgorithm: 'SHA-512', // 推荐 SHA-512（抗长度扩展攻击）

    // --- 密钥派生（抗暴力破解）---
    keyIterations: 120_000, // 2025年推荐值：≥120,000

    // --- 字段级加密 ---
    enableFieldLevelEncryption: false, // 暂时禁用，使用完整数据加密
    encryptedFields: [
      // 明确列出需要加密的字段
      'password',
      'email',
      'phone',
      'idCard',
      'bankCard',
      'realName',
      'token',
      'refreshToken',
    ],

    // --- 密钥缓存优化 ---
    cacheTimeout: 30_000, // 30秒后自动清除内存中的 masterKey
    maxCacheSize: 50, // LRU 缓存最多保留50个派生密钥

    // --- 批量操作 ---
    useBulkOperations: true, // 保持开启，性能提升 5~10 倍
  },

  // 性能配置
  performance: {
    enableQueryOptimization: true, // 建议开启！查询优化（索引）
    maxConcurrentOperations: 5, // 最大并发操作数（建议根据设备性能调整）
    enableBatchOptimization: true, // 建议开启！批量操作优化（批量写入/删除）
    memoryWarningThreshold: 0.8, // 80% 内存使用触发警告（建议根据设备性能调整）
  },

  // 缓存配置
  cache: {
    maxSize: 1000,
    defaultExpiry: 3600_000, // 1小时
    enableCompression: false, // 启用缓存数据压缩（建议根据设备性能调整）
    cleanupInterval: 300_000, // 5分钟
    memoryWarningThreshold: 0.8, // 80% 内存使用触发警告
    // 自动同步配置
    autoSync: {
      enabled: true, // 启用自动同步
      interval: 5000, // 5秒同步一次
      minItems: 1, // 至少1个脏项才同步
      batchSize: 100, // 每次最多同步100个项目
    },
  },

  // API配置
  api: {
    rateLimit: {
      enabled: true, // 建议开启！API 速率限制（防止滥用）
      requestsPerSecond: 20, // 建议根据实际场景调整（20-50之间）
      burstCapacity: 40, // 建议根据实际场景调整（40-80之间）
    },
    retry: {
      maxAttempts: 3, // 最大重试次数（建议根据实际场景调整）
      backoffMultiplier: 2, // 建议根据实际场景调整（2-4之间）
    },
  },

  // 监控配置
  monitoring: {
    enablePerformanceTracking: true, // 建议开启！性能跟踪（监控查询性能）
    enableHealthChecks: true, // 建议开启！健康检查（监控数据库状态）
    metricsRetention: 86_400_000, // 24小时
  },
};
