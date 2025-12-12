// src/core/service/FileService.ts
// 文件服务类，负责管理文件操作，包括读写、分块存储等
// 创建于: 2025-11-28
// 最后修改: 2025-12-11
import { FileOperationManager } from '../FileOperationManager';
import { ChunkedFileHandler } from '../file/ChunkedFileHandler';
import { SingleFileHandler } from '../file/SingleFileHandler';
import ROOT from '../../utils/ROOTPath';
import { MetadataManager } from '../meta/MetadataManager';
/**
 * 文件服务类
 * 负责管理文件操作，包括单文件和分片文件的读写、追加和删除等
 * 提供统一的文件操作接口，封装了不同存储模式的实现细节
 */
export class FileService {
  private fileOperationManager: FileOperationManager;

  /**
   * 构造函数
   * @param fileOperationManager 文件操作管理器实例
   */
  constructor(fileOperationManager: FileOperationManager) {
    this.fileOperationManager = fileOperationManager;
  }

  /**
   * 获取单文件处理器
   */
  getSingleFileHandler(tableName: string): SingleFileHandler {
    const filePath = `${ROOT}/${tableName}.ldb`;
    return new SingleFileHandler(filePath);
  }

  /**
   * 获取分块文件处理器
   */
  private metadataManager = new MetadataManager();
  getChunkedFileHandler(tableName: string): ChunkedFileHandler {
    return new ChunkedFileHandler(tableName, this.metadataManager);
  }

  /**
   * 检查文件系统访问权限
   */
  async checkPermissions(): Promise<void> {
    await this.fileOperationManager.checkPermissions();
  }

  /**
   * 读取单文件
   */
  async readSingleFile(tableName: string): Promise<Record<string, any>[]> {
    const handler = this.getSingleFileHandler(tableName);
    return handler.read();
  }

  /**
   * 写入单文件
   */
  async writeSingleFile(tableName: string, data: Record<string, any>[]): Promise<void> {
    const handler = this.getSingleFileHandler(tableName);
    return handler.write(data);
  }

  /**
   * 读取分块文件
   */
  async readChunkedFile(tableName: string): Promise<Record<string, any>[]> {
    const handler = this.getChunkedFileHandler(tableName);
    return handler.readAll();
  }

  /**
   * 写入分块文件
   */
  async writeChunkedFile(tableName: string, data: Record<string, any>[]): Promise<void> {
    const handler = this.getChunkedFileHandler(tableName);
    return handler.write(data);
  }

  /**
   * 追加到分块文件
   */
  async appendToChunkedFile(tableName: string, data: Record<string, any>[]): Promise<void> {
    const handler = this.getChunkedFileHandler(tableName);
    return handler.append(data);
  }

  /**
   * 清空分块文件
   */
  async clearChunkedFile(tableName: string): Promise<void> {
    const handler = this.getChunkedFileHandler(tableName);
    return handler.clear();
  }

  /**
   * 删除单文件
   */
  async deleteSingleFile(tableName: string): Promise<void> {
    const handler = this.getSingleFileHandler(tableName);
    return handler.delete();
  }
}
