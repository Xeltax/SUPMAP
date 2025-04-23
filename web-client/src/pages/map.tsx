import React, { useState, useEffect, useRef } from 'react';
import { GetServerSideProps } from 'next';
import {
    Box,
    Button,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    Stack,
    Text,
    IconButton,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    useDisclosure,
    useToast,
    useColorModeValue,
    Select,
    Checkbox,
    Badge,
    Grid,
    GridItem,
    Divider,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    FormControl,
    FormLabel
} from '@chakra-ui/react';
import { SearchIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FaRoute, FaDirections, FaCar, FaExclamationTriangle, FaMapMarkerAlt, FaLayerGroup, FaSave } from 'react-icons/fa';
import Head from 'next/head';
import axios from 'axios';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface MapPageProps {
    apiKey: string;
}

interface Location {
    id: string;
    name: string;
    address: string;
    position: {
        lat: number;
        lon: number;
    };
}

interface RouteInfo {
    distance: number;
    duration: number;
    legs: any[];
}

const Map = ({ apiKey }: MapPageProps) => {
    // Hooks de contexte
    const { isAuthenticated, user } = useAuth();
    const toast = useToast();

    // Hooks de Chakra UI pour les couleurs et styles
    const bgColor = useColorModeValue('white', 'gray.800');
    const bgColorSecondary = useColorModeValue('gray.50', 'gray.700');
    const primaryColor = useColorModeValue('blue.500', 'blue.300');
    const mapStyle = useColorModeValue('basic-main', 'basic-night');
    const currentMapStyle = useColorModeValue('basic-main', 'basic-night');

    // Références
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // États relatifs à la carte
    const [map, setMap] = useState<any>(null);
    const [ttObject, setTtObject] = useState<any>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    // États relatifs à la recherche
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // États relatifs à l'itinéraire
    const [startLocation, setStartLocation] = useState<Location | null>(null);
    const [endLocation, setEndLocation] = useState<Location | null>(null);
    const [startMarker, setStartMarker] = useState<any>(null);
    const [endMarker, setEndMarker] = useState<any>(null);
    const [currentRoute, setCurrentRoute] = useState<RouteInfo | null>(null);
    const [isRoutingMode, setIsRoutingMode] = useState(false);
    const [routingStep, setRoutingStep] = useState<'start' | 'end'>('start');
    const [avoidTolls, setAvoidTolls] = useState(false);
    const [routeType, setRouteType] = useState('fastest');
    const [incidents, setIncidents] = useState<any[]>([]);

    // Hooks pour les drawers et modals
    const { isOpen: isRouteDrawerOpen, onOpen: onRouteDrawerOpen, onClose: onRouteDrawerClose } = useDisclosure();
    const { isOpen: isLayerDrawerOpen, onOpen: onLayerDrawerOpen, onClose: onLayerDrawerClose } = useDisclosure();
    const { isOpen: isSaveModalOpen, onOpen: onSaveModalOpen, onClose: onSaveModalClose } = useDisclosure();

    // État pour sauvegarde d'itinéraire
    const [routeName, setRouteName] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);

    // Constantes
    const routeColor = 'blue';
    const startMarkerColor = '#28a745';
    const endMarkerColor = '#dc3545';

    // Initialiser la carte TomTom
    useEffect(() => {
        if (mapContainerRef.current && !map && typeof window !== 'undefined') {
            // Dynamiquement importer le SDK TomTom
            import('@tomtom-international/web-sdk-maps').then(tt => {
                console.log('TomTom SDK loaded');

                // Sauvegarder l'objet TomTom pour une utilisation ultérieure
                setTtObject(tt);

                const ttMap = tt.map({
                    key: apiKey,
                    container: mapContainerRef.current!,
                    center: [2.3522, 46.8566], // Centre de la France
                    zoom: 5,
                    language: 'fr-FR',
                });

                // Ajouter les contrôles à la carte
                ttMap.addControl(new tt.NavigationControl());
                ttMap.addControl(new tt.FullscreenControl());
                ttMap.addControl(new tt.GeolocateControl({
                    positionOptions: {
                        enableHighAccuracy: true
                    },
                    trackUserLocation: true
                }));

                setMap(ttMap);

                // Nettoyer la carte lors du démontage du composant
                return () => {
                    ttMap.remove();
                };
            }).catch((error) => {
                console.log('Erreur lors du chargement du SDK TomTom:', error);
                toast({
                    title: "Erreur de chargement",
                    description: "Impossible de charger la carte TomTom",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            });
        }
    }, [apiKey, mapStyle, toast]);

    // Configurer le clic sur la carte pour le mode itinéraire
    useEffect(() => {
        if (!map || !ttObject) return;

        // Fonction de gestion du clic
        const handleMapClick = (e: any) => {
            if (!isRoutingMode) return;

            // Récupérer les coordonnées du clic
            const coords = e.lngLat;

            // Convertir les coordonnées en adresse (reverse geocoding)
            import('@tomtom-international/web-sdk-services').then(ttServices => {
                const reverseGeocodingOptions = {
                    key: apiKey,
                    position: coords
                };

                ttServices.services.reverseGeocode(reverseGeocodingOptions)
                    .then(response => {
                        if (response && response.addresses && response.addresses.length > 0) {
                            const address = response.addresses[0];
                            const location = {
                                id: `manual-${Date.now()}`,
                                name: address.address.freeformAddress || 'Point sélectionné',
                                address: address.address.freeformAddress || '',
                                position: {
                                    lat: coords.lat,
                                    lon: coords.lng
                                }
                            };

                            // Utiliser l'étape actuelle pour déterminer où placer le point
                            if (routingStep === 'start') {
                                setStartMarkerOnMap(location);
                                setRoutingStep('end');
                            } else {
                                setEndMarkerOnMap(location);
                                // Rester sur l'étape end pour permettre de changer la destination
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Erreur lors du reverse geocoding:', error);
                        toast({
                            title: 'Erreur',
                            description: 'Impossible de récupérer l\'adresse pour ce point',
                            status: 'error',
                            duration: 3000,
                            isClosable: true,
                        });
                    });
            });
        };

        // Supprimer l'ancien écouteur et ajouter le nouveau
        map.off('click');
        map.on('click', handleMapClick);

        // Nettoyage à la désactivation
        return () => {
            if (map) {
                map.off('click', handleMapClick);
            }
        };
    }, [map, ttObject, isRoutingMode, routingStep, apiKey, toast]);

    // Géolocaliser l'utilisateur au chargement
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
                    setUserLocation(coords);

                    if (map) {
                        map.flyTo({
                            center: coords,
                            zoom: 13
                        });
                    }
                },
                (error) => {
                    console.error('Erreur de géolocalisation:', error);
                }
            );
        }
    }, [map]);

    // Rechercher des lieux
    const searchLocations = async () => {
        if (!searchQuery) return;

        setIsLoading(true);
        try {
            const response = await api.routes.search(searchQuery);
            if (response && response.data && response.data.locations) {
                setSearchResults(response.data.locations);
            }
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            toast({
                title: 'Erreur de recherche',
                description: 'Impossible de trouver des lieux correspondants',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction pour placer le marqueur de départ sur la carte
    const setStartMarkerOnMap = (location: Location) => {
        if (!map || !ttObject) return;

        // Supprimer le marqueur existant s'il y en a un
        if (startMarker) {
            startMarker.remove();
        }

        // Créer le nouveau marqueur
        const markerElement = document.createElement('div');
        markerElement.className = 'start-marker';
        markerElement.innerHTML = `<svg width="30" height="30" viewBox="0 0 24 24" fill="${startMarkerColor}">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>`;

        const marker = new ttObject.Marker({ element: markerElement })
            .setLngLat([location.position.lon, location.position.lat])
            .addTo(map);

        // Mettre à jour l'état
        setStartMarker(marker);
        setStartLocation(location);

        // Ajuster la vue pour voir le point
        map.flyTo({
            center: [location.position.lon, location.position.lat],
            zoom: 13
        });
    };

    // Fonction pour placer le marqueur de destination sur la carte
    const setEndMarkerOnMap = (location: Location) => {
        if (!map || !ttObject || !startLocation) return;

        if (endMarker) {
            const existingMarkers = document.querySelectorAll('.end-marker');
            existingMarkers.forEach(marker => {
                if (marker.parentNode) {
                    marker.parentNode.removeChild(marker);
                }
            });
        }

        // Créer le nouveau marqueur
        const markerElement = document.createElement('div');
        markerElement.className = 'end-marker';
        markerElement.innerHTML = `<svg width="30" height="30" viewBox="0 0 24 24" fill="${endMarkerColor}">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`;

        const marker = new ttObject.Marker({ element: markerElement })
            .setLngLat([location.position.lon, location.position.lat])
            .addTo(map);

        // Mettre à jour l'état
        setEndMarker(marker);
        setEndLocation(location);

        // Au lieu d'utiliser setTimeout, passons directement les valeurs actuelles
        // à une fonction qui calculera l'itinéraire
        calculateRouteWithLocations(startLocation, location);
    };

    // Sélectionner un lieu à partir de la recherche
    const selectLocation = (location: Location) => {
        if (isRoutingMode) {
            if (routingStep === 'start') {
                setStartMarkerOnMap(location);
                setRoutingStep('end');
            } else {
                setEndMarkerOnMap(location);
            }
        } else {
            // Si pas en mode itinéraire, juste centrer la carte sur le lieu
            if (map) {
                map.flyTo({
                    center: [location.position.lon, location.position.lat],
                    zoom: 13
                });
            }
        }

        // Effacer les résultats de recherche
        setSearchResults([]);
        setSearchQuery('');
    };

    // Calculer l'itinéraire
    const calculateRouteWithLocations = async (start: Location, end: Location) => {
        if (!start || !end || !map) {
            console.log("Can't calculate route: missing locations or map");
            return;
        }

        setIsLoading(true);
        try {
            console.log("Calculating route between", start, end);

            const response = await api.routes.calculate({
                origin: [start.position.lon, start.position.lat],
                destination: [end.position.lon, end.position.lat],
                routeType,
                avoidTolls,
                traffic: true
            });

            if (response && response.data && response.data.routes && response.data.routes.length > 0) {
                const route = response.data.routes[0];
                setCurrentRoute(route);

                // Afficher l'itinéraire sur la carte
                if (map && ttObject) {
                    // Supprimer les itinéraires existants
                    if (map.getLayer('route')) {
                        map.removeLayer('route');
                    }
                    if (map.getSource('route')) {
                        map.removeSource('route');
                    }

                    // Créer une ligne à partir des points de l'itinéraire
                    const routePoints: any = [];
                    for (const leg of route.legs) {
                        for (const point of leg.points) {
                            routePoints.push([point.longitude, point.latitude]);
                        }
                    }

                    // Solution plus fiable: toujours utiliser un événement 'idle'
                    // Cet événement est déclenché lorsque la carte a terminé tous les rendus
                    const addRouteWhenReady = () => {
                        addRouteToMap(routePoints);
                        // Nettoyer l'écouteur après son utilisation
                        map.off('idle', addRouteWhenReady);
                    };

                    // S'assurer que nous attendons que la carte soit prête
                    if (map.isStyleLoaded()) {
                        addRouteToMap(routePoints);
                    } else {
                        map.on('idle', addRouteWhenReady);
                    }
                }

                // Ouvrir le panneau d'itinéraire
                onRouteDrawerOpen();
            } else {
                toast({
                    title: 'Aucun itinéraire trouvé',
                    description: 'Aucun itinéraire n\'a pu être trouvé entre ces deux points',
                    status: 'warning',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error('Erreur lors du calcul de l\'itinéraire:', error);
            toast({
                title: 'Erreur de calcul d\'itinéraire',
                description: 'Impossible de calculer l\'itinéraire',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction pour ajouter l'itinéraire à la carte
    const addRouteToMap = (routePoints: any) => {
        console.log("map", map);
        console.log("ttObject", ttObject);
        console.log("routePoints", routePoints);
        if (!map || !ttObject || !routePoints || routePoints.length === 0) return;

        map.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: routePoints
                }
            }
        });

        map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': routeColor,
                'line-width': 6
            }
        });

        // Ajuster la vue pour voir l'itinéraire complet
        const bounds = new ttObject.LngLatBounds();
        routePoints.forEach((point: any) => {
            bounds.extend(point);
        });

        map.fitBounds(bounds, { padding: 60 });
    };

    // Charger les incidents sur la carte
    const loadIncidents = async () => {
        if (!map || !ttObject) return;

        try {
            // Obtenir les limites de la carte visible
            const bounds = map.getBounds();
            const bbox = [
                bounds.getWest(),
                bounds.getSouth(),
                bounds.getEast(),
                bounds.getNorth()
            ].join(',');

            const response = await api.traffic.getTrafficIncidents(bbox);

            // Vérifier que response.data existe avant d'y accéder
            if (response && response.data && response.data.incidents) {
                setIncidents(response.data.incidents.incidents || []);

                // Supprimer les marqueurs d'incidents existants
                const markersToRemove = document.querySelectorAll('.incident-marker');
                markersToRemove.forEach(marker => marker.remove());

                // Vérifier que les incidents existent avant de les parcourir
                if (response.data.incidents.incidents && Array.isArray(response.data.incidents.incidents)) {
                    response.data.incidents.incidents.forEach((incident: any) => {
                        let color = '#FFC107'; // Jaune par défaut

                        // Couleur selon le type d'incident
                        if (incident.properties && incident.properties.iconCategory) {
                            switch (incident.properties.iconCategory) {
                                case 'accident':
                                    color = '#DC3545'; // Rouge
                                    break;
                                case 'congestion':
                                    color = '#FD7E14'; // Orange
                                    break;
                                case 'roadClosed':
                                    color = '#6C757D'; // Gris
                                    break;
                                case 'roadworks':
                                    color = '#6610F2'; // Violet
                                    break;
                                case 'police':
                                    color = '#0D6EFD'; // Bleu
                                    break;
                            }
                        }

                        // Créer le marqueur d'incident
                        if (incident.geometry && incident.geometry.coordinates) {
                            const markerElement = document.createElement('div');
                            markerElement.className = 'incident-marker';
                            markerElement.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="${color}">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>`;

                            const marker = new ttObject.Marker({ element: markerElement })
                                .setLngLat(incident.geometry.coordinates)
                                .addTo(map);

                            // Ajouter un popup avec les détails de l'incident
                            if (incident.properties && incident.properties.events && incident.properties.events.length > 0) {
                                const popup = new ttObject.Popup({ offset: 25 }).setHTML(`
                                    <div>
                                        <h3 style="font-weight: bold;">${incident.properties.events[0].description}</h3>
                                        <p>Type: ${incident.properties.iconCategory}</p>
                                        ${incident.properties.startTime ? `<p>Depuis: ${new Date(incident.properties.startTime).toLocaleString()}</p>` : ''}
                                    </div>
                                `);

                                marker.setPopup(popup);
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des incidents:', error);
        }
    };

    // Activer/désactiver le mode d'itinéraire
    const toggleRoutingMode = () => {
        // Si on désactive le mode itinéraire
        if (isRoutingMode) {
            // Nettoyer les marqueurs et l'itinéraire
            cleanupRouting();
        } else {
            // Activer le mode itinéraire
            setRoutingStep('start');
            toast({
                title: 'Mode itinéraire activé',
                description: 'Cliquez sur la carte pour définir le point de départ',
                status: 'info',
                duration: 3000,
                isClosable: true,
            });
        }

        // Basculer le mode
        setIsRoutingMode(!isRoutingMode);
    };

    // Fonction pour nettoyer les marqueurs et l'itinéraire
    const cleanupRouting = () => {
        // Supprimer les marqueurs
        if (startMarker) {
            startMarker.remove();
            setStartMarker(null);
        }
        if (endMarker) {
            endMarker.remove();
            setEndMarker(null);
        }

        // Réinitialiser les emplacements
        setStartLocation(null);
        setEndLocation(null);
        setCurrentRoute(null);

        // Supprimer l'itinéraire de la carte
        if (map) {
            if (map.getLayer('route')) {
                map.removeLayer('route');
            }
            if (map.getSource('route')) {
                map.removeSource('route');
            }
        }

        // Fermer le panneau d'itinéraire s'il est ouvert
        onRouteDrawerClose();
    };

    // Signaler un incident
    const reportIncident = (type: string, location: [number, number]) => {
        // Implémenter la logique de signalement d'incident
        toast({
            title: "Fonctionnalité à venir",
            description: "Le signalement d'incidents sera disponible prochainement",
            status: "info",
            duration: 3000,
            isClosable: true,
        });
    };

    // Sauvegarder l'itinéraire
    const saveRoute = async () => {
        if (!isAuthenticated || !currentRoute || !startLocation || !endLocation) return;

        try {
            await api.routes.save({
                name: routeName,
                originName: startLocation.name,
                destinationName: endLocation.name,
                originCoordinates: [startLocation.position.lon, startLocation.position.lat],
                destinationCoordinates: [endLocation.position.lon, endLocation.position.lat],
                distance: currentRoute.distance,
                duration: currentRoute.duration,
                avoidTolls,
                routeType,
                isFavorite
            });

            toast({
                title: 'Itinéraire sauvegardé',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onSaveModalClose();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'itinéraire:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de sauvegarder l\'itinéraire',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // Texte d'aide selon l'étape
    const getRoutingHelperText = () => {
        if (!isRoutingMode) return "Rechercher un lieu...";
        if (routingStep === 'start') return "Point de départ";
        return "Destination";
    };

    return (
        <>
            <Head>
                <link rel='stylesheet' href='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.23.0/maps/maps.css' />
            </Head>

            <Box position="relative" h="calc(100vh - 60px)">
                {/* Barre de recherche */}
                <Box
                    position="absolute"
                    top={4}
                    left="50%"
                    transform="translateX(-50%)"
                    width={{ base: "90%", md: "50%" }}
                    zIndex={1}
                    bg={bgColor}
                    borderRadius="md"
                    boxShadow="lg"
                    p={2}
                >
                    <InputGroup>
                        <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.300" />
                        </InputLeftElement>
                        <Input
                            placeholder={getRoutingHelperText()}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchLocations()}
                        />
                        <Button ml={2} colorScheme="blue" onClick={searchLocations} isLoading={isLoading}>
                            Rechercher
                        </Button>
                    </InputGroup>

                    {/* Résultats de recherche */}
                    {searchResults.length > 0 && (
                        <Box
                            mt={2}
                            bg={bgColor}
                            borderRadius="md"
                            boxShadow="md"
                            maxH="200px"
                            overflowY="auto"
                        >
                            {searchResults.map((location) => (
                                <Flex
                                    key={location.id}
                                    p={2}
                                    _hover={{ bg: bgColorSecondary }}
                                    cursor="pointer"
                                    align="center"
                                    onClick={() => selectLocation(location)}
                                >
                                    <Box mr={2}>
                                        <FaMapMarkerAlt />
                                    </Box>
                                    <Box flex="1">
                                        <Text fontWeight="bold">{location.name}</Text>
                                        <Text fontSize="sm" color="gray.500">{location.address}</Text>
                                    </Box>
                                    <ChevronRightIcon />
                                </Flex>
                            ))}
                        </Box>
                    )}
                </Box>

                {/* Info sur l'étape de routage */}
                {isRoutingMode && (
                    <Box
                        position="absolute"
                        top={16}
                        left="50%"
                        transform="translateX(-50%)"
                        bg={primaryColor}
                        color="white"
                        py={2}
                        px={4}
                        borderRadius="md"
                        mt={4}
                        zIndex={1}
                        textAlign="center"
                    >
                        {routingStep === 'start'
                            ? "Cliquez sur la carte ou recherchez pour définir le point de départ"
                            : "Cliquez sur la carte ou recherchez pour définir la destination"}
                    </Box>
                )}

                {/* Boutons de contrôle */}
                <Flex
                    position="absolute"
                    bottom={4}
                    left={4}
                    zIndex={1}
                    direction="column"
                >
                    <IconButton
                        aria-label="Mode Itinéraire"
                        icon={<FaDirections />}
                        colorScheme={isRoutingMode ? "blue" : "gray"}
                        size="lg"
                        mb={2}
                        onClick={toggleRoutingMode}
                    />
                    <IconButton
                        aria-label="Afficher les calques"
                        icon={<FaLayerGroup />}
                        colorScheme="gray"
                        size="lg"
                        mb={2}
                        onClick={onLayerDrawerOpen}
                    />
                    <IconButton
                        aria-label="Signaler un incident"
                        icon={<FaExclamationTriangle />}
                        colorScheme="orange"
                        size="lg"
                        disabled={!userLocation}
                        onClick={() => map && userLocation && reportIncident('accident', userLocation)}
                    />
                </Flex>

                {/* Bouton pour sauvegarder l'itinéraire */}
                {currentRoute && isAuthenticated && (
                    <Button
                        position="absolute"
                        bottom={4}
                        right={4}
                        zIndex={1}
                        colorScheme="green"
                        leftIcon={<FaSave />}
                        onClick={onSaveModalOpen}
                    >
                        Sauvegarder
                    </Button>
                )}

                {/* Conteneur de la carte */}
                <Box ref={mapContainerRef} h="100%" />

                {/* Panneau d'itinéraire */}
                <Drawer
                    isOpen={isRouteDrawerOpen}
                    placement="right"
                    onClose={onRouteDrawerClose}
                    size="md"
                >
                    <DrawerOverlay />
                    <DrawerContent>
                        <DrawerCloseButton />
                        <DrawerHeader borderBottomWidth="1px">
                            Détails de l'itinéraire
                        </DrawerHeader>

                        <DrawerBody>
                            {currentRoute && (
                                <Stack spacing={4}>
                                    <Flex justify="space-between" align="center">
                                        <Box>
                                            <Text fontSize="sm" color="gray.500">Distance</Text>
                                            <Text fontWeight="bold">{Math.round(currentRoute.distance/1000)} km</Text>
                                        </Box>
                                        <Box>
                                            <Text fontSize="sm" color="gray.500">Durée</Text>
                                            <Text fontWeight="bold">{Math.floor(currentRoute.duration/60)} min</Text>
                                        </Box>
                                        <Box>
                                            <Text fontSize="sm" color="gray.500">Arrivée estimée</Text>
                                            <Text fontWeight="bold">
                                                {new Date(Date.now() + currentRoute.duration * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </Text>
                                        </Box>
                                    </Flex>

                                    <Divider />

                                    <Box>
                                        <Text fontWeight="bold" mb={2}>Options d'itinéraire</Text>
                                        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                            <GridItem>
                                                <Select
                                                    value={routeType}
                                                    onChange={(e) => setRouteType(e.target.value)}
                                                >
                                                    <option value="fastest">Le plus rapide</option>
                                                    <option value="shortest">Le plus court</option>
                                                    <option value="eco">Économique</option>
                                                    <option value="thrilling">Pittoresque</option>
                                                </Select>
                                            </GridItem>
                                            <GridItem>
                                                <Checkbox
                                                    isChecked={avoidTolls}
                                                    onChange={(e) => setAvoidTolls(e.target.checked)}
                                                >
                                                    Éviter les péages
                                                </Checkbox>
                                            </GridItem>
                                        </Grid>
                                        <Button
                                            mt={4}
                                            colorScheme="blue"
                                            onClick={() => {
                                                if (!startLocation || !endLocation) return;
                                                calculateRouteWithLocations(startLocation, endLocation)
                                            }}
                                            isLoading={isLoading}
                                            width="full"
                                        >
                                            Recalculer
                                        </Button>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Text fontWeight="bold" mb={2}>Instructions</Text>
                                        <Stack spacing={3}>
                                            {currentRoute.legs.map((leg, legIndex) => (
                                                leg.instructions && leg.instructions.map((instruction: any, i: any) => (
                                                    <Flex
                                                        key={`${legIndex}-${i}`}
                                                        p={2}
                                                        borderRadius="md"
                                                        bg={bgColorSecondary}
                                                        align="center"
                                                    >
                                                        <Box
                                                            mr={3}
                                                            bg={primaryColor}
                                                            color="white"
                                                            borderRadius="full"
                                                            w="30px"
                                                            h="30px"
                                                            display="flex"
                                                            alignItems="center"
                                                            justifyContent="center"
                                                        >
                                                            {i + 1}
                                                        </Box>
                                                        <Box flex="1">
                                                            <Text>{instruction.text}</Text>
                                                            {instruction.street && (
                                                                <Text fontSize="sm" color="gray.500">
                                                                    {instruction.street}
                                                                </Text>
                                                            )}
                                                        </Box>
                                                        <Text fontSize="sm" color="gray.500">
                                                            {Math.round(instruction.routeOffsetInMeters/1000)} km
                                                        </Text>
                                                    </Flex>
                                                ))
                                            ))}
                                        </Stack>
                                    </Box>
                                </Stack>
                            )}
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>

                {/* Panneau des calques */}
                <Drawer
                    isOpen={isLayerDrawerOpen}
                    placement="left"
                    onClose={onLayerDrawerClose}
                    size="xs"
                >
                    <DrawerOverlay />
                    <DrawerContent>
                        <DrawerCloseButton />
                        <DrawerHeader borderBottomWidth="1px">
                            Calques
                        </DrawerHeader>

                        <DrawerBody>
                            <Stack spacing={4}>
                                <Box>
                                    <Text fontWeight="bold" mb={2}>Type de carte</Text>
                                    <Select
                                        value={currentMapStyle}
                                        onChange={(e) => map && map.setStyle(e.target.value)}
                                    >
                                        <option value="basic-main">Standard</option>
                                        <option value="basic-night">Nuit</option>
                                        <option value="hybrid-main">Satellite</option>
                                    </Select>
                                </Box>

                                <Divider />

                                <Box>
                                    <Text fontWeight="bold" mb={2}>Afficher</Text>
                                    <Stack spacing={2}>
                                        <Checkbox defaultChecked onChange={() => loadIncidents()}>
                                            Incidents de circulation
                                        </Checkbox>
                                        <Checkbox defaultChecked>
                                            Trafic en temps réel
                                        </Checkbox>
                                        <Checkbox defaultChecked>
                                            Transports en commun
                                        </Checkbox>
                                    </Stack>
                                </Box>
                            </Stack>
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>

                {/* Modal pour sauvegarder l'itinéraire */}
                <Modal isOpen={isSaveModalOpen} onClose={onSaveModalClose}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Sauvegarder l'itinéraire</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <FormControl mb={4}>
                                <FormLabel>Nom de l'itinéraire</FormLabel>
                                <Input
                                    placeholder="Ex: Trajet domicile-travail"
                                    value={routeName}
                                    onChange={(e) => setRouteName(e.target.value)}
                                />
                            </FormControl>
                            <Checkbox
                                isChecked={isFavorite}
                                onChange={(e) => setIsFavorite(e.target.checked)}
                            >
                                Ajouter aux favoris
                            </Checkbox>
                        </ModalBody>

                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={onSaveModalClose}>
                                Annuler
                            </Button>
                            <Button
                                colorScheme="blue"
                                onClick={saveRoute}
                                isDisabled={!routeName.trim()}
                            >
                                Sauvegarder
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Box>
        </>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    // Récupérer le token depuis les cookies pour vérifier l'authentification
    // (optionnel car la carte peut être accessible sans authentification)
    const { req } = context;
    const token = req.cookies.token;

    return {
        props: {
            apiKey: process.env.TOMTOM_API_KEY || '',
        },
    };
};

export default Map;