const express = require('express');
const routesController = require('../controllers/routesController');

const router = express.Router();

/**
 * @route POST /api/routes/calculate
 * @desc Calcule un itinéraire entre deux points
 * @access Privé
 */
router.post('/calculate', routesController.calculateRoute);

/**
 * @route GET /api/routes/search
 * @desc Recherche un lieu par nom ou adresse
 * @access Privé
 */
router.get('/search', routesController.searchLocation);

/**
 * @route POST /api/routes/save
 * @desc Enregistre un itinéraire
 * @access Privé
 */
router.post('/save', routesController.saveRoute);

/**
 * @route GET /api/routes/user
 * @desc Récupère tous les itinéraires de l'utilisateur
 * @access Privé
 */
router.get('/user', routesController.getUserRoutes);

/**
 * @route GET /api/routes/:id
 * @desc Récupère un itinéraire spécifique
 * @access Privé
 */
router.get('/:id', routesController.getRouteById);

/**
 * @route PATCH /api/routes/:id
 * @desc Met à jour un itinéraire
 * @access Privé
 */
router.patch('/:id', routesController.updateRoute);

/**
 * @route DELETE /api/routes/:id
 * @desc Supprime un itinéraire
 * @access Privé
 */
router.delete('/:id', routesController.deleteRoute);

/**
 * @route GET /api/routes/qrcode/:id
 * @desc Génère un code QR pour un itinéraire
 * @access Privé
 */
router.get('/qrcode/:id', routesController.generateQRCode);

module.exports = router;