//src/cache/cacheData.ts
//缓存数据实现 / Cache Data Implementation
import Storage from "../core/adapter/FileSystemStorageAdapter"
// 定义缓存的数据，缓存数据metaData , 任务队列缓存


/**
 * 缓存数据实现 / Cache Data Implementation
 * 单例模式实现 / Singleton Pattern Implementation
 * @class CacheData
 * @description 缓存数据实现
 * @description 缓存数据实现
 */
const CacheDataClass =class CacheData {
    private dataMap = new Map<string, Record<string, any>>();
    
    //set
    async set(key: string, value: any, options?: any): Promise<void> {
        this.dataMap.set(key, value);
    }
    //get
    async get(key: string): Promise<any> {
        return this.dataMap.get(key);
    }
    //delete
    async delete(key: string): Promise<void> {
        this.dataMap.delete(key);
    }
    //clear
    async clear(): Promise<void> {
        this.dataMap.clear();
    }
}

const CacheData = new CacheDataClass();

const MetaCache = new CacheDataClass()
let metaData 

export function getMetaFromStorage() {
    metaData = Storage.read("meta.ldb")
}
export function storageMetaFromCache() {
    
}
setInterval(() => {
    
}, 1000*60*60);
export  {CacheData,MetaCache};