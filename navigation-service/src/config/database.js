const { Sequelize } = require('sequelize');

// Configurer la connexion à la base de données
const sequelize = new Sequelize(
    process.env.POSTGRES_DB || 'trafine-navigation',
    process.env.POSTGRES_USER || 'postgres',
    process.env.POSTGRES_PASSWORD || 'postgres',
    {
        host: process.env.POSTGRES_HOST || 'postgres',
        port: process.env.POSTGRES_PORT || 5432,
        dialect: 'postgres',
        dialectOptions: {
            // Options spécifiques pour PostgreSQL
            ssl: process.env.POSTGRES_SSL === 'true' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        },
        // Configuration du pool de connexions
        pool: {
            max: 5, // Nombre maximum de connexions dans le pool
            min: 0, // Nombre minimum de connexions dans le pool
            acquire: 30000, // Délai maximum pour obtenir une connexion (ms)
            idle: 10000 // Durée maximale d'inactivité d'une connexion (ms)
        }
    }
);

module.exports = sequelize;