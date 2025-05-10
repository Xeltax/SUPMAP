// pages/admin/index.tsx
import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import {
    Box,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Card,
    CardBody,
    Heading,
    Text,
    Icon,
    Flex,
    useColorModeValue,
    Spinner,
    Center,
    Grid,
    GridItem,
    Button,
} from '@chakra-ui/react';
import { FiUsers, FiUser, FiCalendar } from 'react-icons/fi';
import { FaRoute, FaExclamationTriangle } from 'react-icons/fa';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import api from '@/services/api';

// Types pour les statistiques d'administration
interface AdminDashboardStats {
    totalUsers: number;
    activeUsers: number;
    newUsersLastWeek: number;
    totalRoutes: number;
    routesLastWeek: number;
    totalIncidents: number;
    activeIncidents: number;
    incidentsLastWeek: number;
}

// Types pour les données récentes
interface RecentData {
    recentUsers: any[];
    recentRoutes: any[];
    recentIncidents: any[];
}

const AdminDashboard = ({ initialStats, initialRecentData }: {
    initialStats: AdminDashboardStats,
    initialRecentData: RecentData
}) => {
    const [stats, setStats] = useState<AdminDashboardStats>(initialStats);
    const [recentData, setRecentData] = useState<RecentData>(initialRecentData);
    const [loading, setLoading] = useState(false);
    const [displayCount, setDisplayCount] = useState<{
        users: number;
        routes: number;
        incidents: number;
    }>({
        users: 100,
        routes: 100,
        incidents: 100
    });

    // Couleurs pour le mode clair/sombre
    const cardBg = useColorModeValue('white', 'gray.800');
    const statCardBg = useColorModeValue('blue.50', 'blue.900');
    const statCardUsers = useColorModeValue('green.50', 'green.900');
    const statCardRoutes = useColorModeValue('purple.50', 'purple.900');
    const statCardIncidents = useColorModeValue('orange.50', 'orange.900');

    // Formater la date
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

    const renderType = (type : string) => {
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
    }

    const handleLoadMore = (type: 'users' | 'routes' | 'incidents') => {
        setDisplayCount(prev => ({
            ...prev,
            [type]: prev[type] + 100
        }));
    };

    return (
        <AdminLayout>
            <Box maxW="7xl" mx="auto">
                <Heading mb={6}>Tableau de bord</Heading>

                {loading ? (
                    <Center h="200px">
                        <Spinner size="xl" color="blue.500" />
                    </Center>
                ) : (
                    <>
                        {/* Statistiques principales */}
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
                            <Card bg={cardBg} boxShadow="md">
                                <CardBody bg={statCardUsers} borderRadius="md">
                                    <Flex justify="space-between" align="center">
                                        <Stat>
                                            <StatLabel fontSize="lg">Utilisateurs</StatLabel>
                                            <StatNumber fontSize="3xl">{stats.totalUsers}</StatNumber>
                                            <StatHelpText>
                                                +{stats.newUsersLastWeek} cette semaine
                                            </StatHelpText>
                                        </Stat>
                                        <Box p={2} borderRadius="full" bg="white" opacity={0.9}>
                                            <Icon as={FiUsers} boxSize={10} color="green.500" />
                                        </Box>
                                    </Flex>
                                </CardBody>
                            </Card>

                            <Card bg={cardBg} boxShadow="md">
                                <CardBody bg={statCardRoutes} borderRadius="md">
                                    <Flex justify="space-between" align="center">
                                        <Stat>
                                            <StatLabel fontSize="lg">Itinéraires</StatLabel>
                                            <StatNumber fontSize="3xl">{stats.totalRoutes}</StatNumber>
                                            <StatHelpText>
                                                +{stats.routesLastWeek} cette semaine
                                            </StatHelpText>
                                        </Stat>
                                        <Box p={2} borderRadius="full" bg="white" opacity={0.9}>
                                            <Icon as={FaRoute} boxSize={10} color="purple.500" />
                                        </Box>
                                    </Flex>
                                </CardBody>
                            </Card>

                            <Card bg={cardBg} boxShadow="md">
                                <CardBody bg={statCardIncidents} borderRadius="md">
                                    <Flex justify="space-between" align="center">
                                        <Stat>
                                            <StatLabel fontSize="lg">Incidents totaux</StatLabel>
                                            <StatNumber fontSize="3xl">{stats.totalIncidents}</StatNumber>
                                            <StatHelpText>
                                                +{stats.incidentsLastWeek} cette semaine
                                            </StatHelpText>
                                        </Stat>
                                        <Box p={2} borderRadius="full" bg="white" opacity={0.9}>
                                            <Icon as={FaExclamationTriangle} boxSize={10} color="orange.500" />
                                        </Box>
                                    </Flex>
                                </CardBody>
                            </Card>

                            <Card bg={cardBg} boxShadow="md">
                                <CardBody bg={statCardBg} borderRadius="md">
                                    <Flex justify="space-between" align="center">
                                        <Stat>
                                            <StatLabel fontSize="lg">Incidents actifs</StatLabel>
                                            <StatNumber fontSize="3xl">{stats.activeIncidents}</StatNumber>
                                            <StatHelpText>
                                                En attente de résolution
                                            </StatHelpText>
                                        </Stat>
                                        <Box p={2} borderRadius="full" bg="white" opacity={0.9}>
                                            <Icon as={FaExclamationTriangle} boxSize={10} color="red.500" />
                                        </Box>
                                    </Flex>
                                </CardBody>
                            </Card>
                        </SimpleGrid>

                        {/* Sections récentes */}
                        <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
                            {/* Utilisateurs récents */}
                            <GridItem>
                                <Card bg={cardBg} boxShadow="md" h="100%">
                                    <CardBody>
                                        <Heading size="md" mb={4}>Utilisateurs récents</Heading>
                                        {recentData.recentUsers.slice(0, displayCount.users).map((user, index) => (
                                            <Box
                                                key={user.id || index}
                                                p={3}
                                                mb={2}
                                                borderWidth="1px"
                                                borderRadius="md"
                                                _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                                            >
                                                <Flex justify="space-between">
                                                    <Flex align="center">
                                                        <Icon as={FiUser} mr={2} color="green.500" />
                                                        <Text fontWeight="medium">{user.username}</Text>
                                                        <Text fontSize="sm" ml={2} color="gray.500">{user.email}</Text>
                                                    </Flex>
                                                    <Flex align="center">
                                                        <Icon as={FiCalendar} mr={1} color="gray.500" />
                                                        <Text fontSize="xs">{formatDate(user.createdAt)}</Text>
                                                    </Flex>
                                                </Flex>
                                            </Box>
                                        ))}
                                        {recentData.recentUsers.length > displayCount.users && (
                                            <Button
                                                mt={4}
                                                w="full"
                                                onClick={() => handleLoadMore('users')}
                                                colorScheme="blue"
                                                variant="outline"
                                            >
                                                Charger plus d'utilisateurs
                                            </Button>
                                        )}
                                    </CardBody>
                                </Card>
                            </GridItem>

                            {/* Itinéraires récents */}
                            <GridItem>
                                <Card bg={cardBg} boxShadow="md" h="100%">
                                    <CardBody>
                                        <Heading size="md" mb={4}>Itinéraires récents</Heading>
                                        {recentData.recentRoutes.slice(0, displayCount.routes).map((route, index) => (
                                            <Box
                                                key={route.id || index}
                                                p={3}
                                                mb={2}
                                                borderWidth="1px"
                                                borderRadius="md"
                                                _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                                            >
                                                <Flex justify="space-between">
                                                    <Text fontWeight="medium">{route.name}</Text>
                                                    <Text fontSize="sm" color="purple.500">
                                                        {Math.round(route.distance/1000)} km
                                                    </Text>
                                                </Flex>
                                                <Flex justify="space-between" mt={1}>
                                                    <Text fontSize="xs" color="gray.500">
                                                        {route.originName} → {route.destinationName}
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        Créé : {formatDate(route.createdAt)}
                                                    </Text>
                                                </Flex>
                                            </Box>
                                        ))}
                                        {recentData.recentRoutes.length > displayCount.routes && (
                                            <Button
                                                mt={4}
                                                w="full"
                                                onClick={() => handleLoadMore('routes')}
                                                colorScheme="blue"
                                                variant="outline"
                                            >
                                                Charger plus d'itinéraires
                                            </Button>
                                        )}
                                    </CardBody>
                                </Card>
                            </GridItem>

                            {/* Incidents récents */}
                            <GridItem colSpan={{ base: 1, lg: 2 }}>
                                <Card bg={cardBg} boxShadow="md">
                                    <CardBody>
                                        <Heading size="md" mb={4}>Incidents récents</Heading>
                                        {recentData.recentIncidents.slice(0, displayCount.incidents).map((incident, index) => (
                                            <Box
                                                key={incident.id || index}
                                                p={3}
                                                mb={2}
                                                borderWidth="1px"
                                                borderRadius="md"
                                                _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                                            >
                                                <Flex justify="space-between">
                                                    <Flex align="center">
                                                        <Icon as={FaExclamationTriangle} mr={2} color="orange.500" />
                                                        <Text fontWeight="medium">{renderType(incident.incidentType)}</Text>
                                                    </Flex>
                                                    <Text fontSize="xs" color="gray.500">
                                                        Signalé : {formatDate(incident.createdAt)}
                                                    </Text>
                                                </Flex>
                                                <Text fontSize="sm" mt={1} color="gray.600">
                                                    {incident.description}
                                                </Text>
                                            </Box>
                                        ))}
                                        {recentData.recentIncidents.length > displayCount.incidents && (
                                            <Button
                                                mt={4}
                                                w="full"
                                                onClick={() => handleLoadMore('incidents')}
                                                colorScheme="blue"
                                                variant="outline"
                                            >
                                                Charger plus d'incidents
                                            </Button>
                                        )}
                                    </CardBody>
                                </Card>
                            </GridItem>
                        </Grid>
                    </>
                )}
            </Box>
        </AdminLayout>
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
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        const userResponse = await axios.get(`${process.env.API_URL}/api/auth/users`, config);

        const routesResponse = await axios.get(
            `${process.env.API_URL}/api/navigation/routes/user`,
            config
        );

        const newRoutesLastWeek = routesResponse.data.data.routes.filter((route: any) => {
            const createdAt = new Date(route.createdAt);
            const now = new Date();
            const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
            return createdAt >= oneWeekAgo;
        }).length;

        const incidentsResponse = await axios.get(
            `${process.env.API_URL}/api/navigation/traffic/reports`,
            config
        );

        const newIncidentsLastWeek = incidentsResponse.data.data.incidents.filter((incident: any) => {
            const createdAt = new Date(incident.createdAt);
            const now = new Date();
            const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
            return createdAt >= oneWeekAgo;
        }).length;

        const newUserLastWeek = userResponse.data.data.users.filter((user: any) => {
            const createdAt = new Date(user.createdAt);
            const now = new Date();
            const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
            return createdAt >= oneWeekAgo;
        }).length;

        const adminStats: AdminDashboardStats = {
            totalUsers: userResponse.data.data.users.length,
            activeUsers: userResponse.data.data.users.filter((user: any) => user.active).length,
            newUsersLastWeek: newUserLastWeek,
            totalRoutes: routesResponse.data.data.routes.length,
            routesLastWeek: newRoutesLastWeek,
            totalIncidents: incidentsResponse.data.data.incidents.length,
            activeIncidents: incidentsResponse.data.data.incidents.filter((incident: any) => incident.active).length,
            incidentsLastWeek: newIncidentsLastWeek
        };

        const recentData: RecentData = {
            recentUsers: userResponse.data.data.users.slice(0, 10),
            recentRoutes: routesResponse.data.data.routes.slice(0, 10),
            recentIncidents: incidentsResponse.data.data.incidents
        };

        return {
            props: {
                initialStats: adminStats,
                initialRecentData: recentData
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

        // Pour les autres erreurs, afficher le dashboard avec des données vides
        return {
            props: {
                initialStats: {
                    totalUsers: 0,
                    activeUsers: 0,
                    newUsersLastWeek: 0,
                    totalRoutes: 0,
                    routesLastWeek: 0,
                    totalIncidents: 0,
                    activeIncidents: 0,
                    incidentsLastWeek: 0
                },
                initialRecentData: {
                    recentUsers: [],
                    recentRoutes: [],
                    recentIncidents: []
                }
            },
        };
    }
};

export default AdminDashboard;