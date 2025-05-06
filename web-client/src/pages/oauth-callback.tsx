import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Cookies from 'js-cookie';

const OauthCallback = () => {
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const auth = useAuth();

    useEffect(() => {
        const handleOAuthCallback = async () => {
            // Attendre que les paramètres d'URL soient disponibles
            if (!router.isReady) return;

            try {
                const { token } = router.query;

                if (!token || typeof token !== 'string') {
                    throw new Error('Aucun token trouvé dans l\'URL de callback');
                }

                const payload = JSON.parse(atob(token.split('.')[1]));

                const user = {
                    id: payload.id,
                    email: payload.email,
                    username: payload.username,
                    role: payload.role,
                    profilePicture: payload.profilePicture || ''
                };

                const COOKIE_EXPIRY = 7;
                Cookies.set('token', token, {
                    expires: COOKIE_EXPIRY,
                    secure: process.env.NODE_ENV === 'production'
                });
                Cookies.set('user', JSON.stringify(user), {
                    expires: COOKIE_EXPIRY,
                    secure: process.env.NODE_ENV === 'production'
                });

                window.location.href = '/dashboard';
            } catch (err: any) {
                console.error('Erreur lors du traitement du callback OAuth:', err);
                setError(err.message);
            }
        };

        handleOAuthCallback();
    }, [router.isReady, router.query]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="p-6 bg-white rounded shadow-md">
                    <h1 className="text-xl font-bold text-red-600 mb-4">Erreur d'authentification</h1>
                    <p>{error}</p>
                    <button
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => router.push('/login')}
                    >
                        Retourner à la page de connexion
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="p-6 bg-white rounded shadow-md">
                <h1 className="text-xl font-bold mb-4">Connexion en cours...</h1>
                <p>Veuillez patienter pendant que nous finalisons votre connexion.</p>
            </div>
        </div>
    );
};

export default OauthCallback;