const tomtomService = require('../services/tomtomService');
require('dotenv').config();
const { insertTrafficIncidents } = require('../services/dbQueries');

// Zone géographique pour la région de Normandie
const NORMANDY_BBOX = [-1.5373653562812137, 48.90257667883992, 0.7880741778504614, 49.40242438761433];

/**
 * Récupérer et stocker les incidents de circulation
 */
async function fetchAndStoreIncidents() {
    try {
        console.log('Fetching traffic incidents...');

        const response = await tomtomService.getTrafficIncidents({
            bbox: NORMANDY_BBOX,
            incidentType: 'all',
            maxResults: 1000,
            timeValidityFilter: 'present'
        });

        if (response.incidents && response.incidents.length > 0) {
            console.log(`Found ${response.incidents.length} incidents`);

            await insertTrafficIncidents(response.incidents);
            console.log('Successfully stored incidents in database');
        } else {
            console.log('No incidents found');
        }
    } catch (error) {
        console.error('Error in traffic incidents cron job:', error);
    }
}

// Exporter la fonction pour les tests
module.exports = {
    fetchAndStoreIncidents
}; 