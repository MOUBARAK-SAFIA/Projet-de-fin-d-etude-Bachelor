const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validator = require('validator');

/**
 * Connexion administrateur
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validation des inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir email et mot de passe.'
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email invalide.'
      });
    }

    const allowedRoles = ['admin', 'super_admin', 'institution', 'verifier', 'student'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle de connexion manquant ou invalide. Choisissez le bon type de compte (ex. Vérificateur).'
      });
    }

    // Rechercher l'utilisateur avec le rôle spécifié (email + rôle doivent correspondre)
    const user = await User.findOne({ email: email.toLowerCase(), role: role });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email, mot de passe ou rôle incorrect.'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email, mot de passe ou rôle incorrect.'
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      }
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion.'
    });
  }
};

/**
 * Vérification du token (utilisé par le frontend pour vérifier la session)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const verifyToken = async (req, res) => {
  try {
    // Si on arrive ici, le middleware a déjà validé le token
    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role,
          profile: req.user.profile
        }
      }
    });
  } catch (error) {
    console.error('Erreur verifyToken:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification du token.'
    });
  }
};

/**
 * Inscription (pour les institutions et étudiants)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const register = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      role, 
      firstName, 
      lastName, 
      institutionName, 
      studentId, 
      department 
    } = req.body;

    // Validation des inputs
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir email, mot de passe et rôle.'
      });
    }

    if (!['institution', 'student', 'verifier'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle non autorisé pour l\'inscription.'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cet email existe déjà.'
      });
    }

    // Validation spécifique au rôle
    if (role === 'institution' && !institutionName) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de l\'institution est requis.'
      });
    }

    if (role === 'student' && (!studentId || !firstName || !lastName)) {
      return res.status(400).json({
        success: false,
        message: 'Le nom, prénom et numéro étudiant sont requis.'
      });
    }

    // Créer l'utilisateur
    const user = new User({
      email,
      password,
      role,
      profile: {
        firstName,
        lastName,
        institutionName,
        studentId,
        department
      }
    });

    await user.save();

    // Si c'est un étudiant, lui attribuer automatiquement un diplôme
    let assignedDiploma = null;
    if (role === 'student') {
      const { assignDiplomaToStudent } = require('../services/diplomaAssignmentService');
      const assignmentResult = await assignDiplomaToStudent({
        userId: user._id,
        studentId,
        firstName,
        lastName
      });
      
      if (assignmentResult.success) {
        assignedDiploma = assignmentResult.diploma;
      }
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const responseData = {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    };

    // Ajouter les informations du diplôme si attribué
    if (assignedDiploma) {
      responseData.assignedDiploma = {
        message: 'Félicitations! Un diplôme vous a été automatiquement attribué.',
        diploma: assignedDiploma
      };
    }

    res.status(201).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription.'
    });
  }
};

/**
 * Tableau de bord selon le rôle
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getDashboard = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const { getRolePermissions } = require('../middleware/roleMiddleware');
    const permissions = getRolePermissions(role);

    let dashboardData = {
      user: req.user,
      permissions,
      role
    };

    switch (role) {
      case 'admin':
        dashboardData.stats = await getVerifierStats(); // Admin utilise les mêmes stats que verifier
        break;
      case 'super_admin':
        dashboardData.stats = await getSuperAdminStats();
        break;
      case 'institution':
        dashboardData.stats = await getInstitutionStats(userId);
        break;
      case 'verifier':
        dashboardData.stats = await getVerifierStats();
        break;
      case 'student':
        dashboardData.stats = await getStudentStats(userId);
        break;
    }

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Erreur getDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du chargement du tableau de bord.'
    });
  }
};

// Fonctions utilitaires pour les stats
const getSuperAdminStats = async () => {
  const User = require('../models/User');
  const Diploma = require('../models/Diploma');
  
  const [totalUsers, totalDiplomas, validDiplomas, revokedDiplomas] = await Promise.all([
    User.countDocuments(),
    Diploma.countDocuments(),
    Diploma.countDocuments({ isRevoked: false }),
    Diploma.countDocuments({ isRevoked: true })
  ]);

  return {
    totalUsers,
    totalDiplomas,
    validDiplomas,
    revokedDiplomas
  };
};

const getInstitutionStats = async (institutionId) => {
  const Diploma = require('../models/Diploma');
  
  const [totalDiplomas, validDiplomas, revokedDiplomas] = await Promise.all([
    Diploma.countDocuments({ createdBy: institutionId }),
    Diploma.countDocuments({ createdBy: institutionId, isRevoked: false }),
    Diploma.countDocuments({ createdBy: institutionId, isRevoked: true })
  ]);

  return {
    totalDiplomas,
    validDiplomas,
    revokedDiplomas
  };
};

const getVerifierStats = async () => {
  const Diploma = require('../models/Diploma');
  
  const [totalDiplomas, validDiplomas, revokedDiplomas] = await Promise.all([
    Diploma.countDocuments(),
    Diploma.countDocuments({ isRevoked: false }),
    Diploma.countDocuments({ isRevoked: true })
  ]);

  return {
    totalDiplomas,
    validDiplomas,
    revokedDiplomas
  };
};

const getStudentStats = async (studentId) => {
  const Diploma = require('../models/Diploma');
  
  const diplomas = await Diploma.find({ studentId });
  
  return {
    totalDiplomas: diplomas.length,
    validDiplomas: diplomas.filter(d => !d.isRevoked).length,
    revokedDiplomas: diplomas.filter(d => d.isRevoked).length,
    diplomas
  };
};

/**
 * Mettre à jour le profil utilisateur
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, institutionName } = req.body;
    const userId = req.user._id;

    // Validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Les champs prénom, nom et email sont obligatoires'
      });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const User = require('../models/User');
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: userId } 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé par un autre utilisateur'
      });
    }

    // Mettre à jour l'utilisateur
    const updateData = {
      email,
      'profile.firstName': firstName,
      'profile.lastName': lastName
    };

    if (institutionName) {
      updateData['profile.institutionName'] = institutionName;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Erreur updateProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du profil'
    });
  }
};

/**
 * Mettre à jour le mot de passe utilisateur
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe actuel et nouveau sont obligatoires'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le mot de passe actuel
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe actuel est incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur updatePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du mot de passe'
    });
  }
};

module.exports = {
  login,
  register,
  verifyToken,
  getDashboard,
  updateProfile,
  updatePassword
};
