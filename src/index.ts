// src/index.ts
// 主要API
import { db, plainStorage } from './core/db';

// 导出db和plainStorage
export { db, plainStorage };

// 表管理
export const createTable = db.createTable.bind(db);
export const deleteTable = db.deleteTable.bind(db);
export const hasTable = db.hasTable.bind(db);
export const listTables = db.listTables.bind(db);

// 数据读写
export const insert = db.write.bind(db);
export const read = db.read.bind(db);
export const countTable = db.count.bind(db);

// 查询方法
export const findOne = db.findOne.bind(db);
export const findMany = db.findMany.bind(db);

// 删除数据
export const remove = db.delete.bind(db);

// 批量操作
export const bulkWrite = db.bulkWrite.bind(db);

// 事务管理
export const beginTransaction = db.beginTransaction.bind(db);
export const commit = db.commit.bind(db);
export const rollback = db.rollback.bind(db);

// 模式迁移
export const migrateToChunked = db.migrateToChunked.bind(db);

// 为了兼容用户习惯，添加clearTable方法
export async function clearTable(tableName: string): Promise<void> {
  await db.delete(tableName, {});
}

// 为了兼容用户习惯，添加update方法
export async function update(
  tableName: string,
  data: Record<string, any>,
  where: Record<string, any>
): Promise<number> {
  // 先查询匹配的数据
  const matchedData = await db.findMany(tableName, where);
  if (matchedData.length === 0) {
    return 0;
  }
  
  // 更新每条数据
  const updatedData = matchedData.map((item: Record<string, any>) => ({ ...item, ...data }));
  
  // 读取所有数据
  const allData = await db.read(tableName);
  
  // 替换匹配的数据
  const finalData = allData.map((item: Record<string, any>) => {
    // 检查是否匹配where条件
    const matches = Object.entries(where).every(([key, value]) => item[key] === value);
    if (matches) {
      // 返回更新后的数据
      return { ...item, ...data };
    }
    return item;
  });
  
  // 使用覆盖模式写入数据
  await db.write(tableName, finalData, { mode: "overwrite" });
  return updatedData.length;
}

// 导出类型
export type {
  CreateTableOptions,
  ReadOptions,
  WriteOptions,
  WriteResult
} from './types/storageTypes.js';
