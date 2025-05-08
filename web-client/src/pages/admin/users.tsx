// pages/admin/users.tsx
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
    Avatar
} from '@chakra-ui/react';
import { FiMoreVertical, FiSearch, FiEdit, FiTrash2, FiUserPlus, FiEye, FiLock } from 'react-icons/fi';
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
    status: 'active' | 'inactive' | 'banned';
    createdAt: string;
    lastLogin?: string;
    routesCount: number;
    incidentsCount: number;
}

// Composant principal
const UsersPage = ({ initialUsers }: { initialUsers: User[] }) => {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | number | null>(null);
    const [loading, setLoading] = useState(false);

    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isResetPasswordOpen, onOpen: onResetPasswordOpen, onClose: onResetPasswordClose } = useDisclosure();

    const toast = useToast();
    const router = useRouter();

    // Filtrer les utilisateurs
    useEffect(() => {
        let result = users;

        // Filtre de recherche
        if (searchTerm) {
            result = result.filter(user =>
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtre par statut
        if (statusFilter !== 'all') {
            result = result.filter(user => user.status === statusFilter);
        }

        // Filtre par rôle
        if (roleFilter !== 'all') {
            result = result.filter(user => user.role === roleFilter);
        }

        setFilteredUsers(result);
    }, [searchTerm, statusFilter, roleFilter, users]);

    // Formatage de la date
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

    // Déterminer la couleur du badge de statut
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'green';
            case 'inactive':
                return 'yellow';
            case 'banned':
                return 'red';
            default:
                return 'gray';
        }
    };

    // Ouvrir le modal de détails
    const handleViewDetails = (user: User) => {
        setSelectedUser(user);
        onDetailOpen();
    };

    // Ouvrir le modal d'édition
    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        onEditOpen();
    };

    // Ouvrir le modal de suppression
    const handleDeleteUser = (user: User) => {
        setSelectedUser(user);
        setSelectedUserId(user.id);
        onDeleteOpen();
    };

    // Ouvrir le modal de réinitialisation de mot de passe
    const handleResetPassword = (user: User) => {
        setSelectedUser(user);
        setSelectedUserId(user.id);
        onResetPasswordOpen();
    };

    // Sauvegarder les modifications de l'utilisateur
    const handleSaveUser = async (userData: Partial<User>) => {
        if (!selectedUser) return;

        setLoading(true);
        try {
            // Ici, vous implémenterez l'appel API réel pour mettre à jour l'utilisateur
            // Exemple fictif:
            // await api.users.update(selectedUser.id, userData);

            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 1000));

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

    // Confirmer la suppression de l'utilisateur
    const handleConfirmDelete = async () => {
        if (!selectedUserId) return;

        setLoading(true);
        try {
            // Ici, vous implémenterez l'appel API réel pour supprimer l'utilisateur
            // Exemple fictif:
            // await api.users.delete(selectedUserId);

            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Supprimer l'utilisateur de la liste
            const updatedUsers = users.filter(user => user.id !== selectedUserId);
            setUsers(updatedUsers);

            toast({
                title: "Utilisateur supprimé",
                description: `L'utilisateur a été supprimé avec succès.`,
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

    // Confirmer la réinitialisation du mot de passe
    const handleConfirmResetPassword = async (newPassword: string) => {
        if (!selectedUserId) return;

        setLoading(true);
        try {
            // Ici, vous implémenterez l'appel API réel pour réinitialiser le mot de passe
            // Exemple fictif:
            // await api.users.resetPassword(selectedUserId, { newPassword });

            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast({
                title: "Mot de passe réinitialisé",
                description: `Le mot de passe a été réinitialisé avec succès.`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            onResetPasswordClose();
        } catch (error) {
            console.error('Erreur lors de la réinitialisation du mot de passe:', error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la réinitialisation du mot de passe.",
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
                    <Button
                        leftIcon={<FiUserPlus />}
                        colorScheme="blue"
                        onClick={() => {
                            // Implémenter l'ajout d'un nouvel utilisateur
                            toast({
                                title: "Fonctionnalité en cours de développement",
                                description: "L'ajout d'utilisateur sera bientôt disponible.",
                                status: "info",
                                duration: 3000,
                                isClosable: true,
                            });
                        }}
                    >
                        Ajouter un utilisateur
                    </Button>
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
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        maxW={{ md: '180px' }}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="banned">Banni</option>
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
                                        <Th isNumeric>Incidents</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
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
                                                    <Badge colorScheme={getStatusColor(user.status)}>
                                                        {user.status === 'active' ? 'Actif' :
                                                            user.status === 'inactive' ? 'Inactif' : 'Banni'}
                                                    </Badge>
                                                </Td>
                                                <Td>{formatDate(user.createdAt)}</Td>
                                                <Td isNumeric>{user.routesCount}</Td>
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
                                                            <MenuItem icon={<FiEye />} onClick={() => handleViewDetails(user)}>
                                                                Voir les détails
                                                            </MenuItem>
                                                            <MenuItem icon={<FiEdit />} onClick={() => handleEditUser(user)}>
                                                                Modifier
                                                            </MenuItem>
                                                            <MenuItem icon={<FiLock />} onClick={() => handleResetPassword(user)}>
                                                                Réinitialiser le mot de passe
                                                            </MenuItem>
                                                            <MenuItem icon={<FiTrash2 />} color="red.500" onClick={() => handleDeleteUser(user)}>
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
                                                <Text color="gray.500">Aucun utilisateur trouvé</Text>
                                            </Td>
                                        </Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </TableContainer>

                        <Text mt={4} color="gray.500" fontSize="sm">
                            {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} trouvé{filteredUsers.length !== 1 ? 's' : ''}
                        </Text>
                    </>
                )}

                {/* Modal de détails utilisateur */}
                <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Détails de l'utilisateur</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            {selectedUser && (
                                <Box>
                                    <Flex justify="center" mb={6}>
                                        <Avatar
                                            size="xl"
                                            name={selectedUser.username}
                                            bg="blue.500"
                                            color="white"
                                        />
                                    </Flex>

                                    <SimpleUserInfoDisplay
                                        label="Nom d'utilisateur"
                                        value={selectedUser.username}
                                    />
                                    <SimpleUserInfoDisplay
                                        label="Email"
                                        value={selectedUser.email}
                                    />
                                    <SimpleUserInfoDisplay
                                        label="Rôle"
                                        value={selectedUser.role}
                                        badge={{
                                            colorScheme: selectedUser.role === 'admin' ? 'purple' :
                                                selectedUser.role === 'moderator' ? 'blue' : 'gray'
                                        }}
                                    />
                                    <SimpleUserInfoDisplay
                                        label="Statut"
                                        value={selectedUser.status === 'active' ? 'Actif' :
                                            selectedUser.status === 'inactive' ? 'Inactif' : 'Banni'}
                                        badge={{
                                            colorScheme: getStatusColor(selectedUser.status)
                                        }}
                                    />
                                    <SimpleUserInfoDisplay
                                        label="Date d'inscription"
                                        value={formatDate(selectedUser.createdAt)}
                                    />
                                    {selectedUser.lastLogin && (
                                        <SimpleUserInfoDisplay
                                            label="Dernière connexion"
                                            value={formatDate(selectedUser.lastLogin)}
                                        />
                                    )}
                                    <SimpleUserInfoDisplay
                                        label="Itinéraires créés"
                                        value={selectedUser.routesCount.toString()}
                                    />
                                    <SimpleUserInfoDisplay
                                        label="Incidents signalés"
                                        value={selectedUser.incidentsCount.toString()}
                                    />
                                </Box>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button colorScheme="blue" mr={3} onClick={onDetailClose}>
                                Fermer
                            </Button>
                            <Button
                                variant="outline"
                                leftIcon={<FiEdit />}
                                onClick={() => {
                                    onDetailClose();
                                    if (selectedUser) handleEditUser(selectedUser);
                                }}
                            >
                                Modifier
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

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

                {/* Modal de réinitialisation de mot de passe */}
                <Modal isOpen={isResetPasswordOpen} onClose={onResetPasswordClose} size="md">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Réinitialiser le mot de passe</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            <ResetPasswordForm
                                username={selectedUser?.username || ''}
                                onConfirm={handleConfirmResetPassword}
                                isLoading={loading}
                                onCancel={onResetPasswordClose}
                            />
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </Box>
        </AdminLayout>
    );
};

// Composants auxiliaires
interface SimpleUserInfoDisplayProps {
    label: string;
    value: string;
    badge?: {
        colorScheme: string;
    };
}

const SimpleUserInfoDisplay = ({ label, value, badge }: SimpleUserInfoDisplayProps) => {
    return (
        <Box mb={4}>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>
                {label}
            </Text>
            {badge ? (
                <Badge colorScheme={badge.colorScheme}>{value}</Badge>
            ) : (
                <Text>{value}</Text>
            )}
        </Box>
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
        status: user.status
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

            <FormControl mb={4}>
                <FormLabel>Statut</FormLabel>
                <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="banned">Banni</option>
                </Select>
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

interface ResetPasswordFormProps {
    username: string;
    onConfirm: (newPassword: string) => void;
    isLoading: boolean;
    onCancel: () => void;
}

const ResetPasswordForm = ({ username, onConfirm, isLoading, onCancel }: ResetPasswordFormProps) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (newPassword.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setError('');
        onConfirm(newPassword);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Text mb={4}>
                Définir un nouveau mot de passe pour l'utilisateur <b>{username}</b>
            </Text>

            <FormControl mb={4}>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
            </FormControl>

            <FormControl mb={4}>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
            </FormControl>

            {error && (
                <Text color="red.500" mb={4}>{error}</Text>
            )}

            <Flex justifyContent="flex-end" mt={6}>
                <Button mr={3} onClick={onCancel}>
                    Annuler
                </Button>
                <Button
                    colorScheme="blue"
                    type="submit"
                    isLoading={isLoading}
                >
                    Réinitialiser
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
        // Configuration de l'en-tête avec le token
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // Pour l'exemple, utilisons des données simulées
        // Dans un cas réel, vous feriez un appel API pour récupérer les utilisateurs
        // const usersResponse = await axios.get(`${process.env.API_URL}/api/admin/users`, config);
        // const users = usersResponse.data.data.users;

        // Exemple de données fictives
        const users: User[] = [
            {
                id: 1,
                username: "Jules Martin",
                email: "jules@example.com",
                role: "admin",
                status: "active",
                createdAt: "2025-01-15T14:30:00Z",
                lastLogin: "2025-05-02T09:45:00Z",
                routesCount: 12,
                incidentsCount: 5
            },
            {
                id: 2,
                username: "Marie Dubois",
                email: "marie@example.com",
                role: "moderator",
                status: "active",
                createdAt: "2025-02-20T09:15:00Z",
                lastLogin: "2025-05-03T14:20:00Z",
                routesCount: 8,
                incidentsCount: 10
            },
            {
                id: 3,
                username: "Thomas Bernard",
                email: "thomas@example.com",
                role: "user",
                status: "active",
                createdAt: "2025-03-12T16:45:00Z",
                lastLogin: "2025-05-01T11:30:00Z",
                routesCount: 5,
                incidentsCount: 2
            },
            {
                id: 4,
                username: "Sophie Leroy",
                email: "sophie@example.com",
                role: "user",
                status: "inactive",
                createdAt: "2025-03-28T11:20:00Z",
                routesCount: 3,
                incidentsCount: 0
            },
            {
                id: 5,
                username: "Lucas Moreau",
                email: "lucas@example.com",
                role: "user",
                status: "banned",
                createdAt: "2025-02-10T08:45:00Z",
                routesCount: 0,
                incidentsCount: 7
            }
        ];

        return {
            props: {
                initialUsers: users
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