require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const sequelize = require('./config/database');

// Routes
const routesRoutes = require('./routes/routesRoutes');
const trafficRoutes = require('./routes/trafficRoutes');

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

// Tester la connexion à la base de données
sequelize
    .authenticate()
    .then(() => {
        logger.info('Connexion à PostgreSQL établie avec succès');
        console.log('Connexion à PostgreSQL établie avec succès');
    })
    .catch((err) => {
        logger.error('Impossible de se connecter à PostgreSQL:', err);
    });

// Initialiser l'application Express
const app = express();
const PORT = process.env.PORT || 4001;

// Middlewares de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Route de santé
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Navigation services is running'
    });
});

// Routes API
app.use('/api/routes', routesRoutes);
app.use('/api/traffic', trafficRoutes);

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

// Synchroniser les modèles avec la base de données et démarrer le serveur
sequelize.sync({ alter: process.env.NODE_ENV === 'development', force : true })
    .then(() => {
        console.log(`BDD synchronisée avec succès`);
        app.listen(PORT, () => {
            logger.info(`Navigation service running on port ${PORT}`);
            console.log(`Navigation service running on port ${PORT}`);
        });
    })
    .catch((err) => {
        logger.error('Erreur lors de la synchronisation des modèles:', err);
    });

// Gestion de l'arrêt propre du serveur
process.on('SIGINT', async () => {
    console.log('Navigation services shutting down');
    await sequelize.close();
    process.exit(0);
});