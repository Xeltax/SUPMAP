import {
    Box,
    Container,
    Stack,
    SimpleGrid,
    Text,
    Link,
    useColorModeValue,
    Flex,
    IconButton,
} from '@chakra-ui/react';
import { FaTwitter, FaYoutube, FaInstagram, FaGithub, FaEnvelope } from 'react-icons/fa';
import NextLink from 'next/link';

const Footer = () => {
    return (
        <Box
            bg={useColorModeValue('gray.50', 'gray.900')}
            color={useColorModeValue('gray.700', 'gray.200')}
            borderTopWidth={1}
            borderTopStyle="solid"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
            <Container as={Stack} maxW={'6xl'} py={10}>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
                    <Stack align={'flex-start'}>
                        <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
                            L'application
                        </Text>
                        <Link as={NextLink} href={'/'}>Accueil</Link>
                        <Link as={NextLink} href={'/about'}>À propos</Link>
                        <Link as={NextLink} href={'/features'}>Fonctionnalités</Link>
                        <Link as={NextLink} href={'/pricing'}>Tarifs</Link>
                    </Stack>

                    <Stack align={'flex-start'}>
                        <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
                            Support
                        </Text>
                        <Link as={NextLink} href={'/help'}>Centre d'aide</Link>
                        <Link as={NextLink} href={'/faq'}>FAQ</Link>
                        <Link as={NextLink} href={'/contact'}>Contact</Link>
                        <Link as={NextLink} href={'/bug-report'}>Signaler un bug</Link>
                    </Stack>

                    <Stack align={'flex-start'}>
                        <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
                            Légal
                        </Text>
                        <Link as={NextLink} href={'/terms'}>Conditions d'utilisation</Link>
                        <Link as={NextLink} href={'/privacy'}>Politique de confidentialité</Link>
                        <Link as={NextLink} href={'/cookies'}>Politique des cookies</Link>
                        <Link as={NextLink} href={'/cgv'}>CGV</Link>
                    </Stack>

                    <Stack align={'flex-start'}>
                        <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
                            Société
                        </Text>
                        <Link as={NextLink} href={'/about-us'}>À propos de nous</Link>
                        <Link as={NextLink} href={'/blog'}>Blog</Link>
                        <Link as={NextLink} href={'/careers'}>Carrières</Link>
                        <Link as={NextLink} href={'/press'}>Presse</Link>
                    </Stack>
                </SimpleGrid>
            </Container>

            <Box
                borderTopWidth={1}
                borderTopStyle="solid"
                borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
                <Container
                    as={Stack}
                    maxW={'6xl'}
                    py={4}
                    direction={{ base: 'column', md: 'row' }}
                    spacing={4}
                    justify={{ base: 'center', md: 'space-between' }}
                    align={{ base: 'center', md: 'center' }}
                >
                    <Text>© {new Date().getFullYear()} Trafine. Tous droits réservés</Text>
                    <Stack direction={'row'} spacing={6}>
                        <IconButton
                            aria-label="Twitter"
                            icon={<FaTwitter />}
                            size="sm"
                            isRound
                            variant="ghost"
                        />
                        <IconButton
                            aria-label="YouTube"
                            icon={<FaYoutube />}
                            size="sm"
                            isRound
                            variant="ghost"
                        />
                        <IconButton
                            aria-label="Instagram"
                            icon={<FaInstagram />}
                            size="sm"
                            isRound
                            variant="ghost"
                        />
                        <IconButton
                            aria-label="GitHub"
                            icon={<FaGithub />}
                            size="sm"
                            isRound
                            variant="ghost"
                        />
                        <IconButton
                            aria-label="Email"
                            icon={<FaEnvelope />}
                            size="sm"
                            isRound
                            variant="ghost"
                        />
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
};

export default Footer;