const express = require('express');
const router = express.Router();
const { signup, login, getStatus } = require('../controllers/authController');

// Routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/status', getStatus);

module.exports = router;
