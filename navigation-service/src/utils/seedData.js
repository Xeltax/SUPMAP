const Incident = require('../models/incidentModel');
const Route = require('../models/routeModel');

const sampleIncidents = [
    {
        userId: 'user123',
        incidentType: 'accident',
        location: {
            type: 'Point',
            coordinates: [2.3488, 48.8534] // Paris
        },
        description: 'Accident impliquant 2 véhicules',
        severity: 'high',
        validations: 3,
        invalidations: 0,
        active: true,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 heure
    },
    {
        userId: 'user456',
        incidentType: 'congestion',
        location: {
            type: 'Point',
            coordinates: [2.2945, 48.8584] // Arc de Triomphe
        },
        description: 'Trafic dense sur les Champs-Élysées',
        severity: 'moderate',
        validations: 5,
        invalidations: 1,
        active: true,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 heures
    },
    {
        userId: 'user789',
        incidentType: 'roadClosed',
        location: {
            type: 'Point',
            coordinates: [1.8883, 46.5833] // Centre de la France
        },
        description: 'Route fermée pour travaux',
        severity: 'severe',
        validations: 7,
        invalidations: 0,
        active: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 heures
    },
    {
        userId: 'user123',
        incidentType: 'roadworks',
        location: {
            type: 'Point',
            coordinates: [7.7521, 48.5734] // Strasbourg
        },
        description: 'Travaux sur la voie rapide',
        severity: 'moderate',
        validations: 2,
        invalidations: 0,
        active: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
    },
    {
        userId: 'user456',
        incidentType: 'hazard',
        location: {
            type: 'Point',
            coordinates: [-1.5536, 47.2173] // Nantes
        },
        description: 'Débris sur la chaussée',
        severity: 'low',
        validations: 1,
        invalidations: 0,
        active: true,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 heures
    },
    {
        userId: 'user789',
        incidentType: 'police',
        location: {
            type: 'Point',
            coordinates: [4.8357, 45.7640] // Lyon
        },
        description: 'Contrôle de police',
        severity: 'low',
        validations: 4,
        invalidations: 1,
        active: true,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 heures
    }
];

