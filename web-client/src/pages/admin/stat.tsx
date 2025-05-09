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

// Types pour les données mensuelles
interface MonthlyData {
    month: string;
    users: number;
    routes: number;
    incidents: number;
    activeUsers: number;
}

// Types pour les statistiques de performance
interface PerformanceStats {
    averageResponseTime: number;
    p95ResponseTime: number;
    apiCallsPerDay: number;
    errorRate: number;
    uptime: number;
    serverLoad: number;
}

// Types pour les données de la page
interface StatsPageProps {
    generalStats: GeneralStats;
    usageStats: UsageStats;
    monthlyData: MonthlyData[];
    performanceStats: PerformanceStats;
    topRoutes: any[];
    topIncidents: any[];
    topUsers: any[];
}

// Composant principal
const StatsPage = ({
                       generalStats,
                       usageStats,
                       monthlyData,
                       performanceStats,
                       topRoutes,
                       topIncidents,
                       topUsers
                   }: StatsPageProps) => {
    const [timeRange, setTimeRange] = useState<string>('30days');
    const [loading, setLoading] = useState<boolean>(false);

    // Couleurs adaptives pour le mode clair/sombre
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const statBg = useColorModeValue('blue.50', 'blue.900');
    const textMuted = useColorModeValue('gray.600', 'gray.400');

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
                        <Select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            width={{ base: 'full', md: '180px' }}
                            size="md"
                        >
                            <option value="7days">7 derniers jours</option>
                            <option value="30days">30 derniers jours</option>
                            <option value="90days">90 derniers jours</option>
                            <option value="year">Année en cours</option>
                            <option value="alltime">Toutes les données</option>
                        </Select>

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
                            <Tab><Icon as={FiActivity} mr={2} /> Performance</Tab>
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
                                                [Graphique d'évolution mensuelle]
                                            </Center>
                                            <Text fontSize="sm" color={textMuted} mt={2}>
                                                L'utilisation de l'application augmente de manière constante avec une croissance de {generalStats.usersGrowthRate}% d'utilisateurs ce mois-ci.
                                            </Text>
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
                                                <UsageStat
                                                    label="Uptime du serveur"
                                                    value={`${performanceStats.uptime.toFixed(2)}%`}
                                                    icon={FiCheckCircle}
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
                                                        <Text noOfLines={1} flex="1">
                                                            {route.name}
                                                        </Text>
                                                        <Badge colorScheme="blue" variant="outline" ml={2}>
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
                                                [Graphique d'évolution des utilisateurs]
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
                                                [Graphique d'évolution des itinéraires]
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
                                                [Graphique d'évolution des incidents]
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
                                                            <Td fontWeight="medium">{incident.incidentType}</Td>
                                                            <Td noOfLines={1}>{incident.description}</Td>
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
                                                            <Td>
                                                                <Badge
                                                                    colorScheme={
                                                                        incident.severity === 'critical' ? 'red' :
                                                                            incident.severity === 'high' ? 'orange' :
                                                                                incident.severity === 'medium' ? 'yellow' : 'green'
                                                                    }
                                                                >
                                                                    {incident.severity === 'critical' ? 'Critique' :
                                                                        incident.severity === 'high' ? 'Élevée' :
                                                                            incident.severity === 'medium' ? 'Moyenne' : 'Faible'}
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

                            {/* Performance */}
                            <TabPanel>
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
                                    <StatCard
                                        label="Temps de réponse moyen"
                                        value={`${performanceStats.averageResponseTime} ms`}
                                        helpText={`P95: ${performanceStats.p95ResponseTime} ms`}
                                        icon={FiActivity}
                                        colorScheme="blue"
                                    />

                                    <StatCard
                                        label="Taux d'erreur"
                                        value={`${performanceStats.errorRate}%`}
                                        helpText="Sur les 30 derniers jours"
                                        icon={FiArrowDown}
                                        colorScheme={performanceStats.errorRate < 1 ? "green" : "red"}
                                    />

                                    <StatCard
                                        label="Uptime"
                                        value={`${performanceStats.uptime}%`}
                                        helpText="Sur les 30 derniers jours"
                                        icon={FiCheckCircle}
                                        colorScheme="green"
                                    />
                                </SimpleGrid>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
                                    {/* Graphique de performance (placeholder) */}
                                    <Card bg={cardBg}>
                                        <CardHeader>
                                            <Heading size="md">Temps de réponse API</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <Center h="300px" color={textMuted}>
                                                [Graphique de temps de réponse API]
                                            </Center>
                                        </CardBody>
                                    </Card>

                                    {/* Utilisation des ressources (placeholder) */}
                                    <Card bg={cardBg}>
                                        <CardHeader>
                                            <Heading size="md">Utilisation des ressources</Heading>
                                        </CardHeader>
                                        <CardBody>
                                            <Center h="300px" color={textMuted}>
                                                [Graphique d'utilisation des ressources]
                                            </Center>
                                        </CardBody>
                                    </Card>
                                </SimpleGrid>

                                {/* Calls API par jour */}
                                <Card bg={cardBg} mb={8}>
                                    <CardHeader>
                                        <Heading size="md">Appels API</Heading>
                                    </CardHeader>
                                    <CardBody>
                                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                            <Stat
                                                bg={statBg}
                                                p={4}
                                                borderRadius="md"
                                                textAlign="center"
                                            >
                                                <StatLabel fontSize="lg">Appels API par jour</StatLabel>
                                                <StatNumber fontSize="4xl">{formatNumber(performanceStats.apiCallsPerDay)}</StatNumber>
                                                <StatHelpText>Moyenne sur 30 jours</StatHelpText>
                                            </Stat>

                                            <Stat
                                                bg={statBg}
                                                p={4}
                                                borderRadius="md"
                                                textAlign="center"
                                            >
                                                <StatLabel fontSize="lg">Charge serveur</StatLabel>
                                                <StatNumber fontSize="4xl">{performanceStats.serverLoad}%</StatNumber>
                                                <StatHelpText>Moyenne sur 30 jours</StatHelpText>
                                            </Stat>
                                        </SimpleGrid>
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

        // Pour l'exemple, utilisons des données simulées
        // Dans un cas réel, vous feriez des appels API pour récupérer les statistiques

        // Statistiques générales
        const generalStats: GeneralStats = {
            totalUsers: 154,
            activeUsers: 98,
            newUsersThisMonth: 12,
            usersGrowthRate: 8.2,
            totalRoutes: 432,
            newRoutesThisMonth: 45,
            routesGrowthRate: 12.5,
            totalIncidents: 67,
            activeIncidents: 23,
            newIncidentsThisMonth: 8,
            incidentsGrowthRate: -5.3
        };

        // Statistiques d'utilisation
        const usageStats: UsageStats = {
            activeUsersLast30Days: 78,
            averageRoutesPerUser: 2.8,
            averageIncidentsPerUser: 0.43,
            dailyAverageNewUsers: 0.4,
            dailyAverageNewRoutes: 1.5,
            dailyAverageNewIncidents: 0.27,
            routeTypeDistribution: [
                { type: "Le plus rapide", count: 245, percentage: 57 },
                { type: "Le plus court", count: 98, percentage: 23 },
                { type: "Éviter les péages", count: 65, percentage: 15 },
                { type: "Panoramique", count: 24, percentage: 5 }
            ],
            incidentTypeDistribution: [
                { type: "Accident", count: 18, percentage: 27 },
                { type: "Travaux", count: 15, percentage: 22 },
                { type: "Route bloquée", count: 12, percentage: 18 },
                { type: "Embouteillage", count: 14, percentage: 21 },
                { type: "Conditions météo", count: 8, percentage: 12 }
            ]
        };

        // Données mensuelles
        const monthlyData: MonthlyData[] = [
            { month: "Jan 2025", users: 115, routes: 320, incidents: 45, activeUsers: 75 },
            { month: "Fév 2025", users: 125, routes: 345, incidents: 52, activeUsers: 82 },
            { month: "Mar 2025", users: 135, routes: 375, incidents: 58, activeUsers: 88 },
            { month: "Avr 2025", users: 142, routes: 405, incidents: 63, activeUsers: 92 },
            { month: "Mai 2025", users: 154, routes: 432, incidents: 67, activeUsers: 98 }
        ];

        // Statistiques de performance
        const performanceStats: PerformanceStats = {
            averageResponseTime: 125,
            p95ResponseTime: 350,
            apiCallsPerDay: 12500,
            errorRate: 0.8,
            uptime: 99.97,
            serverLoad: 32
        };

        // Top routes
        const topRoutes = [
            { id: 101, name: "Trajet quotidien", originName: "Caen", destinationName: "Bayeux", username: "Jules Martin", distance: 25000, usageCount: 42 },
            { id: 102, name: "Route touristique", originName: "Caen", destinationName: "Mont Saint-Michel", username: "Marie Dubois", distance: 95000, usageCount: 30 },
            { id: 103, name: "Visite client", originName: "Caen", destinationName: "Rouen", username: "Thomas Bernard", distance: 120000, usageCount: 28 },
            { id: 104, name: "Livraison", originName: "Caen", destinationName: "Cherbourg", username: "Jules Martin", distance: 110000, usageCount: 25 },
            { id: 105, name: "Week-end à la plage", originName: "Caen", destinationName: "Deauville", username: "Sophie Leroy", distance: 45000, usageCount: 22 },
            { id: 106, name: "Visite famille", originName: "Caen", destinationName: "Paris", username: "Thomas Bernard", distance: 230000, usageCount: 18 },
            { id: 107, name: "Rendez-vous", originName: "Bayeux", destinationName: "Lisieux", username: "Marie Dubois", distance: 65000, usageCount: 15 },
            { id: 108, name: "Route des vacances", originName: "Caen", destinationName: "Nantes", username: "Sophie Leroy", distance: 280000, usageCount: 12 },
            { id: 109, name: "Shopping", originName: "Caen", destinationName: "Rennes", username: "Jules Martin", distance: 170000, usageCount: 10 },
            { id: 110, name: "Trajet professionnel", originName: "Caen", destinationName: "Le Havre", username: "Thomas Bernard", distance: 75000, usageCount: 9 }
        ];

        // Top incidents
        const topIncidents = [
            { id: 201, incidentType: "Accident", description: "Collision entre deux véhicules", severity: "high", status: "active", username: "Jules Martin", createdAt: "2025-05-05T16:30:00Z" },
            { id: 202, incidentType: "Travaux", description: "Réduction à une voie", severity: "medium", status: "active", username: "Marie Dubois", createdAt: "2025-05-04T11:45:00Z" },
            { id: 203, incidentType: "Route bloquée", description: "Arbre tombé sur la chaussée", severity: "critical", status: "resolved", username: "Thomas Bernard", createdAt: "2025-05-03T14:20:00Z" },
            { id: 204, incidentType: "Embouteillage", description: "Trafic dense", severity: "low", status: "active", username: "Sophie Leroy", createdAt: "2025-05-03T17:15:00Z" },
            { id: 205, incidentType: "Conditions météo", description: "Route glissante après la pluie", severity: "medium", status: "pending", username: "Jules Martin", createdAt: "2025-05-02T09:10:00Z" },
            { id: 206, incidentType: "Accident", description: "Véhicule en panne sur la voie de droite", severity: "medium", status: "active", username: "Thomas Bernard", createdAt: "2025-05-01T14:50:00Z" },
            { id: 207, incidentType: "Travaux", description: "Travaux de réfection de chaussée", severity: "high", status: "active", username: "Marie Dubois", createdAt: "2025-04-30T10:15:00Z" },
            { id: 208, incidentType: "Embouteillage", description: "Ralentissement important", severity: "medium", status: "resolved", username: "Sophie Leroy", createdAt: "2025-04-29T17:30:00Z" },
            { id: 209, incidentType: "Route bloquée", description: "Manifestation sur la voie", severity: "high", status: "resolved", username: "Jules Martin", createdAt: "2025-04-28T12:00:00Z" },
            { id: 210, incidentType: "Conditions météo", description: "Brouillard dense, visibilité réduite", severity: "critical", status: "resolved", username: "Thomas Bernard", createdAt: "2025-04-27T08:45:00Z" }
        ];

        // Top utilisateurs
        const topUsers = [
            { id: 1, username: "Jules Martin", routesCount: 25, incidentsCount: 12, lastLogin: "2025-05-07T09:30:00Z" },
            { id: 2, username: "Marie Dubois", routesCount: 18, incidentsCount: 8, lastLogin: "2025-05-06T14:15:00Z" },
            { id: 3, username: "Thomas Bernard", routesCount: 15, incidentsCount: 10, lastLogin: "2025-05-07T11:20:00Z" },
            { id: 4, username: "Sophie Leroy", routesCount: 12, incidentsCount: 6, lastLogin: "2025-05-05T16:45:00Z" },
            { id: 5, username: "Lucas Moreau", routesCount: 10, incidentsCount: 5, lastLogin: "2025-05-06T08:50:00Z" },
            { id: 6, username: "Emma Petit", routesCount: 8, incidentsCount: 3, lastLogin: "2025-05-04T19:10:00Z" },
            { id: 7, username: "Louis Robert", routesCount: 7, incidentsCount: 2, lastLogin: "2025-05-03T12:30:00Z" },
            { id: 8, username: "Léa Durand", routesCount: 6, incidentsCount: 4, lastLogin: "2025-05-02T15:20:00Z" },
            { id: 9, username: "Noah Simon", routesCount: 5, incidentsCount: 1, lastLogin: "2025-05-01T10:45:00Z" },
            { id: 10, username: "Jade Martin", routesCount: 4, incidentsCount: 3, lastLogin: "2025-04-30T14:55:00Z" }
        ];

        return {
            props: {
                generalStats,
                usageStats,
                monthlyData,
                performanceStats,
                topRoutes,
                topIncidents,
                topUsers
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
                monthlyData: [],
                performanceStats: {
                    averageResponseTime: 0,
                    p95ResponseTime: 0,
                    apiCallsPerDay: 0,
                    errorRate: 0,
                    uptime: 0,
                    serverLoad: 0
                },
                topRoutes: [],
                topIncidents: [],
                topUsers: []
            },
        };
    }
};

export default StatsPage;