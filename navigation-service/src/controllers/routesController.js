const tomtomService = require('../services/tomtomService');
const Route = require('../models/routeModel');
const { Sequelize, Op } = require('sequelize');
const QRCode = require('qrcode');

/**
 * Calcule un itinéraire entre deux points
 * @route POST /api/routes/calculate
 */
exports.calculateRoute = async (req, res, next) => {
    try {
        const {
            origin,
            destination,
            waypoints,
            routeType,
            avoidTolls,
            traffic,
            instructionsType,
            sectionType,
            instructionAnnouncementPoints,
            instructionPhonetics,
            instructionRoadShieldReferences
        } = req.body;

        if (!origin || !destination) {
            return res.status(400).json({
                status: 'error',
                message: 'Les points d\'origine et de destination sont requis'
            });
        }

        // Si les coordonnées sont fournies sous forme d'adresses, les convertir en coordonnées
        let originCoords = Array.isArray(origin) ? origin : await tomtomService.geocode(origin);
        let destinationCoords = Array.isArray(destination) ? destination : await tomtomService.geocode(destination);

        let waypointCoords = [];
        if (waypoints && waypoints.length > 0) {
            waypointCoords = await Promise.all(
                waypoints.map(async (waypoint) => {
                    return Array.isArray(waypoint) ? waypoint : await tomtomService.geocode(waypoint);
                })
            );
        }

        const routeData = await tomtomService.calculateRoute({
            origin: originCoords,
            destination: destinationCoords,
            waypoints: waypointCoords,
            routeType: routeType || 'fastest',
            avoidTolls: avoidTolls || false,
            traffic: traffic !== undefined ? traffic : true
        });

        const routes = routeData.routes.map(route => {
            const summary = {
                lengthInMeters: route.summary.lengthInMeters,
                travelTimeInSeconds: route.summary.travelTimeInSeconds,
                trafficDelayInSeconds: route.summary.trafficDelayInSeconds || 0,
                departureTime: route.summary.departureTime || new Date().toISOString(),
                arrivalTime: route.summary.arrivalTime || new Date(Date.now() + route.summary.travelTimeInSeconds * 1000).toISOString()
            };

            const legs = route.legs.map(leg => {
                const points = leg.points || [];

                return {
                    points,
                    summary: {
                        lengthInMeters: leg.summary?.lengthInMeters,
                        travelTimeInSeconds: leg.summary?.travelTimeInSeconds,
                        trafficDelayInSeconds: leg.summary?.trafficDelayInSeconds || 0
                    }
                };
            });

            let guidance = null;
            if (route.guidance) {
                const instructions = route.guidance.instructions.map(instruction => ({
                    routeOffsetInMeters: instruction.routeOffsetInMeters,
                    text: instruction.message || instruction.instruction || '',
                    phoneticText: instruction.phoneticInstruction || null,
                    maneuver: instruction.maneuver || '',
                    street: instruction.street || '',
                    exitNumber: instruction.exitNumber || null,
                    roundaboutExitNumber: instruction.roundaboutExitNumber || null,
                    travelTimeInSeconds: instruction.travelTimeInSeconds || null,
                    point: instruction.point || null,
                    lanes: instruction.lanes || null,
                    laneSeparators: instruction.laneSeparators || null,
                    roadShields: instruction.roadShields || null
                }));

                const instructionGroups = route.guidance.instructionGroups ?
                    route.guidance.instructionGroups.map(group => ({
                        firstInstructionIndex: group.firstInstructionIndex,
                        lastInstructionIndex: group.lastInstructionIndex,
                        groupMessage: group.groupMessage || '',
                        groupPhoneticMessage: group.groupPhoneticMessage || null
                    })) : [];

                guidance = {
                    instructions,
                    instructionGroups
                };
            }

            return {
                distance: summary.lengthInMeters,
                duration: summary.travelTimeInSeconds,
                trafficDelay: summary.trafficDelayInSeconds,
                departureTime: summary.departureTime,
                arrivalTime: summary.arrivalTime,
                legs,
                guidance
            };
        });

        res.status(200).json({
            status: 'success',
            data: {
                routes
            }
        });
    } catch (error) {
        console.error('Erreur complète:', error);
        next(error);
    }
};

/**
 * Recherche un lieu par nom ou adresse
 * @route GET /api/routes/search
 */
