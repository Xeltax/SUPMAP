const axios = require('axios');

/**
 * Service pour interagir avec l'API TomTom
 */
class TomTomService {
    constructor() {
        this.apiKey = process.env.TOMTOM_API_KEY;
        this.baseUrl = 'https://api.tomtom.com';
        this.routingVersion = '1'; // Version 1 pour l'API de routage
        this.searchVersion = '2';  // Version 2 pour l'API de recherche
        this.trafficVersion = '2'; // Version 2 pour l'API de trafic
    }

    /**
     * Crée une instance axios préconfigurée pour les appels à l'API TomTom
     * @returns {Object} Instance Axios
     */
    createApiClient() {
        return axios.create({
            baseURL: this.baseUrl,
            params: {
                key: this.apiKey
            }
        });
    }

    /**
     * Calcule un itinéraire entre deux points
     * @param {Object} options - Options de routage
     * @param {Array} options.origin - Coordonnées d'origine [longitude, latitude]
     * @param {Array} options.destination - Coordonnées de destination [longitude, latitude]
     * @param {Array} options.waypoints - Points intermédiaires (optionnel)
     * @param {String} options.routeType - Type d'itinéraire (fastest, shortest, eco, thrilling)
     * @param {Boolean} options.avoidTolls - Éviter les péages
     * @param {Boolean} options.traffic - Tenir compte du trafic en temps réel
     * @returns {Promise<Object>} Données de l'itinéraire
     */
    async calculateRoute(options) {
        try {
            const {
                origin,
                destination,
                waypoints = [],
                routeType = 'fastest',
                avoidTolls = false,
                traffic = true
            } = options;

            if (!origin || !destination) {
                throw new Error('Les points d\'origine et de destination sont requis');
            }

            // Construire la chaîne des points de l'itinéraire
            let locations = `${origin[1]},${origin[0]}`;

            // Ajouter les points intermédiaires
            if (waypoints && waypoints.length > 0) {
                waypoints.forEach(point => {
                    locations += `:${point[1]},${point[0]}`;
                });
            }

            // Ajouter la destination
            locations += `:${destination[1]},${destination[0]}`;

            // Paramètres pour l'API de routage v1
            const params = {
                avoid: avoidTolls ? 'tollRoads' : undefined,
                routeType: routeType,
                traffic: traffic,
                travelMode: 'car',
                instructionsType: 'tagged',
                language: 'fr-FR'
            };

            // Effectuer la requête à l'API TomTom
            const client = this.createApiClient();
            const response = await client.get(
                `/routing/${this.routingVersion}/calculateRoute/${locations}/json`,
                { params }
            );

            return response.data;
        } catch (error) {
            console.error('Erreur lors du calcul de l\'itinéraire:', error.message);
            if (error.response) {
                console.error('Réponse d\'erreur:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Obtient des informations sur le trafic dans une zone spécifique
     * @param {Object} options - Options de la requête
     * @param {Array} options.bbox - Boîte englobante [minLon, minLat, maxLon, maxLat]
     * @param {Number} options.zoom - Niveau de zoom (0-22)
     * @returns {Promise<Object>} Données de trafic
     */
    async getTrafficInfo(options) {
        try {
            const { bbox, zoom = 10 } = options;

            if (!bbox || bbox.length !== 4) {
                throw new Error('La boîte englobante (bbox) doit contenir 4 valeurs [minLon, minLat, maxLon, maxLat]');
            }

            // Effectuer la requête à l'API TomTom
            const client = this.createApiClient();
            const response = await client.get(`/traffic/${this.trafficVersion}/flowSegmentData/relative/bbox/${bbox.join('/')}/json`, {
                params: {
                    unit: 'KMPH', // Unité de vitesse
                    zoom: zoom
                }
            });

            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des informations de trafic:', error.message);
            if (error.response) {
                console.error('Réponse d\'erreur:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Obtient des informations sur les incidents de trafic dans une zone spécifique
     * @param {Object} options - Options de la requête
     * @param {Array} options.bbox - Boîte englobante [minLon, minLat, maxLon, maxLat]
     * @param {String} options.incidentType - Type d'incident (all, accidents, congestion, construction, etc.)
     * @returns {Promise<Object>} Données des incidents
     */
    async getTrafficIncidents(options) {
        try {
            const {
                bbox,
                incidentType = 'all'
            } = options;

            if (!bbox || bbox.length !== 4) {
                throw new Error('La boîte englobante (bbox) doit contenir 4 valeurs [minLon, minLat, maxLon, maxLat]');
            }

            // Effectuer la requête à l'API TomTom
            const client = this.createApiClient();
            const response = await client.get(`/traffic/${this.trafficVersion}/incidents/s3/${bbox.join('/')}/all/json`, {
                params: {
                    language: 'fr-FR', // Langue des descriptions d'incidents
                    timeValidityFilter: 'present' // Incidents actuels uniquement
                }
            });

            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des incidents de trafic:', error.message);
            if (error.response) {
                console.error('Réponse d\'erreur:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Recherche des lieux par nom ou adresse (geocoding)
     * @param {String} query - Terme de recherche
     * @param {Object} options - Options supplémentaires
     * @param {Number} options.limit - Nombre maximum de résultats
     * @param {String} options.countrySet - Pays à inclure (ex: 'FR')
     * @returns {Promise<Object>} Résultats de la recherche
     */
    async searchLocation(query, options = {}) {
        try {
            if (!query) {
                throw new Error('Le terme de recherche est requis');
            }

            const {
                limit = 5,
                countrySet = 'FR'
            } = options;

            // Effectuer la requête à l'API TomTom
            const client = this.createApiClient();
            const response = await client.get(`/search/${this.searchVersion}/search/${encodeURIComponent(query)}.json`, {
                params: {
                    limit,
                    countrySet,
                    language: 'fr-FR'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Erreur lors de la recherche de lieu:', error.message);
            if (error.response) {
                console.error('Réponse d\'erreur:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Obtient les coordonnées d'un lieu à partir de son adresse (geocoding)
     * @param {String} address - Adresse à géocoder
     * @returns {Promise<Array>} Coordonnées [longitude, latitude]
     */
    async geocode(address) {
        try {
            const results = await this.searchLocation(address);

            if (results.results && results.results.length > 0) {
                const location = results.results[0].position;
                return [location.lon, location.lat];
            }

            throw new Error('Aucun résultat trouvé pour cette adresse');
        } catch (error) {
            console.error('Erreur lors du géocodage:', error.message);
            throw error;
        }
    }

    /**
     * Obtient l'adresse à partir de coordonnées (reverse geocoding)
     * @param {Array} coordinates - Coordonnées [longitude, latitude]
     * @returns {Promise<Object>} Informations sur l'adresse
     */
    async reverseGeocode(coordinates) {
        try {
            if (!coordinates || coordinates.length !== 2) {
                throw new Error('Les coordonnées doivent contenir 2 valeurs [longitude, latitude]');
            }

            const [longitude, latitude] = coordinates;

            // Effectuer la requête à l'API TomTom
            const client = this.createApiClient();
            const response = await client.get(`/search/${this.searchVersion}/reverseGeocode/${latitude},${longitude}.json`, {
                params: {
                    language: 'fr-FR'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Erreur lors du géocodage inverse:', error.message);
            if (error.response) {
                console.error('Réponse d\'erreur:', error.response.data);
            }
            throw error;
        }
    }
}

module.exports = new TomTomService();