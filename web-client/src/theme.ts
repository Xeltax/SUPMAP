import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Configuration du mode sombre
const config: ThemeConfig = {
    initialColorMode: 'light',
    useSystemColorMode: true,
};

// Couleurs personnalisées
const colors = {
    brand: {
        50: '#e6f7ff',
        100: '#b3e0ff',
        200: '#80c9ff',
        300: '#4db2ff',
        400: '#1a9bff',
        500: '#0084e6',
        600: '#0066b3',
        700: '#004980',
        800: '#002b4d',
        900: '#000e1a',
    },
};

// Styles globaux
const styles = {
    global: (props: any) => ({
        body: {
            bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
            color: props.colorMode === 'dark' ? 'white' : 'gray.800',
        },
    }),
};

// Composants personnalisés
const components = {
    Button: {
        baseStyle: {
            fontWeight: 'bold',
            borderRadius: 'lg',
        },
        variants: {
            solid: (props: any) => ({
                bg: props.colorMode === 'dark' ? 'brand.400' : 'brand.500',
                color: 'white',
                _hover: {
                    bg: props.colorMode === 'dark' ? 'brand.300' : 'brand.600',
                },
            }),
            outline: (props: any) => ({
                borderColor: props.colorMode === 'dark' ? 'brand.400' : 'brand.500',
                color: props.colorMode === 'dark' ? 'brand.400' : 'brand.500',
                _hover: {
                    bg: props.colorMode === 'dark' ? 'brand.900' : 'brand.50',
                },
            }),
        },
    },
    Link: {
        baseStyle: (props: any) => ({
            color: props.colorMode === 'dark' ? 'brand.300' : 'brand.500',
            _hover: {
                textDecoration: 'none',
                color: props.colorMode === 'dark' ? 'brand.200' : 'brand.600',
            },
        }),
    },
};

// Création du thème
const theme = extendTheme({
    config,
    colors,
    styles,
    components,
    fonts: {
        heading: `'Inter', sans-serif`,
        body: `'Inter', sans-serif`,
    },
});

export default theme;