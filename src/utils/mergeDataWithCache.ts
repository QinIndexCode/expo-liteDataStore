// src/utils/mergeDataWithCache.ts
// 合并数据与缓存工具
/**
    *@cacheData
    *@targetTable
 */

//
class CacheMerge {
    private cacheData: string;
    private targetTable: string;

    constructor(cacheData: string, targetTable: string) {
        this.cacheData = cacheData;
        this.targetTable = targetTable;
    }

    // 合并数据与缓存
    mergeDataWithCache(data: any): any {
        try {
            // 1. 解析缓存数据
            const cacheObj = JSON.parse(this.cacheData);

            // 2. 合并数据与缓存（避免自引用）
            const tableData = cacheObj[this.targetTable] || {};
            cacheObj[this.targetTable] = { ...tableData, ...data };

            // 3. 返回合并后的缓存数据
            return cacheObj;
        } catch (error) {
            // 处理 JSON 解析错误
            console.error('数据与缓存合并失败:', error);
            return data;
        }
    }
}
