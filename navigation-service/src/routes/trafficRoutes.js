const express = require('express');
const trafficController = require('../controllers/trafficController');

const router = express.Router();

/**
 * @route GET /api/traffic/info
 * @desc Récupère les informations de trafic pour une zone donnée
 * @access Privé
 */
router.get('/info', trafficController.getTrafficInfo);

/**
 * @route GET /api/traffic/incidents
 * @desc Récupère les incidents de trafic pour une zone donnée
 * @access Privé
 */
router.get('/incidents', trafficController.getTrafficIncidents);

/**
 * @route POST /api/traffic/report
 * @desc Signale un nouvel incident de trafic
 * @access Privé
 */
router.post('/report', trafficController.reportTrafficIncident);

/**
 * @route PATCH /api/traffic/resolve
 * @desc Resolut un incident de trafic
 * @access Privé
 */
router.patch('/resolve/:id', trafficController.resolveTrafficIncident);

/**
 * @route GET /api/traffic/reports
 * @desc Récupère les signalements d'incidents créés par les utilisateurs
 * @access Privé
 */
router.get('/reports', trafficController.getUserReports);

/**
 * @route POST /api/traffic/validate/:id
 * @desc Valide un signalement d'incident
 * @access Privé
 */
router.post('/validate/:id', trafficController.validateIncidentReport);

/**
 * @route POST /api/traffic/invalidate/:id
 * @desc Invalide un signalement d'incident
 * @access Privé
 */
router.post('/invalidate/:id', trafficController.invalidateIncidentReport);

module.exports = router;