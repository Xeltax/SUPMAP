const jwt = require('jsonwebtoken');
const axios = require('axios');

/**
 * Middleware pour valider le token JWT et vérifier l'existence de l'utilisateur
 */
const validateToken = async (req, res, next) => {
    try {
        // Vérifier si le header Authorization est présent
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Non authentifié. Veuillez vous connecter.'
            });
        }

        // Extraire le token du header
        const token = authHeader.split(' ')[1];

        // Vérifier si le token est présent
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Non authentifié. Token manquant.'
            });
        }

        try {
            // Vérifier si le token est valide (décodable avec le secret JWT)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Ajouter les informations décodées à la requête
            req.user = decoded;

            // Facultatif: vérifier l'existence de l'utilisateur auprès du services d'authentification
            try {
                const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:4000';
                await axios.get(`${authServiceUrl}/api/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            } catch (error) {
                // Si le services d'authentification indique que l'utilisateur n'existe pas ou n'est pas valide
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Token invalide ou expiré'
                    });
                }

                // Si l'erreur est liée à la connexion au services d'authentification, continuer quand même
                // car nous avons déjà vérifié que le token est valide
                console.error('Erreur lors de la vérification de l\'utilisateur:', error.message);
            }

            next();
        } catch (error) {
            // Gérer les erreurs de vérification du token
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