const jwt = require('jsonwebtoken');

/**
 * Génère un token JWT pour un utilisateur
 * @param {Object} user - L'utilisateur pour lequel générer le token
 * @returns {String} Token JWT
 */
const generateToken = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
    };

    const options = {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Vérifie et décode un token JWT
 * @param {String} token - Token JWT à vérifier
 * @returns {Object|null} Payload décodé ou null si invalide
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.error('Erreur de vérification du token:', error.message);
        return null;
    }
};

/**
 * Extrait le token JWT de l'en-tête Authorization
 * @param {Object} req - Objet Request d'Express
 * @returns {String|null} Token JWT ou null si non trouvé
 */
const extractTokenFromHeader = (req) => {
    if (!req.headers.authorization) {
        return null;
    }

    const parts = req.headers.authorization.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
};

module.exports = {
    generateToken,
    verifyToken,
    extractTokenFromHeader
};