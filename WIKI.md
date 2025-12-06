# expo-lite-data-store WIKI

## 📖 项目介绍

### 什么是 expo-lite-data-store？

**expo-lite-data-store** 是一个超轻量、零配置、纯 TypeScript 编写的 Expo 本地数据库，专为 React Native + Expo 项目设计，无需任何原生依赖。

### 核心特性

| 特性                       | 描述                                     |
| -------------------------- | ---------------------------------------- |
| 🚀 **零配置使用**          | 仅依赖 React Native FS，无需 Metro 配置  |
| 🔒 **可选加密**            | AES-GCM 加密，密钥完全由您掌控           |
| 📦 **智能分块**            | 自动处理 >5MB 文件，完美规避 RN FS 限制  |
| 🔄 **完整事务**            | ACID 事务保证，数据一致性有保障          |
| 📝 **TypeScript 原生支持** | 完整的类型定义，开箱即用                 |
| 🔍 **复杂查询**            | 支持 where、skip、limit、sort 等高级查询 |
| 📱 **完全离线**            | 无需网络，数据 100% 存储在设备本地       |
| 🎯 **智能排序**            | 5种排序算法，自动选择最优性能            |
| ⏰ **自动同步**            | 定期将缓存中的脏数据同步到磁盘，确保数据持久化 |

## 📦 安装指南

### 基本安装

```bash
npm install expo-lite-data-store
# 或使用 yarn / pnpm
yarn add expo-lite-data-store
pnpm add expo-lite-data-store
```

### 依赖要求

- **Expo**：~54.0.23
- **React Native**：0.81.5
- **TypeScript**：~5.9.2

### 环境配置

无需额外配置，开箱即用。

## 🚀 快速开始

### TypeScript 版本 (推荐)

```typescript
// 默认导入
import { createTable, insert, findOne, findMany } from 'expo-lite-data-store';

// 创建用户表
await createTable('users', {
  columns: {
    id: 'number',
    name: 'string',
    age: 'number',
    email: 'string',
  },
});

// 插入数据
await insert('users', [
  { id: 1, name: '张三', age: 25, email: 'zhangsan@example.com' },
  { id: 2, name: '李四', age: 30, email: 'lisi@example.com' },
  { id: 3, name: '王五', age: 35, email: 'wangwu@example.com' },
]);

// 查询数据
const users = await findMany('users', {
  age: { $gte: 30 },
}, {
  sortBy: 'age',
  order: 'desc',
  limit: 10,
});

console.log(users);
```

### JavaScript 版本

```javascript
// CommonJS 导入
const { createTable, insert, findMany } = require('expo-lite-data-store');

// 或 ES6 导入
import { createTable, insert, findMany } from 'expo-lite-data-store';

// 使用方式与 TypeScript 版本完全一致
await createTable('users');
await insert('users', { id: 1, name: 'Alice' });
const users = await findMany('users');
```

## 📚 核心功能详解

### 1. 表管理

#### 创建表

```typescript
// 基本创建
await createTable('users');

// 带初始数据和列定义
await createTable('users', {
  columns: {
    id: 'number',
    name: 'string',
    age: 'number',
  },
  initialData: [
    { id: 1, name: 'Alice', age: 25 },
    { id: 2, name: 'Bob', age: 30 },
  ],
});
```

#### 删除表

```typescript
await deleteTable('users');
```

#### 检查表是否存在

```typescript
const exists = await hasTable('users');
```

#### 列出所有表

```typescript
const tables = await listTables();
```

### 2. 数据操作

#### 插入数据

```typescript
// 单条插入
await insert('users', { id: 3, name: 'Charlie' });

// 多条插入
await insert('users', [
  { id: 3, name: 'Charlie' },
  { id: 4, name: 'David' },
]);
```

#### 读取数据

```typescript
// 读取所有数据
const allUsers = await read('users');

// 使用过滤条件
const activeUsers = await findMany('users', { active: true });

// 查询单条数据
const user = await findOne('users', { id: 1 });
```

#### 更新数据

```typescript
await update('users', { age: 26 }, { id: 1 });
```

#### 删除数据

```typescript
// 删除匹配的记录
await remove('users', { id: 1 });

// 删除所有记录
await remove('users', {});
```

### 3. 高级查询

#### 过滤条件

```typescript
// 简单条件
const adults = await findMany('users', { age: { $gte: 18 } });

// 复合条件
const activeAdults = await findMany('users', {
  $and: [
    { age: { $gte: 18 } },
    { active: true }
  ]
});

// OR 条件
const featuredOrNew = await findMany('products', {
  $or: [
    { featured: true },
    { createdAt: { $gt: '2024-01-01' } }
  ]
});
```

