// src/core/adapter/FileSystemStorageAdapter.ts
import config from "../../liteStore.config.js";
import { StorageTaskProcessor } from "../../taskQueue/StorageTaskProcessor";
import { taskQueue } from "../../taskQueue/taskQueue";
import { MetadataManagerInfc } from "../../types/metadataManagerInfc";
import { StorageAdapterInfc } from "../../types/storageAdapterInfc";
import { StorageError } from "../../types/storageErrorInfc";
import type {
    CreateTableOptions,
    ReadOptions,
    WriteOptions,
    WriteResult
} from "../../types/storageTypes";
import { FileOperationManager } from "../FileOperationManager";
import { CacheManager, CacheStrategy } from "../cache/CacheManager";
import { DataReader } from "../data/DataReader";
import { DataWriter } from "../data/DataWriter";
import { IndexManager } from "../index/IndexManager";
import { meta } from "../meta/MetadataManager";
import { CacheService } from "../service/CacheService";
import { FileService } from "../service/FileService";
import { TransactionService } from "../service/TransactionService";

export class FileSystemStorageAdapter implements StorageAdapterInfc {
    private metadataManager: MetadataManagerInfc;
    private indexManager: IndexManager;
    private fileOperationManager: FileOperationManager;
    private cacheManager: CacheManager;
    private cacheService: CacheService;
    private fileService: FileService;
    private transactionService: TransactionService;
    private dataReader: DataReader;
    private dataWriter: DataWriter;

    /**
     * 构造函数，接受元数据管理器实例
     * @param metadataManager 元数据管理器实例，默认为全局meta单例
     */
    constructor(metadataManager: MetadataManagerInfc = meta) {
        this.metadataManager = metadataManager;
        
        // 初始化核心组件
        this.indexManager = new IndexManager(this.metadataManager);
        this.fileOperationManager = new FileOperationManager(config.chunkSize, this.metadataManager);
        
        // 初始化服务
        this.cacheManager = new CacheManager({
            strategy: CacheStrategy.LRU,
            maxSize: 1000,
            defaultExpiry: 3600000, // 1小时
            enablePenetrationProtection: true,
            enableBreakdownProtection: true,
            enableAvalancheProtection: true
        });
        
        this.cacheService = new CacheService(this.cacheManager);
        this.fileService = new FileService(this.fileOperationManager);
        this.transactionService = new TransactionService(this.metadataManager, this.indexManager);
        
        // 初始化数据访问组件
        this.dataReader = new DataReader(
            this.metadataManager,
            this.indexManager,
            this.cacheManager,
            this.fileOperationManager
        );
        
        this.dataWriter = new DataWriter(
            this.metadataManager,
            this.indexManager,
            this.cacheManager,
            this.fileOperationManager
        );
        
        // 初始化任务队列
        this._initializeTaskQueue();
    }
    
    /**
     * 初始化任务队列
     */
    private _initializeTaskQueue(): void {
        const storageTaskProcessor = new StorageTaskProcessor(this);
        taskQueue.addProcessor(storageTaskProcessor);
        taskQueue.start();
    }

    // ==================== 表管理 ====================
    async createTable(
        tableName: string,
        options: CreateTableOptions & {
            columns?: Record<string, string | { type: string; isHighRisk?: boolean }>;
            initialData?: Record<string, any>[];
            mode?: "single" | "chunked";
            isHighRisk?: boolean;
            highRiskFields?: string[];
        } = {}
    ): Promise<void> {
        return this.dataWriter.createTable(tableName, options);
    }

    async deleteTable(tableName: string): Promise<void> {
        const result = await this.dataWriter.deleteTable(tableName);
        // 清除与该表相关的所有缓存
        this.cacheService.clearTableCache(tableName);
        return result;
    }

    async hasTable(tableName: string): Promise<boolean> {
        return this.dataWriter.hasTable(tableName);
    }

    async listTables(): Promise<string[]> {
        return this.metadataManager.allTables();
    }

    // ==================== 数据读写 ====================
    async write(
        tableName: string,
        data: Record<string, any> | Record<string, any>[],
        options?: WriteOptions & { directWrite?: boolean }
    ): Promise<WriteResult> {
        // 事务处理逻辑
        if (this.transactionService.isInTransaction()) {
            // 保存数据快照（如果还没有保存），用于事务回滚
            const currentData = await this.read(tableName);
            this.transactionService.saveSnapshot(tableName, currentData);
            
            // 将操作添加到事务操作队列
            this.transactionService.addOperation({
                tableName,
                type: "write",
                data,
                options
            });
            
            // 事务中返回模拟结果，不实际修改数据
            const currentCount = await this.count(tableName);
            return {
                written: Array.isArray(data) ? data.length : 1,
                totalAfterWrite: currentCount + (Array.isArray(data) ? data.length : 1),
                chunked: this.metadataManager.get(tableName)?.mode === "chunked"
            };
        }

        // 不在事务中，直接执行写入操作
        return this.dataWriter.write(tableName, data, options);
    }

