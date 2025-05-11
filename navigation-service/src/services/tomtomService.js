const axios = require('axios');

/**
 * Service pour interagir avec l'API TomTom
 */
class TomTomService {
    constructor() {
        this.apiKey = process.env.TOMTOM_API_KEY;
        this.baseUrl = 'https://api.tomtom.com';
        this.routingVersion = '1';
        this.searchVersion = '2';
        this.trafficVersion = '5';
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
                traffic = true,
                instructionsType = 'tagged',
                language = 'fr-FR',
                sectionType = 'lanes',
                instructionAnnouncementPoints = 'all',
                instructionPhonetics = true,
                instructionRoadShieldReferences = 'all'
            } = options;

            if (!origin || !destination) {
                throw new Error('Les points d\'origine et de destination sont requis');
            }

            let locations = `${origin[1]},${origin[0]}`;

            if (waypoints && waypoints.length > 0) {
                waypoints.forEach(point => {
                    locations += `:${point[1]},${point[0]}`;
                });
            }

            locations += `:${destination[1]},${destination[0]}`;

            const params = {
                avoid: avoidTolls ? 'tollRoads' : undefined,
                routeType: routeType,
                traffic: traffic,
                travelMode: 'car',
                instructionsType: instructionsType,
                language: language,
                sectionType: sectionType,
                instructionAnnouncementPoints: instructionAnnouncementPoints,
                instructionPhonetics: instructionPhonetics ? 'LHP' : undefined, // Left-Hand-Phonetics
                instructionRoadShieldReferences: instructionRoadShieldReferences
            };

            const client = this.createApiClient();
            const response = await client.get(
                `/routing/${this.routingVersion}/calculateRoute/${locations}/json`,
                { params }
            );

            console.log(response.data.routes)

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
     * Obtient des informations sur les incidents de trafic dans une zone spécifique
     * @param {Object} options - Options de la requête
     * @param {Array} options.bbox - Boîte englobante [minLon, minLat, maxLon, maxLat]
     * @param {String} options.incidentType - Type d'incident (all, accidents, congestion, construction, etc.)
     * @param {Number} options.maxResults - Nombre maximum de résultats à retourner
     * @param {String} options.timeValidityFilter - Filtre de validité temporelle (present, future ou all)
     * @returns {Promise<Object>} Données des incidents
     */
    async getTrafficIncidents(options) {
        try {
            const {
                bbox,
                incidentType = 'all',
                maxResults = 100,
                timeValidityFilter = 'present'
            } = options;

            if (!bbox || bbox.length !== 4) {
                throw new Error('La boîte englobante (bbox) doit contenir 4 valeurs [minLon, minLat, maxLon, maxLat]');
            }

            const [minLon, minLat, maxLon, maxLat] = bbox;
            if (minLon > maxLon || minLat > maxLat) {
                throw new Error('Valeurs de bbox invalides: minLon doit être <= maxLon et minLat doit être <= maxLat');
            }

            const client = this.createApiClient();
            const response = await client.get(`/traffic/services/${this.trafficVersion}/incidentDetails`, {
                params: {
                    bbox: bbox.join(','),
                    language: 'fr-FR',
                    timeValidityFilter,
                    maxResults,
                    fields: '{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime}}}',
                    expandCluster: true
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
     * Obtient les détails d'un incident spécifique
     * @param {String} incidentId - Identifiant unique de l'incident
     * @returns {Promise<Object>} Détails de l'incident
     */
    async getIncidentDetails(incidentId) {
        try {
            if (!incidentId) {
                throw new Error('L\'identifiant de l\'incident est requis');
            }

            const client = this.createApiClient();
            const response = await client.get(`/traffic/services/${this.trafficVersion}/incidentDetails/${incidentId}`, {
                params: {
                    language: 'fr-FR'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des détails de l\'incident:', error.message);
            if (error.response) {
                console.error('Réponse d\'erreur:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Obtient des informations sur le flux de trafic dans une zone spécifique
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

            const client = this.createApiClient();
            const response = await client.get(`/traffic/services/${this.trafficVersion}/flowSegmentData/relative`, {
                params: {
                    bbox: bbox.join(','),
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
     * Obtient des incidents de trafic le long d'un itinéraire
     * @param {Object} options - Options de la requête
     * @param {Array} options.points - Tableau de points définissant l'itinéraire [[lon1,lat1], [lon2,lat2], ...]
     * @param {Number} options.width - Largeur du corridor en mètres (de 0 à 50000)
     * @param {String} options.incidentType - Type d'incident (all, accidents, congestion, etc.)
     * @returns {Promise<Object>} Incidents le long de l'itinéraire
     */
    async getRouteIncidents(options) {
        try {
            const {
                points,
                width = 1000,
                incidentType = 'all'
            } = options;

            if (!points || !Array.isArray(points) || points.length < 2) {
                throw new Error('Au moins deux points sont requis pour définir un itinéraire');
            }

            const pointsArray = points.map(point => `${point[1]},${point[0]}`);

            const client = this.createApiClient();
            const response = await client.get(`/traffic/services/${this.trafficVersion}/incidentDetails`, {
                params: {
                    point: pointsArray.join(':'),
                    radius: width,
                    incidentType,
                    expandCluster: true,
                    language: 'fr-FR',
                    fields: '{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events,startTime,endTime}}}'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des incidents sur l\'itinéraire:', error.message);
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