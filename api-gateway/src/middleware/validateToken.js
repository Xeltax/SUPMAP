const jwt = require('jsonwebtoken');
const axios = require('axios');

/**
 * Middleware pour valider le token JWT et vérifier l'existence de l'utilisateur
 */
const validateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Non authentifié. Veuillez vous connecter.'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Non authentifié. Token manquant.'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = decoded;

            try {
                const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:4000';
                await axios.get(`${authServiceUrl}/api/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            } catch (error) {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Token invalide ou expiré'
                    });
                }

                console.error('Erreur lors de la vérification de l\'utilisateur:', error.message);
            }

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: 'error',
                    message: 'Token expiré. Veuillez vous reconnecter.'
                });
            }

            return res.status(401).json({
                status: 'error',
                message: 'Token invalide'
            });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = validateToken;