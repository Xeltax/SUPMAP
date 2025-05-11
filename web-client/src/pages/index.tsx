import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, Center, Container, Flex, Heading, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import { FaMapMarkedAlt, FaRoute, FaExclamationTriangle, FaUsers } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

const Feature = ({ title, text, icon }: { title: string; text: string; icon: React.ReactElement }) => {
    return (
        <Stack direction={'row'} align={'center'} spacing={5}>
            <Flex
                w={16}
                h={16}
                align={'center'}
                justify={'center'}
                rounded={'full'}
                bg={useColorModeValue('blue.100', 'blue.900')}
            >
                {icon}
            </Flex>
            <Stack direction={'column'} spacing={2}>
                <Heading fontSize={'xl'}>{title}</Heading>
                <Text color={useColorModeValue('gray.600', 'gray.400')}>{text}</Text>
            </Stack>
        </Stack>
    );
};

export default function Home() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    return (
        <Box bg={useColorModeValue('gray.50', 'gray.900')}>
            {/* Hero Section */}
            <Box
                bg={useColorModeValue('blue.500', 'blue.700')}
                color="white"
                py={20}
                px={4}
                backgroundImage="url('/images/traffic-background.jpg')"
                backgroundSize="cover"
                backgroundPosition="center"
                backgroundBlendMode="overlay"
                position="relative"
            >
                <Container maxW={'4xl'} zIndex={10} position="relative">
                    <Stack align={'center'} spacing={8} textAlign={'center'}>
                        <Heading
                            fontWeight={700}
                            fontSize={{ base: '3xl', sm: '4xl', md: '6xl' }}
                            lineHeight={'110%'}
                        >
                            Navigation en temps réel{' '}
                            <Text as={'span'} color={'blue.300'}>
                                pour tous
                            </Text>
                        </Heading>
                        <Text maxW={'2xl'} fontSize={'xl'}>
                            Supmap vous permet de naviguer en France avec des informations en temps réel sur la circulation,
                            les accidents et les obstacles. Contribuez à la communauté en signalant des incidents et recevez
                            des itinéraires optimisés en fonction des conditions de trafic.
                        </Text>
                        <Stack spacing={6} direction={'row'}>
                            <Button
                                rounded={'full'}
                                px={6}
                                py={8}
                                bg={'blue.400'}
                                _hover={{ bg: 'blue.500' }}
                                fontSize={'lg'}
                                onClick={() => router.push('/register')}
                            >
                                S'inscrire
                            </Button>
                            <Button
                                rounded={'full'}
                                px={6}
                                py={8}
                                fontSize={'lg'}
                                onClick={() => router.push('/login')}
                            >
                                Se connecter
                            </Button>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            {/* Features Section */}
            <Container maxW={'5xl'} py={16}>
                <Stack spacing={12}>
                    <Heading
                        textAlign={'center'}
                        fontSize={'3xl'}
                        pb={8}
                    >
                        Fonctionnalités principales
                    </Heading>
                    <Stack spacing={10}>
                        <Feature
                            icon={<FaMapMarkedAlt color="blue.500" size="2.5rem" />}
                            title={'Navigation en temps réel'}
                            text={'Itinéraires optimisés en fonction du trafic actuel, avec recalcul automatique en cas d\'incidents sur votre chemin.'}
                        />
                        <Feature
                            icon={<FaExclamationTriangle color="orange.500" size="2.5rem" />}
                            title={'Alertes et signalements'}
                            text={'Recevez des alertes sur les conditions de circulation et signalez des incidents pour aider les autres usagers.'}
                        />
                        <Feature
                            icon={<FaUsers color="green.500" size="2.5rem" />}
                            title={'Contribution communautaire'}
                            text={'Validez ou infirmez les signalements d\'autres utilisateurs pour améliorer la fiabilité des informations.'}
                        />
                        <Feature
                            icon={<FaRoute color="purple.500" size="2.5rem" />}
                            title={'Itinéraires personnalisés'}
                            text={'Choisissez votre itinéraire selon vos préférences : évitez les péages, prenez le chemin le plus court ou le plus rapide.'}
                        />
                    </Stack>
                </Stack>
            </Container>

            {/* CTA Section */}
            <Box bg={useColorModeValue('blue.50', 'blue.900')} py={16}>
                <Container maxW={'3xl'} textAlign={'center'}>
                    <Heading
                        fontWeight={700}
                        fontSize={{ base: '2xl', sm: '3xl', md: '4xl' }}
                        lineHeight={'110%'}
                        mb={6}
                    >
                        Prêt à améliorer vos trajets ?
                    </Heading>
                    <Text fontSize={'xl'} mb={8}>
                        Rejoignez notre communauté et commencez à naviguer plus intelligemment dès aujourd'hui.
                    </Text>
                    <Center>
                        <Button
                            rounded={'full'}
                            px={6}
                            py={8}
                            bg={'blue.400'}
                            color={'white'}
                            _hover={{ bg: 'blue.500' }}
                            fontSize={'lg'}
                            onClick={() => router.push('/register')}
                        >
                            Commencer gratuitement
                        </Button>
                    </Center>
                </Container>
            </Box>
        </Box>
    );
}