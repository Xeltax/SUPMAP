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
    Icon, VStack
} from '@chakra-ui/react';
import { FiMoreVertical, FiSearch, FiTrash2, FiEye, FiMap, FiDownload, FiEdit, FiCalendar, FiClock, FiUser, FiRefreshCw } from 'react-icons/fi';
import { FaRoute, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import { useRouter } from 'next/router';
import api from '@/services/api';

// Types pour les itinéraires
interface Route {
    id: string;
    name: string;
    originName: string;
    destinationName: string;
    originCoordinates: [number, number];
    destinationCoordinates: [number, number];
    waypoints?: Array<[number, number]>;
    distance: number;
    duration: number;
    userId: string;
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
    const [displayCount, setDisplayCount] = useState(100);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<string>('lastUsed');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [loading, setLoading] = useState(false);
    const [qrCodeData, setQRCodeData] = useState<string | null>(null);
    const [currentRoute, setCurrentRoute] = useState<Route | null>(null);

    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isQRCodeOpen, onOpen: onQRCodeOpen, onClose: onQRCodeClose } = useDisclosure();

    const toast = useToast();
    const router = useRouter();

    // Filtrer les itinéraires
    useEffect(() => {
        let result = routes.length > 0 ? [...routes] : [];

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

    const handleDownloadQRCode = async (route: Route) => {
        setLoading(true);
        setCurrentRoute(route);
        try {
            const response = await api.routes.generateQRCode(route.id);

            if (!response.data) {
                toast({
                    title: "Erreur",
                    description: "Aucune donnée QR Code reçue.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }

            setQRCodeData(response.data.qrCode);

            onQRCodeOpen();

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

    const downloadQRCode = () => {
        if (!qrCodeData || !currentRoute) return;

        const link = document.createElement('a');
        link.href = qrCodeData;
        link.download = `qrcode-${currentRoute.name.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "QR Code téléchargé",
            description: "Le QR Code a été téléchargé avec succès.",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
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
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {filteredRoutes.slice(0, displayCount).map((route) => (
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
                                    ))}
                                </Tbody>
                            </Table>
                        </TableContainer>

                        <Flex justify="space-between" align="center" mt={4}>
                            <Text color="gray.500" fontSize="sm">
                                {filteredRoutes.slice(0, displayCount).length} itinéraire{filteredRoutes.slice(0, displayCount).length !== 1 ? 's' : ''} affiché{filteredRoutes.slice(0, displayCount).length !== 1 ? 's' : ''} sur {filteredRoutes.length}
                            </Text>
                            
                            {displayCount < filteredRoutes.length && (
                                <Button
                                    onClick={() => setDisplayCount(prev => prev + 100)}
                                    colorScheme="blue"
                                    variant="outline"
                                    leftIcon={<FiRefreshCw />}
                                >
                                    Charger plus d'itinéraires
                                </Button>
                            )}
                        </Flex>
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
                                        </SimpleGrid>
                                    </Box>
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

                {/* Modal QR Code */}
                <Modal isOpen={isQRCodeOpen} onClose={onQRCodeClose} isCentered size="md">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>QR Code de l'itinéraire</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            {qrCodeData && currentRoute ? (
                                <VStack spacing={4} align="center">
                                    <Text fontWeight="medium">
                                        {currentRoute.name}
                                    </Text>

                                    <Box
                                        p={4}
                                        borderWidth="1px"
                                        borderRadius="md"
                                        bg={useColorModeValue('white', 'gray.700')}
                                        boxShadow="sm"
                                        width="100%"
                                        display="flex"
                                        justifyContent="center"
                                    >
                                        <Image
                                            src={qrCodeData}
                                            alt={`QR Code pour l'itinéraire ${currentRoute.name}`}
                                            maxW="250px"
                                            maxH="250px"
                                        />
                                    </Box>

                                    <Text fontSize="sm" color="gray.500" textAlign="center">
                                        Scannez ce QR code pour accéder à l'itinéraire depuis n'importe quel appareil.
                                    </Text>

                                    <Flex gap={4} width="100%" mt={2}>
                                        <Button
                                            leftIcon={<FiDownload />}
                                            colorScheme="blue"
                                            onClick={downloadQRCode}
                                            flex="1"
                                        >
                                            Télécharger
                                        </Button>

                                    </Flex>
                                </VStack>
                            ) : (
                                <Text>Chargement du QR code...</Text>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" onClick={onQRCodeClose}>
                                Fermer
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

        const routesResponse = await axios.get(
            `${process.env.API_URL}/api/navigation/routes/all`,
            config
        );

        // Créer un tableau de promesses pour récupérer les noms d'utilisateurs
        const routePromises = routesResponse.data.data.routes.map(async (route : Route) => {
            try {
                const userResponse = await axios.get(
                    `${process.env.API_URL}/api/auth/users/${route.userId}`,
                    config
                );

                if (userResponse.data && userResponse.data.data) {
                    return {
                        ...route,
                        username: userResponse.data.data.user.username || "Utilisateur inconnu",
                    };
                } else {
                    return {
                        ...route,
                        username: "Utilisateur inconnu",
                    };
                }
            } catch (error) {
                console.error(`Erreur lors de la récupération de l'utilisateur pour l'itinéraire ${route.id}:`, error);
                // En cas d'erreur, on retourne l'itinéraire sans nom d'utilisateur
                return {
                    ...route,
                    username: "Utilisateur inconnu",
                };
            }
        });

        // Attendre que toutes les promesses soient résolues
        const routesWithUsernames = await Promise.all(routePromises);

        console.log(routesWithUsernames)

        return {
            props: {
                initialRoutes: routesWithUsernames
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