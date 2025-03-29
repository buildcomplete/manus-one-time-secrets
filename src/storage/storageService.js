const fs = require('fs').promises;
const path = require('path');

// Define the storage directory - this will be where encrypted secrets are stored
// Use absolute path to ensure it works in Docker environment
const STORAGE_DIR = process.env.STORAGE_DIR || path.resolve('/usr/src/app/storage');

// Export the storage directory directly to avoid reference issues
module.exports.STORAGE_DIR = STORAGE_DIR;

/**
 * Initialize the storage directory if it doesn't exist
 */
const initStorage = async () => {
  try {
    // Use the constant directly instead of the exported property
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error initializing storage directory:', error);
    throw error;
  }
};

/**
 * Store an encrypted secret
 * @param {string} id - Unique identifier for the secret
 * @param {string} encryptedData - Encrypted secret data
 */
const storeSecret = async (id, encryptedData) => {
  try {
    await initStorage();
    const filePath = path.join(STORAGE_DIR, id);
    await fs.writeFile(filePath, encryptedData);
  } catch (error) {
    console.error('Error storing secret:', error);
    throw error;
  }
};

/**
 * Check if a secret exists
 * @param {string} id - Unique identifier for the secret
 * @returns {boolean} - Whether the secret exists
 */
const secretExists = async (id) => {
  try {
    const filePath = path.join(STORAGE_DIR, id);
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get an encrypted secret
 * @param {string} id - Unique identifier for the secret
 * @returns {string} - Encrypted secret data
 */
const getSecret = async (id) => {
  try {
    const filePath = path.join(STORAGE_DIR, id);
    const data = await fs.readFile(filePath, 'utf8');
    return data;
  } catch (error) {
    console.error('Error retrieving secret:', error);
    throw error;
  }
};

/**
 * Delete a secret
 * @param {string} id - Unique identifier for the secret
 */
const deleteSecret = async (id) => {
  try {
    const filePath = path.join(STORAGE_DIR, id);
    await fs.unlink(filePath);
  } catch (error) {
    // If the file doesn't exist, that's fine for this operation
    if (error.code !== 'ENOENT') {
      console.error('Error deleting secret:', error);
      throw error;
    }
  }
};

module.exports = {
  initStorage,
  storeSecret,
  secretExists,
  getSecret,
  deleteSecret
};
