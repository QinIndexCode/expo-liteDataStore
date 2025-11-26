//src/cache/cacheAdapter.ts
//缓存接口适配器实现 / Cache Adapter Implementation
import { CacheData } from "./cacheDataInfc";
import type { CacheAdapterInfc } from "../types/cacheAdapterInfc";


export class CacheAdapter implements CacheAdapterInfc {
    /**
     * 设置缓存值 / Set Cache Value
     * @param key 缓存键 / Cache Key
     * @param value 缓存值 / Cache Value
     * @param options 缓存选项 / Cache Options
     * @returns Promise<void>
     */
    async set(key: string, value: any, options?: any): Promise<void> {
        return CacheData.set(key, value);   
    }

    /**
     * 获取缓存值 / Get Cache Value
     * @param key 缓存键 / Cache Key
     * @returns Promise<any>
     */
    async get(key: string): Promise<any> {
        return CacheData.get(key);
    }

    /** 
     * 删除缓存值 / Delete Cache Value
     * @param key 缓存键 / Cache Key
     * @returns Promise<void>
     */
    async delete(key: string): Promise<void> {
        return CacheData.delete(key);
    }

    /**
     * 清空缓存 / Clear Cache
     * @returns Promise<void>
     */
    async clear(): Promise<void> {
        return CacheData.clear();
    }
}