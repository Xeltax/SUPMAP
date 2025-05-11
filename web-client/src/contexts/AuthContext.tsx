import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import api from '@/services/api';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    profilePicture: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: { username?: string; email?: string }) => Promise<void>;
    updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    handleOAuthLogin: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

const COOKIE_EXPIRY = 7;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);
            const storedToken = Cookies.get('token');
            const storedUser = Cookies.get('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                try {
                    setUser(JSON.parse(storedUser));

                    const response = await api.auth.getProfile();
                    setUser(response.data?.user);
                } catch (error) {
                    // Si le token est invalide, déconnecter l'utilisateur
                    Cookies.remove('token');
                    Cookies.remove('user');
                    setToken(null);
                    setUser(null);
                }
            }

            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const handleOAuthLogin = async (token: string) => {
        setIsLoading(true);
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));

            const user = {
                id: payload.id,
                email: payload.email,
                username: payload.username,
                role: payload.role,
                profilePicture: payload.profilePicture || ''
            };

            Cookies.set('token', token, { expires: COOKIE_EXPIRY, secure: process.env.NODE_ENV === 'production' });
            Cookies.set('user', JSON.stringify(user), { expires: COOKIE_EXPIRY, secure: process.env.NODE_ENV === 'production' });

            setToken(token);
            setUser(user);

            router.push('/dashboard');
        } catch (error) {
            console.error('Erreur lors de la connexion OAuth:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.auth.login(email, password);

            if (response.data) {
                const { token, user } = response.data;

                Cookies.set('token', token, { expires: COOKIE_EXPIRY, secure: process.env.NODE_ENV === 'production' });
                Cookies.set('user', JSON.stringify(user), { expires: COOKIE_EXPIRY, secure: process.env.NODE_ENV === 'production' });

                setToken(token);
                setUser(user);
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username: string, email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.auth.register(username, email, password);

            if (response.data) {
                const { token, user } = response.data;

                Cookies.set('token', token, { expires: COOKIE_EXPIRY, secure: process.env.NODE_ENV === 'production' });
                Cookies.set('user', JSON.stringify(user), { expires: COOKIE_EXPIRY, secure: process.env.NODE_ENV === 'production' });

                setToken(token);
                setUser(user);
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await api.auth.logout();
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            Cookies.remove('token');
            Cookies.remove('user');

            setToken(null);
            setUser(null);
            setIsLoading(false);
            router.push('/login');
        }
    };

    const updateProfile = async (data: { username?: string; email?: string }) => {
        setIsLoading(true);
        try {
            const response = await api.auth.updateProfile(data);

            if (response.data?.user) {
                setUser(response.data.user);
                Cookies.set('user', JSON.stringify(response.data.user), { expires: COOKIE_EXPIRY, secure: process.env.NODE_ENV === 'production' });
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updatePassword = async (currentPassword: string, newPassword: string) => {
        setIsLoading(true);
        try {
            const response = await api.auth.updatePassword(currentPassword, newPassword);

            if (response.data) {
                const { token, user } = response.data;

                Cookies.set('token', token, { expires: COOKIE_EXPIRY, secure: process.env.NODE_ENV === 'production' });
                Cookies.set('user', JSON.stringify(user), { expires: COOKIE_EXPIRY, secure: process.env.NODE_ENV === 'production' });

                setToken(token);
                setUser(user);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du mot de passe:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        handleOAuthLogin
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;