// Données d'exemple pour les trajets
const sampleRoutes = [
    {
        userId: 'user123',
        name: 'Trajet domicile-travail',
        originName: 'Levallois-Perret',
        destinationName: 'La Défense',
        originCoordinates: {
            type: 'Point',
            coordinates: [2.2868, 48.8932]
        },
        destinationCoordinates: {
            type: 'Point',
            coordinates: [2.2418, 48.8909]
        },
        waypoints: [],
        routeData: {
            summary: {
                lengthInMeters: 5000,
                travelTimeInSeconds: 900
            }
        },
        geometry: {
            type: 'LineString',
            coordinates: [
                [2.2868, 48.8932],
                [2.2750, 48.8925],
                [2.2610, 48.8920],
                [2.2418, 48.8909]
            ]
        },
        distance: 5000,
        duration: 900,
        avoidTolls: true,
        routeType: 'fastest',
        isFavorite: true,
        lastUsed: new Date()
    },
    {
        userId: 'user456',
        name: 'Trajet week-end',
        originName: 'Paris',
        destinationName: 'Versailles',
        originCoordinates: {
            type: 'Point',
            coordinates: [2.3522, 48.8566]
        },
        destinationCoordinates: {
            type: 'Point',
            coordinates: [2.1309, 48.8044]
        },
        waypoints: [
            {
                name: 'Boulogne-Billancourt',
                coordinates: [2.2400, 48.8396]
            }
        ],
        routeData: {
            summary: {
                lengthInMeters: 15000,
                travelTimeInSeconds: 1800
            }
        },
        geometry: {
            type: 'LineString',
            coordinates: [
                [2.3522, 48.8566],
                [2.2400, 48.8396],
                [2.1309, 48.8044]
            ]
        },
        distance: 15000,
        duration: 1800,
        avoidTolls: false,
        routeType: 'eco',
        isFavorite: false,
        lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 jours avant
    },
    {
        userId: 'user789',
        name: 'Trajet vacances',
        originName: 'Paris',
        destinationName: 'Marseille',
        originCoordinates: {
            type: 'Point',
            coordinates: [2.3522, 48.8566]
        },
        destinationCoordinates: {
            type: 'Point',
            coordinates: [5.3698, 43.2965]
        },
        waypoints: [
            {
                name: 'Lyon',
                coordinates: [4.8357, 45.7640]
            }
        ],
        routeData: {
            summary: {
                lengthInMeters: 775000,
                travelTimeInSeconds: 28000
            }
        },
        geometry: {
            type: 'LineString',
            coordinates: [
                [2.3522, 48.8566],
                [4.8357, 45.7640],
                [5.3698, 43.2965]
            ]
        },
        distance: 775000,
        duration: 28000,
        avoidTolls: false,
        routeType: 'fastest',
        isFavorite: true,
        lastUsed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours avant
    },
    {
        userId: 'user123',
        name: 'Circuit touristique Paris',
        originName: 'Tour Eiffel',
        destinationName: 'Notre-Dame',
        originCoordinates: {
            type: 'Point',
            coordinates: [2.2945, 48.8584]
        },
        destinationCoordinates: {
            type: 'Point',
            coordinates: [2.3499, 48.8529]
        },
        waypoints: [
            {
                name: 'Louvre',
                coordinates: [2.3376, 48.8606]
            },
            {
                name: 'Place de la Concorde',
                coordinates: [2.3210, 48.8656]
            }
        ],
        routeData: {
            summary: {
                lengthInMeters: 8000,
                travelTimeInSeconds: 1500
            }
        },
        geometry: {
            type: 'LineString',
            coordinates: [
                [2.2945, 48.8584],
                [2.3210, 48.8656],
                [2.3376, 48.8606],
                [2.3499, 48.8529]
            ]
        },
        distance: 8000,
        duration: 1500,
        avoidTolls: true,
        routeType: 'shortest',
        isFavorite: true,
        lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 jours avant
    },
    {
        userId: 'user456',
        name: 'Trajet professionnel',
        originName: 'Paris',
        destinationName: 'Lille',
        originCoordinates: {
            type: 'Point',
            coordinates: [2.3522, 48.8566]
        },
        destinationCoordinates: {
            type: 'Point',
            coordinates: [3.0573, 50.6292]
        },
        waypoints: [],
        routeData: {
            summary: {
                lengthInMeters: 225000,
                travelTimeInSeconds: 9000
            }
        },
        geometry: {
            type: 'LineString',
            coordinates: [
                [2.3522, 48.8566],
                [2.7000, 49.5000],
                [3.0573, 50.6292]
            ]
        },
        distance: 225000,
        duration: 9000,
        avoidTolls: false,
        routeType: 'fastest',
        isFavorite: false,
        lastUsed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 jours avant
    }
];

/**
 * Vérifie si la base de données contient déjà des données
 * @returns {Promise<boolean>}
 */
async function isDatabaseEmpty() {
    const incidentCount = await Incident.count();
    const routeCount = await Route.count();
    return incidentCount === 0 && routeCount === 0;
}

/**
 * Précharge la base de données avec des données d'exemple
 * @returns {Promise<void>}
 */
async function seedDatabase() {
    try {
        // Vérifier si la base de données est vide
        const isEmpty = await isDatabaseEmpty();

        if (isEmpty) {
            console.log('Base de données vide, préchargement des données...');

            // Insérer les incidents
            console.log('Insertion des incidents...');
            await Incident.bulkCreate(sampleIncidents);
            console.log(`${sampleIncidents.length} incidents ont été insérés.`);

            // Insérer les trajets
            console.log('Insertion des trajets...');
            await Route.bulkCreate(sampleRoutes);
            console.log(`${sampleRoutes.length} trajets ont été insérés.`);

            console.log('Préchargement des données terminé avec succès !');
        } else {
            console.log('La base de données contient déjà des données, aucun préchargement nécessaire.');
        }
    } catch (error) {
        console.error('Erreur lors du préchargement des données:', error);
        throw error;
    }
}

module.exports = {
    seedDatabase,
    sampleIncidents,
    sampleRoutes
};