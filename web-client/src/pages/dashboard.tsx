import React from 'react';
import { GetServerSideProps } from 'next';
import {
    Box,
    Grid,
    GridItem,
    Heading,
    Text,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    SimpleGrid,
    Card,
    CardHeader,
    CardBody,
    Button,
    Icon,
    Flex,
    useColorModeValue
} from '@chakra-ui/react';
import { FaRoute, FaExclamationTriangle, FaCar, FaMapMarkedAlt } from 'react-icons/fa';
import NextLink from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';
import api from "@/services/api";

// Types
interface DashboardProps {
    userData: {
        username: string;
    };
    stats: {
        savedRoutes: number;
        reportedIncidents: number;
        activeIncidents: number;
    };
    recentRoutes: any[];
}

const Dashboard = ({ userData, stats, recentRoutes }: DashboardProps) => {
    const router = useRouter();
    const cardBg = useColorModeValue('white', 'gray.800');
    const statCardBg = useColorModeValue('blue.50', 'blue.900');

    return (
        <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
            <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={6}>
                {/* Section de bienvenue */}
                <GridItem colSpan={{ base: 1, md: 2 }}>
                    <Card bg={cardBg} boxShadow="md" mb={6}>
                        <CardBody>
                            <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between">
                                <Box>
                                    <Heading size="lg" mb={2}>Bienvenue, {userData.username} 👋</Heading>
                                    <Text color="gray.500">Voici le résumé de votre activité Trafine</Text>
                                </Box>
                                <Button
                                    as={NextLink}
                                    href="/map"
                                    colorScheme="blue"
                                    size="lg"
                                    leftIcon={<FaMapMarkedAlt />}
                                    mt={{ base: 4, md: 0 }}
                                >
                                    Ouvrir la carte
                                </Button>
                            </Flex>
                        </CardBody>
                    </Card>
                </GridItem>

                {/* Statistiques */}
                <GridItem colSpan={1}>
                    <Card bg={cardBg} boxShadow="md" height="100%">
                        <CardHeader>
                            <Heading size="md">Vos statistiques</Heading>
                        </CardHeader>
                        <CardBody>
                            <SimpleGrid columns={{ base: 1, sm: 3, md: 1 }} spacing={4}>
                                <Stat bg={statCardBg} p={4} borderRadius="md">
                                    <StatLabel display="flex" alignItems="center">
                                        <Icon as={FaRoute} mr={2} /> Itinéraires sauvegardés
                                    </StatLabel>
                                    <StatNumber>{stats.savedRoutes}</StatNumber>
                                    <StatHelpText>
                                        <NextLink href="/routes" passHref>
                                            <Button size="sm" colorScheme="blue" variant="ghost">
                                                Voir tous
                                            </Button>
                                        </NextLink>
                                    </StatHelpText>
                                </Stat>

                                <Stat bg={statCardBg} p={4} borderRadius="md">
                                    <StatLabel display="flex" alignItems="center">
                                        <Icon as={FaExclamationTriangle} mr={2} /> Signalements créés
                                    </StatLabel>
                                    <StatNumber>{stats.reportedIncidents}</StatNumber>
                                    <StatHelpText>
                                        <NextLink href="/incidents" passHref>
                                            <Button size="sm" colorScheme="blue" variant="ghost">
                                                Voir tous
                                            </Button>
                                        </NextLink>
                                    </StatHelpText>
                                </Stat>
                            </SimpleGrid>
                        </CardBody>
                    </Card>
                </GridItem>

                {/* Itinéraires récents */}
                <GridItem colSpan={1}>
                    <Card bg={cardBg} boxShadow="md">
                        <CardHeader>
                            <Flex justify="space-between" align="center">
                                <Heading size="md">Itinéraires récents</Heading>
                                <Button
                                    as={NextLink}
                                    href="/routes"
                                    colorScheme="blue"
                                    variant="ghost"
                                    size="sm"
                                >
                                    Voir tous
                                </Button>
                            </Flex>
                        </CardHeader>
                        <CardBody>
                            {recentRoutes.length > 0 ? (
                                <SimpleGrid columns={1} spacing={4}>
                                    {recentRoutes.map((route) => (
                                        <Box
                                            key={route.id}
                                            p={4}
                                            borderWidth="1px"
                                            borderRadius="md"
                                            _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                                            cursor="pointer"
                                            onClick={() => router.push(`/routes/${route.id}`)}
                                        >
                                            <Heading size="sm" mb={2}>{route.name}</Heading>
                                            <Flex color="gray.500" fontSize="sm">
                                                <Text mr={4}>
                                                    <Icon as={FaRoute} mr={1} />
                                                    {Math.round(route.distance/1000)} km
                                                </Text>
                                                <Text>
                                                    {Math.floor(route.duration/60)} min
                                                </Text>
                                            </Flex>
                                            <Flex justify="space-between" mt={2}>
                                                <Text fontSize="xs" fontWeight="bold" color="gray.500">
                                                    De: {route.originName}
                                                </Text>
                                                <Text fontSize="xs" fontWeight="bold" color="gray.500">
                                                    À: {route.destinationName}
                                                </Text>
                                            </Flex>
                                        </Box>
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <Box textAlign="center" py={6}>
                                    <Text mb={4} color="gray.500">Vous n&apos;avez pas encore d&apos;itinéraires sauvegardés</Text>
                                    <Button
                                        as={NextLink}
                                        href="/map"
                                        colorScheme="blue"
                                        leftIcon={<FaMapMarkedAlt />}
                                    >
                                        Créer un itinéraire
                                    </Button>
                                </Box>
                            )}
                        </CardBody>
                    </Card>
                </GridItem>

                {/* Actions rapides */}
                <GridItem colSpan={{ base: 1, md: 2 }}>
                    <Card bg={cardBg} boxShadow="md">
                        <CardHeader>
                            <Heading size="md">Actions rapides</Heading>
                        </CardHeader>
                        <CardBody>
                            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                                <Button
                                    as={NextLink}
                                    href="/map"
                                    h="100px"
                                    colorScheme="blue"
                                    leftIcon={<FaMapMarkedAlt size={20} />}
                                >
                                    Explorer la carte
                                </Button>
                                <Button
                                    as={NextLink}
                                    href="/routes/new"
                                    h="100px"
                                    colorScheme="green"
                                    leftIcon={<FaRoute size={20} />}
                                >
                                    Nouvel itinéraire
                                </Button>
                                <Button
                                    as={NextLink}
                                    href="/incidents/report"
                                    h="100px"
                                    colorScheme="orange"
                                    leftIcon={<FaExclamationTriangle size={20} />}
                                >
                                    Signaler un incident
                                </Button>
                            </Grid>
                        </CardBody>
                    </Card>
                </GridItem>
            </Grid>
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

        // Récupération des itinéraires récents
        const routesResponse = await axios.get(
            `${process.env.API_URL}/api/navigation/routes/user?limit=3&sort=lastUsed`,
            config
        );

        const incidentsResponse = await axios.get(
            `${process.env.API_URL}/api/navigation/traffic/reports`,
            {...config, params : { userId : userResponse.data.data.user.id }}
        );
        // Récupération des statistiques (incidents signalés, etc.)
        // Note: Cette partie nécessiterait les endpoints correspondants
        // Pour l'exemple, nous utilisons des données fictives

        return {
            props: {
                userData: userResponse.data.data.user,
                stats: {
                    savedRoutes: routesResponse.data.data.routes.length,
                    reportedIncidents: incidentsResponse.data.data.incidents.length,  // Données fictives
                },
                recentRoutes: routesResponse.data.data.routes || [],
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
                userData: { username: "Utilisateur" },
                stats: {
                    savedRoutes: 0,
                    reportedIncidents: 0,
                    activeIncidents: 0,
                },
                recentRoutes: [],
            },
        };
    }
};

export default Dashboard;