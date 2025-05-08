import React, { useState } from 'react';
import {
    Box,
    Container,
    Heading,
    VStack,
    FormControl,
    FormLabel,
    Input,
    Button,
    useToast,
    Tab,
    Tabs,
    TabList,
    TabPanels,
    TabPanel,
    Text,
    Flex,
    Divider,
    Avatar,
    FormErrorMessage,
    useColorModeValue,
    Card,
    CardBody
} from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import axios from 'axios';
import api from "@/services/api";

interface User {
    id?: string;
    _id?: string;
    username: string;
    email: string;
    profilePicture?: string;
    role?: string;
    createdAt?: string;
}

interface ProfilePageProps {
    userData: User;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userData }) => {
    // États pour les données utilisateur
    const [user, setUser] = useState<User>(userData);
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // États pour le formulaire de profil
    const [username, setUsername] = useState(userData.username);
    const [email, setEmail] = useState(userData.email);
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');

    // États pour le formulaire de mot de passe
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const toast = useToast();
    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // Fonction de validation pour le formulaire de profil
    const validateProfileForm = () => {
        let isValid = true;

        // Valider le nom d'utilisateur
        if (!username) {
            setUsernameError('Le nom d\'utilisateur est requis');
            isValid = false;
        } else if (username.length < 3 || username.length > 20) {
            setUsernameError('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères');
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setUsernameError('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores');
            isValid = false;
        } else {
            setUsernameError('');
        }

        // Valider l'email
        if (!email) {
            setEmailError('L\'email est requis');
            isValid = false;
        } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            setEmailError('Veuillez fournir une adresse email valide');
            isValid = false;
        } else {
            setEmailError('');
        }

        return isValid;
    };

    // Fonction de validation pour le formulaire de mot de passe
    const validatePasswordForm = () => {
        let isValid = true;

        if (!currentPassword) {
            setPasswordError('Le mot de passe actuel est requis');
            isValid = false;
        } else if (!newPassword) {
            setPasswordError('Le nouveau mot de passe est requis');
            isValid = false;
        } else if (newPassword.length < 8) {
            setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères');
            isValid = false;
        } else if (!/\d/.test(newPassword)) {
            setPasswordError('Le mot de passe doit contenir au moins un chiffre');
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            setPasswordError('Les mots de passe ne correspondent pas');
            isValid = false;
        } else {
            setPasswordError('');
        }

        return isValid;
    };

    // Mettre à jour le profil
    const handleUpdateProfile = async () => {
        if (!validateProfileForm()) {
            return;
        }

        try {
            setIsSaving(true);

            // Ne mettre à jour que ce qui a changé
            const updateData: { username?: string; email?: string } = {};

            if (username !== user?.username) {
                updateData.username = username;
            }

            if (email !== user?.email) {
                updateData.email = email;
            }

            // Si rien n'a changé, ne pas faire de requête
            if (Object.keys(updateData).length === 0) {
                toast({
                    title: 'Information',
                    description: 'Aucune modification à enregistrer',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                });
                setIsSaving(false);
                return;
            }

            const response = await api.auth.updateProfile(updateData);

            if (response && response.data && response.data.user) {
                setUser(response.data.user);
                toast({
                    title: 'Succès',
                    description: 'Votre profil a été mis à jour avec succès',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error: any) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            const errorMessage = error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du profil';

            toast({
                title: 'Erreur',
                description: errorMessage,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Mettre à jour le mot de passe
    const handleUpdatePassword = async () => {
        if (!validatePasswordForm()) {
            return;
        }

        try {
            setIsChangingPassword(true);

            const response = await api.auth.updatePassword(currentPassword, newPassword);

            if (response && response.status === 'success') {
                // Réinitialiser les champs du formulaire
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');

                toast({
                    title: 'Succès',
                    description: 'Votre mot de passe a été mis à jour avec succès',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error: any) {
            console.error('Erreur lors de la mise à jour du mot de passe:', error);
            const errorMessage = error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du mot de passe';

            toast({
                title: 'Erreur',
                description: errorMessage,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    // Gérer la déconnexion
    const handleLogout = async () => {
        try {
            await api.auth.logout();

            toast({
                title: 'Déconnexion réussie',
                description: 'Vous avez été déconnecté avec succès',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

            // Redirection vers la page de connexion (à adapter selon votre configuration de routing)
            window.location.href = '/login';
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);

            toast({
                title: 'Erreur',
                description: 'Une erreur est survenue lors de la déconnexion',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Container maxW="container.md" py={8}>
            <Card mb={8} boxShadow="md" borderColor={borderColor}>
                <CardBody>
                    <Flex direction={{ base: 'column', md: 'row' }} alignItems="center" mb={6}>
                        <Avatar
                            size="xl"
                            name={user.username}
                            src={user.profilePicture || undefined}
                            mb={{ base: 4, md: 0 }}
                            mr={{ base: 0, md: 6 }}
                        />
                        <Box>
                            <Heading as="h1" size="lg">{user.username}</Heading>
                            <Text mt={2} fontSize="md" color="gray.500">{user.email}</Text>
                            {user.role && (
                                <Text fontSize="sm" color="blue.500" fontWeight="medium" mt={1}>
                                    Rôle: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Text>
                            )}
                            {user.createdAt && (
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                    Membre depuis {new Date(user.createdAt).toLocaleDateString()}
                                </Text>
                            )}
                        </Box>
                    </Flex>
                </CardBody>
            </Card>

            <Box bg={bgColor} borderRadius="lg" boxShadow="md" overflow="hidden">
                <Tabs isFitted variant="enclosed">
                    <TabList>
                        <Tab fontWeight="semibold">Profil</Tab>
                        <Tab fontWeight="semibold">Mot de passe</Tab>
                    </TabList>

                    <TabPanels>
                        {/* Onglet Informations du profil */}
                        <TabPanel>
                            <VStack spacing={6} align="stretch">
                                <Heading as="h2" size="md">Informations du profil</Heading>

                                <FormControl isInvalid={!!usernameError} isRequired>
                                    <FormLabel htmlFor="username">Nom d'utilisateur</FormLabel>
                                    <Input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                    <FormErrorMessage>{usernameError}</FormErrorMessage>
                                </FormControl>

                                <FormControl isInvalid={!!emailError} isRequired>
                                    <FormLabel htmlFor="email">Adresse e-mail</FormLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <FormErrorMessage>{emailError}</FormErrorMessage>
                                </FormControl>

                                <Button
                                    colorScheme="blue"
                                    isLoading={isSaving}
                                    loadingText="Enregistrement..."
                                    onClick={handleUpdateProfile}
                                    alignSelf="flex-start"
                                    mt={4}
                                >
                                    Enregistrer les modifications
                                </Button>
                            </VStack>
                        </TabPanel>

                        {/* Onglet Modification du mot de passe */}
                        <TabPanel>
                            <VStack spacing={6} align="stretch">
                                <Heading as="h2" size="md">Changer votre mot de passe</Heading>

                                <FormControl isRequired>
                                    <FormLabel htmlFor="currentPassword">Mot de passe actuel</FormLabel>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel htmlFor="newPassword">Nouveau mot de passe</FormLabel>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </FormControl>

                                <FormControl isInvalid={!!passwordError} isRequired>
                                    <FormLabel htmlFor="confirmPassword">Confirmer le nouveau mot de passe</FormLabel>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <FormErrorMessage>{passwordError}</FormErrorMessage>
                                </FormControl>

                                <Button
                                    colorScheme="blue"
                                    isLoading={isChangingPassword}
                                    loadingText="Modification..."
                                    onClick={handleUpdatePassword}
                                    alignSelf="flex-start"
                                    mt={4}
                                >
                                    Changer le mot de passe
                                </Button>
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>

            <Box mt={8} textAlign="center">
                <Divider mb={6} />
                <Button colorScheme="red" variant="outline" onClick={handleLogout}>
                    Se déconnecter
                </Button>
            </Box>
        </Container>
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

        return {
            props: {
                userData: userResponse.data.data.user,
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

        // Pour les autres erreurs, rediriger également vers login
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }
};

export default ProfilePage;