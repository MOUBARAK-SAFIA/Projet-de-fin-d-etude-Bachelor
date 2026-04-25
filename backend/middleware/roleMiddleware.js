/**
 * Middleware pour vérifier les rôles des utilisateurs
 */

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Utilisateur non authentifié.'
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Rôle insuffisant.'
      });
    }

    // Ajouter les permissions spécifiques à la requête
    req.permissions = getRolePermissions(userRole);
    
    next();
  };
};

/**
 * Définit les permissions pour chaque rôle
 */
const getRolePermissions = (role) => {
  const permissions = {
    admin: {
      canCreateDiploma: true,
      canVerifyDiploma: true,
      canRevokeDiploma: true,
      canManageUsers: true,
      canViewAllDiplomas: true,
      canManageInstitutions: true
    },
    super_admin: {
      canCreateDiploma: true,
      canVerifyDiploma: true,
      canRevokeDiploma: true,
      canManageUsers: true,
      canViewAllDiplomas: true,
      canManageInstitutions: true
    },
    institution: {
      canCreateDiploma: true,
      canVerifyDiploma: true,
      canRevokeDiploma: false, // Uniquement ses propres diplômes
      canManageUsers: false,
      canViewAllDiplomas: false, // Uniquement ses diplômes
      canManageInstitutions: false
    },
    verifier: {
      canCreateDiploma: false,
      canVerifyDiploma: true,
      canRevokeDiploma: false,
      canManageUsers: false,
      canViewAllDiplomas: true,
      canManageInstitutions: false
    },
    student: {
      canCreateDiploma: false,
      canVerifyDiploma: true,
      canRevokeDiploma: false,
      canManageUsers: false,
      canViewAllDiplomas: false, // Uniquement ses diplômes
      canManageInstitutions: false
    }
  };

  return permissions[role] || {};
};

/**
 * Middleware pour vérifier si l'utilisateur peut gérer une ressource spécifique
 */
const canManageResource = (resourceType) => {
  return (req, res, next) => {
    const { role, _id: userId } = req.user;
    const resourceId = req.params.id || req.body.userId;
    
    // Super admin peut tout gérer
    if (role === 'super_admin') {
      return next();
    }
    
    // Les autres rôles ne peuvent gérer que leurs propres ressources
    switch (resourceType) {
      case 'diploma':
        // Vérifier si le diplôme appartient à l'institution/étudiant
        if (role === 'institution' || role === 'student') {
          // Logique à implémenter selon les besoins
          return next();
        }
        break;
        
      case 'profile':
        // Uniquement son propre profil
        if (userId === resourceId) {
          return next();
        }
        break;
        
      default:
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Permissions insuffisantes.'
        });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous ne pouvez pas gérer cette ressource.'
    });
  };
};

module.exports = {
  checkRole,
  canManageResource,
  getRolePermissions
};
