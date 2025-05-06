import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import {
    Box,
    Grid,
    GridItem,
    Heading,
    Text,
    Flex,
    Badge,
    Button,
    Icon,
    Card,
    CardHeader,
    CardBody,
    Select,
    Input,
    InputGroup,
    InputLeftElement,
    useColorModeValue,
    SimpleGrid,
    Tag,
    TagLeftIcon,
    TagLabel,
    IconButton,
    useToast,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    useDisclosure,
    Tooltip
} from '@chakra-ui/react';
import {
    FaExclamationTriangle,
    FaSearch,
    FaFilter,
    FaEye,
    FaEdit,
    FaTrash,
    FaClock,
    FaMapMarkerAlt,
    FaCarCrash,
    FaTools,
    FaSnowflake,
    FaWater,
    FaArrowUp,
    FaArrowDown,
    FaTachometerAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationCircle, FaHammer, FaCar
} from 'react-icons/fa';
import NextLink from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';
import {FaRoadBarrier} from "react-icons/fa6";

// Types adaptés à votre API
interface Incident {
    id: string;
    userId: string;
    incidentType: string;
    location: {
        type: string;
        coordinates: number[];
        crs: any;
    };
    description: string;
    severity: 'minor' | 'moderate' | 'major';
    validations: number;
    invalidations: number;
    active: boolean;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}

interface IncidentsPageProps {
    incidents: Incident[];
    userData: {
        username: string;
        id: string;
    };
}

// Fonction utilitaire pour obtenir l'icône appropriée selon le type d'incident
const getIncidentIcon = (type: string) => {
    switch (type) {
        case 'accident':
            return FaCarCrash;
        case 'roadworks':
            return FaHammer;
        case 'roadClosed':
            return FaRoadBarrier;
        case 'congestion':
            return FaCar;
        case 'hazard':
            return FaExclamationTriangle;
        case 'police':
            return FaExclamationCircle;
        default:
            return FaExclamationTriangle;
    }
};

// Fonction utilitaire pour obtenir le libellé en français du type d'incident
const getIncidentTypeLabel = (type: string) => {
    switch (type) {
        case 'accident':
            return 'Accident';
        case 'roadworks':
            return 'Travaux';
        case 'roadClosed':
            return 'Route fermée';
        case 'hazard':
            return 'Obstacle';
        case 'congestion':
            return 'Embouteillage';
        case 'flood':
            return 'Inondation';
        case 'police':
            return 'Contrôle de police';
        default:
            return 'Autre';
    }
};

// Fonction utilitaire pour obtenir la couleur appropriée selon la sévérité
const getSeverityColor = (severity: string) => {
    switch (severity) {
        case 'low':
            return 'green';
        case 'moderate':
            return 'yellow';
        case 'high':
            return 'orange';
        case 'severe':
            return 'red';
        default:
            return 'gray';
    }
};

// Fonction utilitaire pour obtenir le libellé en français de la sévérité
const getSeverityLabel = (severity: string) => {
    switch (severity) {
        case 'low':
            return 'Faible';
        case 'moderate':
            return 'Moyenne';
        case 'high':
            return 'Élevée';
        case 'severe':
            return 'Sévère';
        default:
            return 'Inconnue';
    }
};

// Fonction pour formater la date
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

