const fs = require('fs').promises;
const path = require('path');

// Create a real integration test that uses actual file system
describe('Storage Service Integration Test', () => {
  // Import the actual storage service (not mocked)
  const storageService = require('../src/storage/storageService');
  
  // Use a test-specific directory
  const TEST_DIR = path.resolve('/usr/src/app/integration-test-storage');
  
  beforeAll(async () => {
    // Override the storage directory for this test
    process.env.STORAGE_DIR = TEST_DIR;
    
    // Clean up test directory before starting
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist yet, that's fine
    }
    
    // Create the test directory
    await fs.mkdir(TEST_DIR, { recursive: true });
  });
  
  afterAll(async () => {
    // Clean up after tests
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors during cleanup
    }
    
    // Reset environment variable
    delete process.env.STORAGE_DIR;
  });
  
  test('should store and retrieve a secret', async () => {
    // Test data
    const secretId = 'integration-test-id';
    const secretData = 'test-secret-data-' + Date.now();
    
    // Store the secret
    await storageService.storeSecret(secretId, secretData);
    
    // Check if the secret exists
    const exists = await storageService.secretExists(secretId);
    expect(exists).toBe(true);
    
    // Retrieve the secret
    const retrievedData = await storageService.getSecret(secretId);
    expect(retrievedData).toBe(secretData);
    
    // Delete the secret
    await storageService.deleteSecret(secretId);
    
    // Verify it's gone
    const existsAfterDelete = await storageService.secretExists(secretId);
    expect(existsAfterDelete).toBe(false);
  });
  
  test('should handle one-time access pattern', async () => {
    // Test data
    const secretId = 'one-time-access-test';
    const secretData = 'one-time-secret-data';
    
    // Store the secret
    await storageService.storeSecret(secretId, secretData);
    
    // Retrieve the secret
    const retrievedData = await storageService.getSecret(secretId);
    expect(retrievedData).toBe(secretData);
    
    // Delete immediately after retrieval (simulating one-time access)
    await storageService.deleteSecret(secretId);
    
    // Verify it's gone
    const existsAfterDelete = await storageService.secretExists(secretId);
    expect(existsAfterDelete).toBe(false);
    
    // Trying to retrieve again should throw
    await expect(storageService.getSecret(secretId)).rejects.toThrow();
  });
  
  test('should handle non-existent secrets', async () => {
    const nonExistentId = 'does-not-exist-' + Date.now();
    
    // Check if non-existent secret exists
    const exists = await storageService.secretExists(nonExistentId);
    expect(exists).toBe(false);
    
    // Trying to retrieve should throw
    await expect(storageService.getSecret(nonExistentId)).rejects.toThrow();
    
    // Deleting non-existent secret should not throw
    await expect(storageService.deleteSecret(nonExistentId)).resolves.not.toThrow();
  });
});
