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
    FormLabel,
    ButtonGroup
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
    FaTrafficLight, FaHammer, FaCar, FaExclamationCircle
} from 'react-icons/fa';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import { useRouter } from 'next/router';
import api from '@/services/api';
import {FaRoadBarrier} from "react-icons/fa6";

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

const IncidentsPage = ({ initialIncidents }: { initialIncidents: Incident[] }) => {
    const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
    const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>(initialIncidents);
    const [displayedIncidents, setDisplayedIncidents] = useState<Incident[]>(initialIncidents.slice(0, 100));
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(false);
    const [showExpiredIncidents, setShowExpiredIncidents] = useState(false);
    const [displayCount, setDisplayCount] = useState(100);

    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
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
            result = result.filter(incident => incident.active === (statusFilter === 'active'));
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

    // Update displayed incidents when filtered incidents change
    useEffect(() => {
        setDisplayedIncidents(filteredIncidents.slice(0, displayCount));
    }, [filteredIncidents, displayCount]);

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
    const getStatusColor = (status: boolean) => {
        switch (status) {
            case true:
                return 'orange';
            case false:
                return 'green';
            default:
                return 'gray';
        }
    };

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

    const getIncidentTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
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

    const translateStatus = (status: boolean) => {
        switch (status) {
            case true:
                return 'Actif';
            case false:
                return 'Résolu';
            default:
                return status;
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

    const handleViewDetails = (incident: Incident) => {
        setSelectedIncident(incident);
        onDetailOpen();
    };

    const handleResolveIncident = (incident: Incident) => {
        setSelectedIncident(incident);
        onResolveOpen();
    };

    const handleViewOnMap = (incident: Incident) => {
        router.push(`/map?incident=${incident.id}`);
    };

    const handleConfirmResolve = async () => {
        if (!selectedIncident) return;

        setLoading(true);
        try {
            if (!selectedIncident) {
                toast({
                    title: "Erreur",
                    description: "Cet incident est déjà marqué comme résolu.",
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                });
                return;
            } else {
                const res = await api.traffic.resolveTrafficIncident(selectedIncident.id);

                const updatedIncidents = incidents.map(incident => {
                    if (incident.id === selectedIncident.id) {
                        return { ...incident, active: false };
                    }
                    return incident;
                });

                setIncidents(updatedIncidents);

                toast({
                    title: "Incident résolu",
                    description: `L'incident a été marqué comme résolu.`,
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });

                onResolveClose();
            }
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

    const getIncidentStats = () => {
        const total = incidents.length;
        const active = incidents.filter(incident => incident.active).length;
        const resolved = incidents.filter(incident => !incident.active).length;

        const critical = incidents.filter(incident => incident.severity === 'severe').length;
        const high = incidents.filter(incident => incident.severity === 'high').length;
        const medium = incidents.filter(incident => incident.severity === 'moderate').length;
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
            critical,
            high,
            medium,
            low,
            typeStats
        };
    };

    const stats = getIncidentStats();

    const handleLoadMore = () => {
        setDisplayCount(prev => prev + 100);
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
                            <option value="accident">Accident</option>
                            <option value="roadworks">Travaux</option>
                            <option value="roadClosed">Route fermée</option>
                            <option value="hazard">Conditions météo</option>
                            <option value="police">Controle policier</option>
                            <option value="congestion">Embouteillage</option>
                        </Select>

                        <Select
                            placeholder="Sévérité"
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            maxW={{ md: '160px' }}
                            variant="filled"
                        >
                            <option value="all">Toutes</option>
                            <option value="severe">Critique</option>
                            <option value="high">Élevée</option>
                            <option value="moderate">Moyenne</option>
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
                                    {displayedIncidents.length > 0 ? (
                                        displayedIncidents.map((incident) => (
                                            <Tr key={incident.id}>
                                                <Td>
                                                    <Flex align="center">
                                                        <Icon
                                                            as={getIncidentTypeIcon(incident.incidentType)}
                                                            color={getSeverityColor(incident.severity) + '.500'}
                                                            mr={2}
                                                        />
                                                        {renderType(incident.incidentType)}
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
                                                    <Badge colorScheme={getStatusColor(incident.active)}>
                                                        {translateStatus(incident.active)}
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
                                                            +{incident.validations}
                                                        </Tag>
                                                        <Tag size="sm" colorScheme="red" variant="outline">
                                                            -{incident.invalidations}
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
                                                            {incident.active && (
                                                                <MenuItem icon={<FiCheckCircle />} onClick={() => handleResolveIncident(incident)}>
                                                                    Marquer comme résolu
                                                                </MenuItem>
                                                            )}
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

                        <Flex justify="space-between" align="center" mt={4}>
                            <Text color="gray.500" fontSize="sm">
                                {displayedIncidents.length} incident{displayedIncidents.length !== 1 ? 's' : ''} affiché{displayedIncidents.length !== 1 ? 's' : ''} sur {filteredIncidents.length}
                            </Text>
                            
                            {displayedIncidents.length < filteredIncidents.length && (
                                <Button
                                    onClick={handleLoadMore}
                                    colorScheme="blue"
                                    variant="outline"
                                    leftIcon={<FiRefreshCw />}
                                >
                                    Charger plus d'incidents
                                </Button>
                            )}
                        </Flex>
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
                                            <Heading size="md">{renderType(selectedIncident.incidentType)}</Heading>
                                            <Text color="gray.500" fontSize="sm">{selectedIncident.description}</Text>
                                        </Box>
                                    </Flex>

                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>

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
                                                Confiance: {Math.max(0, selectedIncident.validations - selectedIncident.invalidations)} point{selectedIncident.validations - selectedIncident.invalidations !== 1 ? 's' : ''}
                                            </Text>
                                            <Badge colorScheme={selectedIncident.isVerified ? "green" : "yellow"}>
                                                {selectedIncident.isVerified ? "Vérifié" : "Non vérifié"}
                                            </Badge>
                                        </Flex>
                                        <Flex align="center" mb={2}>
                                            <Box flex="1">
                                                <Progress
                                                    value={(selectedIncident.validations / (selectedIncident.validations + selectedIncident.invalidations || 1)) * 100}
                                                    colorScheme="green"
                                                    borderRadius="full"
                                                    height="8px"
                                                />
                                            </Box>
                                            <Text ml={2} fontWeight="bold">
                                                {(selectedIncident.validations / (selectedIncident.validations + selectedIncident.invalidations || 1) * 100).toFixed(0)}%
                                            </Text>
                                        </Flex>
                                        <HStack spacing={4} mt={4}>
                                            <Stat size="sm">
                                                <StatLabel fontSize="xs">Validations</StatLabel>
                                                <StatNumber color="green.500">{selectedIncident.validations}</StatNumber>
                                            </Stat>
                                            <Stat size="sm">
                                                <StatLabel fontSize="xs">Invalidations</StatLabel>
                                                <StatNumber color="red.500">{selectedIncident.invalidations}</StatNumber>
                                            </Stat>
                                        </HStack>
                                    </Box>
                                </Box>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <HStack spacing={2}>
                                {selectedIncident && selectedIncident.active && (
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
                                Êtes-vous sûr de vouloir marquer l'incident <b>{renderType(selectedIncident?.incidentType ? selectedIncident.incidentType: "")}</b> comme résolu ?
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

        // Fetch incidents and users
        const [incidentsResponse, usersResponse] = await Promise.all([
            axios.get(`${process.env.API_URL}/api/navigation/traffic/reports`, config),
            axios.get(`${process.env.API_URL}/api/auth/users`, config)
        ]);

        const incidents = incidentsResponse.data.data.incidents;
        const users = usersResponse.data.data.users;

        // Add username to each incident
        const incidentsWithUsers = incidents.map((incident: any) => {
            const user = users.find((u: any) => u.id === incident.userId);
            return {
                ...incident,
                username: user ? user.username : 'Utilisateur inconnu'
            };
        });

        return {
            props: {
                initialIncidents: incidentsWithUsers
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