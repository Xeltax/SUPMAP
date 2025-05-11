const passport = require('passport');
const { verifyToken, extractTokenFromHeader } = require('../utils/jwtUtils');
const User = require('../models/userModel');

/**
 * Middleware pour protéger les routes qui nécessitent une authentification
 */
const protect = passport.authenticate('jwt', { session: false });

/**
 * Middleware pour restreindre l'accès en fonction du rôle de l'utilisateur
 * @param  {...String} roles - Les rôles autorisés
 * @returns {Function} Middleware Express
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Non authentifié'
            });
        }

        if (!roles[0].includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'Non autorisé à accéder à cette ressource'
            });
        }

        next();
    };
};

/**
 * Middleware pour vérifier manuellement un token JWT (sans utiliser Passport)
 * Utile pour les routes où l'authentification est optionnelle
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = extractTokenFromHeader(req);

        if (!token) {
            return next();
        }

        const decoded = verifyToken(token);

        if (!decoded) {
            return next();
        }

        const user = await User.findById(decoded.id);

        if (!user || !user.active) {
            return next();
        }

        req.user = user;
        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    protect,
    restrictTo,
    optionalAuth
};