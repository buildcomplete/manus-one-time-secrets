const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

// Create a real integration test that uses actual API endpoints
describe('API Integration Test', () => {
  // Import the actual app
  const app = require('../src/index');
  
  // Use a test-specific directory
  const TEST_DIR = path.resolve('/usr/src/app/api-integration-test-storage');
  
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
  
  test('should create, retrieve, and delete a secret through API', async () => {
    // Create a secret
    const createResponse = await request(app)
      .post('/api/secrets')
      .send({ encryptedData: 'api-test-encrypted-data' })
      .expect(201);
    
    // Check that we got a secret ID
    expect(createResponse.body).toHaveProperty('id');
    const secretId = createResponse.body.id;
    
    // Retrieve the secret
    const retrieveResponse = await request(app)
      .get(`/api/secrets/${secretId}`)
      .expect(200);
    
    // Check that we got the correct data
    expect(retrieveResponse.body).toHaveProperty('encryptedData', 'api-test-encrypted-data');
    
    // Try to retrieve again - should fail as it's one-time access
    const secondRetrieveResponse = await request(app)
      .get(`/api/secrets/${secretId}`)
      .expect(404);
    
    // Check error message
    expect(secondRetrieveResponse.body).toHaveProperty('error');
    expect(secondRetrieveResponse.body.error).toContain('not found');
  });
  
  test('should return 404 for non-existent secrets', async () => {
    const nonExistentId = 'non-existent-id-' + Date.now();
    
    const response = await request(app)
      .get(`/api/secrets/${nonExistentId}`)
      .expect(404);
    
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('not found');
  });
  
  test('should return 400 for missing encrypted data', async () => {
    const response = await request(app)
      .post('/api/secrets')
      .send({}) // Missing encryptedData
      .expect(400);
    
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('required');
  });
});
