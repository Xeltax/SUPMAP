import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from 'react-query';
import type { AppProps } from 'next/app';
import theme from '@/theme';
import Layout from '@/components/Layout';
import '@/styles/globals.css';
import Head from 'next/head';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: false,
        },
    },
});

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ChakraProvider theme={theme}>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <Head>
                        <title>Supmap - Navigation en temps réel</title>
                        <meta name="description" content="Application de navigation en temps réel avec signalements d'incidents de trafic" />
                        <meta name="viewport" content="width=device-width, initial-scale=1" />
                        <link rel="icon" href="/favicon.ico" />
                    </Head>
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                </AuthProvider>
            </QueryClientProvider>
        </ChakraProvider>
    );
}