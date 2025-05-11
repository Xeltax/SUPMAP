const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');

const Incident = sequelize.define('Incident', {
    id: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'system'
    },
    incidentType: {
        type: DataTypes.ENUM('accident', 'congestion', 'roadClosed', 'roadworks', 'hazard', 'police'),
        allowNull: false
    },
    location: {
        type: DataTypes.GEOMETRY('POINT', 4326),
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    severity: {
        type: DataTypes.ENUM('low', 'moderate', 'high', 'severe'),
        allowNull: false,
        defaultValue: 'moderate'
    },
    validations: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    invalidations: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'incidents',
    schema: 'public',
    timestamps: true,
    freezeTableName: true
});

/**
 * Mapping des types d'incidents TomTom vers nos valeurs d'énumération
 */
const TOMTOM_TO_INCIDENT_TYPE = {
    '1': 'accident',
    '2': 'congestion',
    '3': 'roadClosed',
    '4': 'roadworks',
    '5': 'hazard',
    '6': 'police',
    '7': 'accident',
    '8': 'roadClosed',
    '9': 'roadworks',
    '10': 'hazard',
    '11': 'police',
    '12': 'congestion'
};

/**
 * Mapping des niveaux de sévérité TomTom vers nos valeurs d'énumération
 */
const TOMTOM_TO_SEVERITY = {
    0: 'low',
    1: 'low',
    2: 'moderate',
    3: 'high',
    4: 'severe',
    5: 'severe'
};

/**
 * Insère les incidents de trafic dans la base de données
 * @param {Array} incidents - Tableau d'incidents provenant de l'API TomTom
 * @returns {Promise<void>}
 */
async function insertTrafficIncidents(incidents) {
    try {
        for (const incident of incidents) {
            const tomtomType = incident.properties.iconCategory;
            const mappedType = TOMTOM_TO_INCIDENT_TYPE[tomtomType] || 'hazard';
            
            const tomtomSeverity = incident.properties.magnitudeOfDelay;
            const mappedSeverity = TOMTOM_TO_SEVERITY[tomtomSeverity] || 'moderate';

            let coordinates;
            if (incident.geometry.type === 'Point') {
                coordinates = incident.geometry.coordinates;
            } else if (incident.geometry.type === 'LineString' && incident.geometry.coordinates.length > 0) {
                coordinates = incident.geometry.coordinates[0];
            } else {
                console.warn('Type de géométrie ou coordonnées invalides pour l\'incident:', incident);
                continue;
            }

            const existingIncident = await Incident.findOne({
                where: {
                    [Op.and]: [
                        Sequelize.where(
                            Sequelize.fn('ST_X', Sequelize.col('location')),
                            coordinates[0]
                        ),
                        Sequelize.where(
                            Sequelize.fn('ST_Y', Sequelize.col('location')),
                            coordinates[1]
                        ),
                        { incidentType: mappedType },
                        { active: true }
                    ]
                }
            });

            if (existingIncident) {
                const now = new Date();
                const isExpired = existingIncident.expiresAt < now;

                await existingIncident.update({
                    active: !isExpired && incident.properties.active,
                    validations: existingIncident.validations,
                    invalidations: existingIncident.invalidations
                });
            } else {
                await Incident.create({
                    incidentType: mappedType,
                    location: Sequelize.fn('ST_SetSRID', 
                        Sequelize.fn('ST_MakePoint', coordinates[0], coordinates[1]),
                        4326
                    ),
                    active: incident.properties.active,
                    description: incident.properties.events[0]?.description || '',
                    severity: mappedSeverity,
                    expiresAt: incident.properties.endTime || new Date(Date.now() + 3600000) // Par défaut 24 heures si aucune heure de fin n'est fournie
                });
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'insertion des incidents de trafic:', error);
        throw error;
    }
}

module.exports = {
    insertTrafficIncidents,
    Incident
}; 