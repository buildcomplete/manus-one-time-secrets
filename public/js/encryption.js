/**
 * Client-side encryption service for one-time secrets
 * This file handles the encryption and decryption of secrets in the browser
 */

// Encryption service namespace
const SecretEncryption = {
  /**
   * Generate a random encryption key
   * @param {number} length - Length of the key in bytes
   * @returns {string} - Base64 encoded encryption key
   */
  generateEncryptionKey: (length = 32) => {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array));
  },

  /**
   * Encrypt data using AES-GCM
   * @param {string} data - Data to encrypt
   * @param {string} key - Base64 encoded encryption key
   * @returns {Promise<string>} - JSON string containing encrypted data and iv
   */
  encryptData: async (data, key) => {
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
  },

  /**
   * Decrypt data using AES-GCM
   * @param {string} encryptedJson - JSON string containing encrypted data and iv
   * @param {string} key - Base64 encoded encryption key
   * @returns {Promise<string>} - Decrypted data
   */
  decryptData: async (encryptedJson, key) => {
    try {
      console.log('Decrypting data with key:', key);
      console.log('Encrypted JSON type:', typeof encryptedJson);
      
      // Parse the encrypted JSON
      let parsedData;
      try {
        parsedData = JSON.parse(encryptedJson);
        console.log('Successfully parsed JSON:', parsedData);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error('Invalid encrypted data format');
      }
      
      // Extract encrypted data and IV
      const { encryptedData, iv } = parsedData;
      if (!encryptedData || !iv) {
        console.error('Missing required encryption fields:', parsedData);
        throw new Error('Invalid encrypted data structure');
      }
      
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
      console.log('Successfully decrypted data');
      
      return decryptedText;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data: ' + error.message);
    }
  }
};
