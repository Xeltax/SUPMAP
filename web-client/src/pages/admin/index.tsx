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
                                        {recentData.recentUsers.length > 0 ? (
                                            recentData.recentUsers.map((user, index) => (
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
                                            ))
                                        ) : (
                                            <Text color="gray.500">Aucun utilisateur récent</Text>
                                        )}
                                    </CardBody>
                                </Card>
                            </GridItem>

                            {/* Itinéraires récents */}
                            <GridItem>
                                <Card bg={cardBg} boxShadow="md" h="100%">
                                    <CardBody>
                                        <Heading size="md" mb={4}>Itinéraires récents</Heading>
                                        {recentData.recentRoutes.length > 0 ? (
                                            recentData.recentRoutes.map((route, index) => (
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
                                            ))
                                        ) : (
                                            <Text color="gray.500">Aucun itinéraire récent</Text>
                                        )}
                                    </CardBody>
                                </Card>
                            </GridItem>

                            {/* Incidents récents */}
                            <GridItem colSpan={{ base: 1, lg: 2 }}>
                                <Card bg={cardBg} boxShadow="md">
                                    <CardBody>
                                        <Heading size="md" mb={4}>Incidents récents</Heading>
                                        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                                            {recentData.recentIncidents.length > 0 ? (
                                                recentData.recentIncidents.map((incident, index) => (
                                                    <Box
                                                        key={incident.id || index}
                                                        p={3}
                                                        borderWidth="1px"
                                                        borderRadius="md"
                                                        bg={incident.active ? "orange.50" : "gray.50"}
                                                        _dark={{ bg: incident.active ? "orange.900" : "gray.700" }}
                                                        borderLeftWidth="4px"
                                                        borderLeftColor={incident.active ? "orange.500" : "gray.400"}
                                                    >
                                                        <Flex justify="space-between" align="center">
                                                            <Heading size="sm">{renderType(incident.incidentType)}</Heading>
                                                            <Text
                                                                fontSize="xs"
                                                                px={2}
                                                                py={1}
                                                                borderRadius="full"
                                                                bg={incident.active ? "orange.200" : "gray.200"}
                                                                _dark={{ bg: incident.active ? "orange.700" : "gray.600" }}
                                                            >
                                                                {incident.active ? "Actif" : "Résolu"}
                                                            </Text>
                                                        </Flex>
                                                        <Text mt={1} fontSize="sm">{incident.description || "Aucune description"}</Text>
                                                        <Flex justify="space-between" mt={2}>
                                                            <Text fontSize="xs" color="gray.500">
                                                                Signalé par: {incident.username || "Anonyme"}
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.500">
                                                                {formatDate(incident.createdAt)}
                                                            </Text>
                                                        </Flex>
                                                    </Box>
                                                ))
                                            ) : (
                                                <Text color="gray.500" gridColumn="span 2">Aucun incident récent</Text>
                                            )}
                                        </Grid>
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
            recentUsers: userResponse.data.data.users,
            recentRoutes: routesResponse.data.data.routes,
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