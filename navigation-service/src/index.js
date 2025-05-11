require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./config/database');
const cron = require('node-cron');
const { fetchAndStoreIncidents } = require('./cron/trafficIncidentsCron');

const routesRoutes = require('./routes/routesRoutes');
const trafficRoutes = require('./routes/trafficRoutes');
const { seedDatabase } = require('./utils/seedData');

sequelize
    .authenticate()
    .then(() => {
        console.log('Connexion à PostgreSQL établie avec succès');
    })
    .catch((err) => {
        console.error('Impossible de se connecter à PostgreSQL:', err);
    });

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Navigation services is running'
    });
});

app.use('/api/routes', routesRoutes);
app.use('/api/traffic', trafficRoutes);

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

console.log('Starting traffic incidents cron job...');

cron.schedule('*/5 * * * *', () => {
    console.log('Running traffic incidents cron job...');
    fetchAndStoreIncidents();
});

process.on('SIGINT', async () => {
    console.log('Navigation services shutting down');
    await sequelize.close();
    process.exit(0);
});