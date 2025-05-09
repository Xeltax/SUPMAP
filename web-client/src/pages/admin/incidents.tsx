// pages/admin/incidents.tsx
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
    useToast,
    Spinner,
    Center,
    TableContainer,
    Tooltip,
    Tag,
    SimpleGrid,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Icon,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Progress,
    Divider,
    Stack,
    Switch,
    FormControl,
    FormLabel
} from '@chakra-ui/react';
import {
    FiMoreVertical,
    FiSearch,
    FiTrash2,
    FiEye,
    FiMap,
    FiCheckCircle,
    FiXCircle,
    FiAlertTriangle,
    FiCalendar,
    FiClock,
    FiUser,
    FiFilter,
    FiRefreshCw
} from 'react-icons/fi';
import {
    FaMapMarkerAlt,
    FaExclamationTriangle,
    FaRoad,
    FaCarCrash,
    FaTools,
    FaSnowflake,
    FaTrafficLight
} from 'react-icons/fa';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import { useRouter } from 'next/router';
import api from '@/services/api';

// Types pour les incidents
interface Incident {
    id: string | number;
    incidentType: string;
    description: string;
    coordinates: [number, number];
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'resolved' | 'pending';
    userId: string | number;
    username: string;
    createdAt: string;
    updatedAt?: string;
    expiresAt?: string;
    validationCount: number;
    invalidationCount: number;
    isVerified: boolean;
}

