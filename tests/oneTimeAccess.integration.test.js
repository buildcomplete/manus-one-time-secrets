const fs = require('fs').promises;
const path = require('path');
const request = require('supertest');
const app = require('../src/index');
const { STORAGE_DIR } = require('../src/storage/storageService');

/**
 * Real integration tests for one-time access functionality
 * These tests use the actual storage service (no mocks)
 */
describe('One-Time Access Integration Tests', () => {
  // Test storage directory
  const testStorageDir = STORAGE_DIR;
  
  // Helper function to create a test secret file directly
  const createTestSecret = async (id, content) => {
    const filePath = path.join(testStorageDir, id);
    await fs.writeFile(filePath, content);
    return filePath;
  };
  
  // Helper function to check if a secret file exists
  const secretExists = async (id) => {
    try {
      const filePath = path.join(testStorageDir, id);
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // Clean up test files before each test
  beforeEach(async () => {
    try {
      // Ensure the storage directory exists
      await fs.mkdir(testStorageDir, { recursive: true });
      
      // Clean up any existing test files
      const files = await fs.readdir(testStorageDir);
      for (const file of files) {
        if (file.startsWith('test-')) {
          await fs.unlink(path.join(testStorageDir, file));
        }
      }
    } catch (error) {
      console.error('Error in test setup:', error);
    }
  });
  
  describe('One-time access requirement (real storage)', () => {
    test('should actually delete the secret after it is accessed once', async () => {
      // Create a test secret directly in the filesystem
      const secretId = 'test-one-time-access';
      const secretContent = 'this-is-a-test-secret-content';
      await createTestSecret(secretId, secretContent);
      
      // Verify the secret exists before access
      const existsBefore = await secretExists(secretId);
      expect(existsBefore).toBe(true);
      
      // Access the secret via the API
      const response = await request(app)
        .get(`/api/secrets/${secretId}`)
        .expect(200);
      
      // Verify the response contains the secret content
      expect(response.body).toHaveProperty('encryptedData', secretContent);
      
      // Verify the secret has been deleted after access
      const existsAfter = await secretExists(secretId);
      expect(existsAfter).toBe(false);
    });
    
    test('should return 404 when trying to access a secret twice', async () => {
      // Create a test secret directly in the filesystem
      const secretId = 'test-access-twice';
      const secretContent = 'this-is-another-test-secret';
      await createTestSecret(secretId, secretContent);
      
      // First access should succeed
      const firstResponse = await request(app)
        .get(`/api/secrets/${secretId}`)
        .expect(200);
      
      expect(firstResponse.body).toHaveProperty('encryptedData', secretContent);
      
      // Second access should fail with 404
      const secondResponse = await request(app)
        .get(`/api/secrets/${secretId}`)
        .expect(404);
      
      expect(secondResponse.body).toHaveProperty('error');
      expect(secondResponse.body.error).toContain('not found');
    });
  });
  
  describe('Secret creation and retrieval (real storage)', () => {
    test('should create a secret and then retrieve it once', async () => {
      // Create a new secret via the API
      const secretData = 'test-encrypted-data-for-creation-test';
      const createResponse = await request(app)
        .post('/api/secrets')
        .send({ encryptedData: secretData })
        .expect(201);
      
      // Get the secret ID from the response
      const { id: secretId } = createResponse.body;
      expect(secretId).toBeTruthy();
      
      // Verify the secret exists in the filesystem
      const existsAfterCreate = await secretExists(secretId);
      expect(existsAfterCreate).toBe(true);
      
      // Retrieve the secret via the API
      const retrieveResponse = await request(app)
        .get(`/api/secrets/${secretId}`)
        .expect(200);
      
      // Verify the response contains the correct secret content
      expect(retrieveResponse.body).toHaveProperty('encryptedData', secretData);
      
      // Verify the secret has been deleted after retrieval
      const existsAfterRetrieve = await secretExists(secretId);
      expect(existsAfterRetrieve).toBe(false);
    });
  });
});
