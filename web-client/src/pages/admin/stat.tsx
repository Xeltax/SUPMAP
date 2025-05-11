// pages/admin/stats.tsx
import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import {
    Box,
    Heading,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Flex,
    Text,
    useColorModeValue,
    Select,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Card,
    CardBody,
    CardHeader,
    Stack,
    StackDivider,
    Icon,
    HStack,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Badge,
    Center,
    Spinner,
    List,
    ListItem,
    ListIcon
} from '@chakra-ui/react';
import {
    FiUsers,
    FiArrowUp,
    FiArrowDown,
    FiCalendar,
    FiDownload,
    FiRefreshCw,
    FiMapPin,
    FiActivity,
    FiBarChart2,
    FiCheckCircle
} from 'react-icons/fi';
import {
    FaRoute,
    FaExclamationTriangle,
    FaMapMarkedAlt,
    FaCarCrash,
    FaTools,
    FaCalendarAlt
} from 'react-icons/fa';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import api from '@/services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
);

interface User {
    id: string;
    username: string;
    createdAt: string;
    lastLogin?: string;
}

interface Route {
    id: string;
    userId: string;
    name: string;
    originName: string;
    destinationName: string;
    distance: number;
    duration: number;
    routeType: string;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
    lastUsed: string;
    usageCount: number;
}

interface Incident {
    id: string;
    incidentType: string;
    description: string;
    coordinates: [number, number];
    severity: 'low' | 'moderate' | 'high' | 'severe';
    active: boolean;
    userId: string;
    username: string;
    createdAt: string;
    updatedAt?: string;
    expiresAt?: string;
    validations: number;
    invalidations: number;
    isVerified: boolean;
}

// Types pour les statistiques générales
interface GeneralStats {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    usersGrowthRate: number;
    totalRoutes: number;
    newRoutesThisMonth: number;
    routesGrowthRate: number;
    totalIncidents: number;
    activeIncidents: number;
    newIncidentsThisMonth: number;
    incidentsGrowthRate: number;
}

// Types pour les données mensuelles
interface MonthlyData {
    month: string;
    users: number;
    routes: number;
    incidents: number;
    activeUsers: number;
    activeUsersPercentage: number;
    routeTypes: {
        fastest: number;
        shortest: number;
        eco: number;
        thrilling: number;
    };
    incidentTypes: {
        accident: number;
        construction: number;
        roadClosed: number;
        other: number;
    };
    incidentSeverity: {
        low: number;
        medium: number;
        high: number;
    };
}

// Types pour les statistiques d'utilisation
interface UsageStats {
    activeUsersLast30Days: number;
    averageRoutesPerUser: number;
    averageIncidentsPerUser: number;
    dailyAverageNewUsers: number;
    dailyAverageNewRoutes: number;
    dailyAverageNewIncidents: number;
    routeTypeDistribution: { type: string; count: number; percentage: number }[];
    incidentTypeDistribution: { type: string; count: number; percentage: number }[];
}

// Types pour les données de la page
interface StatsPageProps {
    generalStats: GeneralStats;
    usageStats: UsageStats;
    topRoutes: any[];
    topIncidents: any[];
    topUsers: any[];
    monthlyData: MonthlyData[];
}

interface UserStats {
    id: string;
    username: string;
    routesCount: number;
    incidentsCount: number;
    lastLogin: string;
}

