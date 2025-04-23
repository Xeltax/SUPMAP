require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Configuration du logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Initialiser l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Limiter de débit pour éviter les attaques par force brute
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par fenêtre
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Trop de requêtes, veuillez réessayer plus tard'
    }
});

// Appliquer le limiteur à toutes les routes
app.use(apiLimiter);

// Middleware de vérification du token JWT
const validateToken = require('./middleware/validateToken');

console.log(process.env.AUTH_SERVICE_URL)

// Définir les configurations des proxies pour chaque services
const serviceProxies = {
    auth: {
        target: process.env.AUTH_SERVICE_URL || 'http://auth-service:4000',
        pathRewrite: { '^/api/auth': '/api/auth' },
        changeOrigin: true
    },
    navigation: {
        target: process.env.NAVIGATION_SERVICE_URL || 'http://navigation-service:4001',
        pathRewrite: { '^/api/navigation': '/api' },
        changeOrigin: true
    },
    incidents: {
        target: process.env.INCIDENTS_SERVICE_URL || 'http://incidents-service:4002',
        pathRewrite: { '^/api/incidents': '/api' },
        changeOrigin: true
    },
    notifications: {
        target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4003',
        pathRewrite: { '^/api/notifications': '/api' },
        changeOrigin: true
    },
    analytics: {
        target: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:4004',
        pathRewrite: { '^/api/analytics': '/api' },
        changeOrigin: true
    }
};

// Définir les routes qui ne nécessitent pas d'authentification
const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/google',
    '/api/auth/google/callback',
    '/api/auth/facebook',
    '/api/auth/facebook/callback',
    '/health'
];

// Middleware pour vérifier si une route est publique ou nécessite une authentification
const authCheck = (req, res, next) => {
    if (publicRoutes.some(route => req.path.startsWith(route))) {
        return next();
    }
    return validateToken(req, res, next);
};

// Route de santé pour vérifier si l'API Gateway fonctionne
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API Gateway is running'
    });
});

// Configuration des proxies pour les services avec middleware d'authentification
Object.entries(serviceProxies).forEach(([service, config]) => {
    const path = `/api/${service}`;

    // Le services d'authentification a des routes publiques
    if (service === 'auth') {
        app.use(path, createProxyMiddleware({...config, onProxyReq: (proxyReq, req, res) => {
                if (!req.body || !Object.keys(req.body).length) {
                    return;
                }

                const contentType = proxyReq.getHeader('Content-Type');
                const writeBody = (bodyData) => {
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    proxyReq.write(bodyData);
                };

                if (contentType === 'application/json') {
                    writeBody(JSON.stringify(req.body));
                }
            }
        }));
    } else {
        // Les autres services nécessitent une authentification
        app.use(path, authCheck, createProxyMiddleware({...config, onProxyReq: (proxyReq, req, res) => {
                if (!req.body || !Object.keys(req.body).length) {
                    return;
                }

                const contentType = proxyReq.getHeader('Content-Type');
                const writeBody = (bodyData) => {
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    proxyReq.write(bodyData);
                };

                if (contentType === 'application/json') {
                    writeBody(JSON.stringify(req.body));
                }
            }
        }));
    }
});

// Gérer les routes non trouvées
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route non trouvée'
    });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Erreur interne du serveur'
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT}`);
    console.log(`API Gateway running on port ${PORT}`);
});

// Gestion de l'arrêt propre du serveur
process.on('SIGINT', () => {
    console.log('API Gateway shutting down');
    process.exit(0);
});