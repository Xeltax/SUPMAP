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
        // req.user est défini par le middleware passport.authenticate
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Non authentifié'
            });
        }

        // Vérifier si le rôle de l'utilisateur est dans la liste des rôles autorisés
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
            return next(); // Pas de token, continuer sans authentification
        }

        const decoded = verifyToken(token);

        if (!decoded) {
            return next(); // Token invalide, continuer sans authentification
        }

        // Vérifier si l'utilisateur existe toujours
        const user = await User.findById(decoded.id);

        if (!user || !user.active) {
            return next(); // Utilisateur non trouvé ou inactif
        }

        // Ajouter l'utilisateur à la requête
        req.user = user;
        next();
    } catch (error) {
        next(); // En cas d'erreur, continuer sans authentification
    }
};

module.exports = {
    protect,
    restrictTo,
    optionalAuth
};