// Composant principal
const StatsPage = ({
                       generalStats,
                       usageStats,
                       topRoutes,
                       topIncidents,
    topUsers,
    monthlyData
                   }: StatsPageProps) => {
    const [loading, setLoading] = useState<boolean>(false);

    // Couleurs adaptives pour le mode clair/sombre
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const statBg = useColorModeValue('blue.50', 'blue.900');
    const textMuted = useColorModeValue('gray.600', 'gray.400');

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

    const translateSeverity = (severity: string) => {
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

    // Formater le nombre avec un séparateur de milliers
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('fr-FR').format(num);
    };

    // Formater la date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    // Rafraîchir les données
    const handleRefresh = () => {
        setLoading(true);
        // Simuler une actualisation des données
        setTimeout(() => {
            setLoading(false);
        }, 1500);
    };

    // Exporter les données en CSV (exemple fictif)
    const handleExportData = () => {
        // Implémentation réelle : génération d'un fichier CSV
        alert('Export de données en CSV (fonctionnalité à implémenter)');
    };

    // Configuration des graphiques
    const monthlyEvolutionOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Évolution mensuelle',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    const monthlyEvolutionData = {
        labels: monthlyData.map(data => data.month),
        datasets: [
            {
                label: 'Utilisateurs',
                data: monthlyData.map(data => data.users),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
            {
                label: 'Itinéraires',
                data: monthlyData.map(data => data.routes),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
            {
                label: 'Incidents',
                data: monthlyData.map(data => data.incidents),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
        ],
    };

    const userEvolutionOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Évolution des utilisateurs',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    const userEvolutionData = {
        labels: monthlyData.map(data => data.month),
        datasets: [
            {
                label: 'Nombre d\'utilisateurs',
                data: monthlyData.map(data => data.users),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                fill: true,
            },
            {
                label: 'Utilisateurs actifs',
                data: monthlyData.map(data => data.activeUsers),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                fill: true,
            },
        ],
    };

    const routeEvolutionOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Évolution des itinéraires par type',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                stacked: true,
                max: Math.max(...monthlyData.map(data => 
                    data.routeTypes.fastest + data.routeTypes.shortest + data.routeTypes.eco + data.routeTypes.thrilling
                )),
                min: 0
            },
            x: {
                stacked: true,
            },
        },
    };

    const routeEvolutionData = {
        labels: monthlyData.map(data => data.month),
        datasets: [
            {
                label: 'Plus rapide',
                data: monthlyData.map(data => data.routeTypes.fastest),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1,
            },
            {
                label: 'Plus court',
                data: monthlyData.map(data => data.routeTypes.shortest),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1,
            },
            {
                label: 'Éco',
                data: monthlyData.map(data => data.routeTypes.eco),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1,
            },
            {
                label: 'Pittoresque',
                data: monthlyData.map(data => data.routeTypes.thrilling),
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                borderColor: 'rgb(153, 102, 255)',
                borderWidth: 1,
            },
        ],
    };

    const incidentEvolutionOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Évolution des incidents',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    const incidentEvolutionData = {
        labels: monthlyData.map(data => data.month),
        datasets: [
            {
                label: 'Accidents',
                data: monthlyData.map(data => data.incidentTypes.accident),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1,
            },
            {
                label: 'Travaux',
                data: monthlyData.map(data => data.incidentTypes.construction),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1,
            },
            {
                label: 'Route fermée',
                data: monthlyData.map(data => data.incidentTypes.roadClosed),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1,
            },
            {
                label: 'Autres',
                data: monthlyData.map(data => data.incidentTypes.other),
                backgroundColor: 'rgba(201, 203, 207, 0.5)',
                borderColor: 'rgb(201, 203, 207)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <AdminLayout>
            <Box maxW="7xl" mx="auto">
                <Flex
                    justify="space-between"
                    align={{ base: "flex-start", md: "center" }}
                    mb={6}
                    direction={{ base: "column", md: "row" }}
                    gap={{ base: 4, md: 0 }}
                >
                    <Heading>Statistiques</Heading>

                    <HStack spacing={4}>
                        <Button
                            leftIcon={<FiRefreshCw />}
                            colorScheme="blue"
                            variant="outline"
                            isLoading={loading}
                            onClick={handleRefresh}
                        >
                            Actualiser
                        </Button>

                        <Button
                            leftIcon={<FiDownload />}
                            colorScheme="blue"
                            onClick={handleExportData}
                        >
                            Exporter
                        </Button>
                    </HStack>
                </Flex>

                {loading ? (
                    <Center h="500px">
                        <Spinner size="xl" color="blue.500" />
                    </Center>
                ) : (
                    <Tabs colorScheme="blue" variant="enclosed">
                        <TabList>
                            <Tab><Icon as={FiBarChart2} mr={2} /> Vue d'ensemble</Tab>
                            <Tab><Icon as={FiUsers} mr={2} /> Utilisateurs</Tab>
                            <Tab><Icon as={FaRoute} mr={2} /> Itinéraires</Tab>
                            <Tab><Icon as={FaExclamationTriangle} mr={2} /> Incidents</Tab>
                        </TabList>

                        <TabPanels>
                            {/* Vue d'ensemble */}
                            <TabPanel>
                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                                    <StatCard
                                        label="Utilisateurs"
                                        value={formatNumber(generalStats.totalUsers)}
                                        helpText={`+${generalStats.newUsersThisMonth} ce mois-ci`}
                                        icon={FiUsers}
                                        change={generalStats.usersGrowthRate}
                                        colorScheme="blue"
                                    />

                                    <StatCard
                                        label="Itinéraires"
                                        value={formatNumber(generalStats.totalRoutes)}
                                        helpText={`+${generalStats.newRoutesThisMonth} ce mois-ci`}
                                        icon={FaRoute}
                                        change={generalStats.routesGrowthRate}
                                        colorScheme="purple"
                                    />

                                    <StatCard
                                        label="Incidents"
                                        value={formatNumber(generalStats.totalIncidents)}
                                        helpText={`${generalStats.activeIncidents} incidents actifs`}
                                        icon={FaExclamationTriangle}
                                        change={generalStats.incidentsGrowthRate}
                                        colorScheme="orange"
                                    />
                                </SimpleGrid>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
                                    {/* Graphique d'évolution mensuelle (placeholder) */}
                                    <Card bg={cardBg}>
                                        <CardHeader>
                                            <Heading size="md">Évolution mensuelle</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <Center h="200px" color={textMuted}>
                                                <Line options={monthlyEvolutionOptions} data={monthlyEvolutionData} />
                                            </Center>
                                        </CardBody>
                                    </Card>

                                    {/* Statistiques d'utilisation */}
                                    <Card bg={cardBg}>
                                        <CardHeader>
                                            <Heading size="md">Statistiques d'utilisation</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <Stack divider={<StackDivider borderColor={borderColor} />} spacing={4}>
                                                <UsageStat
                                                    label="Utilisateurs actifs (30j)"
                                                    value={formatNumber(usageStats.activeUsersLast30Days)}
                                                    icon={FiActivity}
                                                />
                                                <UsageStat
                                                    label="Routes par utilisateur"
                                                    value={usageStats.averageRoutesPerUser.toFixed(1)}
                                                    icon={FaRoute}
                                                />
                                                <UsageStat
                                                    label="Incidents par utilisateur"
                                                    value={usageStats.averageIncidentsPerUser.toFixed(1)}
                                                    icon={FaExclamationTriangle}
                                                />
                                            </Stack>
                                        </CardBody>
                                    </Card>
                                </SimpleGrid>

                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                                    {/* Top routes */}
                                    <Card bg={cardBg}>
                                        <CardHeader>
                                            <Heading size="md">Itinéraires populaires</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <List spacing={3}>
                                                {topRoutes.slice(0, 5).map((route, index) => (
                                                    <ListItem key={route.id} display="flex" alignItems="center">
                                                        <Badge
                                                            colorScheme="purple"
                                                            borderRadius="full"
                                                            mr={2}
                                                            w="20px"
                                                            h="20px"
                                                            display="flex"
                                                            alignItems="center"
                                                            justifyContent="center"
                                                        >
                                                            {index + 1}
                                                        </Badge>
                                                        <Box flex="1">
                                                            <Text noOfLines={1} fontWeight="medium">
                                                            {route.name}
                                                        </Text>
                                                            <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                                                {route.originName} → {route.destinationName}
                                                            </Text>
                                                        </Box>
                                                        <Badge colorScheme="blue" variant="outline">
                                                            {route.usageCount}
                                                        </Badge>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </CardBody>
                                    </Card>

                                    {/* Top incidents */}
                                    <Card bg={cardBg}>
                                        <CardHeader>
                                            <Heading size="md">Incidents récents</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <List spacing={3}>
                                                {topIncidents.slice(0, 5).map((incident) => (
                                                    <ListItem key={incident.id} display="flex" alignItems="center">
                                                        <ListIcon
                                                            as={FaExclamationTriangle}
                                                            color={
                                                                incident.severity === 'critical' ? 'red.500' :
                                                                    incident.severity === 'high' ? 'orange.500' :
                                                                        incident.severity === 'medium' ? 'yellow.500' : 'green.500'
                                                            }
                                                        />
                                                        <Text noOfLines={1} flex="1">
                                                            {incident.incidentType}
                                                        </Text>
                                                        <Badge
                                                            colorScheme={
                                                                incident.status === 'active' ? 'orange' :
                                                                    incident.status === 'resolved' ? 'green' : 'yellow'
                                                            }
                                                        >
                                                            {incident.status === 'active' ? 'Actif' :
                                                                incident.status === 'resolved' ? 'Résolu' : 'En attente'}
                                                        </Badge>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </CardBody>
                                    </Card>

                                    {/* Top utilisateurs */}
                                    <Card bg={cardBg}>
                                        <CardHeader>
                                            <Heading size="md">Utilisateurs actifs</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <List spacing={3}>
                                                {topUsers.slice(0, 5).map((user, index) => (
                                                    <ListItem key={user.id} display="flex" alignItems="center">
                                                        <Badge
                                                            colorScheme="blue"
                                                            borderRadius="full"
                                                            mr={2}
                                                            w="20px"
                                                            h="20px"
                                                            display="flex"
                                                            alignItems="center"
                                                            justifyContent="center"
                                                        >
                                                            {index + 1}
                                                        </Badge>
                                                        <Text noOfLines={1} flex="1">
                                                            {user.username}
                                                        </Text>
                                                        <HStack spacing={2}>
                                                            <Badge colorScheme="purple" variant="outline">
                                                                {user.routesCount} 🛣️
                                                            </Badge>
                                                            <Badge colorScheme="orange" variant="outline">
                                                                {user.incidentsCount} ⚠️
                                                            </Badge>
                                                        </HStack>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </CardBody>
                                    </Card>
                                </SimpleGrid>
                            </TabPanel>

                            {/* Utilisateurs */}
                            <TabPanel>
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
                                    <StatCard
                                        label="Total des utilisateurs"
                                        value={formatNumber(generalStats.totalUsers)}
                                        helpText={`+${generalStats.newUsersThisMonth} ce mois-ci`}
                                        icon={FiUsers}
                                        change={generalStats.usersGrowthRate}
                                        colorScheme="blue"
                                    />

                                    <StatCard
                                        label="Utilisateurs actifs"
                                        value={formatNumber(generalStats.activeUsers)}
                                        helpText={`${Math.round((generalStats.activeUsers / generalStats.totalUsers) * 100)}% du total`}
                                        icon={FiActivity}
                                        colorScheme="green"
                                    />

                                    <StatCard
                                        label="Nouveaux utilisateurs / jour"
                                        value={usageStats.dailyAverageNewUsers.toFixed(1)}
                                        helpText="Moyenne sur 30 jours"
                                        icon={FiCalendar}
                                        colorScheme="blue"
                                    />

                                    <StatCard
                                        label="Taux de croissance"
                                        value={`${generalStats.usersGrowthRate}%`}
                                        helpText="Par rapport au mois précédent"
                                        icon={FiArrowUp}
                                        colorScheme={generalStats.usersGrowthRate >= 0 ? "green" : "red"}
                                    />
                                </SimpleGrid>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
                                    {/* Graphique d'évolution des utilisateurs (placeholder) */}
                                    <Card bg={cardBg}>
                                        <CardHeader>
                                            <Heading size="md">Évolution des utilisateurs</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <Center h="300px" color={textMuted}>
                                                <Line options={userEvolutionOptions} data={userEvolutionData} />
                                            </Center>
                                        </CardBody>
                                    </Card>

                                    {/* Top 10 utilisateurs actifs */}
                                    <Card bg={cardBg}>
                                        <CardHeader>
                                            <Heading size="md">Top 10 utilisateurs actifs</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <TableContainer>
                                                <Table variant="simple" size="sm">
                                                    <Thead>
                                                        <Tr>
                                                            <Th>Utilisateur</Th>
                                                            <Th isNumeric>Itinéraires</Th>
                                                            <Th isNumeric>Incidents</Th>
                                                            <Th>Dernière connexion</Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {topUsers.map((user) => (
                                                            <Tr key={user.id}>
                                                                <Td fontWeight="medium">{user.username}</Td>
                                                                <Td isNumeric>{user.routesCount}</Td>
                                                                <Td isNumeric>{user.incidentsCount}</Td>
                                                                <Td fontSize="sm">{formatDate(user.lastLogin)}</Td>
                                                            </Tr>
                                                        ))}
                                                    </Tbody>
                                                </Table>
                                            </TableContainer>
                                        </CardBody>
                                    </Card>
                                </SimpleGrid>
                            </TabPanel>

                            {/* Itinéraires */}
                            <TabPanel>
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
                                    <StatCard
                                        label="Total des itinéraires"
                                        value={formatNumber(generalStats.totalRoutes)}
                                        helpText={`+${generalStats.newRoutesThisMonth} ce mois-ci`}
                                        icon={FaRoute}
                                        change={generalStats.routesGrowthRate}
                                        colorScheme="purple"
                                    />

                                    <StatCard
                                        label="Itinéraires par utilisateur"
                                        value={usageStats.averageRoutesPerUser.toFixed(1)}
                                        helpText="Moyenne globale"
                                        icon={FiUsers}
                                        colorScheme="blue"
                                    />

                                    <StatCard
                                        label="Nouveaux itinéraires / jour"
                                        value={usageStats.dailyAverageNewRoutes.toFixed(1)}
                                        helpText="Moyenne sur 30 jours"
                                        icon={FiCalendar}
                                        colorScheme="purple"
                                    />

                                    <StatCard
                                        label="Taux de croissance"
                                        value={`${generalStats.routesGrowthRate}%`}
                                        helpText="Par rapport au mois précédent"
                                        icon={FiArrowUp}
                                        colorScheme={generalStats.routesGrowthRate >= 0 ? "green" : "red"}
                                    />
                                </SimpleGrid>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
                                    {/* Distribution des types d'itinéraires */}
                                    <Card bg={cardBg}>
                                        <CardHeader>
                                            <Heading size="md">Distribution des types d'itinéraires</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <TableContainer>
                                                <Table variant="simple" size="sm">
                                                    <Thead>
                                                        <Tr>
                                                            <Th>Type d'itinéraire</Th>
                                                            <Th isNumeric>Nombre</Th>
                                                            <Th isNumeric>Pourcentage</Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {usageStats.routeTypeDistribution.map((item) => (
                                                            <Tr key={item.type}>
                                                                <Td fontWeight="medium">{item.type}</Td>
                                                                <Td isNumeric>{item.count}</Td>
                                                                <Td isNumeric>{item.percentage}%</Td>
                                                            </Tr>
                                                        ))}
                                                    </Tbody>
                                                </Table>
                                            </TableContainer>
                                        </CardBody>
                                    </Card>

                                    {/* Graphique des itinéraires (placeholder) */}
                                    <Card bg={cardBg}>
                                        <CardHeader>
                                            <Heading size="md">Évolution des itinéraires</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <Center h="300px" color={textMuted}>
                                                <Bar options={routeEvolutionOptions} data={routeEvolutionData} />
                                            </Center>
                                        </CardBody>
                                    </Card>
                                </SimpleGrid>

                                {/* Top 10 itinéraires populaires */}
                                <Card bg={cardBg} mb={8}>
                                    <CardHeader>
                                        <Heading size="md">Top 10 itinéraires populaires</Heading>
                                    </CardHeader>
                                    <CardBody>
                                        <TableContainer>
                                            <Table variant="simple" size="sm">
                                                <Thead>
                                                    <Tr>
                                                        <Th>Nom</Th>
                                                        <Th>Route</Th>
                                                        <Th>Créé par</Th>
                                                        <Th isNumeric>Distance</Th>
                                                        <Th isNumeric>Utilisations</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {topRoutes.map((route) => (
                                                        <Tr key={route.id}>
                                                            <Td fontWeight="medium">{route.name}</Td>
                                                            <Td>{route.originName} → {route.destinationName}</Td>
                                                            <Td>{route.username}</Td>
                                                            <Td isNumeric>{(route.distance / 1000).toFixed(1)} km</Td>
                                                            <Td isNumeric>
                                                                <Badge colorScheme="blue">{route.usageCount}</Badge>
                                                            </Td>
                                                        </Tr>
                                                    ))}
                                                </Tbody>
                                            </Table>
                                        </TableContainer>
                                    </CardBody>
                                </Card>
                            </TabPanel>

                            {/* Incidents */}
                            <TabPanel>
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
                                    <StatCard
                                        label="Total des incidents"
                                        value={formatNumber(generalStats.totalIncidents)}
                                        helpText={`+${generalStats.newIncidentsThisMonth} ce mois-ci`}
                                        icon={FaExclamationTriangle}
                                        change={generalStats.incidentsGrowthRate}
                                        colorScheme="orange"
                                    />

                                    <StatCard
                                        label="Incidents actifs"
                                        value={formatNumber(generalStats.activeIncidents)}
                                        helpText={`${Math.round((generalStats.activeIncidents / generalStats.totalIncidents) * 100)}% du total`}
                                        icon={FiActivity}
                                        colorScheme="red"
                                    />

                                    <StatCard
                                        label="Incidents par utilisateur"
                                        value={usageStats.averageIncidentsPerUser.toFixed(2)}
                                        helpText="Moyenne globale"
                                        icon={FiUsers}
                                        colorScheme="blue"
                                    />

                                    <StatCard
                                        label="Nouveaux incidents / jour"
                                        value={usageStats.dailyAverageNewIncidents.toFixed(1)}
                                        helpText="Moyenne sur 30 jours"
                                        icon={FiCalendar}
                                        colorScheme="orange"
                                    />
                                </SimpleGrid>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
                                    {/* Distribution des types d'incidents */}
                                    <Card bg={cardBg}>
                                        <CardHeader>
                                            <Heading size="md">Distribution des types d'incidents</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <TableContainer>
                                                <Table variant="simple" size="sm">
                                                    <Thead>
                                                        <Tr>
                                                            <Th>Type d'incident</Th>
                                                            <Th isNumeric>Nombre</Th>
                                                            <Th isNumeric>Pourcentage</Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {usageStats.incidentTypeDistribution.map((item) => (
                                                            <Tr key={item.type}>
                                                                <Td fontWeight="medium">{item.type}</Td>
                                                                <Td isNumeric>{item.count}</Td>
                                                                <Td isNumeric>{item.percentage}%</Td>
                                                            </Tr>
                                                        ))}
                                                    </Tbody>
                                                </Table>
                                            </TableContainer>
                                        </CardBody>
                                    </Card>

                                    {/* Graphique des incidents (placeholder) */}
                                    <Card bg={cardBg}>
                                        <CardHeader>
                                            <Heading size="md">Évolution des incidents</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <Center h="300px" color={textMuted}>
                                                <Bar options={incidentEvolutionOptions} data={incidentEvolutionData} />
                                            </Center>
                                        </CardBody>
                                    </Card>
                                </SimpleGrid>

                                {/* Top 10 incidents récents */}
                                <Card bg={cardBg} mb={8}>
                                    <CardHeader>
                                        <Heading size="md">Incidents récents</Heading>
                                    </CardHeader>
                                    <CardBody>
                                        <TableContainer>
                                            <Table variant="simple" size="sm">
                                                <Thead>
                                                    <Tr>
                                                        <Th>Type</Th>
                                                        <Th>Description</Th>
                                                        <Th>Statut</Th>
                                                        <Th>Sévérité</Th>
                                                        <Th>Signalé par</Th>
                                                        <Th>Date</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {topIncidents.map((incident) => (
                                                        <Tr key={incident.id}>
                                                            <Td>
                                                                <Flex align="center">
                                                                    <Icon
                                                                        as={FaExclamationTriangle}
                                                                        color={getSeverityColor(incident.severity) + '.500'}
                                                                        mr={2}
                                                                    />
                                                                    {incident.incidentType}
                                                                </Flex>
                                                            </Td>
                                                            <Td minH="40px" display="flex" alignItems="center">
                                                                <Text noOfLines={1}>{incident.description || 'Aucune description'}</Text>
                                                            </Td>
                                                            <Td>
                                                                <Badge colorScheme={getSeverityColor(incident.severity)}>
                                                                    {translateSeverity(incident.severity)}
                                                                </Badge>
                                                            </Td>
                                                            <Td>
                                                                <Badge
                                                                    colorScheme={
                                                                        incident.status === 'active' ? 'orange' :
                                                                            incident.status === 'resolved' ? 'green' : 'yellow'
                                                                    }
                                                                >
                                                                    {incident.status === 'active' ? 'Actif' :
                                                                        incident.status === 'resolved' ? 'Résolu' : 'En attente'}
                                                                </Badge>
                                                            </Td>
                                                            <Td>{incident.username}</Td>
                                                            <Td fontSize="sm">{formatDate(incident.createdAt)}</Td>
                                                        </Tr>
                                                    ))}
                                                </Tbody>
                                            </Table>
                                        </TableContainer>
                                    </CardBody>
                                </Card>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                )}
            </Box>
        </AdminLayout>
    );
};

// Composant pour les cartes de statistiques
interface StatCardProps {
    label: string;
    value: string | number;
    helpText?: string;
    icon: React.ElementType;
    change?: number;
    colorScheme: string;
}

const StatCard = ({ label, value, helpText, icon, change, colorScheme }: StatCardProps) => {
    const bgColor = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
    const iconColor = `${colorScheme}.500`;

    return (
        <Stat
            px={4}
            py={5}
            bg={bgColor}
            borderRadius="lg"
            boxShadow="sm"
            position="relative"
            overflow="hidden"
        >
            <Box
                position="absolute"
                top={0}
                right={0}
                p={4}
                opacity={0.3}
            >
                <Icon as={icon} boxSize={12} color={iconColor} />
            </Box>
            <StatLabel fontSize="md" fontWeight="medium">{label}</StatLabel>
            <StatNumber fontSize="3xl" fontWeight="bold" my={2}>{value}</StatNumber>
            <StatHelpText mb={0}>
                {change !== undefined && (
                    <StatArrow type={change >= 0 ? 'increase' : 'decrease'} />
                )}
                {helpText}
            </StatHelpText>
        </Stat>
    );
};

// Composant pour les statistiques d'utilisation
interface UsageStatProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
}

const UsageStat = ({ label, value, icon }: UsageStatProps) => {
    return (
        <HStack>
            <Box
                p={2}
                borderRadius="md"
                bg={useColorModeValue('blue.50', 'blue.900')}
            >
                <Icon as={icon} color="blue.500" boxSize={5} />
            </Box>
            <Box>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                    {label}
                </Text>
                <Text fontWeight="bold" fontSize="lg">
                    {value}
                </Text>
            </Box>
        </HStack>
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

        // Fetch all data in parallel
        const [incidentsResponse, usersResponse, routesResponse] = await Promise.all([
            axios.get(`${process.env.API_URL}/api/navigation/traffic/reports`, config),
            axios.get(`${process.env.API_URL}/api/auth/users`, config),
            axios.get(`${process.env.API_URL}/api/navigation/routes/all`, config)
        ]);

        const incidents: Incident[] = incidentsResponse.data.data.incidents;
        const users: User[] = usersResponse.data.data.users;
        const routes: Route[] = routesResponse.data.data.routes;

        // Add username to each incident
        const incidentsWithUsers = incidents.map(incident => {
            const user = users.find(u => u.id === incident.userId);
            return {
                ...incident,
                username: user ? user.username : 'Utilisateur inconnu'
            };
        });

        // Add username to each route
        const routesWithUsers = routes.map(route => {
            const user = users.find(u => u.id === route.userId);
            return {
                ...route,
                username: user ? user.username : 'Utilisateur inconnu'
            };
        });

        // Get top 10 routes and incidents
        const topRoutes = routesWithUsers
            .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
            .slice(0, 10);

        const topIncidents = incidentsWithUsers
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);

        // Calculate route statistics
        const totalRoutes = routes.length;
        const newRoutesThisMonth = routes.filter(route => {
            const routeDate = new Date(route.createdAt);
            const now = new Date();
            return routeDate.getMonth() === now.getMonth() && 
                   routeDate.getFullYear() === now.getFullYear();
        }).length;

        // Calculate route type distribution
        const routeTypes = Array.from(new Set(routes.map(route => route.routeType)));
        const routeTypeDistribution = routeTypes.map(type => {
            const count = routes.filter(route => route.routeType === type).length;
            return {
                type,
                count,
                percentage: Math.round((count / totalRoutes) * 100)
            };
        });

        // Calculate incident statistics
        const totalIncidents = incidentsWithUsers.length;
        const activeIncidents = incidentsWithUsers.filter(incident => incident.active).length;
        const newIncidentsThisMonth = incidentsWithUsers.filter(incident => {
            const incidentDate = new Date(incident.createdAt);
            const now = new Date();
            return incidentDate.getMonth() === now.getMonth() && 
                   incidentDate.getFullYear() === now.getFullYear();
        }).length;

        // Calculate incident type distribution
        const incidentTypes = Array.from(new Set(incidentsWithUsers.map(incident => incident.incidentType)));
        const incidentTypeDistribution = incidentTypes.map(type => {
            const count = incidentsWithUsers.filter(incident => incident.incidentType === type).length;
            return {
                type,
                count,
                percentage: Math.round((count / totalIncidents) * 100)
            };
        });

        // Calculate user statistics
        const totalUsers = users.length;
        const newUsersThisMonth = users.filter((user: User) => {
            const userDate = new Date(user.createdAt);
            const now = new Date();
            return userDate.getMonth() === now.getMonth() && 
                   userDate.getFullYear() === now.getFullYear();
        }).length;

        // Calculate active users
        const activeUsers = new Set([
            ...routes.filter(route => {
                const routeDate = new Date(route.createdAt);
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                return routeDate >= thirtyDaysAgo && routeDate <= now && users.some(user => user.id === route.userId);
            }).map(route => route.userId),
            ...incidentsWithUsers.filter(incident => {
                const incidentDate = new Date(incident.createdAt);
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                return incidentDate >= thirtyDaysAgo && incidentDate <= now && 
                       incident.username !== 'Utilisateur inconnu' && 
                       users.some(user => user.id === incident.userId);
            }).map(incident => incident.userId)
        ]).size;

        // Calculate growth rates
        const lastMonthUsers = users.filter((user: User) => {
            const userDate = new Date(user.createdAt);
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return userDate >= lastMonth && userDate < now;
        }).length;

        const usersGrowthRate = lastMonthUsers > 0 
            ? ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers) * 100 
            : 0;

        const lastMonthRoutes = routes.filter(route => {
            const routeDate = new Date(route.createdAt);
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return routeDate >= lastMonth && routeDate < now;
        }).length;

        const routesGrowthRate = lastMonthRoutes > 0 
            ? ((newRoutesThisMonth - lastMonthRoutes) / lastMonthRoutes) * 100 
            : 0;

        const lastMonthIncidents = incidentsWithUsers.filter(incident => {
            const incidentDate = new Date(incident.createdAt);
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return incidentDate >= lastMonth && incidentDate < now;
        }).length;

        const incidentsGrowthRate = lastMonthIncidents > 0 
            ? ((newIncidentsThisMonth - lastMonthIncidents) / lastMonthIncidents) * 100 
            : 0;

        // Prepare top users data
        const topUsers = users.map((user: User) => {
            const userRoutes = routes.filter((route: Route) => route.userId === user.id);
            const userIncidents = incidentsWithUsers.filter((incident: Incident) => 
                incident.userId === user.id && incident.username !== 'Utilisateur inconnu'
            );
            return {
                id: user.id,
                username: user.username,
                routesCount: userRoutes.length,
                incidentsCount: userIncidents.length,
                lastLogin: user.lastLogin || user.createdAt
            };
        }).sort((a: UserStats, b: UserStats) => (b.routesCount + b.incidentsCount) - (a.routesCount + a.incidentsCount))
          .slice(0, 10);

        // General statistics
        const generalStats: GeneralStats = {
            totalUsers,
            activeUsers,
            newUsersThisMonth,
            usersGrowthRate,
            totalRoutes,
            newRoutesThisMonth,
            routesGrowthRate,
            totalIncidents,
            activeIncidents,
            newIncidentsThisMonth,
            incidentsGrowthRate
        };

        // Usage statistics
        const usageStats: UsageStats = {
            activeUsersLast30Days: activeUsers,
            averageRoutesPerUser: totalRoutes / totalUsers,
            averageIncidentsPerUser: incidentsWithUsers.filter(incident => incident.username !== 'Utilisateur inconnu').length / totalUsers,
            dailyAverageNewUsers: newUsersThisMonth / 30,
            dailyAverageNewRoutes: newRoutesThisMonth / 30,
            dailyAverageNewIncidents: newIncidentsThisMonth / 30,
            routeTypeDistribution,
            incidentTypeDistribution
        };

        // Generate monthly data from existing data
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 12 derniers mois
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const month = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
            const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

            // Filter data for this month
            const cumulativeUsers = users.filter(user => {
                const userDate = new Date(user.createdAt);
                return userDate <= monthEnd;
            });

            const monthRoutes = routes.filter(route => {
                const routeDate = new Date(route.createdAt);
                return routeDate >= monthStart && routeDate <= monthEnd;
            });

            const monthIncidents = incidentsWithUsers.filter(incident => {
                const incidentDate = new Date(incident.createdAt);
                return incidentDate >= monthStart && incidentDate <= monthEnd;
            });

            // Calculate active users for this month
            const monthActiveUsers = new Set([
                ...monthRoutes.map(route => route.userId),
                ...monthIncidents.filter(incident => incident.username !== 'Utilisateur inconnu').map(incident => incident.userId)
            ]).size;

            // Calculate route types for this month
            const routeTypes = {
                fastest: monthRoutes.filter(route => route.routeType === 'fastest').length,
                shortest: monthRoutes.filter(route => route.routeType === 'shortest').length,
                eco: monthRoutes.filter(route => route.routeType === 'eco').length,
                thrilling: monthRoutes.filter(route => route.routeType === 'thrilling').length,
            };

            // Calculate incident types for this month
            const incidentTypes = {
                accident: monthIncidents.filter(incident => incident.incidentType === 'accident').length,
                construction: monthIncidents.filter(incident => incident.incidentType === 'roadworks').length,
                roadClosed: monthIncidents.filter(incident => incident.incidentType === 'roadClosed').length,
                other: monthIncidents.filter(incident => !['accident', 'roadworks', 'roadClosed'].includes(incident.incidentType)).length,
            };

            // Calculate incident severity for this month
            const incidentSeverity = {
                low: monthIncidents.filter(incident => incident.severity === 'low').length,
                medium: monthIncidents.filter(incident => incident.severity === 'moderate').length,
                high: monthIncidents.filter(incident => incident.severity === 'high').length,
            };

            return {
                month: month.toLocaleString('fr-FR', { month: 'long' }),
                users: cumulativeUsers.length,
                routes: monthRoutes.length,
                incidents: monthIncidents.length,
                activeUsers: monthActiveUsers,
                activeUsersPercentage: cumulativeUsers.length > 0 ? Math.round((monthActiveUsers / cumulativeUsers.length) * 100) : 0,
                routeTypes,
                incidentTypes,
                incidentSeverity,
            };
        });

        return {
            props: {
                generalStats,
                usageStats,
                topRoutes,
                topIncidents,
                topUsers,
                monthlyData,
            },
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);

        // En cas d'erreur d'authentification, rediriger vers la page de connexion
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            return {
                redirect: {
                    destination: '/login',
                    permanent: false,
                },
            };
        }

        // Pour les autres erreurs, afficher une page avec des données vides
        return {
            props: {
                generalStats: {
                    totalUsers: 0,
                    activeUsers: 0,
                    newUsersThisMonth: 0,
                    usersGrowthRate: 0,
                    totalRoutes: 0,
                    newRoutesThisMonth: 0,
                    routesGrowthRate: 0,
                    totalIncidents: 0,
                    activeIncidents: 0,
                    newIncidentsThisMonth: 0,
                    incidentsGrowthRate: 0
                },
                usageStats: {
                    activeUsersLast30Days: 0,
                    averageRoutesPerUser: 0,
                    averageIncidentsPerUser: 0,
                    dailyAverageNewUsers: 0,
                    dailyAverageNewRoutes: 0,
                    dailyAverageNewIncidents: 0,
                    routeTypeDistribution: [],
                    incidentTypeDistribution: []
                },
                topRoutes: [],
                topIncidents: [],
                topUsers: [],
                monthlyData: [],
            },
        };
    }
};

export default StatsPage;