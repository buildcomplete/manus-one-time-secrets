const express = require('express');
const router = express.Router();
const secretController = require('./secretController');

// Create a new secret
router.post('/secrets', secretController.createSecret);

// Get a secret by ID
router.get('/secrets/:id', secretController.getSecret);

module.exports = router;
