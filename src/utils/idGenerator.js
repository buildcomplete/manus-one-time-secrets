/**
 * Generate a cryptographically secure random ID
 * @param {number} length - Length of the ID to generate
 * @returns {string} - Generated ID
 */
const generateId = (length = 16) => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  generateId
};