#### 分页和排序

```typescript
const paginatedResults = await findMany('products', {
  category: 'electronics'
}, {
  skip: 20,      // 跳过前20条
  limit: 10,     // 返回10条
  sortBy: ['rating', 'price'],  // 多字段排序
  order: ['desc', 'asc'],       // 对应排序方向
  sortAlgorithm: 'merge'        // 手动指定排序算法
});
```

### 4. 事务管理

```typescript
import { beginTransaction, commit, rollback } from 'expo-lite-data-store';

async function transferMoney(fromUserId: number, toUserId: number, amount: number) {
  try {
    await beginTransaction();
    
    // 执行事务操作
    await update('users', { balance: { $inc: -amount } }, { id: fromUserId });
    await update('users', { balance: { $inc: amount } }, { id: toUserId });
    await insert('transactions', {
      fromUserId,
      toUserId,
      amount,
      timestamp: Date.now()
    });
    
    // 提交事务
    await commit();
    console.log('转账成功');
  } catch (error) {
    // 回滚事务
    await rollback();
    console.error('转账失败:', error);
    throw error;
  }
}
```

### 5. 自动同步机制

#### 配置自动同步

```typescript
import { setAutoSyncConfig, getSyncStats, syncNow } from 'expo-lite-data-store';

// 自定义自动同步配置
setAutoSyncConfig({
  enabled: true,        // 启用自动同步
  interval: 10000,      // 10秒同步一次
  minItems: 5,          // 至少5个脏项才同步
  batchSize: 200        // 每次最多同步200个项目
});

// 获取同步统计信息
const stats = await getSyncStats();
console.log('同步统计:', stats);

// 立即触发同步
await syncNow();
```

## 🔧 高级用法

### 1. 智能排序算法

系统提供5种排序算法，自动选择最优性能：

| 算法       | 适用场景                 | 性能特点           |
| ---------- | ------------------------ | ------------------ |
| `default`  | 小数据集 (< 100项)       | 平衡性能和功能     |
| `fast`     | 大数据集，简单比较       | 最快，但功能简化   |
| `merge`    | 大数据集，稳定排序       | 稳定，适合大数据   |
| `counting` | 有限值域（如状态、等级） | O(n+k)，空间换时间 |
| `slow`     | 需要完整localeCompare    | 支持中文、特殊字符 |

```typescript
// 手动指定算法
const users = await findMany('users', {}, {
  sortBy: 'name',
  sortAlgorithm: 'slow'  // 支持中文排序
});
```

### 2. 批量操作

```typescript
await bulkWrite('products', [
  { type: 'insert', data: { id: 1, name: 'Product 1' } },
  { type: 'update', data: { price: 29.99 }, where: { id: 2 } },
  { type: 'delete', where: { id: 3 } },
]);
```

### 3. 模式迁移

```typescript
// 迁移到分片存储模式
await migrateToChunked('large_table');
```

### 4. 加密存储

```typescript
// 注意：加密功能需要在项目初始化时启用
// 未来版本将支持：
// await enableEncryption();
// await setEncryptionKey('your-secure-key-here');
```

## 📖 API 参考

### 表管理 API

| 方法          | 签名                                     | 说明           |
| ------------- | ---------------------------------------- | -------------- |
| `createTable` | `(tableName, options?) => Promise<void>` | 创建新表       |
| `deleteTable` | `(tableName) => Promise<void>`           | 删除表         |
| `hasTable`    | `(tableName) => Promise<boolean>`        | 检查表是否存在 |
| `listTables`  | `() => Promise<string[]>`                | 获取所有表名   |
| `countTable`  | `(tableName) => Promise<number>`         | 获取表记录数   |
| `clearTable`  | `(tableName) => Promise<void>`           | 清空表数据     |

### 数据操作 API

| 方法        | 签名                                               | 说明                             |
| ----------- | -------------------------------------------------- | -------------------------------- |
| `insert`    | `(tableName, data) => Promise<WriteResult>`        | 插入单条或多条数据               |
| `read`      | `(tableName, options?) => Promise<any[]>`          | 读取数据（支持过滤、分页、排序） |
| `findOne`   | `(tableName, filter) => Promise<any|null>`        | 查询单条记录                     |
| `findMany`  | `(tableName, filter?, options?) => Promise<any[]>` | 查询多条记录（支持高级选项）     |
| `update`    | `(tableName, data, where) => Promise<number>`      | 更新匹配的记录                   |
| `remove`    | `(tableName, where) => Promise<number>`            | 删除匹配的记录                   |
| `bulkWrite` | `(tableName, operations) => Promise<WriteResult>`  | 批量操作                         |

