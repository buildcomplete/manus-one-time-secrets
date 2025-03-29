/**
 * Main application script for One-Time Secrets
 * Handles UI interactions and API calls
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const createSecretSection = document.getElementById('create-secret-section');
  const viewSecretSection = document.getElementById('view-secret-section');
  const secretInput = document.getElementById('secret-input');
  const createBtn = document.getElementById('create-btn');
  const resultContainer = document.getElementById('result-container');
  const secretLink = document.getElementById('secret-link');
  const copyBtn = document.getElementById('copy-btn');
  const createNewBtn = document.getElementById('create-new-btn');
  const loadingContainer = document.getElementById('loading-container');
  const secretContainer = document.getElementById('secret-container');
  const secretContent = document.getElementById('secret-content');
  const errorContainer = document.getElementById('error-container');
  const errorMessage = document.getElementById('error-message');
  const createAnotherBtn = document.getElementById('create-another-btn');
  const tryAnotherBtn = document.getElementById('try-another-btn');

  // API endpoint
  const API_URL = '/api/secrets';

  /**
   * Initialize the application
   */
  const init = () => {
    // Check if we're on a view page (URL has a hash fragment)
    if (window.location.hash) {
      // We're viewing a secret
      showViewSecret();
    } else {
      // We're creating a secret
      showCreateSecret();
    }

    // Set up event listeners
    setupEventListeners();
  };

  /**
   * Set up event listeners for UI interactions
   */
  const setupEventListeners = () => {
    // Create secret button
    createBtn.addEventListener('click', handleCreateSecret);

    // Copy link button
    copyBtn.addEventListener('click', handleCopyLink);

    // Create new secret buttons
    createNewBtn.addEventListener('click', handleCreateNew);
    createAnotherBtn.addEventListener('click', handleCreateNew);
    tryAnotherBtn.addEventListener('click', handleCreateNew);
  };

  /**
   * Show the create secret section
   */
  const showCreateSecret = () => {
    createSecretSection.classList.remove('hidden');
    viewSecretSection.classList.add('hidden');
    resultContainer.classList.add('hidden');
    secretInput.value = '';
  };

  /**
   * Show the view secret section and attempt to retrieve the secret
   */
  const showViewSecret = () => {
    createSecretSection.classList.add('hidden');
    viewSecretSection.classList.remove('hidden');
    loadingContainer.classList.remove('hidden');
    secretContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');

    // Extract the secret ID and key from the URL
    const secretId = window.location.pathname.split('/').pop();
    const encryptionKey = window.location.hash.substring(1); // Remove the # character

    // If we have a secret ID, try to retrieve it
    if (secretId) {
      retrieveSecret(secretId, encryptionKey);
    } else {
      showError('Invalid secret link');
    }
  };

  /**
   * Handle creating a new secret
   */
  const handleCreateSecret = async () => {
    const secret = secretInput.value.trim();
    
    if (!secret) {
      alert('Please enter a secret');
      return;
    }

    try {
      // Generate a random encryption key
      const encryptionKey = SecretEncryption.generateEncryptionKey();
      
      // Encrypt the secret with the key
      const encryptedData = await SecretEncryption.encryptData(secret, encryptionKey);
      
      // Send the encrypted data to the server
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ encryptedData })
      });

      if (!response.ok) {
        throw new Error('Failed to create secret');
      }

      const data = await response.json();
      
      // Create the secret link with the ID and encryption key
      const host = window.location.origin;
      const secretUrl = `${host}/s/${data.id}#${encryptionKey}`;
      
      // Display the result
      secretLink.value = secretUrl;
      resultContainer.classList.remove('hidden');
      
      // Clear the input
      secretInput.value = '';
    } catch (error) {
      console.error('Error creating secret:', error);
      alert('Failed to create secret. Please try again.');
    }
  };

  /**
   * Handle copying the secret link to clipboard
   */
  const handleCopyLink = () => {
    secretLink.select();
    document.execCommand('copy');
    
    // Change button text temporarily
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  };

  /**
   * Handle creating a new secret (reset the form)
   */
  const handleCreateNew = () => {
    // Clear the URL hash and navigate to the home page
    window.location.hash = '';
    window.location.pathname = '/';
    
    // Show the create secret section
    showCreateSecret();
  };

  /**
   * Retrieve a secret from the server
   * @param {string} secretId - The ID of the secret to retrieve
   * @param {string} encryptionKey - The encryption key to decrypt the secret
   */
  const retrieveSecret = async (secretId, encryptionKey) => {
    try {
      // Fetch the encrypted secret from the server
      const response = await fetch(`${API_URL}/${secretId}`);
      
      if (!response.ok) {
        throw new Error(response.status === 404 
          ? 'Secret not found or already viewed' 
          : 'Failed to retrieve secret');
      }

      const data = await response.json();
      
      // Decrypt the secret with the key from the URL fragment
      const decryptedSecret = await SecretEncryption.decryptData(
        JSON.stringify(data.encryptedData), 
        encryptionKey
      );
      
      // Display the decrypted secret
      secretContent.textContent = decryptedSecret;
      loadingContainer.classList.add('hidden');
      secretContainer.classList.remove('hidden');
      
      // Remove the secret ID and key from the URL to prevent accidental refresh
      window.history.replaceState(null, document.title, '/');
    } catch (error) {
      console.error('Error retrieving secret:', error);
      showError(error.message || 'Failed to retrieve secret');
    }
  };

  /**
   * Show an error message
   * @param {string} message - The error message to display
   */
  const showError = (message) => {
    errorMessage.textContent = message;
    loadingContainer.classList.add('hidden');
    errorContainer.classList.remove('hidden');
  };

  // Initialize the application
  init();
});
