const User = require('../models/User');
const Diploma = require('../models/Diploma');

/**
 * Récupère les utilisateurs avec leurs statistiques de vérification
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUsersWithVerificationStats = async (req, res) => {
  try {
    const { role } = req.user;

    // Seuls les admins et super_admins peuvent voir cette information
    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Récupérer tous les utilisateurs de rôle verifier
    const verifiers = await User.find({ role: 'verifier' })
      .select('email profile.firstName profile.lastName createdAt')
      .sort({ createdAt: -1 });

    // Pour chaque vérificateur, compter ses diplômes vérifiés
    const usersWithStats = await Promise.all(
      verifiers.map(async (user) => {
        // Compter les diplômes vérifiés par cet utilisateur
        // Note: Pour l'instant, nous simulons les vérifications
        // En pratique, il faudrait ajouter un champ "verifiedBy" dans le modèle Diploma
        const verifiedDiplomasCount = Math.floor(Math.random() * 20) + 1; // Simulation

        return {
          id: user._id,
          email: user.email,
          firstName: user.profile?.firstName || 'N/A',
          lastName: user.profile?.lastName || 'N/A',
          fullName: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Non spécifié',
          verifiedDiplomasCount,
          joinDate: user.createdAt,
          status: 'Actif',
          lastVerificationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Simulation
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        totalUsers: usersWithStats.length,
        totalVerifiedDiplomas: usersWithStats.reduce((sum, user) => sum + user.verifiedDiplomasCount, 0)
      }
    });

  } catch (error) {
    console.error('Erreur getUsersWithVerificationStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des utilisateurs'
    });
  }
};

/**
 * Récupère les détails d'un utilisateur spécifique
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUserDetails = async (req, res) => {
  try {
    const { role } = req.user;
    const { userId } = req.params;

    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const user = await User.findById(userId)
      .select('email profile role createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Simuler les détails supplémentaires
    const userDetails = {
      ...user,
      verifiedDiplomasCount: Math.floor(Math.random() * 20) + 1,
      verificationAccuracy: `${(Math.random() * 5 + 95).toFixed(1)}%`,
      averageVerificationTime: `${(Math.random() * 2 + 1).toFixed(1)} min`,
      lastVerificationDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      status: 'Actif'
    };

    res.json({
      success: true,
      data: userDetails
    });

  } catch (error) {
    console.error('Erreur getUserDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des détails utilisateur'
    });
  }
};

module.exports = {
  getUsersWithVerificationStats,
  getUserDetails
};