### 事务管理 API

| 方法               | 签名                  | 说明         |
| ------------------ | --------------------- | ------------ |
| `beginTransaction` | `() => Promise<void>` | 开始新事务   |
| `commit`           | `() => Promise<void>` | 提交当前事务 |
| `rollback`         | `() => Promise<void>` | 回滚当前事务 |

### 高级功能 API

| 方法               | 签名                           | 说明                 |
| ------------------ | ------------------------------ | -------------------- |
| `migrateToChunked` | `(tableName) => Promise<void>` | 迁移表到分块存储模式 |
| `getSyncStats`     | `() => Promise<SyncStats>`     | 获取同步统计信息     |
| `syncNow`          | `() => Promise<void>`          | 立即触发数据同步     |
| `setAutoSyncConfig`| `(config: AutoSyncConfig) => void` | 更新自动同步配置 |

## 🎯 最佳实践

### 1. 性能优化

#### 分页查询

```typescript
// 对于大数据集，使用分页避免一次性加载过多数据
const pageSize = 50;
let page = 0;

while (true) {
  const results = await findMany('largeTable', {}, {
    skip: page * pageSize,
    limit: pageSize,
    sortBy: 'id',
  });
  
  if (results.length === 0) break;
  
  // 处理当前页数据
  processPageData(results);
  
  page++;
}
```

#### 选择合适的排序算法

```typescript
// 大数据集使用 fast 或 merge 算法
const logs = await findMany('logs', {}, {
  sortBy: 'timestamp',
  sortAlgorithm: 'merge'  // 适合大数据
});

// 中文排序使用 slow 算法
const users = await findMany('users', {}, {
  sortBy: 'name',
  sortAlgorithm: 'slow'  // 支持中文
});
```

### 2. 数据安全

- **密钥管理**：加密密钥请妥善保管，避免硬编码
- **敏感数据**：对包含敏感信息的数据启用加密
- **定期备份**：重要数据定期备份到云存储
- **密钥轮换**：定期更换加密密钥

### 3. 开发体验

- **使用 TypeScript**：充分利用类型安全和智能提示
- **合理规划表结构**：设计清晰的表结构，避免冗余数据
- **使用事务**：在涉及多条数据修改的操作中使用事务
- **监控性能**：定期检查性能指标，优化慢查询

## 🐛 故障排除

### 常见问题

#### Q: 排序后数据顺序不正确？

A: 检查排序字段是否存在 null/undefined 值，这些值会被排到末尾。

#### Q: 查询性能慢？

A: 尝试使用更适合的数据量的排序算法，或启用分页查询。

#### Q: 内存使用过高？

A: 对于超大数据集，考虑使用分页查询或 `fast` 排序算法。

#### Q: 中文排序不正确？

A: 使用 `sortAlgorithm: 'slow'` 以获得完整的中文支持。

#### Q: 数据写入后无法读取？

A: 确保数据格式正确，检查字段类型是否匹配。

## 🤝 贡献指南

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/QinIndexCode/expo-lite-data-store.git
cd expo-lite-data-store

# 安装依赖
npm install

# 运行测试
npm test

# 构建项目
npm run build
```

### 代码规范

- 使用 TypeScript 编写代码
- 遵循项目的 ESLint 和 Prettier 配置
- 为新功能添加测试
- 保持代码简洁、清晰

### 提交 PR

1. Fork 仓库
2. 创建特性分支
3. 提交代码
4. 运行测试确保通过
5. 提交 Pull Request

## 📄 许可证

MIT © QinIndex Qin

## 📞 支持和反馈

- **GitHub Issues**: [https://github.com/QinIndexCode/expo-lite-data-store/issues](https://github.com/QinIndexCode/expo-lite-data-store/issues)
- **文档**: [https://github.com/QinIndexCode/expo-lite-data-store/wiki](https://github.com/QinIndexCode/expo-lite-data-store/wiki)

## 🚀 未来规划

- [ ] 更强大的索引功能
- [ ] 支持关系查询
- [ ] 数据导出和导入
- [ ] 更高级的加密选项
- [ ] 云同步集成

---

感谢您使用 expo-lite-data-store！如果您喜欢这个项目，请给它一个 ⭐ Star，让更多人发现它！