import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    Button,
    Checkbox,
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
    useToast
} from '@chakra-ui/react';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import NextLink from 'next/link';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const toast = useToast();

    // Rediriger vers le tableau de bord si l'utilisateur est déjà connecté
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await login(email, password);
            toast({
                title: 'Connexion réussie',
                description: 'Vous êtes maintenant connecté.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            router.push('/dashboard');
        } catch (error: any) {
            toast({
                title: 'Erreur de connexion',
                description: error.response?.data?.message || 'Identifiants incorrects. Veuillez réessayer.',
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
                        Connexion à SupMap
                    </Heading>
                    <Text color={useColorModeValue('gray.600', 'gray.400')}>
                        Naviguez en temps réel avec notre communauté
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
                                <FormControl isRequired>
                                    <FormLabel htmlFor="email">Email</FormLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="votre@email.com"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel htmlFor="password">Mot de passe</FormLabel>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Votre mot de passe"
                                    />
                                </FormControl>
                            </Stack>
                            <HStack justify="space-between">
                                <Checkbox defaultChecked>Se souvenir de moi</Checkbox>
                                {/*<Link as={NextLink} href="/forgot-password" color={useColorModeValue('blue.500', 'blue.300')} fontSize="sm">*/}
                                {/*    Mot de passe oublié?*/}
                                {/*</Link>*/}
                            </HStack>
                            <Stack spacing="4">
                                <Button
                                    colorScheme="blue"
                                    type="submit"
                                    isLoading={isSubmitting}
                                    loadingText="Connexion..."
                                >
                                    Se connecter
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
                        Pas encore de compte?
                    </Text>
                    <Link as={NextLink} href="/register" color={useColorModeValue('blue.500', 'blue.300')}>
                        S&apos;inscrire
                    </Link>
                </HStack>
            </Stack>
        </Container>
    );
};

export default Login;