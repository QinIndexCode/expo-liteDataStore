// src/core/adapter/FileSystemStorageAdapter.ts
import { Directory, File } from "expo-file-system";
import config from "../../liteStore.config.js";
import { StorageError, type StorageAdapterInfc } from "../../types/storageAdapterInfc.js";
import type {
    CreateTableOptions,
    ReadOptions,
    WriteOptions,
    WriteResult,
} from "../../types/storageTypes";
import ROOT from "../../utils/ROOTPath.js";
import { SingleFileHandler } from "../file/SingleFileHandler";
import type { ColumnSchema, TableSchema } from "../meta/MetadataManager";
import { meta } from "../meta/MetadataManager";
import { QueryEngine } from "../query/QueryEngine";

// 超时包装（所有异步操作加上 10s 超时）
const withTimeout = <T>(promise: Promise<T>, ms = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new StorageError("操作超时", "TIMEOUT")), ms)
    ),
  ]);
};

export class FileSystemStorageAdapter implements StorageAdapterInfc {
    private chunkSize = config.chunkSize;

    private static readonly supportedColumnTypes: ColumnSchema[string][] = [
        "string", "number", "boolean", "date", "blob",
    ];

    private normalizeColumnSchema(columns?: Record<string, string>): ColumnSchema {
        const schema: ColumnSchema = {};
        if (!columns) return schema;

        for (const [column, type] of Object.entries(columns)) {
            if (!FileSystemStorageAdapter.supportedColumnTypes.includes(type as any)) {
                throw new StorageError(
                    `不支持的列类型: ${column}: ${type}`,
                    "TABLE_COLUMN_INVALID"
                );
            }
            schema[column] = type as ColumnSchema[string];
        }
        return schema;
    }

    private getSingleFile(tableName: string): SingleFileHandler {
        const file = new File(ROOT, tableName + ".ldb");
        return new SingleFileHandler(file);
    }

    // ==================== 创建表（开发者最爱用的版本） ====================
    async createTable(
            tableName: string,
        options: CreateTableOptions & {
            columns?: Record<string, string>;
            initialData?: Record<string, any>[];
        } = {}
    ): Promise<void> {
        try {
            if (!tableName?.trim()) {
                throw new StorageError("表名不能为空", "TABLE_NAME_INVALID");
            }
            if (meta.get(tableName)) {
                return; // 幂等
            }

            const { columns = {}, initialData = [] } = options;

            // 自动创建（单文件模式）
            const handler = this.getSingleFile(tableName);
            await withTimeout(handler.write(initialData));

            // 注册元数据（不覆盖 createdAt）
            meta.update(tableName, {
                mode: "single",
                path: `${tableName}.ldb`,
                count: initialData.length,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                columns: this.normalizeColumnSchema(columns),
            });
        } catch (error) {
            throw new StorageError(`创建表 ${tableName} 失败`, "TABLE_CREATE_FAILED", error);
        }
    }

    // ==================== 删除表（彻底清理） ====================
    async deleteTable(tableName: string): Promise<void> {
        try {
            await withTimeout(Promise.allSettled([
                this.getSingleFile(tableName).delete(),
                new Directory(ROOT, tableName).delete(),
            ]));
            meta.delete(tableName);
        } catch (error) {
            throw new StorageError(`删除表 ${tableName} 失败`, "TABLE_DELETE_FAILED", error);
        }
    }

    async hasTable(tableName: string): Promise<boolean> {
        return meta.get(tableName) !== undefined;
    }

    async listTables(): Promise<string[]> {
        return meta.allTables();
    }

    // ==================== 写入（自动创建 + 超时） ====================
    async write(
        tableName: string,
        data: Record<string, any> | Record<string, any>[],
        options?: WriteOptions
    ): Promise<WriteResult> {
        const items = Array.isArray(data) ? data : [data];
        if (items.length === 0) {
            return { written: 0, totalAfterWrite: await this.count(tableName), chunked: false };
        }

        // 自动创建表
        if (!await this.hasTable(tableName)) {
            await this.createTable(tableName);
        }

        try {
            const handler = this.getSingleFile(tableName);
            const existing = options?.mode === "overwrite" ? [] : await withTimeout(handler.read());
            const final = options?.mode === "overwrite" ? items : [...existing, ...items];

            await withTimeout(handler.write(final));

            meta.update(tableName, {
                count: final.length,
                updatedAt: Date.now(),
            });

            return {
                written: items.length,
                totalAfterWrite: final.length,
                chunked: false,
            };
        } catch (error) {
            throw new StorageError(`写入表 ${tableName} 失败`, "FILE_WRITE_FAILED", error);
        }
    }

    // ==================== 读取（防御性编程） ====================
    async read(tableName: string, options?: ReadOptions): Promise<Record<string, any>[]> {
        try {
            const handler = this.getSingleFile(tableName);
            let data = await withTimeout(handler.read());

            if (options?.filter) {
                data = QueryEngine.filter(data, options.filter);
            }   
            data = QueryEngine.paginate(data, options?.skip, options?.limit);

            return data;
        } catch (error) {
            throw new StorageError(`读取表 ${tableName} 失败`, "FILE_READ_FAILED", error);
        }
    }

    async count(tableName: string): Promise<number> {
        return meta.count(tableName);
    }
}

const storage = new FileSystemStorageAdapter();
export default storage;