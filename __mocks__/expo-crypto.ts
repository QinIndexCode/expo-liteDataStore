// __mocks__/expo-crypto.ts
// Mock implementation for expo-crypto

// Mock Crypto object
const Crypto = {
  // Mock getRandomBytes method
  getRandomBytes: (length: number): Uint8Array => {
    // Generate a simple random bytes array for testing
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  },
  
  // Mock digestStringAsync method
  digestStringAsync: async (
    algorithm: string,
    data: string,
    options?: { encoding?: string }
  ): Promise<string> => {
    // Simple mock implementation
    return Buffer.from(data).toString('base64');
  },
  
  // Mock getRandomValues method
  getRandomValues: (array: Uint8Array): Uint8Array => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  
  // Mock randomUUID method
  randomUUID: (): string => {
    return 'mock-uuid-' + Math.random().toString(36).substring(2, 15);
  }
};

// Export all mock functions using CommonJS syntax
module.exports = {
  Crypto
};

// Also export as named exports for TypeScript compatibility
module.exports.default = module.exports;