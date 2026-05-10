const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware d'authentification optionnelle.
 * - Si un token valide est présent, req.user est injecté.
 * - Sinon, la requête continue sans bloquer.
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (user) {
      req.user = user;
    }
    return next();
  } catch (error) {
    // Auth optionnelle: ignorer les erreurs token et continuer.
    return next();
  }
};

module.exports = optionalAuthMiddleware;