    async read(
        tableName: string,
        options?: ReadOptions & { bypassCache?: boolean }
    ): Promise<Record<string, any>[]> {
        return this.dataReader.read(tableName, options);
    }

    async count(tableName: string): Promise<number> {
        return this.dataWriter.count(tableName);
    }

    // ==================== 查询方法 ====================
    async findOne(
        tableName: string,
        filter: Record<string, any>
    ): Promise<Record<string, any> | null> {
        return this.dataReader.findOne(tableName, filter);
    }

    async findMany(
        tableName: string,
        filter?: Record<string, any>,
        options?: { skip?: number; limit?: number }
    ): Promise<Record<string, any>[]> {
        return this.dataReader.findMany(tableName, filter, options);
    }

    // ==================== 删除数据 ====================
    async delete(
        tableName: string,
        where: Record<string, any>
    ): Promise<number> {
        // 事务处理逻辑
        if (this.transactionService.isInTransaction()) {
            // 保存数据快照（如果还没有保存），用于事务回滚
            const currentData = await this.read(tableName);
            this.transactionService.saveSnapshot(tableName, currentData);
            
            // 将操作添加到事务操作队列
            this.transactionService.addOperation({
                tableName,
                type: "delete",
                data: where
            });
            
            // 事务中返回模拟结果，不实际修改数据
            return 0;
        }

        // 不在事务中，直接执行删除操作
        return this.dataWriter.delete(tableName, where);
    }

    // ==================== 批量操作 ====================
    async bulkWrite(
        tableName: string,
        operations: Array<{
            type: "insert" | "update" | "delete";
            data: Record<string, any> | Record<string, any>[];
        }>
    ): Promise<WriteResult> {
        // 如果在事务中，将操作添加到事务队列
        if (this.transactionService.isInTransaction()) {
            // 保存数据快照（如果还没有保存）
            const currentData = await this.read(tableName);
            this.transactionService.saveSnapshot(tableName, currentData);
            
            // 添加到事务操作队列
            this.transactionService.addOperation({
                tableName,
                type: "bulkWrite",
                data: operations
            });
            
            // 事务中返回模拟结果
            const currentCount = await this.count(tableName);
            return {
                written: operations.length,
                totalAfterWrite: currentCount + operations.length,
                chunked: this.metadataManager.get(tableName)?.mode === "chunked"
            };
        }
        
        // 直接执行批量操作，不使用任务队列，避免无限递归
        let currentData = await this.read(tableName);
        let writtenCount = 0;
        
        for (const op of operations) {
            const items = Array.isArray(op.data) ? op.data : [op.data];
            
            switch (op.type) {
                case "insert":
                    currentData.push(...items);
                    writtenCount += items.length;
                    break;
                case "update":
                    for (const item of items) {
                        if (item.id) {
                            const index = currentData.findIndex(d => d.id === item.id);
                            if (index !== -1) {
                                currentData[index] = { ...currentData[index], ...item };
                                writtenCount++;
                            }
                        }
                    }
                    break;
                case "delete":
                    for (const item of items) {
                        if (item.id) {
                            const initialLength = currentData.length;
                            currentData = currentData.filter(d => d.id !== item.id);
                            if (currentData.length < initialLength) {
                                writtenCount++;
                            }
                        }
                    }
                    break;
            }
        }
        
        // 写入更新后的数据
        const result = await this.write(tableName, currentData, { mode: "overwrite" });
        
        return {
            ...result,
            written: writtenCount
        };
    }

    // ==================== 事务管理 ====================
    /**
     * 开始事务
     */
    async beginTransaction(): Promise<void> {
        await this.transactionService.beginTransaction();
    }
    
    /**
     * 提交事务
     */
    async commit(): Promise<void> {
        await this.transactionService.commit(
            (tableName, data, options) => this.dataWriter.write(tableName, data, options),
            (tableName, where) => this.dataWriter.delete(tableName, where),
            (tableName, operations) => this.bulkWrite(tableName, operations)
        );
    }
    
    /**
     * 回滚事务
     */
    async rollback(): Promise<void> {
        await this.transactionService.rollback();
    }
    
    // ==================== 模式迁移 ====================
    async migrateToChunked(tableName: string): Promise<void> {
        // 直接执行迁移操作，不使用任务队列，避免无限递归
        // 读取当前表数据
        const data = await this.read(tableName);
        
        // 获取当前表的元数据
        const tableMeta = this.metadataManager.get(tableName);
        if (!tableMeta) {
            throw new StorageError(
                `Table ${tableName} not found`,
                "TABLE_NOT_FOUND",
                {
                    details: `Failed to migrate table ${tableName} to chunked mode: table not found`,
                    suggestion: "Check if the table name is correct"
                }
            );
        }
        
        // 删除原表
        await this.deleteTable(tableName);
        
        // 创建新的分片表
        await this.createTable(tableName, {
            mode: "chunked",
            initialData: data,
            isHighRisk: tableMeta.isHighRisk,
            highRiskFields: tableMeta.highRiskFields
        });
    }
}

const storage = new FileSystemStorageAdapter();
export default storage;