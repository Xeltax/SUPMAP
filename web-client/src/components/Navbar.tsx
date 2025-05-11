import React, { useState } from 'react';
import {
    Box,
    Flex,
    Text,
    IconButton,
    Button,
    Stack,
    Collapse,
    Icon,
    Link,
    Popover,
    PopoverTrigger,
    PopoverContent,
    useColorModeValue,
    useDisclosure,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    useColorMode,
} from '@chakra-ui/react';
import {
    HamburgerIcon,
    CloseIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    MoonIcon,
    SunIcon,
} from '@chakra-ui/icons';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import {FaMap, FaRoute, FaExclamationTriangle, FaUser, FaCrown} from 'react-icons/fa';

interface NavbarProps {
    minimal?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ minimal = false }) => {
    const { isOpen, onToggle } = useDisclosure();
    const { colorMode, toggleColorMode } = useColorMode();
    const { isAuthenticated, user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    console.log('user', user);

    return (
        <Box>
            <Flex
                bg={useColorModeValue('white', 'gray.800')}
                color={useColorModeValue('gray.600', 'white')}
                minH={'60px'}
                py={{ base: 2 }}
                px={{ base: 4, md: 6 }}
                borderBottom={1}
                borderStyle={'solid'}
                borderColor={useColorModeValue('gray.200', 'gray.700')}
                align={'center'}
                justify={'space-between'}
            >
                <Flex
                    flex={{ base: 1, md: 'auto' }}
                    ml={{ base: -2 }}
                    display={{ base: 'flex', md: 'none' }}
                >
                    <IconButton
                        onClick={onToggle}
                        icon={
                            isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
                        }
                        variant={'ghost'}
                        aria-label={'Toggle Navigation'}
                    />
                </Flex>
                <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
                    <Link as={NextLink} href="/">
                        <Text
                            textAlign={useColorModeValue('left', 'left')}
                            fontFamily={'heading'}
                            fontWeight={'bold'}
                            fontSize={'xl'}
                            color={useColorModeValue('blue.600', 'blue.300')}
                        >
                            Supmap
                        </Text>
                    </Link>

                    {!minimal && (
                        <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
                            <DesktopNav isAuthenticated={isAuthenticated} />
                        </Flex>
                    )}
                </Flex>

                <Stack
                    flex={{ base: 1, md: 0 }}
                    justify={'flex-end'}
                    direction={'row'}
                    spacing={6}
                >
                    <Button onClick={toggleColorMode} variant={'ghost'} size={'sm'}>
                        {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                    </Button>

                    {!minimal && (
                        <>
                            {isAuthenticated ? (
                                <Menu>
                                    <MenuButton
                                        as={Button}
                                        rounded={'full'}
                                        variant={'link'}
                                        cursor={'pointer'}
                                        minW={0}
                                    >
                                        <Avatar
                                            size={'sm'}
                                            src={user?.profilePicture || ''}
                                            name={user?.username || 'Utilisateur'}
                                        />
                                    </MenuButton>
                                    <MenuList>
                                        <MenuItem icon={<FaUser />} onClick={() => router.push('/profile')}>
                                            Mon profil
                                        </MenuItem>
                                        {user?.role === 'admin' &&
                                            <MenuItem icon={<FaCrown />} onClick={() => router.push('/admin')}>
                                                Administration
                                            </MenuItem>
                                        }
                                        <MenuItem icon={<FaRoute />} onClick={() => router.push('/routes')}>
                                            Mes itinéraires
                                        </MenuItem>
                                        <MenuItem icon={<FaMap />} onClick={() => router.push('/map')}>
                                            Carte en direct
                                        </MenuItem>
                                        <MenuDivider />
                                        <MenuItem onClick={handleLogout}>
                                            Déconnexion
                                        </MenuItem>
                                    </MenuList>
                                </Menu>
                            ) : (
                                <>
                                    <Button
                                        as={NextLink}
                                        fontSize={'sm'}
                                        fontWeight={400}
                                        variant={'link'}
                                        href={'/login'}
                                    >
                                        Se connecter
                                    </Button>
                                    <Button
                                        as={NextLink}
                                        display={{ base: 'none', md: 'inline-flex' }}
                                        fontSize={'sm'}
                                        fontWeight={600}
                                        color={'white'}
                                        bg={'blue.400'}
                                        href={'/register'}
                                        _hover={{
                                            bg: 'blue.500',
                                        }}
                                    >
                                        S'inscrire
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </Stack>
            </Flex>

            <Collapse in={isOpen} animateOpacity>
                <MobileNav isAuthenticated={isAuthenticated} />
            </Collapse>
        </Box>
    );
};

const DesktopNav = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
    const linkColor = useColorModeValue('gray.600', 'gray.200');
    const linkHoverColor = useColorModeValue('blue.600', 'blue.300');
    const popoverContentBgColor = useColorModeValue('white', 'gray.800');

    // Différentes options de navigation selon que l'utilisateur est connecté ou non
    const NAV_ITEMS = isAuthenticated
        ? [
            {
                label: 'Dashboard',
                href: '/dashboard',
            },
            {
                label: 'Carte',
                href: '/map',
                icon: <FaMap />,
            },
            {
                label: 'Itinéraires',
                href: '/routes',
                icon: <FaRoute />,
            },
            {
                label: 'Signalements',
                href: '/incidents',
                icon: <FaExclamationTriangle />,
            },
        ]
        : [
            {
                label: 'Fonctionnalités',
                children: [
                    {
                        label: 'Navigation en temps réel',
                        subLabel: 'Itinéraires optimisés en fonction du trafic',
                        href: '/#features',
                        icon: <FaMap />,
                    },
                    {
                        label: 'Signalements d\'incidents',
                        subLabel: 'Partagez et recevez des alertes de trafic',
                        href: '/#features',
                        icon: <FaExclamationTriangle />,
                    },
                ],
            },
            {
                label: 'À propos',
                href: '/about',
            },
        ];

    return (
        <Stack direction={'row'} spacing={4}>
            {NAV_ITEMS.map((navItem : any) => (
                <Box key={navItem.label}>
                    <Popover trigger={'hover'} placement={'bottom-start'}>
                        <PopoverTrigger>
                            <Link
                                as={NextLink}
                                p={2}
                                href={navItem.href ?? '#'}
                                fontSize={'sm'}
                                fontWeight={500}
                                color={linkColor}
                                _hover={{
                                    textDecoration: 'none',
                                    color: linkHoverColor,
                                }}
                            >
                                <Flex align="center">
                                    {navItem.icon && <Box mr={2}>{navItem.icon}</Box>}
                                    {navItem.label}
                                    {navItem.children && (
                                        <Icon color={'gray.400'} ml={1} w={4} h={4} as={ChevronDownIcon} />
                                    )}
                                </Flex>
                            </Link>
                        </PopoverTrigger>

                        {navItem.children && (
                            <PopoverContent
                                border={0}
                                boxShadow={'xl'}
                                bg={popoverContentBgColor}
                                p={4}
                                rounded={'xl'}
                                minW={'sm'}
                            >
                                <Stack>
                                    {navItem.children.map((child : any) => (
                                        <DesktopSubNav key={child.label} {...child} />
                                    ))}
                                </Stack>
                            </PopoverContent>
                        )}
                    </Popover>
                </Box>
            ))}
        </Stack>
    );
};

const DesktopSubNav = ({ label, href, subLabel, icon }: NavItem) => {
    return (
        <Link
            as={NextLink}
            href={href}
            role={'group'}
            display={'block'}
            p={2}
            rounded={'md'}
            _hover={{ bg: useColorModeValue('blue.50', 'gray.700') }}
        >
            <Stack direction={'row'} align={'center'}>
                {icon && <Box mr={2}>{icon}</Box>}
                <Box>
                    <Text
                        transition={'all .3s ease'}
                        _groupHover={{ color: useColorModeValue('blue.500', 'blue.300') }}
                        fontWeight={500}
                    >
                        {label}
                    </Text>
                    <Text fontSize={'sm'}>{subLabel}</Text>
                </Box>
                <Flex
                    transition={'all .3s ease'}
                    transform={'translateX(-10px)'}
                    opacity={0}
                    _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
                    justify={'flex-end'}
                    align={'center'}
                    flex={1}
                >
                    <Icon color={'blue.400'} w={5} h={5} as={ChevronRightIcon} />
                </Flex>
            </Stack>
        </Link>
    );
};

const MobileNav = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
    const linkColor = useColorModeValue('gray.600', 'gray.200');
    const NAV_ITEMS = isAuthenticated
        ? [
            {
                label: 'Dashboard',
                href: '/dashboard',
            },
            {
                label: 'Carte',
                href: '/map',
                icon: <FaMap />,
            },
            {
                label: 'Itinéraires',
                href: '/routes',
                icon: <FaRoute />,
            },
            {
                label: 'Signalements',
                href: '/incidents',
                icon: <FaExclamationTriangle />,
            },
            {
                label: 'Mon profil',
                href: '/profile',
                icon: <FaUser />,
            },
        ]
        : [
            {
                label: 'Fonctionnalités',
                children: [
                    {
                        label: 'Navigation en temps réel',
                        subLabel: 'Itinéraires optimisés en fonction du trafic',
                        href: '/#features',
                        icon: <FaMap />,
                    },
                    {
                        label: 'Signalements d\'incidents',
                        subLabel: 'Partagez et recevez des alertes de trafic',
                        href: '/#features',
                        icon: <FaExclamationTriangle />,
                    },
                ],
            },
            {
                label: 'À propos',
                href: '/about',
            },
        ];

    return (
        <Stack
            bg={useColorModeValue('white', 'gray.800')}
            p={4}
            display={{ md: 'none' }}
        >
            {NAV_ITEMS.map((navItem) => (
                <MobileNavItem key={navItem.label} {...navItem} />
            ))}
            {isAuthenticated && (
                <Box
                    py={2}
                    as={NextLink}
                    href="/"
                    onClick={(e) => {
                        e.preventDefault();
                        // Appeler la fonction de déconnexion
                        const { logout } = useAuth();
                        logout();
                    }}
                    _hover={{
                        textDecoration: 'none',
                    }}
                >
                    <Text fontWeight={600} color={linkColor}>
                        Déconnexion
                    </Text>
                </Box>
            )}
        </Stack>
    );
};

const MobileNavItem = ({ label, children, href, icon }: NavItem) => {
    const { isOpen, onToggle } = useDisclosure();
    const linkColor = useColorModeValue('gray.600', 'gray.200');

    return (
        <Stack spacing={4} onClick={children && onToggle}>
            <Flex
                py={2}
                as={NextLink}
                href={href ?? '#'}
                justify={'space-between'}
                align={'center'}
                _hover={{
                    textDecoration: 'none',
                }}
            >
                <Flex align="center">
                    {icon && <Box mr={2}>{icon}</Box>}
                    <Text fontWeight={600} color={linkColor}>
                        {label}
                    </Text>
                </Flex>
                {children && (
                    <Icon
                        as={ChevronDownIcon}
                        transition={'all .25s ease-in-out'}
                        transform={isOpen ? 'rotate(180deg)' : ''}
                        w={6}
                        h={6}
                    />
                )}
            </Flex>

            <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
                <Stack
                    mt={2}
                    pl={4}
                    borderLeft={1}
                    borderStyle={'solid'}
                    borderColor={useColorModeValue('gray.200', 'gray.700')}
                    align={'start'}
                >
                    {children &&
                        children.map((child) => (
                            <Link key={child.label} py={2} as={NextLink} href={child.href}>
                                <Flex align="center">
                                    {child.icon && <Box mr={2}>{child.icon}</Box>}
                                    {child.label}
                                </Flex>
                            </Link>
                        ))}
                </Stack>
            </Collapse>
        </Stack>
    );
};

interface NavItem {
    label: string;
    subLabel?: string;
    children?: Array<NavItem>;
    href?: string;
    icon?: React.ReactElement;
}

export default Navbar;