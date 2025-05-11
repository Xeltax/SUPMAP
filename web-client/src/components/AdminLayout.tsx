import React, { ReactNode } from 'react';
import {
    Box,
    Flex,
    Icon,
    Text,
    Drawer,
    DrawerContent,
    DrawerOverlay,
    IconButton,
    useDisclosure,
    useColorModeValue,
    Heading,
    Avatar,
    VStack,
    HStack,
    CloseButton,
    BoxProps,
    FlexProps,
    Button,
    useColorMode
} from '@chakra-ui/react';
import {
    FiMenu,
    FiUsers,
    FiMapPin,
    FiAlertTriangle,
    FiBarChart2,
    FiSettings,
    FiLogOut,
    FiSun,
    FiMoon,
    FiTrendingUp
} from 'react-icons/fi';
import { FaRoute } from 'react-icons/fa';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import api from '@/services/api';

interface LinkItemProps {
    name: string;
    icon: any;
    path: string;
}

const LinkItems: Array<LinkItemProps> = [
    { name: 'Tableau de bord', icon: FiBarChart2, path: '/admin' },
    { name: 'Utilisateurs', icon: FiUsers, path: '/admin/users' },
    { name: 'Itinéraires', icon: FaRoute, path: '/admin/routes' },
    { name: 'Incidents', icon: FiAlertTriangle, path: '/admin/incidents' },
    { name: 'Prédictions', icon: FiTrendingUp, path: '/admin/predictions' },
    { name: 'Statistiques', icon: FiBarChart2, path: '/admin/stat' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
            <SidebarContent
                onClose={() => onClose}
                display={{ base: 'none', md: 'block' }}
            />
            <Drawer
                autoFocus={false}
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
                returnFocusOnClose={false}
                onOverlayClick={onClose}
                size="full">
                <DrawerOverlay />
                <DrawerContent>
                    <SidebarContent onClose={onClose} />
                </DrawerContent>
            </Drawer>
            <Box ml={{ base: 0, md: 60 }} p="4">
                {children}
            </Box>
        </Box>
    );
}

interface SidebarProps extends BoxProps {
    onClose: () => void;
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
    const router = useRouter();
    const { colorMode, toggleColorMode } = useColorMode();

    const handleLogout = async () => {
        try {
            await api.auth.logout();
            router.push('/login');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    };

    return (
        <Box
            transition="3s ease"
            bg={useColorModeValue('white', 'gray.900')}
            borderRight="1px"
            borderRightColor={useColorModeValue('gray.200', 'gray.700')}
            w={{ base: 'full', md: 60 }}
            pos="fixed"
            h="full"
            {...rest}>
            <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
                <HStack spacing={2}>
                    <Icon as={FaRoute} color="blue.500" w={6} h={6} />
                    <Text fontSize="xl" fontWeight="bold">
                        Trafine Admin
                    </Text>
                </HStack>
                <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
            </Flex>
            <VStack spacing={1} align="stretch">
                {LinkItems.map((link) => (
                    <NavItem
                        key={link.name}
                        icon={link.icon}
                        path={link.path}
                        isActive={router.pathname === link.path}
                    >
                        {link.name}
                    </NavItem>
                ))}
            </VStack>
        </Box>
    );
};

interface NavItemProps extends FlexProps {
    icon: any;
    children: ReactNode;
    path: string;
    isActive?: boolean;
}

const NavItem = ({ icon, children, path, isActive, ...rest }: NavItemProps) => {
    const activeColor = useColorModeValue('blue.500', 'blue.300');
    const activeBg = useColorModeValue('blue.50', 'blue.900');
    const inactiveColor = useColorModeValue('gray.600', 'gray.300');

    return (
        <NextLink href={path} passHref>
            <Flex
                align="center"
                p="4"
                mx="4"
                borderRadius="lg"
                role="group"
                cursor="pointer"
                bg={isActive ? activeBg : 'transparent'}
                color={isActive ? activeColor : inactiveColor}
                fontWeight={isActive ? 'bold' : 'normal'}
                _hover={{
                    bg: useColorModeValue('blue.50', 'blue.900'),
                    color: useColorModeValue('blue.500', 'blue.300'),
                }}
                {...rest}>
                {icon && (
                    <Icon
                        mr="4"
                        fontSize="16"
                        as={icon}
                    />
                )}
                {children}
            </Flex>
        </NextLink>
    );
};

interface MobileProps extends FlexProps {
    onOpen: () => void;
}

const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
    const { colorMode } = useColorMode();
    const router = useRouter();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.auth.getProfile();
                setUser(response.data?.user);
            } catch (error) {
                console.error('Erreur lors de la récupération du profil:', error);
            }
        };

        fetchUserData();
    }, []);

    return (
        <Flex
            ml={{ base: 0, md: 60 }}
            px={{ base: 4, md: 4 }}
            height="20"
            alignItems="center"
            bg={useColorModeValue('white', 'gray.900')}
            borderBottomWidth="1px"
            borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
            justifyContent={{ base: 'space-between', md: 'flex-end' }}
            {...rest}>
            <IconButton
                display={{ base: 'flex', md: 'none' }}
                onClick={onOpen}
                variant="outline"
                aria-label="open menu"
                icon={<FiMenu />}
            />

            <HStack spacing={{ base: '0', md: '6' }}>
                <Text
                    display={{ base: 'flex', md: 'none' }}
                    fontSize="xl"
                    fontWeight="bold"
                    alignItems="center"
                >
                    <Icon as={FaRoute} color="blue.500" mr="2" />
                    Trafine Admin
                </Text>
                <Flex alignItems={'center'}>
                    <HStack spacing="4">
                        <VStack
                            display={{ base: 'none', md: 'flex' }}
                            alignItems="flex-end"
                            spacing="1px"
                            ml="2">
                            <Text fontSize="sm">{user?.username || 'Administrateur'}</Text>
                            <Text fontSize="xs" color="gray.600">
                                Admin
                            </Text>
                        </VStack>
                        <Avatar
                            size={'sm'}
                            name={user?.username || 'Admin'}
                            bg="blue.500"
                            color="white"
                        />
                    </HStack>
                </Flex>
            </HStack>
        </Flex>
    );
};