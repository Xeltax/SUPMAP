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
    FormLabel,
    Radio,
    RadioGroup,
    Textarea,
    SimpleGrid,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    VStack,
} from '@chakra-ui/react';
import { SearchIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FaRoute, FaDirections, FaCar, FaExclamationTriangle, FaMapMarkerAlt, FaLayerGroup, FaSave } from 'react-icons/fa';
import Head from 'next/head';
import axios from 'axios';
import GuidanceInstruction from "@/components/GuidanceInstruction";
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import {useRouter} from "next/router";
import {FaArrowsSpin} from "react-icons/fa6";

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

interface Incident {
    id: string;
    userId: string | null;
    incidentType: string;
    coordinates: [number, number];
    description: string;
    severity: string;
    validations: number;
    invalidations: number;
    active: boolean;
    expiresAt: string;
    createdAt: string;
}

interface RouteInfo {
    distance: number;
    duration: number;
    legs: any[];
    guidance: any;
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

    // États relatifs au incident
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [incidentLocation, setIncidentLocation] = useState<[number, number] | null>(null);
    const [incidentType, setIncidentType] = useState<string>('accident');
    const [incidentDescription, setIncidentDescription] = useState<string>('');
    const [incidentSeverity, setIncidentSeverity] = useState<string>('moderate');
    const [incidentDuration, setIncidentDuration] = useState<number>(60);
    const [userIncidents, setUserIncidents] = useState<Incident[]>([]);

    // Hooks pour les drawers et modals
    const { isOpen: isRouteDrawerOpen, onOpen: onRouteDrawerOpen, onClose: onRouteDrawerClose } = useDisclosure();
    const { isOpen: isSaveModalOpen, onOpen: onSaveModalOpen, onClose: onSaveModalClose } = useDisclosure();

