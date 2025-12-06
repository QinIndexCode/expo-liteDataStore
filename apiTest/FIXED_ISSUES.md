# 修复 API 测试中发现的问题

## 测试结果分析

根据测试结果，发现以下主要问题：

### 1. 查询引擎问题
- ❌ `$in` 操作符无法正常工作
- ❌ `$like` 操作符无法正常工作
- ❌ `$and` 操作符无法正常工作
- ❌ `$or` 操作符无法正常工作
- ✅ 排序功能正常
- ✅ 分页功能正常

### 2. 更新和删除操作问题
- ❌ 更新操作无法正常工作
- ❌ 删除操作无法正常工作

### 3. 其他问题
- ❌ `clearTable` 功能无法正常工作
- ❌ `bulkWrite` 功能无法正常工作
- ❌ 事务提交无法正常工作

## 修复方案

### 1. 修复 QueryEngine 类

**问题根源**：查询引擎的操作符处理逻辑存在错误，特别是复合条件处理。

**修复方法**：简化查询引擎实现，使用直接的过滤逻辑替代复杂的查询计划。

### 2. 修复更新和删除操作

**问题根源**：更新和删除操作的实现逻辑存在错误。

**修复方法**：重写 `update` 和 `remove` 函数，确保它们能正确修改数据。

### 3. 修复 clearTable 功能

**问题根源**：`clearTable` 函数实现存在问题。

**修复方法**：重写 `clearTable` 函数，确保它能清空表数据。

## 修复步骤

### 步骤 1：修复 QueryEngine 类

```typescript
// src/core/query/QueryEngine.ts

import type { FilterCondition } from '../../types/storageTypes';
import { QUERY } from '../constants';

export class QueryEngine {
  /**
   * 过滤数据，支持多种查询操作符
   */
  static filter<T extends Record<string, any>>(data: T[], condition?: FilterCondition): T[] {
    if (!condition) return data;
    
    // 函数条件
    if (typeof condition === 'function') {
      return data.filter(condition);
    }
    
    // 复合 AND 条件
    if ('$and' in condition) {
      let result = [...data];
      for (const subCondition of condition.$and) {
        result = this.filter(result, subCondition);
      }
      return result;
    }
    
    // 复合 OR 条件
    if ('$or' in condition) {
      const results = new Set<T>();
      for (const subCondition of condition.$or) {
        const filtered = this.filter(data, subCondition);
        filtered.forEach(item => results.add(item));
      }
      return Array.from(results);
    }
    
    // 简单条件
    return data.filter(item => {
      for (const [key, value] of Object.entries(condition)) {
        const itemValue = item[key];
        
        if (itemValue === undefined) {
          return false;
        }
        
        // 操作符条件
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          let matches = true;
          
          for (const [op, opValue] of Object.entries(value)) {
            switch (op) {
              case '$eq':
                if (itemValue !== opValue) matches = false;
                break;
              case '$ne':
                if (itemValue === opValue) matches = false;
                break;
              case '$gt':
                if (itemValue <= opValue) matches = false;
                break;
              case '$gte':
                if (itemValue < opValue) matches = false;
                break;
              case '$lt':
                if (itemValue >= opValue) matches = false;
                break;
              case '$lte':
                if (itemValue > opValue) matches = false;
                break;
              case '$in':
                if (!Array.isArray(opValue)) {
                  matches = false;
                } else {
                  if (Array.isArray(itemValue)) {
                    if (!itemValue.some(item => opValue.includes(item))) {
                      matches = false;
                    }
                  } else {
                    if (!opValue.includes(itemValue)) {
                      matches = false;
                    }
                  }
                }
                break;
              case '$nin':
                if (!Array.isArray(opValue)) {
                  matches = false;
                } else {
                  if (Array.isArray(itemValue)) {
                    if (itemValue.some(item => opValue.includes(item))) {
                      matches = false;
                    }
                  } else {
                    if (opValue.includes(itemValue)) {
                      matches = false;
                    }
                  }
                }
                break;
              case '$like':
                if (typeof itemValue !== 'string' || typeof opValue !== 'string') {
                  matches = false;
                } else {
                  const pattern = opValue.replace(/%/g, '.*');
                  const regex = new RegExp(`^${pattern}$`, 'i');
                  if (!regex.test(itemValue)) {
                    matches = false;
                  }
                }
                break;
              default:
                matches = false;
            }
            
            if (!matches) break;
          }
          
          if (!matches) return false;
        } 
        // 简单值比较
        else if (itemValue !== value) {
          return false;
        }
      }
      
      return true;
    });
  }
}
```

### 步骤 2：修复 update 函数

**问题根源**：`update` 函数的实现逻辑存在错误，无法正确匹配和更新数据。

