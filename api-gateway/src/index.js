require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

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
};

const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/google',
    '/api/auth/google/callback',
    '/api/auth/facebook',
    '/api/auth/facebook/callback',
    '/health'
];

const authCheck = (req, res, next) => {
    if (publicRoutes.some(route => req.path.startsWith(route))) {
        return next();
    }
    return validateToken(req, res, next);
};

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API Gateway is running'
    });
});

Object.entries(serviceProxies).forEach(([service, config]) => {
    const path = `/api/${service}`;

    // Le services d'authentification a des routes publiques
    if (service === 'auth') {
        app.use(path, createProxyMiddleware({...config, onProxyReq: (proxyReq, req, res) => {
                if (req.user && req.user.id) {
                    proxyReq.setHeader('X-User-ID', req.user.id);
                }

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
        app.use(path, authCheck, createProxyMiddleware({...config, onProxyReq: (proxyReq, req, res) => {
                if (req.user && req.user.id) {
                    proxyReq.setHeader('X-User-ID', req.user.id);
                }

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

app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route non trouvée'
    });
});

app.use((err, req, res, next) => {
    console.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Erreur interne du serveur'
    });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});

process.on('SIGINT', () => {
    console.log('API Gateway shutting down');
    process.exit(0);
});