import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    Button,
    Container,
    Divider,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Input,
    Link,
    Stack,
    Text,
    useColorModeValue,
    useToast,
    FormErrorMessage
} from '@chakra-ui/react';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import NextLink from 'next/link';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { register, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const toast = useToast();

    // Rediriger vers le tableau de bord si l'utilisateur est déjà connecté
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!username || username.length < 3) {
            newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
        }

        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Veuillez fournir une adresse email valide';
        }

        if (!password || password.length < 8) {
            newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await register(username, email, password);
            toast({
                title: 'Inscription réussie',
                description: 'Votre compte a été créé avec succès.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            router.push('/dashboard');
        } catch (error: any) {
            toast({
                title: 'Erreur d\'inscription',
                description: error.response?.data?.message || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${provider}`;
    };

    return (
        <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
            <Stack spacing="8">
                <Stack spacing="6" align="center">
                    <Heading size="xl" fontWeight="bold">
                        Créer un compte
                    </Heading>
                    <Text color={useColorModeValue('gray.600', 'gray.400')}>
                        Rejoignez notre communauté et naviguez en temps réel
                    </Text>
                </Stack>
                <Box
                    py={{ base: '0', sm: '8' }}
                    px={{ base: '4', sm: '10' }}
                    bg={useColorModeValue('white', 'gray.800')}
                    boxShadow={{ base: 'none', sm: 'md' }}
                    borderRadius={{ base: 'none', sm: 'xl' }}
                >
                    <form onSubmit={handleSubmit}>
                        <Stack spacing="6">
                            <Stack spacing="5">
                                <FormControl isRequired isInvalid={!!errors.username}>
                                    <FormLabel htmlFor="username">Nom d'utilisateur</FormLabel>
                                    <Input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Votre nom d'utilisateur"
                                    />
                                    {errors.username && <FormErrorMessage>{errors.username}</FormErrorMessage>}
                                </FormControl>
                                <FormControl isRequired isInvalid={!!errors.email}>
                                    <FormLabel htmlFor="email">Email</FormLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="votre@email.com"
                                    />
                                    {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
                                </FormControl>
                                <FormControl isRequired isInvalid={!!errors.password}>
                                    <FormLabel htmlFor="password">Mot de passe</FormLabel>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Votre mot de passe"
                                    />
                                    {errors.password && <FormErrorMessage>{errors.password}</FormErrorMessage>}
                                </FormControl>
                                <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                                    <FormLabel htmlFor="confirmPassword">Confirmer le mot de passe</FormLabel>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirmez votre mot de passe"
                                    />
                                    {errors.confirmPassword && <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>}
                                </FormControl>
                            </Stack>
                            <Stack spacing="4">
                                <Button
                                    colorScheme="blue"
                                    type="submit"
                                    isLoading={isSubmitting}
                                    loadingText="Inscription..."
                                >
                                    S'inscrire
                                </Button>
                                <Divider />
                                <Stack spacing="3">
                                    <Button
                                        variant="outline"
                                        leftIcon={<FaGoogle />}
                                        onClick={() => handleSocialLogin('google')}
                                    >
                                        Continuer avec Google
                                    </Button>
                                </Stack>
                            </Stack>
                        </Stack>
                    </form>
                </Box>
                <HStack spacing="1" justify="center">
                    <Text color={useColorModeValue('gray.600', 'gray.400')}>
                        Vous avez déjà un compte?
                    </Text>
                    <Link as={NextLink} href="/login" color={useColorModeValue('blue.500', 'blue.300')}>
                        Se connecter
                    </Link>
                </HStack>
            </Stack>
        </Container>
    );
};

export default Register;