require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./config/database');
const cron = require('node-cron');
const { fetchAndStoreIncidents } = require('./cron/trafficIncidentsCron');

// Routes
const routesRoutes = require('./routes/routesRoutes');
const trafficRoutes = require('./routes/trafficRoutes');
const { seedDatabase } = require('./utils/seedData');

// Tester la connexion à la base de données
sequelize
    .authenticate()
    .then(() => {
        console.log('Connexion à PostgreSQL établie avec succès');
    })
    .catch((err) => {
        console.error('Impossible de se connecter à PostgreSQL:', err);
    });

// Initialiser l'application Express
const app = express();
const PORT = process.env.PORT || 4001;

// Middlewares de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

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
    console.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Erreur interne du serveur'
    });
});

// Synchroniser les modèles avec la base de données et démarrer le serveur
sequelize.sync({ alter: process.env.NODE_ENV === 'development', force : true })
    .then(() => {
        console.log(`BDD synchronisée avec succès`);
        
        // Démarrer le serveur
        app.listen(PORT, () => {
            console.log(`Navigation service running on port ${PORT}`);
            return seedDatabase()
        });
    })
    .catch((err) => {
        console.error('Erreur lors de la synchronisation des modèles:', err);
    });

// Démarrer le cron job pour les incidents de trafic
console.log('Starting traffic incidents cron job...');
// Exécuter toutes les 5 minutes
cron.schedule('*/5 * * * *', () => {
    console.log('Running traffic incidents cron job...');
    fetchAndStoreIncidents();
});

// Gestion de l'arrêt propre du serveur
process.on('SIGINT', async () => {
    console.log('Navigation services shutting down');
    await sequelize.close();
    process.exit(0);
});