/**
 * Tests for the Node.js version of the encryption service
 * Note: This is a simplified test for Node.js environment
 * The actual encryption service is designed to run in the browser
 */

const crypto = require('crypto');

// Mock browser crypto API for Node.js testing environment
global.window = {
  crypto: {
    getRandomValues: (array) => {
      const randomValues = crypto.randomBytes(array.length);
      array.set(randomValues);
      return array;
    },
    subtle: {
      importKey: async (format, keyData, algorithm, extractable, keyUsages) => {
        return { type: 'mock-key', algorithm, extractable, usages: keyUsages, keyData };
      },
      encrypt: async (algorithm, key, data) => {
        const cipher = crypto.createCipheriv(
          'aes-256-gcm', 
          Buffer.from(key.keyData), 
          Buffer.from(algorithm.iv)
        );
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return Buffer.concat([encrypted, authTag]);
      },
      decrypt: async (algorithm, key, data) => {
        // Extract the auth tag (last 16 bytes)
        const authTag = data.slice(data.length - 16);
        const encryptedData = data.slice(0, data.length - 16);
        
        const decipher = crypto.createDecipheriv(
          'aes-256-gcm', 
          Buffer.from(key.keyData), 
          Buffer.from(algorithm.iv)
        );
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
      }
    }
  }
};

// Mock TextEncoder and TextDecoder
global.TextEncoder = class TextEncoder {
  encode(text) {
    return Buffer.from(text);
  }
};

global.TextDecoder = class TextDecoder {
  decode(buffer) {
    return Buffer.from(buffer).toString();
  }
};

// Mock btoa and atob
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');

// Import the encryption service
const encryptionService = require('../src/encryption/encryptionService');

describe('Encryption Service', () => {
  describe('generateEncryptionKey', () => {
    test('should generate a random encryption key of the specified length', () => {
      const key = encryptionService.generateEncryptionKey(32);
      
      // The key should be a base64 string
      expect(typeof key).toBe('string');
      
      // When decoded, it should have the correct length
      const decodedKey = Buffer.from(key, 'base64');
      expect(decodedKey.length).toBe(32);
    });
    
    test('should generate different keys on each call', () => {
      const key1 = encryptionService.generateEncryptionKey();
      const key2 = encryptionService.generateEncryptionKey();
      
      expect(key1).not.toBe(key2);
    });
  });
  
  describe('encryptData and decryptData', () => {
    test('should encrypt and decrypt data correctly', async () => {
      const originalData = 'This is a secret message';
      const key = encryptionService.generateEncryptionKey();
      
      // Encrypt the data
      const encryptedJson = await encryptionService.encryptData(originalData, key);
      
      // The result should be a JSON string
      expect(typeof encryptedJson).toBe('string');
      
      // Parse the JSON to check its structure
      const encryptedObj = JSON.parse(encryptedJson);
      expect(encryptedObj).toHaveProperty('encryptedData');
      expect(encryptedObj).toHaveProperty('iv');
      
      // Decrypt the data
      const decryptedData = await encryptionService.decryptData(encryptedJson, key);
      
      // The decrypted data should match the original
      expect(decryptedData).toBe(originalData);
    });
    
    test('should fail to decrypt with an incorrect key', async () => {
      const originalData = 'This is a secret message';
      const correctKey = encryptionService.generateEncryptionKey();
      const wrongKey = encryptionService.generateEncryptionKey();
      
      // Encrypt with the correct key
      const encryptedJson = await encryptionService.encryptData(originalData, correctKey);
      
      // Attempt to decrypt with the wrong key
      await expect(encryptionService.decryptData(encryptedJson, wrongKey))
        .rejects.toThrow('Failed to decrypt data');
    });
    
    test('should encrypt different data to different ciphertexts', async () => {
      const data1 = 'First secret';
      const data2 = 'Second secret';
      const key = encryptionService.generateEncryptionKey();
      
      const encrypted1 = await encryptionService.encryptData(data1, key);
      const encrypted2 = await encryptionService.encryptData(data2, key);
      
      expect(encrypted1).not.toBe(encrypted2);
    });
    
    test('should encrypt same data to different ciphertexts due to random IV', async () => {
      const data = 'Same secret';
      const key = encryptionService.generateEncryptionKey();
      
      const encrypted1 = await encryptionService.encryptData(data, key);
      const encrypted2 = await encryptionService.encryptData(data, key);
      
      expect(encrypted1).not.toBe(encrypted2);
    });
  });
  
  describe('Security requirements', () => {
    test('encrypted data should not contain the original plaintext', async () => {
      const originalData = 'This is a very unique secret phrase XYZ123';
      const key = encryptionService.generateEncryptionKey();
      
      const encryptedJson = await encryptionService.encryptData(originalData, key);
      
      // The encrypted data should not contain the original plaintext
      expect(encryptedJson).not.toContain(originalData);
    });
    
    test('encrypted data should be meaningless without the key', async () => {
      const originalData = 'This is a secret message';
      const key = encryptionService.generateEncryptionKey();
      
      const encryptedJson = await encryptionService.encryptData(originalData, key);
      const encryptedObj = JSON.parse(encryptedJson);
      
      // Try to find patterns in the encrypted data
      const encryptedDataBuffer = Buffer.from(encryptedObj.encryptedData, 'base64');
      
      // Check entropy of encrypted data (should be high for good encryption)
      // This is a simple entropy calculation
      const frequencies = new Map();
      for (const byte of encryptedDataBuffer) {
        frequencies.set(byte, (frequencies.get(byte) || 0) + 1);
      }
      
      let entropy = 0;
      for (const count of frequencies.values()) {
        const probability = count / encryptedDataBuffer.length;
        entropy -= probability * Math.log2(probability);
      }
      
      // For good encryption, entropy should be reasonably high
      // Our mock implementation may not achieve perfect entropy
      expect(entropy).toBeGreaterThan(4);
    });
  });
});