// Composant principal
const IncidentsPage = ({ initialIncidents }: { initialIncidents: Incident[] }) => {
    const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
    const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>(initialIncidents);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(false);
    const [showExpiredIncidents, setShowExpiredIncidents] = useState(false);

    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isResolveOpen, onOpen: onResolveOpen, onClose: onResolveClose } = useDisclosure();

    const toast = useToast();
    const router = useRouter();

    // Filtrer les incidents
    useEffect(() => {
        let result = [...incidents];

        // Filtre de recherche
        if (searchTerm) {
            result = result.filter(incident =>
                incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                incident.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                incident.incidentType.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtre par statut
        if (statusFilter !== 'all') {
            result = result.filter(incident => incident.status === statusFilter);
        }

        // Filtre par type d'incident
        if (typeFilter !== 'all') {
            result = result.filter(incident => incident.incidentType === typeFilter);
        }

        // Filtre par sévérité
        if (severityFilter !== 'all') {
            result = result.filter(incident => incident.severity === severityFilter);
        }

        // Filtre pour les incidents expirés
        if (!showExpiredIncidents && result.some(incident => incident.expiresAt)) {
            const now = new Date().getTime();
            result = result.filter(incident => {
                if (!incident.expiresAt) return true;
                const expiryTime = new Date(incident.expiresAt).getTime();
                return expiryTime > now;
            });
        }

        setFilteredIncidents(result);
    }, [searchTerm, statusFilter, typeFilter, severityFilter, showExpiredIncidents, incidents]);

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

    // Déterminer la couleur du badge de statut
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'orange';
            case 'resolved':
                return 'green';
            case 'pending':
                return 'yellow';
            default:
                return 'gray';
        }
    };

    // Déterminer la couleur du badge de sévérité
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'red';
            case 'high':
                return 'orange';
            case 'medium':
                return 'yellow';
            case 'low':
                return 'green';
            default:
                return 'gray';
        }
    };

    // Obtenir l'icône pour le type d'incident
    const getIncidentTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'accident':
                return FaCarCrash;
            case 'travaux':
                return FaTools;
            case 'route bloquée':
                return FaRoad;
            case 'conditions météo':
                return FaSnowflake;
            case 'embouteillage':
                return FaTrafficLight;
            default:
                return FaExclamationTriangle;
        }
    };

    // Traduire le statut en français
    const translateStatus = (status: string) => {
        switch (status) {
            case 'active':
                return 'Actif';
            case 'resolved':
                return 'Résolu';
            case 'pending':
                return 'En attente';
            default:
                return status;
        }
    };

    // Traduire la sévérité en français
    const translateSeverity = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'Critique';
            case 'high':
                return 'Élevée';
            case 'medium':
                return 'Moyenne';
            case 'low':
                return 'Faible';
            default:
                return severity;
        }
    };

    // Ouvrir le modal de détails
    const handleViewDetails = (incident: Incident) => {
        setSelectedIncident(incident);
        onDetailOpen();
    };

    // Ouvrir le modal de suppression
    const handleDeleteIncident = (incident: Incident) => {
        setSelectedIncident(incident);
        onDeleteOpen();
    };

    // Ouvrir le modal de résolution
    const handleResolveIncident = (incident: Incident) => {
        setSelectedIncident(incident);
        onResolveOpen();
    };

    // Voir sur la carte
    const handleViewOnMap = (incident: Incident) => {
        // Rediriger vers la page de carte avec l'incident sélectionné
        router.push(`/map?incident=${incident.id}`);
    };

    // Valider un incident
    const handleValidateIncident = async (incident: Incident) => {
        setLoading(true);
        try {
            // Ici, vous implémenterez l'appel API réel pour valider l'incident
            // Exemple fictif:
            // await api.traffic.validateIncidentReport(incident.id);

            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mettre à jour l'incident dans la liste
            const updatedIncidents = incidents.map(item => {
                if (item.id === incident.id) {
                    return {
                        ...item,
                        validationCount: item.validationCount + 1,
                        isVerified: true
                    };
                }
                return item;
            });

            setIncidents(updatedIncidents);

            toast({
                title: "Incident validé",
                description: `L'incident a été validé avec succès.`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Erreur lors de la validation de l\'incident:', error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la validation de l'incident.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Invalider un incident
    const handleInvalidateIncident = async (incident: Incident) => {
        setLoading(true);
        try {
            // Ici, vous implémenterez l'appel API réel pour invalider l'incident
            // Exemple fictif:
            // await api.traffic.invalidateIncidentReport(incident.id);

            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mettre à jour l'incident dans la liste
            const updatedIncidents = incidents.map(item => {
                if (item.id === incident.id) {
                    return {
                        ...item,
                        invalidationCount: item.invalidationCount + 1
                    };
                }
                return item;
            });

            setIncidents(updatedIncidents);

            toast({
                title: "Incident invalidé",
                description: `L'incident a été invalidé avec succès.`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Erreur lors de l\'invalidation de l\'incident:', error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de l'invalidation de l'incident.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Confirmer la résolution de l'incident
    const handleConfirmResolve = async () => {
        if (!selectedIncident) return;

        setLoading(true);
        try {
            // Ici, vous implémenterez l'appel API réel pour résoudre l'incident
            // Exemple fictif:
            // await api.traffic.resolveIncident(selectedIncident.id);

            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 1000));
            //
            // // Mettre à jour l'incident dans la liste
            // const updatedIncidents = incidents.map(incident => {
            //     if (incident.id === selectedIncident.id) {
            //         return {
            //             ...incident,
            //             status: 'resolved',
            //             updatedAt: new Date().toISOString()
            //         };
            //     }
            //     return incident;
            // });
            //
            // setIncidents(updatedIncidents);

            toast({
                title: "Incident résolu",
                description: `L'incident a été marqué comme résolu.`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            onResolveClose();
        } catch (error) {
            console.error('Erreur lors de la résolution de l\'incident:', error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la résolution de l'incident.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Confirmer la suppression de l'incident
    const handleConfirmDelete = async () => {
        if (!selectedIncident) return;

        setLoading(true);
        try {
            // Ici, vous implémenterez l'appel API réel pour supprimer l'incident
            // Exemple fictif:
            // await api.traffic.deleteIncident(selectedIncident.id);

            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Supprimer l'incident de la liste
            const updatedIncidents = incidents.filter(incident => incident.id !== selectedIncident.id);
            setIncidents(updatedIncidents);

            toast({
                title: "Incident supprimé",
                description: `L'incident a été supprimé avec succès.`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            onDeleteClose();
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'incident:', error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la suppression de l'incident.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Obtenir les statistiques des incidents
    const getIncidentStats = () => {
        const total = incidents.length;
        const active = incidents.filter(incident => incident.status === 'active').length;
        const resolved = incidents.filter(incident => incident.status === 'resolved').length;
        const pending = incidents.filter(incident => incident.status === 'pending').length;

        const critical = incidents.filter(incident => incident.severity === 'critical').length;
        const high = incidents.filter(incident => incident.severity === 'high').length;
        const medium = incidents.filter(incident => incident.severity === 'medium').length;
        const low = incidents.filter(incident => incident.severity === 'low').length;

        // @ts-ignore
        const types = [...new Set(incidents.map(incident => incident.incidentType))];
        const typeStats = types.map(type => ({
            type,
            count: incidents.filter(incident => incident.incidentType === type).length,
            percentage: Math.round((incidents.filter(incident => incident.incidentType === type).length / total) * 100)
        }));

        return {
            total,
            active,
            resolved,
            pending,
            critical,
            high,
            medium,
            low,
            typeStats
        };
    };

    const stats = getIncidentStats();

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
                    <Heading>Gestion des incidents</Heading>

                    <HStack spacing={4}>
                        <Button
                            leftIcon={<FiRefreshCw />}
                            variant="outline"
                            onClick={() => {
                                setLoading(true);
                                // Simuler une actualisation des données
                                setTimeout(() => {
                                    setLoading(false);
                                    toast({
                                        title: "Données actualisées",
                                        description: "Les données des incidents ont été mises à jour.",
                                        status: "success",
                                        duration: 3000,
                                        isClosable: true,
                                    });
                                }, 1000);
                            }}
                        >
                            Actualiser
                        </Button>

                        <Button
                            leftIcon={<FiMap />}
                            colorScheme="blue"
                            onClick={() => router.push('/map')}
                        >
                            Voir la carte
                        </Button>
                    </HStack>
                </Flex>

                {/* Statistiques des incidents */}
                <SimpleGrid
                    columns={{ base: 1, md: 4 }}
                    spacing={6}
                    mb={6}
                    display={{ base: router.query.tab === 'stats' ? 'grid' : 'none', md: 'grid' }}
                >
                    <Stat
                        bg={useColorModeValue('white', 'gray.800')}
                        p={4}
                        borderRadius="md"
                        boxShadow="sm"
                        borderLeft="4px solid"
                        borderColor="blue.500"
                    >
                        <StatLabel>Total des incidents</StatLabel>
                        <StatNumber>{stats.total}</StatNumber>
                        <StatHelpText>Incidents enregistrés</StatHelpText>
                    </Stat>

                    <Stat
                        bg={useColorModeValue('white', 'gray.800')}
                        p={4}
                        borderRadius="md"
                        boxShadow="sm"
                        borderLeft="4px solid"
                        borderColor="orange.500"
                    >
                        <StatLabel>Incidents actifs</StatLabel>
                        <StatNumber>{stats.active}</StatNumber>
                        <StatHelpText>{Math.round((stats.active / stats.total) * 100)}% du total</StatHelpText>
                    </Stat>

                    <Stat
                        bg={useColorModeValue('white', 'gray.800')}
                        p={4}
                        borderRadius="md"
                        boxShadow="sm"
                        borderLeft="4px solid"
                        borderColor="green.500"
                    >
                        <StatLabel>Incidents résolus</StatLabel>
                        <StatNumber>{stats.resolved}</StatNumber>
                        <StatHelpText>{Math.round((stats.resolved / stats.total) * 100)}% du total</StatHelpText>
                    </Stat>

                    <Stat
                        bg={useColorModeValue('white', 'gray.800')}
                        p={4}
                        borderRadius="md"
                        boxShadow="sm"
                        borderLeft="4px solid"
                        borderColor="red.500"
                    >
                        <StatLabel>Incidents critiques</StatLabel>
                        <StatNumber>{stats.critical}</StatNumber>
                        <StatHelpText>{Math.round((stats.critical / stats.total) * 100)}% du total</StatHelpText>
                    </Stat>
                </SimpleGrid>

                {/* Filtres */}
                <Box
                    p={4}
                    mb={6}
                    bg={useColorModeValue('white', 'gray.800')}
                    borderRadius="md"
                    boxShadow="sm"
                >
                    <Flex
                        direction={{ base: 'column', md: 'row' }}
                        gap={4}
                        align={{ base: 'stretch', md: 'center' }}
                    >
                        <InputGroup maxW={{ md: '320px' }}>
                            <InputLeftElement pointerEvents="none">
                                <FiSearch color="gray.300" />
                            </InputLeftElement>
                            <Input
                                placeholder="Rechercher un incident..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>

                        <Select
                            placeholder="Statut"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            maxW={{ md: '160px' }}
                            variant="filled"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="active">Actifs</option>
                            <option value="resolved">Résolus</option>
                            <option value="pending">En attente</option>
                        </Select>

                        <Select
                            placeholder="Type d'incident"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            maxW={{ md: '200px' }}
                            variant="filled"
                        >
                            <option value="all">Tous les types</option>
                            <option value="Accident">Accident</option>
                            <option value="Travaux">Travaux</option>
                            <option value="Route bloquée">Route bloquée</option>
                            <option value="Conditions météo">Conditions météo</option>
                            <option value="Embouteillage">Embouteillage</option>
                        </Select>

                        <Select
                            placeholder="Sévérité"
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            maxW={{ md: '160px' }}
                            variant="filled"
                        >
                            <option value="all">Toutes</option>
                            <option value="critical">Critique</option>
                            <option value="high">Élevée</option>
                            <option value="medium">Moyenne</option>
                            <option value="low">Faible</option>
                        </Select>

                        <FormControl display="flex" alignItems="center" maxW={{ md: '200px' }}>
                            <Switch
                                id="show-expired"
                                isChecked={showExpiredIncidents}
                                onChange={(e) => setShowExpiredIncidents(e.target.checked)}
                                colorScheme="blue"
                            />
                            <FormLabel htmlFor="show-expired" mb="0" ml={2} fontSize="sm">
                                Afficher les incidents expirés
                            </FormLabel>
                        </FormControl>
                    </Flex>
                </Box>

                {/* Tableau des incidents */}
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
                            mb={4}
                        >
                            <Table variant="simple">
                                <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                                    <Tr>
                                        <Th>Type</Th>
                                        <Th>Description</Th>
                                        <Th>Sévérité</Th>
                                        <Th>Statut</Th>
                                        <Th>Utilisateur</Th>
                                        <Th>Date de signalement</Th>
                                        <Th>Validations</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {filteredIncidents.length > 0 ? (
                                        filteredIncidents.map((incident) => (
                                            <Tr key={incident.id}>
                                                <Td>
                                                    <Flex align="center">
                                                        <Icon
                                                            as={getIncidentTypeIcon(incident.incidentType)}
                                                            color={getSeverityColor(incident.severity) + '.500'}
                                                            mr={2}
                                                        />
                                                        {incident.incidentType}
                                                    </Flex>
                                                </Td>
                                                <Td>
                                                    <Text noOfLines={1}>{incident.description}</Text>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={getSeverityColor(incident.severity)}>
                                                        {translateSeverity(incident.severity)}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={getStatusColor(incident.status)}>
                                                        {translateStatus(incident.status)}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm">{incident.username}</Text>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm">{formatDate(incident.createdAt)}</Text>
                                                </Td>
                                                <Td>
                                                    <HStack spacing={1}>
                                                        <Tag size="sm" colorScheme="green" variant="outline">
                                                            +{incident.validationCount}
                                                        </Tag>
                                                        <Tag size="sm" colorScheme="red" variant="outline">
                                                            -{incident.invalidationCount}
                                                        </Tag>
                                                    </HStack>
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
                                                            <MenuItem icon={<FiEye />} onClick={() => handleViewDetails(incident)}>
                                                                Voir les détails
                                                            </MenuItem>
                                                            <MenuItem icon={<FiMap />} onClick={() => handleViewOnMap(incident)}>
                                                                Voir sur la carte
                                                            </MenuItem>
                                                            {incident.status !== 'resolved' && (
                                                                <MenuItem icon={<FiCheckCircle />} onClick={() => handleResolveIncident(incident)}>
                                                                    Marquer comme résolu
                                                                </MenuItem>
                                                            )}
                                                            <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteIncident(incident)}>
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
                                                <Text color="gray.500">Aucun incident trouvé</Text>
                                            </Td>
                                        </Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </TableContainer>

                        <Text color="gray.500" fontSize="sm">
                            {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''} trouvé{filteredIncidents.length !== 1 ? 's' : ''}
                        </Text>
                    </>
                )}

                {/* Modal de détails incident */}
                <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Détails de l'incident</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            {selectedIncident && (
                                <Box>
                                    <Flex
                                        align="center"
                                        mb={4}
                                        p={3}
                                        bg={useColorModeValue('gray.50', 'gray.700')}
                                        borderRadius="md"
                                    >
                                        <Icon
                                            as={getIncidentTypeIcon(selectedIncident.incidentType)}
                                            boxSize={6}
                                            mr={3}
                                            color={getSeverityColor(selectedIncident.severity) + '.500'}
                                        />
                                        <Box>
                                            <Heading size="md">{selectedIncident.incidentType}</Heading>
                                            <Text color="gray.500" fontSize="sm">{selectedIncident.description}</Text>
                                        </Box>
                                    </Flex>

                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
                                        <Box p={3} borderWidth="1px" borderRadius="md">
                                            <Text fontWeight="medium" mb={1}>Coordonnées</Text>
                                            <Text fontSize="sm" fontFamily="monospace">
                                                {selectedIncident.coordinates.join(', ')}
                                            </Text>
                                        </Box>

                                        <Box p={3} borderWidth="1px" borderRadius="md">
                                            <Text fontWeight="medium" mb={1}>Signalé par</Text>
                                            <Text>{selectedIncident.username}</Text>
                                        </Box>

                                        <Box p={3} borderWidth="1px" borderRadius="md">
                                            <Text fontWeight="medium" mb={1}>Date de signalement</Text>
                                            <Text>{formatDate(selectedIncident.createdAt)}</Text>
                                        </Box>

                                        {selectedIncident.updatedAt && (
                                            <Box p={3} borderWidth="1px" borderRadius="md">
                                                <Text fontWeight="medium" mb={1}>Dernière mise à jour</Text>
                                                <Text>{formatDate(selectedIncident.updatedAt)}</Text>
                                            </Box>
                                        )}

                                        {selectedIncident.expiresAt && (
                                            <Box p={3} borderWidth="1px" borderRadius="md">
                                                <Text fontWeight="medium" mb={1}>Expire le</Text>
                                                <Text>{formatDate(selectedIncident.expiresAt)}</Text>
                                            </Box>
                                        )}
                                    </SimpleGrid>

                                    <Box
                                        p={4}
                                        mb={6}
                                        bg={useColorModeValue('gray.50', 'gray.700')}
                                        borderRadius="md"
                                    >
                                        <Heading size="sm" mb={2}>Validation communautaire</Heading>
                                        <Flex align="center" justify="space-between" mb={2}>
                                            <Text>
                                                Confiance: {Math.max(0, selectedIncident.validationCount - selectedIncident.invalidationCount)} point{selectedIncident.validationCount - selectedIncident.invalidationCount !== 1 ? 's' : ''}
                                            </Text>
                                            <Badge colorScheme={selectedIncident.isVerified ? "green" : "yellow"}>
                                                {selectedIncident.isVerified ? "Vérifié" : "Non vérifié"}
                                            </Badge>
                                        </Flex>
                                        <Flex align="center" mb={2}>
                                            <Box flex="1">
                                                <Progress
                                                    value={(selectedIncident.validationCount / (selectedIncident.validationCount + selectedIncident.invalidationCount || 1)) * 100}
                                                    colorScheme="green"
                                                    borderRadius="full"
                                                    height="8px"
                                                />
                                            </Box>
                                            <Text ml={2} fontWeight="bold">
                                                {(selectedIncident.validationCount / (selectedIncident.validationCount + selectedIncident.invalidationCount || 1) * 100).toFixed(0)}%
                                            </Text>
                                        </Flex>
                                        <HStack spacing={4} mt={4}>
                                            <Stat size="sm">
                                                <StatLabel fontSize="xs">Validations</StatLabel>
                                                <StatNumber color="green.500">{selectedIncident.validationCount}</StatNumber>
                                            </Stat>
                                            <Stat size="sm">
                                                <StatLabel fontSize="xs">Invalidations</StatLabel>
                                                <StatNumber color="red.500">{selectedIncident.invalidationCount}</StatNumber>
                                            </Stat>
                                        </HStack>
                                    </Box>

                                    {/* Placeholder pour la carte d'incident */}
                                    <Box
                                        position="relative"
                                        borderRadius="md"
                                        overflow="hidden"
                                        h="200px"
                                        w="100%"
                                        bg={useColorModeValue('gray.100', 'gray.700')}
                                        mb={4}
                                    >
                                        <Center h="100%" w="100%" color={useColorModeValue('gray.500', 'gray.400')}>
                                            <Icon as={FiMap} boxSize={10} />
                                            <Text ml={2}>Carte de l'incident</Text>
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
                                                <Icon as={FaMapMarkerAlt} color="red.500" />
                                                <Text>{selectedIncident.coordinates.join(', ')}</Text>
                                            </HStack>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <HStack spacing={2}>
                                {selectedIncident && selectedIncident.status !== 'resolved' && (
                                    <Button
                                        leftIcon={<FiCheckCircle />}
                                        colorScheme="green"
                                        onClick={() => {
                                            onDetailClose();
                                            if (selectedIncident) handleResolveIncident(selectedIncident);
                                        }}
                                    >
                                        Résoudre
                                    </Button>
                                )}
                                <Button
                                    leftIcon={<FiMap />}
                                    colorScheme="blue"
                                    onClick={() => {
                                        onDetailClose();
                                        if (selectedIncident) handleViewOnMap(selectedIncident);
                                    }}
                                >
                                    Voir sur la carte
                                </Button>
                                <Button variant="ghost" onClick={onDetailClose}>
                                    Fermer
                                </Button>
                            </HStack>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Modal de confirmation de résolution */}
                <Modal isOpen={isResolveOpen} onClose={onResolveClose} isCentered size="md">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader color="green.500">Résoudre l'incident</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            <Text>
                                Êtes-vous sûr de vouloir marquer l'incident <b>{selectedIncident?.incidentType}</b> comme résolu ?
                            </Text>
                            <Text mt={2} fontSize="sm" color="gray.500">
                                Cette action informera les utilisateurs que l'incident n'est plus actif.
                            </Text>
                        </ModalBody>
                        <ModalFooter>
                            <Button mr={3} onClick={onResolveClose}>Annuler</Button>
                            <Button
                                colorScheme="green"
                                leftIcon={<FiCheckCircle />}
                                onClick={handleConfirmResolve}
                                isLoading={loading}
                            >
                                Confirmer la résolution
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Modal de confirmation de suppression */}
                <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="md">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader color="red.500">Supprimer l'incident</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            <Text>
                                Êtes-vous sûr de vouloir supprimer l'incident <b>{selectedIncident?.incidentType}</b> ?
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
        // Dans un cas réel, vous feriez un appel API pour récupérer les incidents
        // const incidentsResponse = await axios.get(`${process.env.API_URL}/api/admin/traffic/reports`, config);
        // const incidents = incidentsResponse.data.data.incidents;

        // Exemple de données fictives
        const incidents: Incident[] = [
            {
                id: 201,
                incidentType: "Accident",
                description: "Collision entre deux véhicules",
                coordinates: [49.1829, -0.3707],
                severity: "high",
                status: "active",
                userId: 1,
                username: "Jules Martin",
                createdAt: "2025-05-05T16:30:00Z",
                validationCount: 8,
                invalidationCount: 1,
                isVerified: true
            },
            {
                id: 202,
                incidentType: "Travaux",
                description: "Réduction à une voie",
                coordinates: [49.2764, -0.7024],
                severity: "medium",
                status: "active",
                userId: 2,
                username: "Marie Dubois",
                createdAt: "2025-05-04T11:45:00Z",
                expiresAt: "2025-05-15T23:59:59Z",
                validationCount: 5,
                invalidationCount: 0,
                isVerified: true
            },
            {
                id: 203,
                incidentType: "Route bloquée",
                description: "Arbre tombé sur la chaussée",
                coordinates: [49.3539, 0.0630],
                severity: "critical",
                status: "resolved",
                userId: 3,
                username: "Thomas Bernard",
                createdAt: "2025-05-03T14:20:00Z",
                updatedAt: "2025-05-03T16:45:00Z",
                validationCount: 12,
                invalidationCount: 0,
                isVerified: true
            },
            {
                id: 204,
                incidentType: "Embouteillage",
                description: "Trafic dense",
                coordinates: [49.4431, 1.0989],
                severity: "low",
                status: "active",
                userId: 4,
                username: "Sophie Leroy",
                createdAt: "2025-05-03T17:15:00Z",
                validationCount: 3,
                invalidationCount: 2,
                isVerified: false
            },
            {
                id: 205,
                incidentType: "Conditions météo",
                description: "Route glissante après la pluie",
                coordinates: [49.6337, -1.6221],
                severity: "medium",
                status: "pending",
                userId: 1,
                username: "Jules Martin",
                createdAt: "2025-05-02T09:10:00Z",
                validationCount: 1,
                invalidationCount: 1,
                isVerified: false
            }
        ];

        return {
            props: {
                initialIncidents: incidents
            },
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des incidents:', error);

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
                initialIncidents: []
            },
        };
    }
};

export default IncidentsPage;