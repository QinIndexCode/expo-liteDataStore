// src/core/EncryptedStorageAdapter.ts
// 加密存储适配装饰器 
import type { StorageAdapterInfc } from "../types/storageAdapterInfc";
import { decrypt, encrypt, getMasterKey } from "../utils/crypto";
import storage from "./adapter/FileSystemStorageAdapter";

export class EncryptedStorageAdapter implements StorageAdapterInfc {
  private keyPromise = getMasterKey();

  private async key() {
    return await this.keyPromise;
  }

  async createTable(dir: any, options?: any) {
    return storage.createTable(dir, options);
  }

  async deleteTable(tableName: string) {
    return storage.deleteTable(tableName);
  }

  async hasTable(tableName: string) {
    return storage.hasTable(tableName);
  }

  async listTables() {
    return storage.listTables();
  }

  async write(tableName: string, data: any, options?: any) {
    const key = await this.key();
    const encrypted = await encrypt(JSON.stringify(data), key);
    return storage.write(tableName, [{ __enc: encrypted }], { mode: "overwrite", ...options });
  }

  async read(tableName: string, options?: any) {
    const raw = await storage.read(tableName, options);
    if (raw.length === 0) return [];
    const first = raw[0];
    if (first?.__enc) {
      const key = await this.key();
      return JSON.parse(await decrypt(first.__enc, key));
    }
    return raw;
  }
}