    // État pour sauvegarde d'itinéraire
    const [routeName, setRouteName] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);

    // Constantes
    const routeColor = 'blue';
    const startMarkerColor = '#28a745';
    const endMarkerColor = '#dc3545';
    const router = useRouter();

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
            // Récupérer les coordonnées du clic
            const coords = e.lngLat;
            const clickedCoords: [number, number] = [coords.lng, coords.lat];

            if (isRoutingMode) {
                // Mode itinéraire
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
            } else {
                // Si non en mode routage, proposer d'ajouter un incident à cet endroit
                // Afficher un petit popup de confirmation
                const popupContent = `
                <div style="text-align: center; padding: 5px; color: black;">
                    <h4>Signaler un incident ici?</h4>
                    <button id="report-incident-btn" style="background-color: #FF6B00; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-top: 5px;">
                        Signaler
                    </button>
                </div>
                `;

                const popup = new ttObject.Popup({ closeButton: true, closeOnClick: true, offset: 25 })
                    .setLngLat(clickedCoords)
                    .setHTML(popupContent)
                    .addTo(map);

                // Ajouter un écouteur d'événement au bouton dans le popup
                setTimeout(() => {
                    const reportButton = document.getElementById('report-incident-btn');
                    if (reportButton) {
                        reportButton.addEventListener('click', () => {
                            popup.remove();
                            openIncidentReportModal(clickedCoords);
                        });
                    }
                }, 100);
            }
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

    useEffect(() => {
        if (map && router.query.routeMode) {
            toggleRoutingMode()
        }
    }, [map]);

    // Set l'itinéraire si id de la route en paramètre
    useEffect(() => {
        if (map && router.query.route) {
            const routeId = router.query.route as string;
            loadRoute(routeId);
        }
    }, [map, router.query.route]);

    const loadRoute = async (routeId: string) => {
        setIsLoading(true);
        try {
            console.log("pass here")
            const response = await api.routes.getRouteById(routeId);
            if (response && response.data) {
                const route : any = response.data.route;

                console.log(route)

                const calculatedRoute = await api.routes.calculate({
                    origin : route.originCoordinates.coordinates,
                    destination : route.destinationCoordinates.coordinates,
                    routeType: route.routeType,
                    avoidTolls: route.avoidTolls,
                    traffic: true
                    })

                const tracedRoute : any = calculatedRoute.data?.routes;
                setCurrentRoute(tracedRoute[0]);

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
                    for (const leg of tracedRoute) {
                        console.log(leg.legs)
                        for (const legs of leg.legs) {
                            for (const point of legs.points) {
                                routePoints.push([point.longitude, point.latitude]);
                            }
                        }
                    }

                    setStartLocation(routePoints[0]);
                    setEndLocation(routePoints[routePoints.length - 1]);
                    const startLocation = {
                        id : `manual-${Date.now()}`,
                        name : route.originName,
                        address : route.originName,
                        position : {
                            lat: routePoints[0][1],
                            lon: routePoints[0][0]
                        }
                    }

                    const endLocation = {
                        id : `manual-${Date.now()}`,
                        name : route.originName,
                        address : route.originName,
                        position : {
                            lat: routePoints[routePoints.length - 1][1],
                            lon: routePoints[routePoints.length - 1][0]
                        }
                    }

                    setStartMarkerOnMap(startLocation);
                    setEndMarkerOnMap(endLocation);

                    addRouteToMap(routePoints);
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'itinéraire:', error);
            toast({
                title: 'Erreur de chargement',
                description: 'Impossible de charger cet itinéraire',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    }

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
        if (!map || !ttObject) return;

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

        setEndMarker(marker);
        setEndLocation(location);

        if (!startLocation) return; // On check après pour permettre une bonne mise a jour de l'état

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
                console.log("route actuel", route);
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

            // Charger les incidents TomTom
            const response = await api.traffic.getTrafficIncidents(bbox);

            // Charger les incidents signalés par les utilisateurs
            const userReportsResponse = await api.traffic.getUserReports({ bbox });

            // Vérifier les réponses et combiner les incidents
            let tomtomIncidents: any[] = [];
            if (response && response.data && response.data.incidents) {
                tomtomIncidents = response.data.incidents.incidents || [];
            }

            let userReports: Incident[] = [];
            if (userReportsResponse && userReportsResponse.data && userReportsResponse.data.incidents) {
                userReports = userReportsResponse.data.incidents;
                // Mettre à jour l'état des incidents de l'utilisateur
                setUserIncidents(userReports.filter(incident =>
                    incident.userId === (user ? user.id : null)
                ));
            }

            // Combiner les incidents
            setIncidents([...tomtomIncidents, ...userReports]);

            // Supprimer les marqueurs d'incidents existants
            const markersToRemove = document.querySelectorAll('.incident-marker');
            markersToRemove.forEach(marker => marker.remove());

            // Afficher les incidents TomTom
            if (tomtomIncidents && Array.isArray(tomtomIncidents)) {
                tomtomIncidents.forEach(incident => {
                    displayIncidentMarker(incident, false);
                });
            }

            // Afficher les incidents utilisateur
            if (userReports && Array.isArray(userReports)) {
                userReports.forEach(incident => {
                    displayIncidentMarker(incident, true);
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement des incidents:', error);
        }
    };

    const displayIncidentMarker = (incident: any, isUserReport: boolean) => {
        if (!map || !ttObject) return;

        let coordinates: [number, number] = [0, 0];
        let color = '#FFC107'; // Jaune par défaut
        let type = 'incident';
        let description = 'Incident de trafic';
        let timeInfo = '';
        let validations = 0;
        let invalidations = 0;
        let severity = '';

        if (isUserReport) {
            // Format des incidents utilisateur
            if (!incident.location || !incident.location.coordinates) return;

            coordinates = incident.location.coordinates;
            type = incident.incidentType;
            description = incident.description || 'Pas de description';
            timeInfo = new Date(incident.createdAt).toLocaleString();
            validations = incident.validations;
            invalidations = incident.invalidations;

            // Couleur selon le type d'incident
            switch (type) {
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
                case 'hazard':
                    color = '#FFC107'; // Jaune
                    break;
            }
        } else {
            // Format des incidents TomTom
            if (!incident.geometry || !incident.geometry.coordinates) return;

            // Vérifiez le type de géométrie pour déterminer comment extraire les coordonnées
            if (incident.geometry.type === "LineString") {
                // Pour une ligne, utilisez le premier point de la ligne
                const firstPoint = incident.geometry.coordinates[0];
                if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
                    coordinates = [firstPoint[0], firstPoint[1]];
                } else {
                    return; // Coordonnées invalides
                }
            } else if (incident.geometry.type === "Point") {
                // Pour un point, utilisez directement les coordonnées
                coordinates = incident.geometry.coordinates;
            } else {
                return; // Type de géométrie non pris en charge
            }

            if (incident.properties) {
                // Déterminer le type d'incident basé sur iconCategory
                if (incident.properties.iconCategory !== undefined) {
                    const iconCategory = incident.properties.iconCategory;
                    switch (iconCategory) {
                        case 1:
                            type = 'Accident';
                            color = '#DC3545'; // Rouge
                            break;
                        case 2:
                            type = 'Brouillard';
                            color = '#ADB5BD'; // Gris clair
                            break;
                        case 3:
                            type = 'Conditions dangereuses';
                            color = '#FFC107'; // Jaune
                            break;
                        case 4:
                            type = 'Pluie';
                            color = '#0DCAF0'; // Cyan
                            break;
                        case 5:
                            type = 'Verglas';
                            color = '#0DCAF0'; // Cyan
                            break;
                        case 6:
                            type = 'Embouteillage';
                            color = '#FD7E14'; // Orange
                            break;
                        case 7:
                            type = 'Voie fermée';
                            color = '#6C757D'; // Gris
                            break;
                        case 8:
                            type = 'Route fermée';
                            color = '#343A40'; // Noir
                            break;
                        case 9:
                            type = 'Travaux';
                            color = '#6610F2'; // Violet
                            break;
                        case 10:
                            type = 'Vent';
                            color = '#20C997'; // Vert teal
                            break;
                        case 11:
                            type = 'Inondation';
                            color = '#0D6EFD'; // Bleu
                            break;
                        case 14:
                            type = 'Véhicule en panne';
                            color = '#FD7E14'; // Orange
                            break;
                        default:
                            type = 'Incident';
                            color = '#FFC107'; // Jaune
                    }
                }

                // Déterminer la sévérité basée sur magnitudeOfDelay
                if (incident.properties.magnitudeOfDelay !== undefined) {
                    const magnitude = incident.properties.magnitudeOfDelay;
                    switch (magnitude) {
                        case 1:
                            severity = 'Mineur';
                            break;
                        case 2:
                            severity = 'Modéré';
                            break;
                        case 3:
                            severity = 'Majeur';
                            break;
                        case 4:
                            severity = 'Indéfini';
                            break;
                        default:
                            severity = 'Inconnu';
                    }
                }

                if (incident.properties.events && incident.properties.events.length > 0) {
                    description = incident.properties.events[0].description || type;

                    if (incident.properties.events.length > 1 && incident.properties.events[1].description) {
                        description += ` - ${incident.properties.events[1].description}`;
                    }
                }

                if (incident.properties.startTime) {
                    const startDate = new Date(incident.properties.startTime);
                    timeInfo = `Début: ${startDate.toLocaleString()}`;

                    if (incident.properties.endTime) {
                        const endDate = new Date(incident.properties.endTime);
                        timeInfo += `<br>Fin: ${endDate.toLocaleString()}`;
                    }
                }
            }
        }

        // Créer le marqueur d'incident avec une icône personnalisée basée sur le type
        const markerElement = document.createElement('div');
        markerElement.className = 'incident-marker';

        // Différentes icônes selon le type d'incident
        let svgIcon = '';
        if (type.toLowerCase().includes('accident')) {
            svgIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="${color}">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>`;
        } else if (type.toLowerCase().includes('fermée') || type.toLowerCase().includes('roadclosed')) {
            svgIcon = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" style="enable-background:new 0 0 512 512;" xml:space="preserve" width="24" height="24"><g><g><path d="M23.707 1.707c0.391 -0.391 0.391 -1.024 0 -1.414s-1.024 -0.391 -1.414 0l-2.545 2.545C17.657 1.068 14.954 0 12 0 5.373 0 0 5.373 0 12c0 2.954 1.068 5.657 2.838 7.748L0.293 22.293c-0.391 0.391 -0.391 1.024 0 1.414s1.024 0.391 1.414 0l2.545 -2.545C6.343 22.932 9.046 24 12 24c6.627 0 12 -5.373 12 -12 0 -2.954 -1.068 -5.657 -2.838 -7.748zM2 12c0 -5.523 4.477 -10 10 -10 2.401 0 4.605 0.847 6.328 2.257l-2.524 2.524c-0.37 -0.481 -0.949 -0.782 -1.585 -0.782h-4.439c-0.918 0 -1.718 0.625 -1.94 1.516l-0.621 2.485c0 -0.001 -0.22 -0.001 -0.22 -0.001 -1.104 0 -2 0.896 -2 2v3c0 0.703 0.362 1.32 0.91 1.677l-1.652 1.652C2.847 16.605 2 14.401 2 12m14.781 -0.001h0.219v3H10.415l4.445 -4.445c0.246 0.853 1.028 1.445 1.921 1.445m-9.781 3v-3h0.22c0.917 0 1.716 -0.624 1.94 -1.513l0.621 -2.487c0 0 4.439 0 4.439 0 0 0 0.028 0.114 0.073 0.294L7.586 14.999zM22 12c0 5.523 -4.477 10 -10 10 -2.401 0 -4.605 -0.847 -6.328 -2.257l1.86 -1.86A0.994 0.994 0 0 0 8 18c0.552 0 1 -0.448 1 -1v-0.001h6v0.001c0 0.552 0.448 1 1 1s1 -0.448 1 -1v-0.001c1.105 0 2 -0.895 2 -2v-3c0 -1.104 -0.895 -2 -2 -2h-0.219l-0.273 -1.093 3.235 -3.235c1.411 1.724 2.257 3.927 2.257 6.328"/></g></g></svg>`;
        } else if (type.toLowerCase().includes('travaux') || type.toLowerCase().includes('roadworks')) {
            svgIcon = `<svg width="24px" height="24px" viewBox="0 0 24 24" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
             <g transform="translate(0 -1028.4)">
              <path d="m10.286 1030.4-5.3466 18h5.3466 3.564 5.346l-5.346-18h-3.564z" fill="#ecf0f1"/>
              <path d="m4 19l-2 2h20l-2-2h-16z" transform="translate(0 1028.4)" fill="#f39c12"/>
              <path d="m10.286 1030.4-0.8913 3h5.3463l-0.891-3h-3.564zm-2.0886 7-1.1974 4h10.136l-1.198-4h-7.7406zm-2.3669 8-0.8911 3h5.3466 3.564 5.346l-0.891-3h-12.474z" fill="#e67e22"/>
              <path d="m10.286 1030.4-5.3466 18h5.3466 1.782v-18h-1.782z" fill="#bdc3c7"/>
              <path d="m10.286 1030.4-0.8913 3h2.6733v-3h-1.782zm-2.0886 7-1.1974 4h5.068v-4h-3.8706zm-2.3669 8-0.8911 3h5.3466 1.782v-3h-6.2375z" fill="#d35400"/>
              <rect height="1" width="20" y="0" x="0" fill="#e67e22"/>
             </g>
            </svg>`;
        } else if (type.toLowerCase().includes('embouteillage') || type.toLowerCase().includes('congestion')) {
            svgIcon = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" style="enable-background:new 0 0 301.397 301.397;" xml:space="preserve" width="24" height="24"><g id="XMLID_1400_"><g><g><path d="M22.861 7.417 21.736 1.487a0.621 0.621 0 0 0 -0.61 -0.505H9.727a0.621 0.621 0 0 0 -0.61 0.505l-0.957 5.044h1.264l0.817 -4.308h6.325a1.25 1.25 0 0 0 -0.112 0.517c0 0.692 0.561 1.253 1.253 1.253s1.253 -0.561 1.253 -1.253c0 -0.184 -0.04 -0.359 -0.112 -0.517h1.764l0.89 4.692c-0.161 -0.014 -0.192 -0.01 -0.743 -0.01l-0.005 -1.089c-0.004 -0.785 -0.646 -1.423 -1.43 -1.423h-3.245c-0.785 0 -1.426 0.638 -1.43 1.423l-0.004 0.758a1.672 1.672 0 0 1 0.68 0.331 1.669 1.669 0 0 1 0.591 0.987l1.054 5.555a3.743 3.743 0 0 1 0.169 0.166h2.355v1.306c0 0.828 0.671 1.499 1.499 1.499s1.499 -0.671 1.499 -1.499v-1.306h0.487c0.564 0 1.022 -0.457 1.022 -1.022v-2.957c0 -0.914 -0.449 -1.722 -1.139 -2.218m-1.825 4.462c-0.781 0 -1.415 -0.633 -1.415 -1.415q0 -0.005 0 -0.01c0.006 -0.777 0.637 -1.404 1.415 -1.404 0.781 0 1.415 0.633 1.415 1.415 0 0.776 -0.629 1.415 -1.415 1.415"/><path d="m16.008 14.017 -1.125 -5.929a0.621 0.621 0 0 0 -0.61 -0.505H2.874a0.621 0.621 0 0 0 -0.61 0.505l-1.125 5.929A2.73 2.73 0 0 0 0 16.235v2.957c0 0.564 0.457 1.022 1.022 1.022h0.487v1.306c0 0.828 0.671 1.499 1.499 1.499s1.499 -0.671 1.499 -1.499V20.213h8.135v1.306c0 0.828 0.671 1.499 1.499 1.499s1.499 -0.671 1.499 -1.499V20.213h0.487c0.564 0 1.022 -0.457 1.022 -1.022v-2.957a2.73 2.73 0 0 0 -1.139 -2.218M2.965 18.479c-0.786 0 -1.415 -0.639 -1.415 -1.415 0 -0.781 0.633 -1.415 1.415 -1.415 0.778 0 1.409 0.628 1.415 1.404q0 0.005 0 0.01c0 0.781 -0.633 1.415 -1.415 1.415m9.507 -7.486h-3.245c-0.785 0 -1.426 0.638 -1.43 1.423l-0.005 1.089c-5.509 0 -5.115 -0.005 -5.294 0.01l0.89 -4.692h6.325a1.25 1.25 0 0 0 -0.112 0.517c0 0.692 0.561 1.253 1.253 1.253s1.253 -0.561 1.253 -1.253c0 -0.184 -0.04 -0.359 -0.112 -0.517h1.764l0.89 4.692c-0.16 -0.013 -0.191 -0.01 -0.743 -0.01l-0.005 -1.089c-0.004 -0.785 -0.645 -1.423 -1.43 -1.423m1.711 7.486c-0.781 0 -1.415 -0.633 -1.415 -1.415q0 -0.005 0 -0.01c0.006 -0.777 0.637 -1.404 1.415 -1.404 0.781 0 1.415 0.633 1.415 1.415 0 0.776 -0.629 1.415 -1.415 1.415"/></g></g></g></svg>`;
        } else {
            // Icône par défaut pour les autres types
            svgIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="${color}">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>`;
        }

        markerElement.innerHTML = svgIcon;

        const marker = new ttObject.Marker({ element: markerElement })
            .setLngLat(coordinates)
            .addTo(map);

        // Ajouter un popup avec les détails de l'incident
        const popupContent = `
            <div style="max-width: 250px; color: black">
                <h3 style="font-weight: bold; margin-bottom: 8px;">${description}</h3>
                <p><strong>Type:</strong> ${type}</p>
                ${severity ? `<p><strong>Sévérité:</strong> ${severity}</p>` : ''}
                <p><strong>Date:</strong> ${timeInfo}</p>
                ${isUserReport ? `
                    <p><strong>Validations:</strong> ${validations} | <strong>Invalidations:</strong> ${invalidations}</p>
                    <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                        <button id="validate-${incident.id}" style="background-color: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Valider</button>
                        <button id="invalidate-${incident.id}" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Invalider</button>
                    </div>
                ` : ''}
            </div>
        `;

        const popup = new ttObject.Popup({ offset: 25 })
            .setHTML(popupContent);

        marker.setPopup(popup);

        // Ajouter des écouteurs d'événements pour les boutons de validation/invalidation
        if (isUserReport) {
            marker.getPopup().on('open', () => {
                setTimeout(() => {
                    const validateButton = document.getElementById(`validate-${incident.id}`);
                    const invalidateButton = document.getElementById(`invalidate-${incident.id}`);

                    if (validateButton) {
                        validateButton.addEventListener('click', async () => {
                            try {
                                await api.traffic.validateIncidentReport(incident.id);
                                toast({
                                    title: 'Incident validé',
                                    status: 'success',
                                    duration: 2000,
                                    isClosable: true,
                                });
                                loadIncidents(); // Recharger les incidents pour mettre à jour les compteurs
                            } catch (error) {
                                console.error('Erreur lors de la validation:', error);
                            }
                        });
                    }

                    if (invalidateButton) {
                        invalidateButton.addEventListener('click', async () => {
                            try {
                                await api.traffic.invalidateIncidentReport(incident.id);
                                toast({
                                    title: 'Incident invalidé',
                                    status: 'success',
                                    duration: 2000,
                                    isClosable: true,
                                });
                                loadIncidents(); // Recharger les incidents pour mettre à jour les compteurs
                            } catch (error) {
                                console.error('Erreur lors de l\'invalidation:', error);
                            }
                        });
                    }
                }, 100);
            });
        }
    };

    useEffect(() => {
        if (map) {
            loadIncidents();

            // Recharger les incidents lors du déplacement de la carte
            map.on('moveend', () => {
                loadIncidents()
            });

            return () => {
                map.off('moveend', loadIncidents);
            };
        }
    }, [map]);

    // Activer/désactiver le mode d'itinéraire
    const toggleRoutingMode = () => {
        // Si on désactive le mode itinéraire
        if (isRoutingMode) {
            // Nettoyer les marqueurs et l'itinéraire
            cleanupRouting();
        } else {
            // Activer le mode itinéraire
            setRoutingStep('start');
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
        const existingMarkers = document.querySelectorAll('.end-marker');
        existingMarkers.forEach(marker => {
            if (marker.parentNode) {
                marker.parentNode.removeChild(marker);
            }
        });

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
    const openIncidentReportModal = (location: [number, number]) => {
        setIncidentLocation(location);
        setIncidentType('accident');
        setIncidentDescription('');
        setIncidentSeverity('moderate');
        setIncidentDuration(60);
        setIsIncidentModalOpen(true);
    };

    const reportIncident = async () => {
        if (!incidentLocation || !incidentType) return;

        setIsLoading(true);
        try {
            const response = await api.traffic.reportTrafficIncident({
                incidentType,
                coordinates: incidentLocation,
                description: incidentDescription,
                severity: incidentSeverity,
                durationMinutes: incidentDuration
            });

            if (response && response.data && response.data.incident) {
                toast({
                    title: 'Incident signalé',
                    description: 'Votre signalement a été enregistré avec succès',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });

                // Fermer le modal et recharger les incidents
                setIsIncidentModalOpen(false);
                loadIncidents();

                // Ajouter le nouvel incident à la liste des incidents de l'utilisateur
                const newIncident = response.data.incident;
                setUserIncidents(prev => [newIncident, ...prev]);
            }
        } catch (error) {
            console.error('Erreur lors du signalement de l\'incident:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de signaler l\'incident',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
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
                                        <Flex align="center" gap={2} mt={2}>
                                            <Button
                                                mt={4}
                                                colorScheme="blue"
                                                leftIcon={<FaArrowsSpin />}
                                                onClick={() => {
                                                    if (!startLocation || !endLocation) return;
                                                    calculateRouteWithLocations(startLocation, endLocation)
                                                }}
                                                isLoading={isLoading}
                                                width="full"
                                            >
                                                Recalculer
                                            </Button>
                                            <Button
                                                mt={4}
                                                colorScheme="green"
                                                leftIcon={<FaSave />}
                                                onClick={onSaveModalOpen}
                                                width="full"
                                            >
                                                Sauvegarder
                                            </Button>
                                        </Flex>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Text fontWeight="bold" mb={2}>Instructions</Text>
                                        <Stack spacing={3}>
                                            {currentRoute.guidance.instructions.map((instruction : any, index : number) => (
                                                <Flex
                                                    key={`${index}`}
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
                                                        {index + 1}
                                                    </Box>
                                                    <Box flex="1">
                                                        <GuidanceInstruction
                                                            key={instruction.id}
                                                            instruction={instruction.text}
                                                        />
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
                                            ))}
                                        </Stack>
                                    </Box>
                                </Stack>
                            )}
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>

                <Modal isOpen={isIncidentModalOpen} onClose={() => setIsIncidentModalOpen(false)}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Signaler un incident</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <VStack spacing={4} align="stretch">
                                <FormControl>
                                    <FormLabel>Type d'incident</FormLabel>
                                    <RadioGroup value={incidentType} onChange={setIncidentType}>
                                        <SimpleGrid columns={2} spacing={2}>
                                            <Radio value="accident">Accident</Radio>
                                            <Radio value="congestion">Embouteillage</Radio>
                                            <Radio value="roadClosed">Route fermée</Radio>
                                            <Radio value="roadworks">Travaux</Radio>
                                            <Radio value="police">Contrôle policier</Radio>
                                            <Radio value="hazard">Obstacle</Radio>
                                        </SimpleGrid>
                                    </RadioGroup>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Description (optionnelle)</FormLabel>
                                    <Textarea
                                        placeholder="Décrivez l'incident..."
                                        value={incidentDescription}
                                        onChange={(e) => setIncidentDescription(e.target.value)}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Gravité</FormLabel>
                                    <RadioGroup value={incidentSeverity} onChange={setIncidentSeverity}>
                                        <SimpleGrid columns={2} spacing={2}>
                                            <Radio value="low">Faible</Radio>
                                            <Radio value="moderate">Modérée</Radio>
                                            <Radio value="high">Élevée</Radio>
                                            <Radio value="severe">Sévère</Radio>
                                        </SimpleGrid>
                                    </RadioGroup>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Durée estimée (minutes)</FormLabel>
                                    <NumberInput
                                        min={15}
                                        max={240}
                                        step={15}
                                        value={incidentDuration}
                                        onChange={(_, value) => setIncidentDuration(value)}
                                    >
                                        <NumberInputField />
                                        <NumberInputStepper>
                                            <NumberIncrementStepper />
                                            <NumberDecrementStepper />
                                        </NumberInputStepper>
                                    </NumberInput>
                                </FormControl>
                            </VStack>
                        </ModalBody>

                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={() => setIsIncidentModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button
                                colorScheme="orange"
                                onClick={reportIncident}
                                isLoading={isLoading}
                            >
                                Signaler
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

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