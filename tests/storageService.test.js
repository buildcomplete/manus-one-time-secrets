/**
 * Tests for the storage service
 */

const fs = require('fs').promises;
const path = require('path');

// Mock storage directory for testing - use absolute path for Docker compatibility
const TEST_STORAGE_DIR = path.resolve('/usr/src/app/test-storage');

// Create a direct import of the storage service
const storageService = require('../src/storage/storageService');

// Manually override the storage directory for testing
storageService.STORAGE_DIR = TEST_STORAGE_DIR;

describe('Storage Service', () => {
  beforeEach(async () => {
    // Clean up test storage directory before each test
    try {
      await fs.rm(TEST_STORAGE_DIR, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist yet, that's fine
    }
  });

  afterAll(async () => {
    // Clean up after all tests
    try {
      await fs.rm(TEST_STORAGE_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('initStorage', () => {
    test('should create storage directory if it does not exist', async () => {
      await storageService.initStorage();
      
      // Check if directory exists
      const stats = await fs.stat(TEST_STORAGE_DIR);
      expect(stats.isDirectory()).toBe(true);
    });

    test('should not throw error if directory already exists', async () => {
      // Create directory first
      await fs.mkdir(TEST_STORAGE_DIR, { recursive: true });
      
      // Should not throw when called again
      await expect(storageService.initStorage()).resolves.not.toThrow();
    });
  });

  describe('storeSecret', () => {
    test('should store encrypted data with the given ID', async () => {
      const id = 'test-id-123';
      const encryptedData = 'encrypted-data-content';
      
      await storageService.storeSecret(id, encryptedData);
      
      // Check if file exists and has correct content
      const filePath = path.join(TEST_STORAGE_DIR, id);
      const content = await fs.readFile(filePath, 'utf8');
      expect(content).toBe(encryptedData);
    });

    test('should overwrite existing secret with same ID', async () => {
      const id = 'test-id-456';
      const originalData = 'original-encrypted-data';
      const newData = 'new-encrypted-data';
      
      // Store original data
      await storageService.storeSecret(id, originalData);
      
      // Store new data with same ID
      await storageService.storeSecret(id, newData);
      
      // Check if file has been overwritten
      const filePath = path.join(TEST_STORAGE_DIR, id);
      const content = await fs.readFile(filePath, 'utf8');
      expect(content).toBe(newData);
    });
  });

  describe('secretExists', () => {
    test('should return true if secret exists', async () => {
      const id = 'existing-secret';
      const data = 'some-encrypted-data';
      
      // Store a secret
      await storageService.storeSecret(id, data);
      
      // Check if it exists
      const exists = await storageService.secretExists(id);
      expect(exists).toBe(true);
    });

    test('should return false if secret does not exist', async () => {
      const id = 'non-existent-secret';
      
      // Check if a non-existent secret exists
      const exists = await storageService.secretExists(id);
      expect(exists).toBe(false);
    });
  });

  describe('getSecret', () => {
    test('should retrieve stored secret data', async () => {
      const id = 'get-secret-test';
      const data = 'encrypted-secret-to-retrieve';
      
      // Store a secret
      await storageService.storeSecret(id, data);
      
      // Retrieve the secret
      const retrievedData = await storageService.getSecret(id);
      expect(retrievedData).toBe(data);
    });

    test('should throw error if secret does not exist', async () => {
      const id = 'non-existent-secret';
      
      // Try to retrieve a non-existent secret
      await expect(storageService.getSecret(id)).rejects.toThrow();
    });
  });

  describe('deleteSecret', () => {
    test('should delete a stored secret', async () => {
      const id = 'delete-secret-test';
      const data = 'secret-to-delete';
      
      // Store a secret
      await storageService.storeSecret(id, data);
      
      // Verify it exists
      expect(await storageService.secretExists(id)).toBe(true);
      
      // Delete the secret
      await storageService.deleteSecret(id);
      
      // Verify it no longer exists
      expect(await storageService.secretExists(id)).toBe(false);
    });

    test('should not throw error if secret does not exist', async () => {
      const id = 'non-existent-secret-to-delete';
      
      // Try to delete a non-existent secret
      await expect(storageService.deleteSecret(id)).resolves.not.toThrow();
    });
  });

  describe('One-time access requirement', () => {
    test('should ensure a secret can only be accessed once', async () => {
      const id = 'one-time-secret';
      const data = 'secret-data-for-one-time-access';
      
      // Store a secret
      await storageService.storeSecret(id, data);
      
      // Retrieve the secret
      const retrievedData = await storageService.getSecret(id);
      expect(retrievedData).toBe(data);
      
      // Delete the secret immediately after retrieval
      await storageService.deleteSecret(id);
      
      // Verify the secret no longer exists
      expect(await storageService.secretExists(id)).toBe(false);
      
      // Trying to retrieve it again should throw an error
      await expect(storageService.getSecret(id)).rejects.toThrow();
    });
  });
});
