// pages/admin/routes.tsx
import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import {
    Box,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    HStack,
    Text,
    useColorModeValue,
    Badge,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    IconButton,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    useToast,
    Spinner,
    Center,
    TableContainer,
    Tooltip,
    Tag,
    Image,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Icon
} from '@chakra-ui/react';
import { FiMoreVertical, FiSearch, FiTrash2, FiEye, FiMap, FiDownload, FiEdit, FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { FaRoute, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import { useRouter } from 'next/router';
import api from '@/services/api';

// Types pour les itinéraires
interface Route {
    id: string | number;
    name: string;
    originName: string;
    destinationName: string;
    originCoordinates: [number, number];
    destinationCoordinates: [number, number];
    waypoints?: Array<[number, number]>;
    distance: number;
    duration: number;
    userId: string | number;
    username: string;
    createdAt: string;
    lastUsed?: string;
    isFavorite: boolean;
    usageCount: number;
    routeType: string;
    avoidTolls: boolean;
}

// Composant principal
const RoutesPage = ({ initialRoutes }: { initialRoutes: Route[] }) => {
    const [routes, setRoutes] = useState<Route[]>(initialRoutes);
    const [filteredRoutes, setFilteredRoutes] = useState<Route[]>(initialRoutes);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<string>('lastUsed');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [loading, setLoading] = useState(false);

    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

    const toast = useToast();
    const router = useRouter();

    // Filtrer les itinéraires
    useEffect(() => {
        let result = [...routes];

        // Filtre de recherche
        if (searchTerm) {
            result = result.filter(route =>
                route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                route.originName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                route.destinationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                route.username.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Tri
        result.sort((a, b) => {
            let fieldA: any = a[sortField as keyof Route];
            let fieldB: any = b[sortField as keyof Route];

            // Gestion des champs de type date
            if (typeof fieldA === 'string' && (sortField === 'createdAt' || sortField === 'lastUsed')) {
                fieldA = new Date(fieldA).getTime();
                fieldB = new Date(fieldB || '').getTime();
            }

            if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
            if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredRoutes(result);
    }, [searchTerm, sortField, sortOrder, routes]);

    // Formatage de la date
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Formatage de la distance
    const formatDistance = (meters: number) => {
        if (meters < 1000) {
            return `${meters} m`;
        }
        return `${(meters / 1000).toFixed(1)} km`;
    };

    // Formatage de la durée
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours} h ${minutes} min`;
        }
        return `${minutes} min`;
    };

    // Changer l'ordre de tri
    const toggleSortOrder = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc'); // Par défaut, tri décroissant pour un nouveau champ
        }
    };

    // Ouvrir le modal de détails
    const handleViewDetails = (route: Route) => {
        setSelectedRoute(route);
        onDetailOpen();
    };

    // Ouvrir le modal de suppression
    const handleDeleteRoute = (route: Route) => {
        setSelectedRoute(route);
        onDeleteOpen();
    };

    // Voir sur la carte
    const handleViewOnMap = (route: Route) => {
        // Rediriger vers la page de carte avec l'itinéraire sélectionné
        router.push(`/map?route=${route.id}`);
    };

    // Télécharger le QR code
    const handleDownloadQRCode = async (route: Route) => {
        setLoading(true);
        try {
            // Ici, vous implémenterez l'appel API réel pour générer un QR code
            // Exemple fictif:
            // const response = await api.routes.generateQRCode(route.id);

            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast({
                title: "QR Code généré",
                description: `Le QR Code pour l'itinéraire ${route.name} a été généré avec succès.`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Erreur lors de la génération du QR Code:', error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la génération du QR Code.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Confirmer la suppression de l'itinéraire
    const handleConfirmDelete = async () => {
        if (!selectedRoute) return;

        setLoading(true);
        try {
            // Ici, vous implémenterez l'appel API réel pour supprimer l'itinéraire
            // Exemple fictif:
            // await api.routes.deleteRoute(selectedRoute.id);

            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Supprimer l'itinéraire de la liste
            const updatedRoutes = routes.filter(route => route.id !== selectedRoute.id);
            setRoutes(updatedRoutes);

            toast({
                title: "Itinéraire supprimé",
                description: `L'itinéraire ${selectedRoute.name} a été supprimé avec succès.`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            onDeleteClose();
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'itinéraire:', error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la suppression de l'itinéraire.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Composant pour la carte statique de l'itinéraire (maquette)
    const RouteMapPreview = ({ route }: { route: Route }) => {
        // Ici, vous pourriez utiliser une API comme Mapbox Static API pour générer une image de carte
        // Pour l'exemple, nous utilisons une image de placeholder
        return (
            <Box position="relative" borderRadius="md" overflow="hidden" h="200px" w="100%">
                <Center
                    bg={useColorModeValue('gray.100', 'gray.700')}
                    h="100%"
                    w="100%"
                    color={useColorModeValue('gray.500', 'gray.400')}
                >
                    <Icon as={FiMap} boxSize={10} />
                </Center>
                <Box
                    position="absolute"
                    bottom={2}
                    right={2}
                    bg="white"
                    p={2}
                    borderRadius="md"
                    boxShadow="md"
                    fontSize="sm"
                    color="gray.700"
                >
                    <HStack spacing={2}>
                        <Box as={FaRoute} color="blue.500" />
                        <Text>{formatDistance(route.distance)}</Text>
                        <Text>•</Text>
                        <Box as={FiClock} color="blue.500" />
                        <Text>{formatDuration(route.duration)}</Text>
                    </HStack>
                </Box>
            </Box>
        );
    };

    return (
        <AdminLayout>
            <Box maxW="7xl" mx="auto">
                <Heading mb={6}>Gestion des itinéraires</Heading>

                {/* Filtres */}
                <Flex
                    direction={{ base: 'column', md: 'row' }}
                    gap={4}
                    mb={6}
                    p={4}
                    bg={useColorModeValue('white', 'gray.800')}
                    borderRadius="md"
                    boxShadow="sm"
                >
                    <InputGroup maxW={{ md: '320px' }}>
                        <InputLeftElement pointerEvents="none">
                            <FiSearch color="gray.300" />
                        </InputLeftElement>
                        <Input
                            placeholder="Rechercher un itinéraire..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    <Select
                        placeholder="Trier par"
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                        maxW={{ md: '180px' }}
                    >
                        <option value="lastUsed">Dernière utilisation</option>
                        <option value="createdAt">Date de création</option>
                        <option value="name">Nom</option>
                        <option value="distance">Distance</option>
                        <option value="duration">Durée</option>
                        <option value="usageCount">Popularité</option>
                    </Select>

                    <Select
                        placeholder="Ordre"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                        maxW={{ md: '150px' }}
                    >
                        <option value="desc">Décroissant</option>
                        <option value="asc">Croissant</option>
                    </Select>
                </Flex>

                {/* Tableau des itinéraires */}
                {loading ? (
                    <Center h="400px">
                        <Spinner size="xl" color="blue.500" />
                    </Center>
                ) : (
                    <>
                        <TableContainer
                            bg={useColorModeValue('white', 'gray.800')}
                            borderRadius="md"
                            boxShadow="sm"
                            overflowX="auto"
                        >
                            <Table variant="simple">
                                <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                                    <Tr>
                                        <Th>
                                            <HStack spacing={1} cursor="pointer" onClick={() => toggleSortOrder('name')}>
                                                <Text>Nom</Text>
                                                {sortField === 'name' && (
                                                    <Text>{sortOrder === 'asc' ? '↑' : '↓'}</Text>
                                                )}
                                            </HStack>
                                        </Th>
                                        <Th>Route</Th>
                                        <Th>
                                            <HStack spacing={1} cursor="pointer" onClick={() => toggleSortOrder('distance')}>
                                                <Text>Distance</Text>
                                                {sortField === 'distance' && (
                                                    <Text>{sortOrder === 'asc' ? '↑' : '↓'}</Text>
                                                )}
                                            </HStack>
                                        </Th>
                                        <Th>
                                            <HStack spacing={1} cursor="pointer" onClick={() => toggleSortOrder('duration')}>
                                                <Text>Durée</Text>
                                                {sortField === 'duration' && (
                                                    <Text>{sortOrder === 'asc' ? '↑' : '↓'}</Text>
                                                )}
                                            </HStack>
                                        </Th>
                                        <Th>Utilisateur</Th>
                                        <Th>
                                            <HStack spacing={1} cursor="pointer" onClick={() => toggleSortOrder('createdAt')}>
                                                <Text>Créé le</Text>
                                                {sortField === 'createdAt' && (
                                                    <Text>{sortOrder === 'asc' ? '↑' : '↓'}</Text>
                                                )}
                                            </HStack>
                                        </Th>
                                        <Th>
                                            <HStack spacing={1} cursor="pointer" onClick={() => toggleSortOrder('usageCount')}>
                                                <Text>Utilisations</Text>
                                                {sortField === 'usageCount' && (
                                                    <Text>{sortOrder === 'asc' ? '↑' : '↓'}</Text>
                                                )}
                                            </HStack>
                                        </Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {filteredRoutes.length > 0 ? (
                                        filteredRoutes.map((route) => (
                                            <Tr key={route.id}>
                                                <Td>
                                                    <Flex align="center">
                                                        {route.isFavorite && (
                                                            <Icon as={FaStar} color="yellow.400" mr={2} />
                                                        )}
                                                        <Text fontWeight="medium">{route.name}</Text>
                                                    </Flex>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm" noOfLines={1}>
                                                        {route.originName} → {route.destinationName}
                                                    </Text>
                                                </Td>
                                                <Td>{formatDistance(route.distance)}</Td>
                                                <Td>{formatDuration(route.duration)}</Td>
                                                <Td>
                                                    <Text fontSize="sm">{route.username}</Text>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm">{formatDate(route.createdAt)}</Text>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={route.usageCount > 10 ? "green" : route.usageCount > 5 ? "blue" : "gray"}>
                                                        {route.usageCount}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Menu>
                                                        <MenuButton
                                                            as={IconButton}
                                                            icon={<FiMoreVertical />}
                                                            variant="ghost"
                                                            size="sm"
                                                            aria-label="Actions"
                                                        />
                                                        <MenuList>
                                                            <MenuItem icon={<FiEye />} onClick={() => handleViewDetails(route)}>
                                                                Voir les détails
                                                            </MenuItem>
                                                            <MenuItem icon={<FiMap />} onClick={() => handleViewOnMap(route)}>
                                                                Voir sur la carte
                                                            </MenuItem>
                                                            <MenuItem icon={<FiDownload />} onClick={() => handleDownloadQRCode(route)}>
                                                                Générer QR Code
                                                            </MenuItem>
                                                            <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteRoute(route)}>
                                                                Supprimer
                                                            </MenuItem>
                                                        </MenuList>
                                                    </Menu>
                                                </Td>
                                            </Tr>
                                        ))
                                    ) : (
                                        <Tr>
                                            <Td colSpan={8} textAlign="center" py={10}>
                                                <Text color="gray.500">Aucun itinéraire trouvé</Text>
                                            </Td>
                                        </Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </TableContainer>

                        <Text mt={4} color="gray.500" fontSize="sm">
                            {filteredRoutes.length} itinéraire{filteredRoutes.length !== 1 ? 's' : ''} trouvé{filteredRoutes.length !== 1 ? 's' : ''}
                        </Text>
                    </>
                )}

                {/* Modal de détails itinéraire */}
                <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Détails de l'itinéraire</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            {selectedRoute && (
                                <Box>
                                    <Heading size="md" mb={4}>
                                        {selectedRoute.isFavorite && (
                                            <Icon as={FaStar} color="yellow.400" mr={2} />
                                        )}
                                        {selectedRoute.name}
                                    </Heading>

                                    <Tabs isFitted variant="enclosed" mb={6}>
                                        <TabList>
                                            <Tab>Informations</Tab>
                                            <Tab>Carte</Tab>
                                        </TabList>
                                        <TabPanels>
                                            <TabPanel>
                                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                                                    <RouteDetailItem
                                                        icon={FaMapMarkerAlt}
                                                        label="Point de départ"
                                                        value={selectedRoute.originName}
                                                        color="green.500"
                                                    />
                                                    <RouteDetailItem
                                                        icon={FaMapMarkerAlt}
                                                        label="Destination"
                                                        value={selectedRoute.destinationName}
                                                        color="red.500"
                                                    />
                                                    <RouteDetailItem
                                                        icon={FaRoute}
                                                        label="Distance"
                                                        value={formatDistance(selectedRoute.distance)}
                                                        color="blue.500"
                                                    />
                                                    <RouteDetailItem
                                                        icon={FiClock}
                                                        label="Durée estimée"
                                                        value={formatDuration(selectedRoute.duration)}
                                                        color="blue.500"
                                                    />
                                                    <RouteDetailItem
                                                        icon={FiUser}
                                                        label="Créé par"
                                                        value={selectedRoute.username}
                                                        color="purple.500"
                                                    />
                                                    <RouteDetailItem
                                                        icon={FiCalendar}
                                                        label="Créé le"
                                                        value={formatDate(selectedRoute.createdAt)}
                                                        color="gray.500"
                                                    />
                                                </SimpleGrid>

                                                <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md" mb={4}>
                                                    <Heading size="sm" mb={2}>Options de l'itinéraire</Heading>
                                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                                        <Box>
                                                            <Text fontSize="sm" fontWeight="medium" color="gray.500">Type de route</Text>
                                                            <Badge>{selectedRoute.routeType || 'Standard'}</Badge>
                                                        </Box>
                                                        <Box>
                                                            <Text fontSize="sm" fontWeight="medium" color="gray.500">Péages</Text>
                                                            <Badge colorScheme={selectedRoute.avoidTolls ? "green" : "red"}>
                                                                {selectedRoute.avoidTolls ? 'Évités' : 'Autorisés'}
                                                            </Badge>
                                                        </Box>
                                                        <Box>
                                                            <Text fontSize="sm" fontWeight="medium" color="gray.500">Dernière utilisation</Text>
                                                            <Text>{selectedRoute.lastUsed ? formatDate(selectedRoute.lastUsed) : 'Jamais'}</Text>
                                                        </Box>
                                                        <Box>
                                                            <Text fontSize="sm" fontWeight="medium" color="gray.500">Nombre d'utilisations</Text>
                                                            <Badge colorScheme={selectedRoute.usageCount > 10 ? "green" : selectedRoute.usageCount > 5 ? "blue" : "gray"}>
                                                                {selectedRoute.usageCount}
                                                            </Badge>
                                                        </Box>
                                                    </SimpleGrid>
                                                </Box>

                                                <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                                                    <Heading size="sm" mb={2}>Coordonnées géographiques</Heading>
                                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                                        <Box>
                                                            <Text fontSize="sm" fontWeight="medium" color="gray.500">Origine</Text>
                                                            <Text fontSize="sm" fontFamily="monospace">
                                                                {selectedRoute.originCoordinates.join(', ')}
                                                            </Text>
                                                        </Box>
                                                        <Box>
                                                            <Text fontSize="sm" fontWeight="medium" color="gray.500">Destination</Text>
                                                            <Text fontSize="sm" fontFamily="monospace">
                                                                {selectedRoute.destinationCoordinates.join(', ')}
                                                            </Text>
                                                        </Box>
                                                    </SimpleGrid>
                                                </Box>
                                            </TabPanel>
                                            <TabPanel>
                                                <RouteMapPreview route={selectedRoute} />
                                            </TabPanel>
                                        </TabPanels>
                                    </Tabs>
                                </Box>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button leftIcon={<FiMap />} colorScheme="blue" mr={3} onClick={() => {
                                onDetailClose();
                                if (selectedRoute) handleViewOnMap(selectedRoute);
                            }}>
                                Voir sur la carte
                            </Button>
                            <Button variant="ghost" onClick={onDetailClose}>
                                Fermer
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Modal de confirmation de suppression */}
                <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="md">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader color="red.500">Supprimer l'itinéraire</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            <Text>
                                Êtes-vous sûr de vouloir supprimer l'itinéraire <b>{selectedRoute?.name}</b> ?
                                Cette action est irréversible.
                            </Text>
                        </ModalBody>
                        <ModalFooter>
                            <Button mr={3} onClick={onDeleteClose}>Annuler</Button>
                            <Button
                                colorScheme="red"
                                onClick={handleConfirmDelete}
                                isLoading={loading}
                            >
                                Supprimer
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Box>
        </AdminLayout>
    );
};

// Composant auxiliaire pour l'affichage des détails
interface RouteDetailItemProps {
    icon: React.ElementType;
    label: string;
    value: string;
    color?: string;
}

const RouteDetailItem = ({ icon, label, value, color }: RouteDetailItemProps) => {
    return (
        <Flex align="center" p={3} borderWidth="1px" borderRadius="md">
            <Icon as={icon} boxSize={5} color={color} mr={3} />
            <Box>
                <Text fontSize="xs" fontWeight="medium" color="gray.500">{label}</Text>
                <Text>{value}</Text>
            </Box>
        </Flex>
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

        // Pour l'exemple, utilisons des données simulées
        // Dans un cas réel, vous feriez un appel API pour récupérer les itinéraires
        // const routesResponse = await axios.get(`${process.env.API_URL}/api/admin/routes`, config);
        // const routes = routesResponse.data.data.routes;

        // Exemple de données fictives
        const routes: Route[] = [
            {
                id: 101,
                name: "Trajet quotidien",
                originName: "Caen",
                destinationName: "Bayeux",
                originCoordinates: [49.1829, -0.3707],
                destinationCoordinates: [49.2764, -0.7024],
                distance: 25000,
                duration: 1800,
                userId: 1,
                username: "Jules Martin",
                createdAt: "2025-04-15T08:00:00Z",
                lastUsed: "2025-05-02T08:00:00Z",
                isFavorite: true,
                usageCount: 42,
                routeType: "fastest",
                avoidTolls: true
            },
            {
                id: 102,
                name: "Route touristique",
                originName: "Caen",
                destinationName: "Mont Saint-Michel",
                originCoordinates: [49.1829, -0.3707],
                destinationCoordinates: [48.6361, -1.5115],
                distance: 95000,
                duration: 5400,
                userId: 2,
                username: "Marie Dubois",
                createdAt: "2025-04-01T14:30:00Z",
                lastUsed: "2025-04-28T10:15:00Z",
                isFavorite: true,
                usageCount: 12,
                routeType: "scenic",
                avoidTolls: false
            },
            {
                id: 103,
                name: "Visite client",
                originName: "Caen",
                destinationName: "Rouen",
                originCoordinates: [49.1829, -0.3707],
                destinationCoordinates: [49.4431, 1.0989],
                distance: 120000,
                duration: 5100,
                userId: 3,
                username: "Thomas Bernard",
                createdAt: "2025-03-20T10:15:00Z",
                lastUsed: "2025-04-15T14:30:00Z",
                isFavorite: false,
                usageCount: 8,
                routeType: "fastest",
                avoidTolls: true
            },
            {
                id: 104,
                name: "Livraison",
                originName: "Caen",
                destinationName: "Cherbourg",
                originCoordinates: [49.1829, -0.3707],
                destinationCoordinates: [49.6337, -1.6221],
                distance: 110000,
                duration: 5700,
                userId: 1,
                username: "Jules Martin",
                createdAt: "2025-03-15T09:45:00Z",
                lastUsed: "2025-04-10T11:20:00Z",
                isFavorite: false,
                usageCount: 5,
                routeType: "shortest",
                avoidTolls: true
            },
            {
                id: 105,
                name: "Week-end à la plage",
                originName: "Caen",
                destinationName: "Deauville",
                originCoordinates: [49.1829, -0.3707],
                destinationCoordinates: [49.3539, 0.0630],
                distance: 45000,
                duration: 2400,
                userId: 4,
                username: "Sophie Leroy",
                createdAt: "2025-02-28T16:10:00Z",
                lastUsed: "2025-04-05T09:30:00Z",
                isFavorite: true,
                usageCount: 15,
                routeType: "scenic",
                avoidTolls: false
            }
        ];

        return {
            props: {
                initialRoutes: routes
            },
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des itinéraires:', error);

        // En cas d'erreur d'authentification, rediriger vers la page de connexion
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            return {
                redirect: {
                    destination: '/login',
                    permanent: false,
                },
            };
        }

        // Pour les autres erreurs, afficher une page avec une liste vide
        return {
            props: {
                initialRoutes: []
            },
        };
    }
};

export default RoutesPage;