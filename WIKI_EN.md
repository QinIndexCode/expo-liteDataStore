# expo-lite-data-store WIKI

## 📖 Project Introduction

### What is expo-lite-data-store?

**expo-lite-data-store** is an ultra-lightweight, zero-configuration, pure TypeScript Expo local database, designed specifically for React Native + Expo projects with no native dependencies.

### Core Features

| Feature                       | Description                                      |
| -------------------------- | ---------------------------------------- |
| 🚀 **Zero Configuration**          | Only depends on React Native FS, no Metro configuration  |
| 🔒 **Optional Encryption**            | AES-GCM encryption, keys fully under your control           |
| 📦 **Intelligent Chunking**            | Automatically handles >5MB files, perfectly avoiding RN FS limits  |
| 🔄 **Complete Transactions**            | ACID transaction guarantees, data consistency ensured          |
| 📝 **TypeScript Native Support** | Complete type definitions, ready to use                 |
| 🔍 **Complex Queries**            | Supports advanced queries like where, skip, limit, sort |
| 📱 **Fully Offline**            | No network required, 100% local data storage       |
| 🎯 **Intelligent Sorting**            | 5 sorting algorithms, automatically selects optimal performance            |
| ⏰ **Auto-synchronization**            | Regularly synchronizes dirty data from cache to disk, ensuring data persistence |

## 📦 Installation Guide

### Basic Installation

```bash
npm install expo-lite-data-store
# or use yarn / pnpm
yarn add expo-lite-data-store
pnpm add expo-lite-data-store
```

### Dependencies

- **Expo**：~54.0.23
- **React Native**：0.81.5
- **TypeScript**：~5.9.2

### Environment Configuration

No additional configuration required, ready to use out of the box.

## 🚀 Quick Start

### TypeScript Version (Recommended)

```typescript
// Default import
import { createTable, insert, findOne, findMany } from 'expo-lite-data-store';

// Create user table
await createTable('users', {
  columns: {
    id: 'number',
    name: 'string',
    age: 'number',
    email: 'string',
  },
});

// Insert data
await insert('users', [
  { id: 1, name: 'Zhang San', age: 25, email: 'zhangsan@example.com' },
  { id: 2, name: 'Li Si', age: 30, email: 'lisi@example.com' },
  { id: 3, name: 'Wang Wu', age: 35, email: 'wangwu@example.com' },
]);

// Query data
const users = await findMany('users', {
  age: { $gte: 30 },
}, {
  sortBy: 'age',
  order: 'desc',
  limit: 10,
});

console.log(users);
```

### JavaScript Version

```javascript
// CommonJS import
const { createTable, insert, findMany } = require('expo-lite-data-store');

// or ES6 import
import { createTable, insert, findMany } from 'expo-lite-data-store';

// Usage is identical to TypeScript version
await createTable('users');
await insert('users', { id: 1, name: 'Alice' });
const users = await findMany('users');
```

## 📚 Core Features Detailed

### 1. Table Management

#### Create Table

```typescript
// Basic creation
await createTable('users');

// With initial data and column definitions
await createTable('users', {
  columns: {
    id: 'number',
    name: 'string',
    age: 'number',
  },
  initialData: [
    { id: 1, name: 'Alice', age: 25 },
    { id: 2, name: 'Bob', age: 30 },
  ],
});
```

#### Delete Table

```typescript
await deleteTable('users');
```

#### Check if Table Exists

```typescript
const exists = await hasTable('users');
```

#### List All Tables

```typescript
const tables = await listTables();
```

### 2. Data Operations

#### Insert Data

```typescript
// Single insert
await insert('users', { id: 3, name: 'Charlie' });

// Multiple inserts
await insert('users', [
  { id: 3, name: 'Charlie' },
  { id: 4, name: 'David' },
]);
```

#### Read Data

```typescript
// Read all data
const allUsers = await read('users');

// With filter conditions
const activeUsers = await findMany('users', { active: true });

// Query single record
const user = await findOne('users', { id: 1 });
```

#### Update Data

```typescript
await update('users', { age: 26 }, { id: 1 });
```

#### Delete Data

```typescript
// Delete matching records
await remove('users', { id: 1 });

// Delete all records
await remove('users', {});
```

### 3. Advanced Queries

#### Filter Conditions

```typescript
// Simple condition
const adults = await findMany('users', { age: { $gte: 18 } });

// Compound condition with AND
const activeAdults = await findMany('users', {
  $and: [
    { age: { $gte: 18 } },
    { active: true }
  ]
});

// OR condition
const featuredOrNew = await findMany('products', {
  $or: [
    { featured: true },
    { createdAt: { $gt: '2024-01-01' } }
  ]
});
```

