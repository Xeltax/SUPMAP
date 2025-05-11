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
    Avatar,
    Switch,
    FormHelperText
} from '@chakra-ui/react';
import { FiMoreVertical, FiSearch, FiEdit, FiTrash2, FiUserPlus, FiEye, FiLock, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import { useRouter } from 'next/router';
import api from '@/services/api';

// Types pour les utilisateurs
interface User {
    id: string | number;
    username: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
    lastLogin?: string;
    routesCount: number;
    incidentsCount: number;
    totalRouteUsage: number;
}

const UsersPage = ({ initialUsers }: { initialUsers: User[] }) => {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers);
    const [displayCount, setDisplayCount] = useState(100);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isResetPasswordOpen, onOpen: onResetPasswordOpen, onClose: onResetPasswordClose } = useDisclosure();
    const { isOpen: isAddUserOpen, onOpen: onAddUserOpen, onClose: onAddUserClose } = useDisclosure();

    const toast = useToast();

    useEffect(() => {
        let result = users;

        if (searchTerm) {
            result = result.filter(user =>
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (activeFilter !== 'all') {
            const isActive = activeFilter === 'true';
            result = result.filter(user => user.active === isActive);
        }

        if (roleFilter !== 'all') {
            result = result.filter(user => user.role === roleFilter);
        }

        setFilteredUsers(result);
    }, [searchTerm, activeFilter, roleFilter, users]);

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

    const getActiveColor = (active: boolean) => {
        return active ? 'green' : 'red';
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        onEditOpen();
    };

    const handleDeleteUser = (user: User) => {
        setSelectedUser(user);
        onDeleteOpen();
    };

    const handleSaveUser = async (userData: Partial<User>) => {
        if (!selectedUser) return;

        setLoading(true);
        try {
            // Appel API pour mettre à jour l'utilisateur
            const response = await api.auth.updateById(selectedUser.id as string, userData);

            if (response && response.data) {
                // Mettre à jour l'utilisateur dans la liste
                const updatedUsers = users.map(user =>
                    user.id === selectedUser.id ? { ...user, ...userData } : user
                );
                setUsers(updatedUsers);

                toast({
                    title: "Utilisateur mis à jour",
                    description: `Les informations de ${userData.username || selectedUser.username} ont été mises à jour.`,
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });

                onEditClose();
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la mise à jour de l'utilisateur.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedUser) return;

        setLoading(true);
        try {
            const response = await api.auth.deleteById(selectedUser.id as string);

            const updatedUsers = users.filter(user => user.id !== selectedUser.id);
            setUsers(updatedUsers);

            toast({
                title: "Utilisateur supprimé",
                description: `L'utilisateur ${selectedUser.username} a été supprimé avec succès.`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            onDeleteClose();
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur:', error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la suppression de l'utilisateur.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Box maxW="7xl" mx="auto">
                <Flex justify="space-between" align="center" mb={6}>
                    <Heading>Gestion des utilisateurs</Heading>
                </Flex>

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
                            placeholder="Rechercher un utilisateur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    <Select
                        placeholder="Statut"
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        maxW={{ md: '180px' }}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="true">Actif</option>
                        <option value="false">Inactif</option>
                    </Select>

                    <Select
                        placeholder="Rôle"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        maxW={{ md: '180px' }}
                    >
                        <option value="all">Tous les rôles</option>
                        <option value="admin">Administrateur</option>
                        <option value="moderator">Modérateur</option>
                        <option value="user">Utilisateur</option>
                    </Select>
                </Flex>

                {/* Tableau des utilisateurs */}
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
                                        <Th>Utilisateur</Th>
                                        <Th>Email</Th>
                                        <Th>Rôle</Th>
                                        <Th>Statut</Th>
                                        <Th>Date d'inscription</Th>
                                        <Th isNumeric>Routes</Th>
                                        <Th isNumeric>Utilisations</Th>
                                        <Th isNumeric>Incidents</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {filteredUsers.slice(0, displayCount).map((user) => (
                                        <Tr key={user.id}>
                                            <Td>
                                                <Flex align="center">
                                                    <Avatar
                                                        size="sm"
                                                        name={user.username}
                                                        mr={2}
                                                        bg="blue.500"
                                                        color="white"
                                                    />
                                                    <Text fontWeight="medium">{user.username}</Text>
                                                </Flex>
                                            </Td>
                                            <Td>{user.email}</Td>
                                            <Td>
                                                <Tag
                                                    size="sm"
                                                    colorScheme={user.role === 'admin' ? 'purple' : user.role === 'moderator' ? 'blue' : 'gray'}
                                                >
                                                    {user.role}
                                                </Tag>
                                            </Td>
                                            <Td>
                                                <Flex align="center">
                                                    <Badge mr={2} colorScheme={getActiveColor(user.active)}>
                                                        {user.active ? 'Actif' : 'Inactif'}
                                                    </Badge>
                                                </Flex>
                                            </Td>
                                            <Td>{formatDate(user.createdAt)}</Td>
                                            <Td isNumeric>{user.routesCount}</Td>
                                            <Td isNumeric>{user.totalRouteUsage}</Td>
                                            <Td isNumeric>{user.incidentsCount}</Td>
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
                                                        <MenuItem icon={<FiEdit />} onClick={() => handleEditUser(user)}>
                                                            Modifier
                                                        </MenuItem>
                                                        <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteUser(user)}>
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
                                {filteredUsers.slice(0, displayCount).length} utilisateur{filteredUsers.slice(0, displayCount).length !== 1 ? 's' : ''} affiché{filteredUsers.slice(0, displayCount).length !== 1 ? 's' : ''} sur {filteredUsers.length}
                            </Text>
                            
                            {displayCount < filteredUsers.length && (
                                <Button
                                    onClick={() => setDisplayCount(prev => prev + 100)}
                                    colorScheme="blue"
                                    variant="outline"
                                    leftIcon={<FiRefreshCw />}
                                >
                                    Charger plus d'utilisateurs
                                </Button>
                            )}
                        </Flex>
                    </>
                )}

                {/* Modal d'édition utilisateur */}
                <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Modifier l'utilisateur</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            {selectedUser && (
                                <EditUserForm
                                    user={selectedUser}
                                    onSave={handleSaveUser}
                                    isLoading={loading}
                                    onCancel={onEditClose}
                                />
                            )}
                        </ModalBody>
                    </ModalContent>
                </Modal>

                {/* Modal de confirmation de suppression */}
                <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="md">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader color="red.500">Supprimer l'utilisateur</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            <Text>
                                Êtes-vous sûr de vouloir supprimer l'utilisateur <b>{selectedUser?.username}</b> ?
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

interface EditUserFormProps {
    user: User;
    onSave: (userData: Partial<User>) => void;
    isLoading: boolean;
    onCancel: () => void;
}

const EditUserForm = ({ user, onSave, isLoading, onCancel }: EditUserFormProps) => {
    const [formData, setFormData] = useState({
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <FormControl mb={4}>
                <FormLabel>Nom d'utilisateur</FormLabel>
                <Input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />
            </FormControl>

            <FormControl mb={4}>
                <FormLabel>Email</FormLabel>
                <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </FormControl>

            <FormControl mb={4}>
                <FormLabel>Rôle</FormLabel>
                <Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                >
                    <option value="admin">Administrateur</option>
                    <option value="moderator">Modérateur</option>
                    <option value="user">Utilisateur</option>
                </Select>
            </FormControl>

            <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel htmlFor="active" mb="0">
                    Utilisateur actif
                </FormLabel>
                <Switch
                    id="active"
                    name="active"
                    isChecked={formData.active}
                    onChange={handleSwitchChange}
                    colorScheme="green"
                />
            </FormControl>

            <Flex justifyContent="flex-end" mt={6}>
                <Button mr={3} onClick={onCancel}>
                    Annuler
                </Button>
                <Button
                    colorScheme="blue"
                    type="submit"
                    isLoading={isLoading}
                >
                    Enregistrer
                </Button>
            </Flex>
        </form>
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

        // Fetch users, routes, and incidents
        const [usersResponse, routesResponse, incidentsResponse] = await Promise.all([
            axios.get(`${process.env.API_URL}/api/auth/users`, config),
            axios.get(`${process.env.API_URL}/api/navigation/routes/all`, config),
            axios.get(`${process.env.API_URL}/api/navigation/traffic/reports`, config)
        ]);

        const users = usersResponse.data.data.users;
        const routes = routesResponse.data.data.routes;
        const incidents = incidentsResponse.data.data.incidents;

        // Add route and incident counts to each user
        const usersWithStats = users.map((user: any) => {
            const userRoutes = routes.filter((route: any) => route.userId === user.id);
            const userIncidents = incidents.filter((incident: any) => incident.userId === user.id);
            
            // Calculer l'utilisation totale des itinéraires
            const totalRouteUsage = userRoutes.reduce((total: number, route: any) => total + (route.usageCount || 0), 0);
            
            return {
                ...user,
                routesCount: userRoutes.length,
                incidentsCount: userIncidents.length,
                totalRouteUsage
            };
        });

        if (usersResponse.data.status === 'success') {
            return {
                props: {
                    initialUsers: usersWithStats || []
                },
            };
        }

        return {
            props: {
                initialUsers: []
            },
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);

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
                initialUsers: []
            },
        };
    }
};

export default UsersPage;