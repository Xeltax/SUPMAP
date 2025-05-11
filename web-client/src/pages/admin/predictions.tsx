import React, {useEffect, useRef, useState} from 'react';
import {GetServerSideProps} from 'next';
import {
    Box,
    useColorModeValue,
    useToast,
} from '@chakra-ui/react';
import Head from 'next/head';
import {useAuth} from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import { FaCar, FaExclamationCircle } from 'react-icons/fa';
import { renderToStaticMarkup } from 'react-dom/server';

interface MapPageProps {
    apiKey: string;
    initialIncidents: TrafficIncident[];
}

interface TrafficIncident {
    id: string;
    incidentType: string;
    description: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
        crs?: {
            type: string;
            properties: {
                name: string;
            };
        };
    };
    severity: 'low' | 'moderate' | 'high' | 'severe';
    createdAt: string;
    city?: string;
    userId: string;
    validations: number;
    invalidations: number;
    active: boolean;
    expiresAt: string;
    updatedAt: string;
}

const PredictionsPage = ({ apiKey, initialIncidents }: MapPageProps) => {
    // Hooks de contexte
    const { isAuthenticated, user } = useAuth();
    const toast = useToast();

    // Hooks de Chakra UI pour les couleurs et styles
    const mapStyle = useColorModeValue('basic-main', 'basic-night');

    // Références
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // États relatifs à la carte
    const [map, setMap] = useState<any>(null);
    const [ttObject, setTtObject] = useState<any>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [incidents, setIncidents] = useState<TrafficIncident[]>(initialIncidents || []);

    // Initialiser la carte TomTom
    useEffect(() => {
        if (mapContainerRef.current && !map && typeof window !== 'undefined') {
            // Charger dynamiquement le SDK TomTom
            import('@tomtom-international/web-sdk-maps').then(tt => {
                console.log('SDK TomTom chargé');

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

    // Charger les incidents sur la carte
    const loadIncidents = () => {
        if (!map || !ttObject) return;

        console.log('Chargement des incidents:', incidents);

        // Supprimer les marqueurs existants
        const markersToRemove = document.querySelectorAll('.incident-marker');
        markersToRemove.forEach(marker => marker.remove());

        // Filtrer les incidents (uniquement police et embouteillages)
        const filteredIncidents = incidents.filter(incident => {
            console.log('Traitement de l\'incident:', incident);
            return incident && incident.incidentType && (incident.incidentType === 'congestion' || incident.incidentType === 'police');
        });

        console.log('Incidents filtrés:', filteredIncidents);

        // Afficher les incidents sur la carte
        filteredIncidents.forEach(incident => {
            try {
                // Vérifier et formater les coordonnées
                let coordinates: [number, number] | null = null;
                
                console.log('Données de l\'incident:', incident);
                
                // Extraire les coordonnées du format GeoJSON Point
                if (incident.location?.type === 'Point' && Array.isArray(incident.location.coordinates)) {
                    coordinates = incident.location.coordinates;
                }

                if (!coordinates) {
                    console.error('Aucune coordonnée valide trouvée pour l\'incident:', incident);
                    return;
                }

                console.log('Coordonnées traitées:', coordinates);

                const markerElement = document.createElement('div');
                markerElement.className = 'incident-marker';
                markerElement.style.width = '30px';
                markerElement.style.height = '30px';
                markerElement.style.display = 'flex';
                markerElement.style.justifyContent = 'center';
                markerElement.style.alignItems = 'center';
                markerElement.style.borderRadius = '50%';
                markerElement.style.backgroundColor = 'white';
                markerElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';

                const IconComponent = incident.incidentType === 'congestion' ? FaCar : FaExclamationCircle;
                const color = incident.incidentType === 'congestion' ? '#FD7E14' : '#0D6EFD';

                markerElement.innerHTML = renderToStaticMarkup(
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                        <IconComponent color={color} size={20} />
                    </div>
                );

                const marker = new ttObject.Marker({ element: markerElement })
                    .setLngLat(coordinates)
                    .addTo(map);

                const popupContent = `
                    <div style="max-width: 250px; color: black">
                        <h3 style="font-weight: bold; margin-bottom: 8px;">${incident.description || (incident.incidentType === 'congestion' ? 'Embouteillage' : 'Contrôle de police')}</h3>
                        <p><strong>Type:</strong> ${incident.incidentType === 'congestion' ? 'Embouteillage' : 'Contrôle de police'}</p>
                        <p><strong>Sévérité:</strong> ${incident.severity}</p>
                        <p><strong>Date:</strong> ${new Date(incident.createdAt).toLocaleString()}</p>
                        <p><strong>Validations:</strong> ${incident.validations}</p>
                        <p><strong>Invalidations:</strong> ${incident.invalidations}</p>
                        ${incident.city ? `<p><strong>Ville:</strong> ${incident.city}</p>` : ''}
                    </div>
                `;

                const popup = new ttObject.Popup({ offset: 25 }).setHTML(popupContent);
                marker.setPopup(popup);
            } catch (error) {
                console.error('Erreur lors de l\'affichage du marqueur:', error, incident);
            }
        });
    };

    useEffect(() => {
        if (map) {
            loadIncidents();
        }
    }, [map, incidents]);

    return (
        <AdminLayout>
            <Head>
                <link rel='stylesheet' href='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.23.0/maps/maps.css' />
            </Head>

            <Box position="relative" h="calc(100vh - 60px)">
                <Box
                    ref={mapContainerRef}
                    height="100%"
                    width="100%"
                    borderRadius="lg"
                    overflow="hidden"
                    boxShadow="md"
                />
            </Box>
        </AdminLayout>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req } = context;
    const token = req.cookies.token;

    if (!token) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }

    try {
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };
        
        const response = await axios.get(`${process.env.API_URL}/api/navigation/traffic/reports`, config);
        console.log('Réponse de l\'API:', response.data);
        
        // Gérer les différents formats de réponse
        let incidents = [];
        if (response.data.data?.incidents) {
            incidents = response.data.data.incidents;
        } else if (Array.isArray(response.data)) {
            incidents = response.data;
        } else if (response.data.incidents) {
            incidents = response.data.incidents;
        }
        
        console.log('Incidents traités:', incidents);
        
        return {
            props: {
                initialIncidents: incidents,
                apiKey: process.env.TOMTOM_API_KEY || ''
            }
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des incidents:', error);
        
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            return {
                redirect: {
                    destination: '/login',
                    permanent: false,
                },
            };
        }

        return {
            props: {
                initialIncidents: [],
                apiKey: process.env.TOMTOM_API_KEY || ''
            }
        };
    }
};

export default PredictionsPage; 