#### Pagination and Sorting

```typescript
const paginatedResults = await findMany('products', {
  category: 'electronics'
}, {
  skip: 20,      // Skip first 20 records
  limit: 10,     // Return 10 records
  sortBy: ['rating', 'price'],  // Multi-field sorting
  order: ['desc', 'asc'],       // Corresponding sort directions
  sortAlgorithm: 'merge'        // Manually specify sort algorithm
});
```

### 4. Transaction Management

```typescript
import { beginTransaction, commit, rollback } from 'expo-lite-data-store';

async function transferMoney(fromUserId: number, toUserId: number, amount: number) {
  try {
    await beginTransaction();
    
    // Perform transaction operations
    await update('users', { balance: { $inc: -amount } }, { id: fromUserId });
    await update('users', { balance: { $inc: amount } }, { id: toUserId });
    await insert('transactions', {
      fromUserId,
      toUserId,
      amount,
      timestamp: Date.now()
    });
    
    // Commit transaction
    await commit();
    console.log('Transfer successful');
  } catch (error) {
    // Rollback transaction on error
    await rollback();
    console.error('Transfer failed:', error);
    throw error;
  }
}
```

### 5. Auto-synchronization Mechanism

#### Configure Auto-synchronization

```typescript
import { setAutoSyncConfig, getSyncStats, syncNow } from 'expo-lite-data-store';

// Customize auto-synchronization configuration
setAutoSyncConfig({
  enabled: true,        // Enable auto-synchronization
  interval: 10000,      // Sync every 10 seconds
  minItems: 5,          // Minimum 5 dirty items to sync
  batchSize: 200        // Maximum 200 items per sync
});

// Get synchronization statistics
const stats = await getSyncStats();
console.log('Sync stats:', stats);

// Trigger immediate synchronization
await syncNow();
```

## 🔧 Advanced Usage

### 1. Intelligent Sorting Algorithms

The system provides 5 sorting algorithms, automatically selecting the optimal performance:

| Algorithm       | Use Case                 | Performance Characteristics           |
| ---------- | ------------------------ | ------------------ |
| `default`  | Small datasets (< 100 items)       | Balanced performance and functionality     |
| `fast`     | Large datasets, simple comparisons       | Fastest, but simplified functionality   |
| `merge`    | Large datasets, stable sorting       | Stable, suitable for large data   |
| `counting` | Limited value range (e.g., status, level) | O(n+k), space for time |
| `slow`     | Needs complete localeCompare    | Supports Chinese, special characters |

```typescript
// Manually specify algorithm
const users = await findMany('users', {}, {
  sortBy: 'name',
  sortAlgorithm: 'slow'  // Supports Chinese sorting
});
```

### 2. Bulk Operations

```typescript
await bulkWrite('products', [
  { type: 'insert', data: { id: 1, name: 'Product 1' } },
  { type: 'update', data: { price: 29.99 }, where: { id: 2 } },
  { type: 'delete', where: { id: 3 } },
]);
```

### 3. Schema Migration

```typescript
// Migrate to chunked storage mode
await migrateToChunked('large_table');
```

### 4. Encrypted Storage

```typescript
// Note: Encryption functionality needs to be enabled during project initialization
// Future versions will support:
// await enableEncryption();
// await setEncryptionKey('your-secure-key-here');
```

## 📖 API Reference

### Table Management API

| Method          | Signature                                     | Description           |
| ------------- | ---------------------------------------- | -------------- |
| `createTable` | `(tableName, options?) => Promise<void>` | Create new table       |
| `deleteTable` | `(tableName) => Promise<void>`           | Delete table         |
| `hasTable`    | `(tableName) => Promise<boolean>`        | Check if table exists |
| `listTables`  | `() => Promise<string[]>`                | Get all table names   |
| `countTable`  | `(tableName) => Promise<number>`         | Get table record count   |
| `clearTable`  | `(tableName) => Promise<void>`           | Clear table data     |

### Data Operations API

| Method        | Signature                                               | Description                             |
| ----------- | -------------------------------------------------- | -------------------------------- |
| `insert`    | `(tableName, data) => Promise<WriteResult>`        | Insert single or multiple records               |
| `read`      | `(tableName, options?) => Promise<any[]>`          | Read data (supports filtering, pagination, sorting) |
| `findOne`   | `(tableName, filter) => Promise<any|null>`        | Query single record                     |
| `findMany`  | `(tableName, filter?, options?) => Promise<any[]>` | Query multiple records (supports advanced options)     |
| `update`    | `(tableName, data, where) => Promise<number>`      | Update matching records                   |
| `remove`    | `(tableName, where) => Promise<number>`            | Delete matching records                   |
| `bulkWrite` | `(tableName, operations) => Promise<WriteResult>`  | Batch operations                         |

