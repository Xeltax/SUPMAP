const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modèle pour les itinéraires enregistrés
 */
class Route extends Model {}

Route.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'ID de l\'utilisateur propriétaire de l\'itinéraire'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Nom de l\'itinéraire'
        },
        originName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Nom du point de départ'
        },
        destinationName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Nom du point d\'arrivée'
        },
        originCoordinates: {
            type: DataTypes.GEOMETRY('POINT'),
            allowNull: false,
            comment: 'Coordonnées du point de départ'
        },
        destinationCoordinates: {
            type: DataTypes.GEOMETRY('POINT'),
            allowNull: false,
            comment: 'Coordonnées du point d\'arrivée'
        },
        waypoints: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: [],
            comment: 'Points intermédiaires de l\'itinéraire'
        },
        routeData: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Données complètes de l\'itinéraire'
        },
        geometry: {
            type: DataTypes.GEOMETRY('LINESTRING'),
            allowNull: true,
            comment: 'Géométrie de l\'itinéraire pour l\'affichage sur la carte'
        },
        distance: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: 'Distance de l\'itinéraire en mètres'
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Durée estimée de l\'itinéraire en secondes'
        },
        avoidTolls: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Indique si l\'itinéraire évite les péages'
        },
        routeType: {
            type: DataTypes.ENUM('fastest', 'shortest', 'eco', 'thrilling'),
            allowNull: false,
            defaultValue: 'fastest',
            comment: 'Type d\'itinéraire'
        },
        isFavorite: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Indique si l\'itinéraire est marqué comme favori'
        },
        lastUsed: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date de dernière utilisation de l\'itinéraire'
        }
    },
    {
        sequelize,
        modelName: 'Route',
        tableName: 'routes',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['isFavorite']
            }
        ]
    }
);

module.exports = Route;