```typescript
// src/expo-lite-data-store.ts

export async function update(
  tableName: string,
  data: Record<string, any>,
  where: Record<string, any>
): Promise<number> {
  // 只读取一次所有数据，减少文件I/O操作
  const allData = await db.read(tableName);
  
  let updatedCount = 0;
  const finalData = allData.map((item: Record<string, any>) => {
    // 检查是否匹配where条件
    let matches = true;
    for (const [key, value] of Object.entries(where)) {
      if (item[key] !== value) {
        matches = false;
        break;
      }
    }
    
    if (matches) {
      // 更新匹配的数据
      updatedCount++;
      return { ...item, ...data };
    }
    return item;
  });
  
  // 如果没有数据被更新，直接返回0，避免不必要的写入操作
  if (updatedCount === 0) {
    return 0;
  }
  
  // 只写入一次更新后的数据
  await db.write(tableName, finalData, { mode: 'overwrite' });
  return updatedCount;
}
```

### 步骤 3：修复 remove 函数

**问题根源**：`remove` 函数的实现逻辑存在错误，无法正确删除数据。

```typescript
// src/expo-lite-data-store.ts

export const remove = async (
  tableName: string,
  where: Record<string, any>
): Promise<number> => {
  // 读取所有数据
  const allData = await db.read(tableName);
  
  // 过滤出要保留的数据（不匹配where条件的数据）
  const filteredData = allData.filter((item: Record<string, any>) => {
    for (const [key, value] of Object.entries(where)) {
      if (item[key] === value) {
        return false; // 匹配条件，要删除
      }
    }
    return true; // 不匹配条件，保留
  });
  
  // 计算删除的记录数
  const deletedCount = allData.length - filteredData.length;
  
  // 写入过滤后的数据
  await db.write(tableName, filteredData, { mode: 'overwrite' });
  
  return deletedCount;
};
```

### 步骤 4：修复 clearTable 函数

**问题根源**：`clearTable` 函数的实现逻辑存在错误。

```typescript
// src/expo-lite-data-store.ts

export async function clearTable(tableName: string): Promise<void> {
  await db.write(tableName, [], { mode: 'overwrite' });
}
```

### 步骤 5：修复 bulkWrite 函数

**问题根源**：`bulkWrite` 函数的实现逻辑存在错误，无法正确处理不同类型的操作。

```typescript
// src/expo-lite-data-store.ts

export const bulkWrite = async (
  tableName: string,
  operations: Array<{ type: 'insert' | 'update' | 'delete'; data: any }>
): Promise<WriteResult> => {
  // 读取所有数据
  const allData = await db.read(tableName);
  
  let finalData = [...allData];
  
  for (const op of operations) {
    switch (op.type) {
      case 'insert':
        // 插入操作：添加到数据中
        if (Array.isArray(op.data)) {
          finalData = [...finalData, ...op.data];
        } else {
          finalData.push(op.data);
        }
        break;
      case 'update':
        // 更新操作：替换匹配ID的数据
        if (Array.isArray(op.data)) {
          op.data.forEach((item: Record<string, any>) => {
            const index = finalData.findIndex((d: Record<string, any>) => d.id === item.id);
            if (index !== -1) {
              finalData[index] = item;
            } else {
              finalData.push(item);
            }
          });
        } else {
          const index = finalData.findIndex((d: Record<string, any>) => d.id === op.data.id);
          if (index !== -1) {
            finalData[index] = op.data;
          } else {
            finalData.push(op.data);
          }
        }
        break;
      case 'delete':
        // 删除操作：移除匹配ID的数据
        if (Array.isArray(op.data)) {
          const idsToDelete = new Set(op.data.map((item: Record<string, any>) => item.id));
          finalData = finalData.filter((d: Record<string, any>) => !idsToDelete.has(d.id));
        } else {
          finalData = finalData.filter((d: Record<string, any>) => d.id !== op.data.id);
        }
        break;
    }
  }
  
  // 写入最终数据
  return db.write(tableName, finalData, { mode: 'overwrite' });
};
```

### 步骤 6：修复事务提交功能

**问题根源**：事务提交的实现逻辑存在错误，无法正确提交事务。

**修复方法**：确保事务提交时能够正确写入数据。

```typescript
// src/core/service/TransactionService.ts

export class TransactionService {
  async commit(
    writeFn: (tableName: string, data: Record<string, any>[], options?: WriteOptions) => Promise<WriteResult>,
    deleteFn: (tableName: string, where: Record<string, any>) => Promise<number>,
    bulkWriteFn: (tableName: string, operations: any[]) => Promise<WriteResult>
  ): Promise<void> {
    if (!this.isInTransaction) {
      return;
    }
    
    try {
      // 执行所有事务操作
      for (const operation of this.operations) {
        if (operation.type === 'write') {
          await writeFn(operation.tableName, operation.data as any, operation.options);
        } else if (operation.type === 'delete') {
          await deleteFn(operation.tableName, operation.data as any);
        } else if (operation.type === 'bulkWrite') {
          await bulkWriteFn(operation.tableName, operation.data as any);
        }
      }
      
      // 清除事务状态
      this.reset();
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}
```

## 验证修复

修复完成后，重新运行 API 测试，确保所有功能都能正常工作：

```bash
npx jest apiTest/comprehensive-api-test.test.ts --config jest.simple.config.js
```

## 预期结果

所有测试用例应该通过，证明 API 功能已恢复正常。