const express = require('express');
const { login, register, verifyToken, getDashboard, updateProfile, updatePassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Connexion utilisateur
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/register
 * @desc    Inscription (institution et student)
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   GET /api/auth/verify
 * @desc    Vérification du token JWT
 * @access  Private
 */
router.get('/verify', authMiddleware, verifyToken);

/**
 * @route   GET /api/auth/dashboard
 * @desc    Tableau de bord selon le rôle
 * @access  Private
 */
router.get('/dashboard', authMiddleware, getDashboard);

/**
 * @route   PUT /api/auth/profile
 * @desc    Mettre à jour le profil utilisateur
 * @access  Private
 */
router.put('/profile', authMiddleware, updateProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    Mettre à jour le mot de passe utilisateur
 * @access  Private
 */
router.put('/password', authMiddleware, updatePassword);

module.exports = router;
