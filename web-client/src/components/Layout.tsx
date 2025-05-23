import React, { ReactNode } from 'react';
import { Box } from '@chakra-ui/react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    const fullScreenPages = ['/map', '/admin', '/admin/users', '/admin/routes', '/admin/incidents', '/admin/settings'];
    const isFullScreen = fullScreenPages.includes(router.pathname);

    const publicPages = ['/', '/login', '/register', '/forgot-password'];
    const isPublicPage = publicPages.includes(router.pathname);

    if (isFullScreen) {
        return (
            <Box display="flex" flexDirection="column" minHeight="100vh">
                <Navbar minimal={true} />
                <Box flex="1">
                    {children}
                </Box>
            </Box>
        );
    }

    return (
        <Box display="flex" flexDirection="column" minHeight="100vh">
            <Navbar minimal={false} />
            <Box flex="1">
                {children}
            </Box>
            <Footer />
        </Box>
    );
};

export default Layout;