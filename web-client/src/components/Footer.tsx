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
                </Container>
            </Box>
        </Box>
    );
};

export default Footer;