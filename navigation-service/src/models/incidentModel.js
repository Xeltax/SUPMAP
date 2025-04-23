const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modèle pour les incidents signalés par les utilisateurs
 */
class Incident extends Model {}

Incident.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'ID de l\'utilisateur qui a signalé l\'incident'
        },
        incidentType: {
            type: DataTypes.ENUM('accident', 'congestion', 'roadClosed', 'roadworks', 'hazard', 'police'),
            allowNull: false,
            comment: 'Type d\'incident'
        },
        location: {
            type: DataTypes.GEOMETRY('POINT'),
            allowNull: false,
            comment: 'Coordonnées de l\'incident'
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Description de l\'incident'
        },
        severity: {
            type: DataTypes.ENUM('low', 'moderate', 'high', 'severe'),
            allowNull: false,
            defaultValue: 'moderate',
            comment: 'Sévérité de l\'incident'
        },
        validations: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Nombre de validations par d\'autres utilisateurs'
        },
        invalidations: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Nombre d\'invalidations par d\'autres utilisateurs'
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Indique si l\'incident est toujours actif'
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: 'Date d\'expiration de l\'incident'
        }
    },
    {
        sequelize,
        modelName: 'Incident',
        tableName: 'incidents',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['incidentType']
            },
            {
                fields: ['active']
            },
            {
                fields: ['expiresAt']
            }
        ]
    }
);

module.exports = Incident;