### Transaction Management API

| Method               | Signature                  | Description         |
| ------------------ | --------------------- | ------------ |
| `beginTransaction` | `() => Promise<void>` | Start new transaction   |
| `commit`           | `() => Promise<void>` | Commit current transaction |
| `rollback`         | `() => Promise<void>` | Rollback current transaction |

### Advanced Features API

| Method               | Signature                           | Description                 |
| ------------------ | ------------------------------ | -------------------- |
| `migrateToChunked` | `(tableName) => Promise<void>` | Migrate table to chunked storage mode |
| `getSyncStats`     | `() => Promise<SyncStats>`     | Get synchronization statistics     |
| `syncNow`          | `() => Promise<void>`          | Trigger immediate data synchronization     |
| `setAutoSyncConfig`| `(config: AutoSyncConfig) => void` | Update auto-synchronization configuration |

## 🎯 Best Practices

### 1. Performance Optimization

#### Pagination Query

```typescript
// For large datasets, use pagination to avoid loading too much data at once
const pageSize = 50;
let page = 0;

while (true) {
  const results = await findMany('largeTable', {}, {
    skip: page * pageSize,
    limit: pageSize,
    sortBy: 'id',
  });
  
  if (results.length === 0) break;
  
  // Process current page data
  processPageData(results);
  
  page++;
}
```

#### Choose the Right Sorting Algorithm

```typescript
// Use fast or merge algorithm for large datasets
const logs = await findMany('logs', {}, {
  sortBy: 'timestamp',
  sortAlgorithm: 'merge'  // Suitable for large data
});

// Use slow algorithm for Chinese sorting
const users = await findMany('users', {}, {
  sortBy: 'name',
  sortAlgorithm: 'slow'  // Supports Chinese
});
```

### 2. Data Security

- **Key Management**: Keep encryption keys secure, avoid hardcoding
- **Sensitive Data**: Enable encryption for data containing sensitive information
- **Regular Backups**: Regularly back up important data to cloud storage
- **Key Rotation**: Regularly rotate encryption keys

### 3. Development Experience

- **Use TypeScript**: Fully leverage type safety and intelligent hints
- **Plan Table Structure**: Design clear table structures, avoid redundant data
- **Use Transactions**: Use transactions for operations involving multiple data modifications
- **Monitor Performance**: Regularly check performance metrics, optimize slow queries

## 🐛 Troubleshooting

### Common Issues

#### Q: Incorrect data order after sorting?

A: Check if the sorting field has null/undefined values, which will be sorted to the end.

#### Q: Slow query performance?

A: Try using a sorting algorithm more suitable for your data volume, or enable pagination.

#### Q: High memory usage?

A: For extremely large datasets, consider using pagination or the `fast` sorting algorithm.

#### Q: Incorrect Chinese sorting?

A: Use `sortAlgorithm: 'slow'` for complete Chinese support.

#### Q: Can't read data after writing?

A: Ensure data format is correct, check if field types match.

## 🤝 Contribution Guide

### Development Environment Setup

```bash
# Clone repository
git clone https://github.com/QinIndexCode/expo-lite-data-store.git
cd expo-lite-data-store

# Install dependencies
npm install

# Run tests
npm test

# Build project
npm run build
```

### Code Guidelines

- Write code in TypeScript
- Follow project's ESLint and Prettier configuration
- Add tests for new features
- Keep code concise and clear

### Submit a PR

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Run tests to ensure they pass
5. Submit a Pull Request

## 📄 License

MIT © QinIndex Qin

## 📞 Support and Feedback

- **GitHub Issues**: [https://github.com/QinIndexCode/expo-lite-data-store/issues](https://github.com/QinIndexCode/expo-lite-data-store/issues)
- **Documentation**: [https://github.com/QinIndexCode/expo-lite-data-store/wiki](https://github.com/QinIndexCode/expo-lite-data-store/wiki)

## 🚀 Future Plans

- [ ] More powerful indexing features
- [ ] Support for relational queries
- [ ] Data export and import
- [ ] Advanced encryption options
- [ ] Cloud synchronization integration

---

Thank you for using expo-lite-data-store! If you like this project, please give it a ⭐ Star to help more people discover it!