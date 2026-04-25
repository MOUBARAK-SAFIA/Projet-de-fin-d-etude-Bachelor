const express = require('express');
const router = express.Router();
const { getUsersWithVerificationStats, getUserDetails } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes pour la gestion des utilisateurs (admin seulement)
router.get('/verifiers', authMiddleware, getUsersWithVerificationStats);
router.get('/:userId', authMiddleware, getUserDetails);

module.exports = router;
