// Mock the ID generator at the top level
jest.mock('../src/utils/idGenerator', () => ({
  generateId: jest.fn().mockReturnValue('test-secret-id')
}));

/**
 * Tests for the one-time access functionality
 */

const request = require('supertest');
const app = require('../src/index');
const storageService = require('../src/storage/storageService');
const idGenerator = require('../src/utils/idGenerator');

// Mock the storage service
jest.mock('../src/storage/storageService');

// Set up default mock implementations before each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Set up default mock implementations
  storageService.initStorage.mockResolvedValue(undefined);
  storageService.storeSecret.mockResolvedValue(undefined);
  storageService.secretExists.mockResolvedValue(true);
  storageService.getSecret.mockResolvedValue('mock-encrypted-data');
  storageService.deleteSecret.mockResolvedValue(undefined);
});

describe('One-Time Access API', () => {
  // We already reset mocks in the global beforeEach

  describe('POST /api/secrets', () => {
    test('should create a new secret and return its ID', async () => {
      // Mock data
      const encryptedData = 'encrypted-data-content';
      const secretId = 'generated-id-123';
      
      // Mock the storage service
      storageService.storeSecret.mockResolvedValue(undefined);
      
      // Set the ID generator mock return value for this test
      idGenerator.generateId.mockReturnValue(secretId);
      
      // Make the request
      const response = await request(app)
        .post('/api/secrets')
        .send({ encryptedData })
        .expect(201);
      
      // Check the response
      expect(response.body).toHaveProperty('id', secretId);
      
      // Verify the storage service was called correctly
      expect(storageService.storeSecret).toHaveBeenCalledWith(secretId, encryptedData);
    });

    test('should return 400 if encrypted data is missing', async () => {
      // Make the request without encrypted data
      const response = await request(app)
        .post('/api/secrets')
        .send({})
        .expect(400);
      
      // Check the response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
      
      // Verify the storage service was not called
      expect(storageService.storeSecret).not.toHaveBeenCalled();
    });

    test('should return 500 if storage fails', async () => {
      // Mock data
      const encryptedData = 'encrypted-data-content';
      
      // Mock the storage service to fail
      storageService.storeSecret.mockRejectedValue(new Error('Storage failure'));
      
      // Make the request
      const response = await request(app)
        .post('/api/secrets')
        .send({ encryptedData })
        .expect(500);
      
      // Check the response
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/secrets/:id', () => {
    test('should retrieve a secret and delete it immediately', async () => {
      // Mock data
      const secretId = 'existing-secret-id';
      const encryptedData = 'encrypted-secret-data';
      
      // Mock the storage service
      storageService.secretExists.mockResolvedValue(true);
      storageService.getSecret.mockResolvedValue(encryptedData);
      storageService.deleteSecret.mockResolvedValue(undefined);
      
      // Make the request
      const response = await request(app)
        .get(`/api/secrets/${secretId}`)
        .expect(200);
      
      // Check the response
      expect(response.body).toHaveProperty('encryptedData', encryptedData);
      
      // Verify the storage service was called correctly
      expect(storageService.secretExists).toHaveBeenCalledWith(secretId);
      expect(storageService.getSecret).toHaveBeenCalledWith(secretId);
      expect(storageService.deleteSecret).toHaveBeenCalledWith(secretId);
    });

    test('should return 404 if secret does not exist', async () => {
      // Mock data
      const secretId = 'non-existent-secret-id';
      
      // Mock the storage service
      storageService.secretExists.mockResolvedValue(false);
      
      // Make the request
      const response = await request(app)
        .get(`/api/secrets/${secretId}`)
        .expect(404);
      
      // Check the response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
      
      // Verify the storage service was called correctly
      expect(storageService.secretExists).toHaveBeenCalledWith(secretId);
      expect(storageService.getSecret).not.toHaveBeenCalled();
      expect(storageService.deleteSecret).not.toHaveBeenCalled();
    });

    test('should return 500 if retrieval fails', async () => {
      // Mock data
      const secretId = 'existing-secret-id';
      
      // Mock the storage service
      storageService.secretExists.mockResolvedValue(true);
      storageService.getSecret.mockRejectedValue(new Error('Retrieval failure'));
      
      // Make the request
      const response = await request(app)
        .get(`/api/secrets/${secretId}`)
        .expect(500);
      
      // Check the response
      expect(response.body).toHaveProperty('error');
      
      // Verify the storage service was called correctly
      expect(storageService.secretExists).toHaveBeenCalledWith(secretId);
      expect(storageService.getSecret).toHaveBeenCalledWith(secretId);
      expect(storageService.deleteSecret).not.toHaveBeenCalled();
    });

    test('should handle deletion failure gracefully', async () => {
      // Mock data
      const secretId = 'existing-secret-id';
      const encryptedData = 'encrypted-secret-data';
      
      // Mock the storage service
      storageService.secretExists.mockResolvedValue(true);
      storageService.getSecret.mockResolvedValue(encryptedData);
      storageService.deleteSecret.mockRejectedValue(new Error('Deletion failure'));
      
      // Make the request
      const response = await request(app)
        .get(`/api/secrets/${secretId}`)
        .expect(200);
      
      // Even if deletion fails, the API should still return the secret
      expect(response.body).toHaveProperty('encryptedData', encryptedData);
      
      // Verify the storage service was called correctly
      expect(storageService.secretExists).toHaveBeenCalledWith(secretId);
      expect(storageService.getSecret).toHaveBeenCalledWith(secretId);
      expect(storageService.deleteSecret).toHaveBeenCalledWith(secretId);
    });
  });

  describe('One-time access requirement', () => {
    test('should ensure a secret can only be accessed once', async () => {
      // Mock data
      const secretId = 'one-time-secret-id';
      const encryptedData = 'encrypted-one-time-data';
      
      // Mock the storage service
      storageService.secretExists
        .mockResolvedValueOnce(true)  // First call: secret exists
        .mockResolvedValueOnce(false); // Second call: secret doesn't exist
      storageService.getSecret.mockResolvedValue(encryptedData);
      storageService.deleteSecret.mockResolvedValue(undefined);
      
      // First request should succeed
      const firstResponse = await request(app)
        .get(`/api/secrets/${secretId}`)
        .expect(200);
      
      expect(firstResponse.body).toHaveProperty('encryptedData', encryptedData);
      
      // Second request should fail with 404
      const secondResponse = await request(app)
        .get(`/api/secrets/${secretId}`)
        .expect(404);
      
      expect(secondResponse.body).toHaveProperty('error');
      expect(secondResponse.body.error).toContain('not found');
      
      // Verify the storage service was called correctly
      expect(storageService.secretExists).toHaveBeenCalledTimes(2);
      expect(storageService.getSecret).toHaveBeenCalledTimes(1);
      expect(storageService.deleteSecret).toHaveBeenCalledTimes(1);
    });
  });

  describe('Anti-virus protection', () => {
    test('should protect against automated access by requiring proper headers', async () => {
      // This test simulates a virus scanner accessing the URL without proper headers
      
      // Mock data
      const secretId = 'protected-secret-id';
      const encryptedData = 'encrypted-protected-data';
      
      // Mock the storage service
      storageService.secretExists.mockResolvedValue(true);
      storageService.getSecret.mockResolvedValue(encryptedData);
      
      // Add a middleware to check for a specific header (implementation will be in the actual code)
      // For testing, we'll mock this by adding a check in the test
      
      // First, make a request without the required header (simulating a virus scanner)
      const response = await request(app)
        .get(`/api/secrets/${secretId}`)
        .set('User-Agent', 'VirusScanner/1.0')
        .expect(200); // We still return 200 to avoid tipping off scanners
      
      // The response should contain the encrypted data but not delete the secret
      expect(response.body).toHaveProperty('encryptedData');
      
      // Verify the storage service was called correctly
      expect(storageService.secretExists).toHaveBeenCalledWith(secretId);
      expect(storageService.getSecret).toHaveBeenCalledWith(secretId);
      
      // The key point: deleteSecret should NOT be called for automated scanners
      expect(storageService.deleteSecret).not.toHaveBeenCalled();
    });
  });
});