exports.searchLocation = async (req, res, next) => {
    try {
        const { query, limit, countrySet } = req.query;

        if (!query) {
            return res.status(400).json({
                status: 'error',
                message: 'Le terme de recherche est requis'
            });
        }

        const results = await tomtomService.searchLocation(query, {
            limit: limit ? parseInt(limit) : 5,
            countrySet: countrySet || 'FR'
        });

        const formattedResults = results.results.map(result => ({
            id: result.id,
            name: result.poi ? result.poi.name : result.address.freeformAddress,
            address: result.address.freeformAddress,
            position: result.position,
            type: result.type
        }));

        res.status(200).json({
            status: 'success',
            data: {
                locations: formattedResults
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Enregistre un itinéraire
 * @route POST /api/routes/save
 */
exports.saveRoute = async (req, res, next) => {
    try {
        const {
            name,
            originName,
            destinationName,
            originCoordinates,
            destinationCoordinates,
            waypoints,
            routeData,
            geometry,
            distance,
            duration,
            avoidTolls,
            routeType,
            isFavorite
        } = req.body;

        if (!name || !originName || !destinationName || !originCoordinates || !destinationCoordinates) {
            return res.status(400).json({
                status: 'error',
                message: 'Tous les champs obligatoires doivent être fournis'
            });
        }

        const pgOrigin = {
            type: 'Point',
            coordinates: originCoordinates
        };

        const pgDestination = {
            type: 'Point',
            coordinates: destinationCoordinates
        };

        let pgGeometry = null;
        if (geometry && geometry.coordinates && geometry.coordinates.length > 0) {
            pgGeometry = {
                type: 'LineString',
                coordinates: geometry.coordinates
            };
        }

        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Utilisateur non authentifié'
            });
        }

        const route = await Route.create({
            userId,
            name,
            originName,
            destinationName,
            originCoordinates: pgOrigin,
            destinationCoordinates: pgDestination,
            waypoints: waypoints || [],
            routeData: routeData || null,
            geometry: pgGeometry,
            distance: distance || null,
            duration: duration || null,
            avoidTolls: avoidTolls || false,
            routeType: routeType || 'fastest',
            isFavorite: isFavorite || false,
            lastUsed: new Date()
        });

        console.log("route", route)

        res.status(201).json({
            status: 'success',
            data: {
                route
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère tous les itinéraires de l'utilisateur
 * @route GET /api/routes/user
 */
exports.getUserRoutes = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];

        const { favorite, sort, limit, offset } = req.query;

        const where = { userId };

        if (favorite === 'true') {
            where.isFavorite = true;
        }

        let order = [['createdAt', 'DESC']];

        if (sort === 'name') {
            order = [['name', 'ASC']];
        } else if (sort === 'lastUsed') {
            order = [['lastUsed', 'DESC']];
        }

        const routes = await Route.findAndCountAll({
            where,
            order,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        });

        res.status(200).json({
            status: 'success',
            results: routes.count,
            data: {
                routes: routes.rows
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère un itinéraire spécifique
 * @route GET /api/routes/:id
 */
exports.getRouteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'];

        const route = await Route.findOne({
            where: {
                id,
                userId
            }
        });

        if (!route) {
            return res.status(404).json({
                status: 'error',
                message: 'Itinéraire non trouvé'
            });
        }

        route.lastUsed = new Date();
        route.usageCount = (route.usageCount || 0) + 1;
        await route.save();

        res.status(200).json({
            status: 'success',
            data: {
                route
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Met à jour un itinéraire
 * @route PATCH /api/routes/:id
 */
exports.updateRoute = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'];
        const { name, isFavorite } = req.body;

        const route = await Route.findOne({
            where: {
                id,
                userId
            }
        });

        if (!route) {
            return res.status(404).json({
                status: 'error',
                message: 'Itinéraire non trouvé'
            });
        }

        if (name !== undefined) route.name = name;
        if (isFavorite !== undefined) route.isFavorite = isFavorite;

        await route.save();

        res.status(200).json({
            status: 'success',
            data: {
                route
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Supprime un itinéraire
 * @route DELETE /api/routes/:id
 */
exports.deleteRoute = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'];

        const route = await Route.findOne({
            where: {
                id,
                userId
            }
        });

        if (!route) {
            return res.status(404).json({
                status: 'error',
                message: 'Itinéraire non trouvé'
            });
        }

        await route.destroy();

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Génère un code QR pour un itinéraire
 * @route GET /api/routes/qrcode/:id
 */
exports.generateQRCode = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.headers['x-user-id'];

        const route = await Route.findOne({
            where: {
                id,
                userId
            }
        });

        if (!route) {
            return res.status(404).json({
                status: 'error',
                message: 'Itinéraire non trouvé'
            });
        }

        const qrData = {
            type: 'route',
            id: route.id,
            origin: {
                name: route.originName,
                coordinates: route.originCoordinates.coordinates
            },
            destination: {
                name: route.destinationName,
                coordinates: route.destinationCoordinates.coordinates
            },
            options: {
                avoidTolls: route.avoidTolls,
                routeType: route.routeType
            }
        };

        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

        res.status(200).json({
            status: 'success',
            data: {
                qrCode
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère tous les itinéraires
 * @route GET /api/routes/all
 */
exports.getAllRoutes = async (req, res, next) => {
    try {
        const { favorite, sort, limit, offset } = req.query;

        const where = {};

        if (favorite === 'true') {
            where.isFavorite = true;
        }

        let order = [['createdAt', 'DESC']];

        if (sort === 'name') {
            order = [['name', 'ASC']];
        } else if (sort === 'lastUsed') {
            order = [['lastUsed', 'DESC']];
        }

        const routes = await Route.findAndCountAll({
            where,
            order,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        });

        res.status(200).json({
            status: 'success',
            results: routes.count,
            data: {
                routes: routes.rows
            }
        });
    } catch (error) {
        next(error);
    }
};