// Fonction pour calculer le temps restant avant expiration
const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffMs = expiration.getTime() - now.getTime();

    if (diffMs <= 0) return "Expiré";

    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 60) return `${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h${diffMinutes % 60}`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}j ${diffHours % 24}h`;
};

// Fonction pour convertir les coordonnées en adresse (simulée)
const getAddressFromCoordinates = (coordinates: number[]) => {
    // Ici vous utiliseriez normalement un service de géocodage inverse
    // Pour l'exemple, on retourne une adresse générique
    return `Lat: ${coordinates[1].toFixed(5)}, Long: ${coordinates[0].toFixed(5)}`;
};

const IncidentsPage = ({ incidents: initialIncidents, userData }: IncidentsPageProps) => {
    const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterActive, setFilterActive] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const router = useRouter();
    const toast = useToast();
    const cardBg = useColorModeValue('white', 'gray.800');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = React.useRef<HTMLButtonElement>(null);
    const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);

    // Filtrage des incidents
    const filteredIncidents = incidents.filter(incident => {
        // Filtre par type
        if (filterType !== 'all' && incident.incidentType !== filterType) return false;

        // Filtre par statut actif/inactif
        if (filterActive === 'active' && !incident.active) return false;
        if (filterActive === 'expired' && incident.active) return false;

        // Filtre par recherche (description ou coordonnées)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const addressString = getAddressFromCoordinates(incident.location.coordinates).toLowerCase();
            const descriptionMatch = incident.description?.toLowerCase().includes(query) || false;
            const addressMatch = addressString.includes(query);
            const typeMatch = getIncidentTypeLabel(incident.incidentType).toLowerCase().includes(query);

            return descriptionMatch || addressMatch || typeMatch;
        }

        return true;
    });

    // Tri des incidents
    const sortedIncidents = [...filteredIncidents].sort((a, b) => {
        if (sortBy === 'date') {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (sortBy === 'severity') {
            const severityMap = { minor: 1, moderate: 2, major: 3 };
            const severityA = severityMap[a.severity as keyof typeof severityMap] || 0;
            const severityB = severityMap[b.severity as keyof typeof severityMap] || 0;
            return sortOrder === 'asc' ? severityA - severityB : severityB - severityA;
        } else if (sortBy === 'validations') {
            return sortOrder === 'asc'
                ? a.validations - b.validations
                : b.validations - a.validations;
        }
        return 0;
    });

    // Gestion de la suppression d'incident
    const handleDeleteClick = (id: string) => {
        setIncidentToDelete(id);
        onOpen();
    };

    const confirmDelete = async () => {
        if (!incidentToDelete) return;

        try {
            // Appel API pour supprimer l'incident
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/navigation/traffic/reports/${incidentToDelete}`, {
                withCredentials: true
            });

            // Mise à jour de l'état
            setIncidents(incidents.filter(inc => inc.id !== incidentToDelete));

            toast({
                title: "Incident supprimé",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de supprimer l'incident",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            onClose();
            setIncidentToDelete(null);
        }
    };

    // Fonction pour naviguer vers la carte avec l'incident sélectionné
    const viewOnMap = (incident: Incident) => {
        router.push(`/map?lat=${incident.location.coordinates[1]}&lng=${incident.location.coordinates[0]}&incident=${incident.id}`);
    };

    // Vérifie si un incident est expiré
    const isExpired = (expiresAt: string) => {
        return new Date(expiresAt) <= new Date();
    };

    return (
        <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
            <Grid templateColumns={{ base: "1fr", md: "1fr" }} gap={6}>
                {/* En-tête */}
                <GridItem colSpan={1}>
                    <Card bg={cardBg} boxShadow="md" mb={6}>
                        <CardBody>
                            <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between">
                                <Box>
                                    <Heading size="lg" mb={2}>Mes signalements</Heading>
                                    <Text color="gray.500">Gérez les incidents que vous avez signalés</Text>
                                </Box>
                                <Button
                                    as={NextLink}
                                    href="/map"
                                    colorScheme="orange"
                                    size="lg"
                                    leftIcon={<FaExclamationTriangle />}
                                    mt={{ base: 4, md: 0 }}
                                >
                                    Signaler un incident
                                </Button>
                            </Flex>
                        </CardBody>
                    </Card>
                </GridItem>

                {/* Filtres et recherche */}
                <GridItem colSpan={1}>
                    <Card bg={cardBg} boxShadow="md" mb={6}>
                        <CardBody>
                            <Flex direction={{ base: 'column', sm: 'row' }} gap={4} mb={4}>
                                <InputGroup>
                                    <InputLeftElement pointerEvents='none'>
                                        <Icon as={FaSearch} color='gray.300' />
                                    </InputLeftElement>
                                    <Input
                                        placeholder='Rechercher par type ou position'
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </InputGroup>

                                <Select
                                    icon={<FaFilter />}
                                    placeholder="Type d'incident"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    maxW={{ sm: '200px' }}
                                >
                                    <option value="all">Tous les types</option>
                                    <option value="accident">Accident</option>
                                    <option value="roadwork">Travaux</option>
                                    <option value="weather">Météo</option>
                                    <option value="flood">Inondation</option>
                                    <option value="police">Contrôle de police</option>
                                    <option value="other">Autre</option>
                                </Select>

                                <Select
                                    placeholder="Status"
                                    value={filterActive}
                                    onChange={(e) => setFilterActive(e.target.value)}
                                    maxW={{ sm: '200px' }}
                                >
                                    <option value="all">Tous les statuts</option>
                                    <option value="active">Actif</option>
                                    <option value="expired">Expiré</option>
                                </Select>
                            </Flex>

                            <Flex justifyContent="flex-end" alignItems="center" gap={2}>
                                <Text fontSize="sm">Trier par:</Text>
                                <Select
                                    size="sm"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    width="auto"
                                >
                                    <option value="date">Date</option>
                                    <option value="severity">Sévérité</option>
                                    <option value="validations">Validations</option>
                                </Select>

                                <IconButton
                                    aria-label="Ordre de tri"
                                    icon={sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />}
                                    size="sm"
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                />
                            </Flex>
                        </CardBody>
                    </Card>
                </GridItem>

                {/* Liste des incidents */}
                <GridItem colSpan={1}>
                    <Card bg={cardBg} boxShadow="md">
                        <CardHeader>
                            <Heading size="md">
                                {sortedIncidents.length} incident{sortedIncidents.length !== 1 ? 's' : ''} trouvé{sortedIncidents.length !== 1 ? 's' : ''}
                            </Heading>
                        </CardHeader>
                        <CardBody>
                            {sortedIncidents.length > 0 ? (
                                <SimpleGrid columns={1} spacing={4}>
                                    {sortedIncidents.map((incident) => {
                                        const expired = isExpired(incident.expiresAt);
                                        const actuallyActive = incident.active && !expired;

                                        return (
                                            <Card key={incident.id} variant="outline">
                                                <CardBody>
                                                    <Flex
                                                        direction={{ base: 'column', md: 'row' }}
                                                        justify="space-between"
                                                        align={{ md: 'center' }}
                                                    >
                                                        <Flex flex="1" gap={4} alignItems="center" mb={{ base: 3, md: 0 }}>
                                                            <Box
                                                                p={2}
                                                                bg={`${getSeverityColor(incident.severity)}.100`}
                                                                color={`${getSeverityColor(incident.severity)}.500`}
                                                                borderRadius="full"
                                                            >
                                                                <Icon as={getIncidentIcon(incident.incidentType)} boxSize={5} />
                                                            </Box>

                                                            <Box flex="1">
                                                                <Flex gap={2} mb={1} align="center" wrap="wrap">
                                                                    <Heading size="sm">
                                                                        {incident.description
                                                                            ? incident.description
                                                                            : getIncidentTypeLabel(incident.incidentType)}
                                                                    </Heading>
                                                                    <Badge colorScheme={actuallyActive ? 'green' : 'gray'}>
                                                                        {actuallyActive ? 'Actif' : 'Expiré'}
                                                                    </Badge>
                                                                </Flex>

                                                                <Flex gap={4} fontSize="sm" color="gray.500" wrap="wrap">
                                                                    <Flex align="center">
                                                                        <Icon as={FaMapMarkerAlt} mr={1} />
                                                                        <Text>{getAddressFromCoordinates(incident.location.coordinates)}</Text>
                                                                    </Flex>
                                                                    <Flex align="center">
                                                                        <Icon as={FaClock} mr={1} />
                                                                        <Text>{formatDate(incident.createdAt)}</Text>
                                                                    </Flex>
                                                                </Flex>

                                                                <Flex mt={2} gap={2} wrap="wrap">
                                                                    <Tag size="sm" variant="subtle" colorScheme={getSeverityColor(incident.severity)}>
                                                                        <TagLeftIcon as={FaTachometerAlt} />
                                                                        <TagLabel>Sévérité: {getSeverityLabel(incident.severity)}</TagLabel>
                                                                    </Tag>

                                                                    {actuallyActive && (
                                                                        <Tooltip label={`Expire dans: ${getTimeRemaining(incident.expiresAt)}`}>
                                                                            <Tag size="sm" variant="subtle" colorScheme="purple">
                                                                                <TagLeftIcon as={FaClock} />
                                                                                <TagLabel>{getTimeRemaining(incident.expiresAt)}</TagLabel>
                                                                            </Tag>
                                                                        </Tooltip>
                                                                    )}

                                                                    <Flex gap={1}>
                                                                        <Tag size="sm" variant="subtle" colorScheme="green">
                                                                            <TagLeftIcon as={FaCheckCircle} />
                                                                            <TagLabel>{incident.validations}</TagLabel>
                                                                        </Tag>

                                                                        <Tag size="sm" variant="subtle" colorScheme="red">
                                                                            <TagLeftIcon as={FaTimesCircle} />
                                                                            <TagLabel>{incident.invalidations}</TagLabel>
                                                                        </Tag>
                                                                    </Flex>
                                                                </Flex>
                                                            </Box>
                                                        </Flex>

                                                        <Flex gap={2}>
                                                            <IconButton
                                                                aria-label="Voir sur la carte"
                                                                icon={<FaEye />}
                                                                onClick={() => viewOnMap(incident)}
                                                                colorScheme="blue"
                                                                variant="ghost"
                                                                size="sm"
                                                            />
                                                        </Flex>
                                                    </Flex>
                                                </CardBody>
                                            </Card>
                                        );
                                    })}
                                </SimpleGrid>
                            ) : (
                                <Box textAlign="center" py={8}>
                                    <Icon as={FaExclamationTriangle} boxSize={10} color="gray.400" mb={4} />
                                    <Text mb={4} color="gray.500">Aucun incident trouvé avec les filtres actuels</Text>
                                    <Button
                                        as={NextLink}
                                        href="/map"
                                        colorScheme="orange"
                                        leftIcon={<FaExclamationTriangle />}
                                    >
                                        Signaler un incident
                                    </Button>
                                </Box>
                            )}
                        </CardBody>
                    </Card>
                </GridItem>
            </Grid>

            {/* Dialog de confirmation de suppression */}
            <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef}
                onClose={onClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Supprimer l'incident
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Êtes-vous sûr de vouloir supprimer cet incident ? Cette action ne peut pas être annulée.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                Annuler
                            </Button>
                            <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                                Supprimer
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    // Récupérer le token depuis les cookies
    const { req } = context;
    const token = req.cookies.token;

    // Rediriger vers login si pas de token
    if (!token) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }

    try {
        // Configuration de l'en-tête avec le token
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // Récupération des données utilisateur
        const userResponse = await axios.get(`${process.env.API_URL}/api/auth/me`, config);
        const userId = userResponse.data.data.user.id;

        // Récupération des incidents de l'utilisateur
        const incidentsResponse = await axios.get(
            `${process.env.API_URL}/api/navigation/traffic/reports`,
            {
                ...config,
                params: { userId }
            }
        );

        const routesResponse = await axios.get(
            `${process.env.API_URL}/api/navigation/traffic/routes`,
            config
        );

        return {
            props: {
                incidents: incidentsResponse.data.data.incidents || [],
                userData: userResponse.data.data.user
            },
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);

        // En cas d'erreur d'authentification, rediriger vers la page de connexion
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            return {
                redirect: {
                    destination: '/login',
                    permanent: false,
                },
            };
        }

        // Pour les autres erreurs, afficher la page avec des données vides
        return {
            props: {
                incidents: [],
                userData: { username: "Utilisateur", id: "" }
            },
        };
    }
};

export default IncidentsPage;