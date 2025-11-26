/**
 * ChunkedFileHandler handles file operations for chunked storage mode.
 * It appends data to multiple files (chunks) and manages metadata.
 */
import { Directory, File } from "expo-file-system";
import * as Crypto from "expo-crypto";
import { meta } from "../meta/MetadataManager";
import config from "../../liteStore.config.js";
import ROOT from "../../utils/ROOTPath.js";
import { StorageError } from "../../types/storageAdapterInfc";

const CHUNK_EXT = ".ldb";
const META_FILE = "meta.ldb";

const withTimeout = <T>(
  promise: Promise<T>,
  ms = 10000,
  operation = "chunked file operation"
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() =>
        reject(new StorageError(`${operation} timeout`, "TIMEOUT")), ms
      )
    ),
  ]);
};

export class ChunkedFileHandler {
  private tableDir: Directory;

  constructor(tableName: string) {
    this.tableDir = new Directory(ROOT, tableName);
  }

  private getChunkFile(index: number): File {
    // 正确：大表是 users/0000.ldb
    return new File(this.tableDir, String(index).padStart(6, "0") + CHUNK_EXT);
  }

  private getMetaFile(): File {
    return new File(this.tableDir, META_FILE);
  }

  /**
   * Appends data to the table's chunked files.
   * @param data - The data to append.
   */ 
  async append(data: Record<string, any>[]) {
    if (data.length === 0) return;

    await this.tableDir.create({ intermediates: true });

    const currentMeta = meta.get(this.tableDir.name) || {
      mode: "chunked" as const,
      path: this.tableDir.name + "/",
      count: 0,
      chunks: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    let chunkIndex = currentMeta.chunks || 0;
    let currentChunk: Record<string, any>[] = [];
    let currentSize = 0;

    for (const item of data) {
      const itemSize = new TextEncoder().encode(JSON.stringify(item)).byteLength + 200; // 预估开销

      if (currentSize + itemSize > config.chunkSize && currentChunk.length > 0) {
        await this.writeChunk(chunkIndex, currentChunk);
        chunkIndex++;
        currentChunk = [];
        currentSize = 0;
      }

      currentChunk.push(item);
      currentSize += itemSize;
    }

    if (currentChunk.length > 0) {
      await this.writeChunk(chunkIndex, currentChunk);
      chunkIndex++;
    }

    meta.update(this.tableDir.name, {
      mode: "chunked",
      count: currentMeta.count + data.length,
      chunks: chunkIndex,
      updatedAt: Date.now(),
    });
  }

  private async writeChunk(index: number, data: Record<string, any>[]) {
    const file = this.getChunkFile(index);
    const content = JSON.stringify(data);
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      content
    );
    await file.write(JSON.stringify({ data, hash }));
  }

  async readAll(): Promise<Record<string, any>[]> {
    const metaFile = this.getMetaFile();
    let chunksCount = 0;
    try {
      const info = await metaFile.info();
      if (info.exists) {
        const text = await metaFile.text();
        const metaInfo = JSON.parse(text);
        chunksCount = metaInfo.chunks || 0;
      }
    } catch (e) {
      console.warn("读取分片元数据失败，使用扫描模式", e);
    }

    const all: Record<string, any>[] = [];
    for (let i = 0; i < Math.max(chunksCount, 1000); i++) { // 最多扫 1000 个，防无限循环
      const file = this.getChunkFile(i);
      const info = await file.info();
      if (!info.exists) {
        if (i < chunksCount) continue; // 中间缺失也跳过
        break; // 连续缺失说明结束了
      }

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed.data || parsed.hash === undefined) continue;

        const expected = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          JSON.stringify(parsed.data)
        );
        if (expected !== parsed.hash) {
          console.warn(`Chunk ${i} corrupted, skipping`);
          continue;
        }
        all.push(...parsed.data);
      } catch (e) {
        console.warn(`读取 chunk ${i} 失败`, e);
      }
    }
    return all;
  }

  async clear() {
    try {
      const entries = await this.tableDir.list();
      await Promise.all(
        entries.map(async e => {
          try {
            e.delete();
          } catch {}
        })
      );
      meta.update(this.tableDir.name, {
        count: 0,
        chunks: 0,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("清空分片表失败", error);
    }
  }
}