const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.POSTGRES_DB || 'trafine-navigation',
    process.env.POSTGRES_USER || 'postgres',
    process.env.POSTGRES_PASSWORD || 'postgres',
    {
        host: process.env.POSTGRES_HOST || 'postgres',
        port: process.env.POSTGRES_PORT || 5432,
        dialect: 'postgres',
        dialectOptions: {
            ssl: process.env.POSTGRES_SSL === 'true' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = sequelize;