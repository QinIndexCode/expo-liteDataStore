// Comprehensive API Test for expo-lite-data-store (Jest version)
// Covers all exposed APIs and features mentioned in README

import {
  createTable,
  deleteTable,
  hasTable,
  listTables,
  insert,
  read,
  findOne,
  findMany,
  update,
  remove,
  bulkWrite,
  beginTransaction,
  rollback,
  migrateToChunked,
  clearTable,
  countTable
} from '../src/expo-lite-data-store';

// Test constants
const TEST_TABLE = 'test_comprehensive_table';
const TEST_TABLE_CHUNKED = 'test_chunked_table';

// Helper function to clean up test tables
const cleanupTables = async () => {
  const tables = await listTables();
  for (const table of tables) {
    if (table.startsWith('test_')) {
      await deleteTable(table);
    }
  }
};

describe('Comprehensive API Tests', () => {
  // Cleanup before each test
  beforeEach(async () => {
    await cleanupTables();
  });
  
  // Cleanup after all tests
  afterAll(async () => {
    await cleanupTables();
  });
  
  describe('Table Management APIs', () => {
    it('should create a table successfully', async () => {
      await createTable(TEST_TABLE);
      expect(await hasTable(TEST_TABLE)).toBe(true);
    });
    
    it('should check if a table exists', async () => {
      await createTable(TEST_TABLE);
      const exists = await hasTable(TEST_TABLE);
      expect(exists).toBe(true);
    });
    
    it('should list all tables', async () => {
      await createTable(TEST_TABLE);
      const tables = await listTables();
      expect(tables).toContain(TEST_TABLE);
    });
    
    it('should count records in an empty table', async () => {
      await createTable(TEST_TABLE);
      const count = await countTable(TEST_TABLE);
      expect(count).toBe(0);
    });
  });
  
  describe('Data Insertion and Basic Read', () => {
    it('should insert a single record', async () => {
      await createTable(TEST_TABLE);
      await insert(TEST_TABLE, { id: 1, name: 'Test User 1', age: 25, active: true });
      const data = await read(TEST_TABLE);
      expect(data.length).toBe(1);
      expect(data[0].id).toBe(1);
    });
    
    it('should insert multiple records', async () => {
      await createTable(TEST_TABLE);
      await insert(TEST_TABLE, [
        { id: 1, name: 'Test User 1', age: 25, active: true },
        { id: 2, name: 'Test User 2', age: 30, active: false }
      ]);
      const data = await read(TEST_TABLE);
      expect(data.length).toBe(2);
    });
    
    it('should read all data from table', async () => {
      await createTable(TEST_TABLE);
      await insert(TEST_TABLE, [
        { id: 1, name: 'Test User 1', age: 25, active: true },
        { id: 2, name: 'Test User 2', age: 30, active: false },
        { id: 3, name: 'Test User 3', age: 35, active: true }
      ]);
      const data = await read(TEST_TABLE);
      expect(data.length).toBe(3);
    });
    
    it('should count records in a table with data', async () => {
      await createTable(TEST_TABLE);
      await insert(TEST_TABLE, [
        { id: 1, name: 'Test User 1', age: 25, active: true },
        { id: 2, name: 'Test User 2', age: 30, active: false },
        { id: 3, name: 'Test User 3', age: 35, active: true }
      ]);
      const count = await countTable(TEST_TABLE);
      expect(count).toBe(3);
    });
  });
  
  describe('Query APIs', () => {
    beforeEach(async () => {
      await createTable(TEST_TABLE);
      await insert(TEST_TABLE, [
        { id: 1, name: 'Test User 1', age: 25, active: true },
        { id: 2, name: 'Test User 2', age: 30, active: false },
        { id: 3, name: 'Test User 3', age: 35, active: true }
      ]);
    });
    
    it('should find one record by filter', async () => {
      const user = await findOne(TEST_TABLE, { id: 1 });
      expect(user).toBeDefined();
      expect(user?.id).toBe(1);
    });
    
    it('should find many records with simple filter', async () => {
      const users = await findMany(TEST_TABLE, { active: true });
      expect(users.length).toBe(2);
    });
    
    it('should find records using IN operator', async () => {
      const users = await findMany(TEST_TABLE, { id: { $in: [1, 3] } });
      expect(users.length).toBe(2);
    });
    
    it('should find records using LIKE operator', async () => {
      const users = await findMany(TEST_TABLE, { name: { $like: '%User%' } });
      expect(users.length).toBe(3);
    });
    
    it('should find records using AND operator', async () => {
      const users = await findMany(TEST_TABLE, { $and: [{ active: true }, { age: { $gt: 25 } }] });
      expect(users.length).toBe(1);
      expect(users[0].id).toBe(3);
    });
    
    it('should find records using OR operator', async () => {
      const users = await findMany(TEST_TABLE, { $or: [{ id: 1 }, { id: 3 }] });
      expect(users.length).toBe(2);
    });
    
    it('should sort records', async () => {
      const users = await findMany(TEST_TABLE, {}, { sortBy: 'age', order: 'asc' });
      expect(users[0].age).toBe(25);
      expect(users[1].age).toBe(30);
      expect(users[2].age).toBe(35);
    });
    
    it('should paginate records', async () => {
      const users = await findMany(TEST_TABLE, {}, { skip: 1, limit: 1 });
      expect(users.length).toBe(1);
      expect(users[0].id).toBe(2);
    });
  });
  
  describe('Update and Delete APIs', () => {
    beforeEach(async () => {
      await createTable(TEST_TABLE);
      await insert(TEST_TABLE, [
        { id: 1, name: 'Test User 1', age: 25, active: true },
        { id: 2, name: 'Test User 2', age: 30, active: false },
        { id: 3, name: 'Test User 3', age: 35, active: true }
      ]);
    });
    
    it('should update records', async () => {
      const updatedCount = await update(TEST_TABLE, { age: 40 }, { active: true });
      expect(updatedCount).toBe(2);
      
      const users = await findMany(TEST_TABLE, { active: true });
      expect(users.every(user => user.age === 40)).toBe(true);
    });
    
    it('should delete records', async () => {
      const removedCount = await remove(TEST_TABLE, { id: 2 });
      expect(removedCount).toBe(1);
      
      const users = await read(TEST_TABLE);
      expect(users.length).toBe(2);
    });
  });
  
  describe('bulkWrite API', () => {
    beforeEach(async () => {
      await createTable(TEST_TABLE);
    });
    
    it('should perform bulk write operations', async () => {
      // Use bulkWrite to insert multiple records at once
      const result = await bulkWrite(TEST_TABLE, [
        { type: 'insert', data: { id: 1, name: 'Bulk User 1', age: 22, active: true } },
        { type: 'insert', data: { id: 2, name: 'Bulk User 2', age: 25, active: false } },
      ]);
      
      console.log('bulkWrite result:', result);
      
      // Try to read directly using storage adapter
      const users = await read(TEST_TABLE);
      console.log('users after bulkWrite:', users);
      
      // Try a different approach - use insert first to see if that works
      const insertResult = await insert(TEST_TABLE, { id: 3, name: 'Insert User', age: 30, active: true });
      console.log('insert result:', insertResult);
      
      const usersAfterInsert = await read(TEST_TABLE);
      console.log('users after insert:', usersAfterInsert);
      
      // Should have 2 records after bulk insert
      expect(users.length).toBe(2);
    });
  });
  
  describe('clearTable API', () => {
    beforeEach(async () => {
      await createTable(TEST_TABLE);
      await insert(TEST_TABLE, [
        { id: 1, name: 'Test User 1', age: 25, active: true },
        { id: 2, name: 'Test User 2', age: 30, active: false }
      ]);
    });
    
    it('should clear table data', async () => {
      // Debug: Check initial state
      const initialCount = await countTable(TEST_TABLE);
      console.log('ClearTable Debug - Initial count:', initialCount);
      
      await clearTable(TEST_TABLE);
      
      // Debug: Check after clearTable
      const afterClearCount = await countTable(TEST_TABLE);
      console.log('ClearTable Debug - After clear count:', afterClearCount);
      
      // Debug: Check actual data
      const actualData = await read(TEST_TABLE);
      console.log('ClearTable Debug - Actual data after clear:', actualData);
      
      expect(afterClearCount).toBe(0);
    });
  });
  
  describe('Transaction API', () => {
    beforeEach(async () => {
      await createTable(TEST_TABLE);
      await insert(TEST_TABLE, [
        { id: 1, name: 'User 1', age: 25, active: true },
        { id: 2, name: 'User 2', age: 30, active: false }
      ]);
    });
    
    it('should rollback a transaction', async () => {
      await beginTransaction();
      await remove(TEST_TABLE, { id: 2 });
      await update(TEST_TABLE, { age: 60 }, { id: 1 });
      await rollback();
      
      const users = await read(TEST_TABLE);
      expect(users.length).toBe(2);
    });
  });
  
  describe('Advanced Features', () => {
    it('should migrate table to chunked mode', async () => {
      await createTable(TEST_TABLE_CHUNKED, { 
        initialData: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Chunked User ${i + 1}`,
          data: `Data ${i + 1}`
        }))
      });
      
      await migrateToChunked(TEST_TABLE_CHUNKED);
      const data = await read(TEST_TABLE_CHUNKED);
      expect(data.length).toBe(10);
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle reading non-existent table', async () => {
      const data = await read('non_existent_table');
      expect(data).toEqual([]);
    });
  });
});
