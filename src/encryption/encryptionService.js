/**
 * Encryption service for one-time secrets
 * Handles client-side encryption/decryption functionality
 */

/**
 * Generate a random encryption key
 * @param {number} length - Length of the key in bytes
 * @returns {string} - Base64 encoded encryption key
 */
const generateEncryptionKey = (length = 32) => {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array));
};

/**
 * Encrypt data using AES-GCM
 * @param {string} data - Data to encrypt
 * @param {string} key - Base64 encoded encryption key
 * @returns {Promise<string>} - JSON string containing encrypted data, iv, and auth tag
 */
const encryptData = async (data, key) => {
  try {
    // Convert key from base64 to array buffer
    const rawKey = Uint8Array.from(atob(key), c => c.charCodeAt(0));
    
    // Generate a random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Import the key
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // Encode the data
    const encodedData = new TextEncoder().encode(data);
    
    // Encrypt the data
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      cryptoKey,
      encodedData
    );
    
    // Convert encrypted data and IV to base64
    const encryptedArray = Array.from(new Uint8Array(encryptedBuffer));
    const encryptedBase64 = btoa(String.fromCharCode.apply(null, encryptedArray));
    const ivBase64 = btoa(String.fromCharCode.apply(null, Array.from(iv)));
    
    // Return the encrypted data and IV as a JSON string
    return JSON.stringify({
      encryptedData: encryptedBase64,
      iv: ivBase64
    });
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data using AES-GCM
 * @param {string} encryptedJson - JSON string containing encrypted data and iv
 * @param {string} key - Base64 encoded encryption key
 * @returns {Promise<string>} - Decrypted data
 */
const decryptData = async (encryptedJson, key) => {
  try {
    // Parse the encrypted JSON
    const { encryptedData, iv } = JSON.parse(encryptedJson);
    
    // Convert key from base64 to array buffer
    const rawKey = Uint8Array.from(atob(key), c => c.charCodeAt(0));
    
    // Convert IV from base64 to array buffer
    const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    
    // Import the key
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Convert encrypted data from base64 to array buffer
    const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivArray
      },
      cryptoKey,
      encryptedArray
    );
    
    // Decode the decrypted data
    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    
    return decryptedText;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Export functions for use in the browser
if (typeof window !== 'undefined') {
  window.secretEncryption = {
    generateEncryptionKey,
    encryptData,
    decryptData
  };
}

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateEncryptionKey,
    encryptData,
    decryptData
  };
}
