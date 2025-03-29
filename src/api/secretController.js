const storageService = require('../storage/storageService');
const { generateId } = require('../utils/idGenerator');

/**
 * Create a new secret
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSecret = async (req, res) => {
  try {
    const { encryptedData } = req.body;
    
    if (!encryptedData) {
      return res.status(400).json({ error: 'Encrypted data is required' });
    }
    
    // Generate a unique ID for the secret
    const secretId = generateId();
    
    // Store the encrypted secret
    await storageService.storeSecret(secretId, encryptedData);
    
    // Return the secret ID to the client
    return res.status(201).json({ id: secretId });
  } catch (error) {
    console.error('Error creating secret:', error);
    return res.status(500).json({ error: 'Failed to create secret' });
  }
};

/**
 * Get a secret by ID and delete it after retrieval
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSecret = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the secret exists
    const exists = await storageService.secretExists(id);
    if (!exists) {
      return res.status(404).json({ error: 'Secret not found or already viewed' });
    }
    
    // Retrieve the encrypted secret
    const encryptedData = await storageService.getSecret(id);
    
    // Delete the secret immediately after retrieval, but only if not from an automated scanner
    if (!req.isAutomatedScanner) {
      try {
        await storageService.deleteSecret(id);
      } catch (deleteError) {
        console.error('Error deleting secret after retrieval:', deleteError);
        // Continue even if deletion fails, to ensure user gets the secret
      }
    }
    
    // Return the encrypted data to the client
    return res.status(200).json({ encryptedData });
  } catch (error) {
    console.error('Error retrieving secret:', error);
    return res.status(500).json({ error: 'Failed to retrieve secret' });
  }
};

module.exports = {
  createSecret,
  getSecret
};