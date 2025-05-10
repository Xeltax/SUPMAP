import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

// Types
export interface ApiResponse<T> {
    status: string;
    data?: T;
    message?: string;
    errors?: any[];
}

console.log(process.env.NEXT_PUBLIC_API_URL )
const isServer = typeof window === 'undefined'
// Configuration de base d'Axios
const apiConfig: AxiosRequestConfig = {
    baseURL: isServer
        ? process.env.API_URL        // SSR / getServerSideProps
        : process.env.NEXT_PUBLIC_API_URL,  // client-side
    headers: {
        'Content-Type': 'application/json',
    },
};

// Création de l'instance Axios
const apiClient: AxiosInstance = axios.create(apiConfig);

// Intercepteur pour ajouter le token JWT aux requêtes
apiClient.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les réponses
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error : any) => {
        // Si le token est expiré ou invalide (statut 401), déconnecter l'utilisateur
        if (error.response && error.response.status === 401) {
            // Vérifier si l'erreur ne provient pas d'une tentative de connexion
            const isLoginRequest = error.config.url.includes('/auth/login');
            const isRegisterRequest = error.config.url.includes('/auth/register');

            if (!isLoginRequest && !isRegisterRequest) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Rediriger vers la page de connexion si on n'y est pas déjà
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// Service API
const api = {
    // Authentification
    auth: {
        login: async (email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> => {
            const response = await apiClient.post<ApiResponse<{ user: any; token: string }>>('/api/auth/login', {
                email,
                password,
            });
            return response.data;
        },

        register: async (username: string, email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> => {
            const response = await apiClient.post<ApiResponse<{ user: any; token: string }>>('/api/auth/register', {
                username,
                email,
                password,
            });
            console.log(response)
            return response.data;
        },

        getProfile: async (): Promise<ApiResponse<{ user: any }>> => {
            const response = await apiClient.get<ApiResponse<{ user: any }>>('/api/auth/me');
            return response.data;
        },

        updateProfile: async (data: { username?: string; email?: string }): Promise<ApiResponse<{ user: any }>> => {
            const response = await apiClient.patch<ApiResponse<{ user: any }>>('/api/auth/me', data);
            return response.data;
        },

        updatePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<{ user: any; token: string }>> => {
            const response = await apiClient.patch<ApiResponse<{ user: any; token: string }>>('/api/auth/password', {
                currentPassword,
                newPassword,
            });
            return response.data;
        },

        logout: async (): Promise<ApiResponse<null>> => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            const response = await apiClient.post<ApiResponse<null>>('/api/auth/logout');
            return response.data;
        },

        getAllUsers: async (): Promise<ApiResponse<{ users: any }>> => {
            const response = await apiClient.get<ApiResponse<{ users: any }>>('/api/auth/users');
            return response.data;
        },

        updateById: async (id: string, newData : any): Promise<ApiResponse<{ user: any }>> => {
            const response = await apiClient.patch<ApiResponse<{ user: any }>>(`/api/auth/users/${id}`, newData);
            return response.data;
        },

        deleteById: async (id: string): Promise<ApiResponse<{ user: any }>> => {
            const response = await apiClient.delete<ApiResponse<{ user: any }>>(`/api/auth/users/${id}`);
            return response.data;
        }
    },

    // Navigation et itinéraires
    routes: {
        calculate: async (data: {
            origin: [number, number] | string;
            destination: [number, number] | string;
            waypoints?: Array<[number, number] | string>;
            routeType?: string;
            avoidTolls?: boolean;
            traffic?: boolean;
        }): Promise<ApiResponse<{ routes: any[] }>> => {
            const response = await apiClient.post<ApiResponse<{ routes: any[] }>>('/api/navigation/routes/calculate', data);
            return response.data;
        },

        search: async (query: string, options?: { limit?: number; countrySet?: string }): Promise<ApiResponse<{ locations: any[] }>> => {
            const params = { query, ...options };
            const response = await apiClient.get<ApiResponse<{ locations: any[] }>>('/api/navigation/routes/search', { params });
            return response.data;
        },

        save: async (data: {
            name: string;
            originName: string;
            destinationName: string;
            originCoordinates: [number, number];
            destinationCoordinates: [number, number];
            waypoints?: Array<[number, number]>;
            routeData?: any;
            geometry?: any;
            distance?: number;
            duration?: number;
            avoidTolls?: boolean;
            routeType?: string;
            isFavorite?: boolean;
        }): Promise<ApiResponse<{ route: any }>> => {
            const response = await apiClient.post<ApiResponse<{ route: any }>>('/api/navigation/routes/save', data);
            return response.data;
        },

        getUserRoutes: async (options?: { favorite?: boolean; sort?: string; limit?: number; offset?: number }): Promise<ApiResponse<{ routes: any[] }>> => {
            const response = await apiClient.get<ApiResponse<{ routes: any[] }>>('/api/navigation/routes/user', { params: options });
            return response.data;
        },

        getRouteById: async (id: string): Promise<ApiResponse<{ route: any }>> => {
            const response = await apiClient.get<ApiResponse<{ route: any }>>(`/api/navigation/routes/${id}`);
            return response.data;
        },

        updateRoute: async (id: string, data: { name?: string; isFavorite?: boolean }): Promise<ApiResponse<{ route: any }>> => {
            const response = await apiClient.patch<ApiResponse<{ route: any }>>(`/api/navigation/routes/${id}`, data);
            return response.data;
        },

        deleteRoute: async (id: string): Promise<ApiResponse<null>> => {
            const response = await apiClient.delete<ApiResponse<null>>(`/api/navigation/routes/${id}`);
            return response.data;
        },

        generateQRCode: async (id: string): Promise<ApiResponse<{ qrCode: string }>> => {
            const response = await apiClient.get<ApiResponse<{ qrCode: string }>>(`/api/navigation/routes/qrcode/${id}`);
            return response.data;
        },

        getAllRoutes: async (options?: { favorite?: boolean; sort?: string; limit?: number; offset?: number }): Promise<ApiResponse<{ routes: any[] }>> => {
            const response = await apiClient.get<ApiResponse<{ routes: any[] }>>('/api/navigation/routes/all', { params: options });
            return response.data;
        },
    },

    // Trafic et incidents
    traffic: {
        getTrafficInfo: async (bbox: string, zoom?: number): Promise<ApiResponse<{ trafficInfo: any }>> => {
            const params = { bbox, zoom };
            const response = await apiClient.get<ApiResponse<{ trafficInfo: any }>>('/api/navigation/traffic/info', { params });
            return response.data;
        },

        getTrafficIncidents: async (bbox: string, incidentType?: string): Promise<ApiResponse<{ incidents: any }>> => {
            const params = { bbox, incidentType };
            const response = await apiClient.get<ApiResponse<{ incidents: any }>>('/api/navigation/traffic/incidents', { params });
            return response.data;
        },

        reportTrafficIncident: async (data: {
            incidentType: string;
            coordinates: [number, number];
            description?: string;
            severity?: string;
            durationMinutes?: number;
        }): Promise<ApiResponse<{ incident: any }>> => {
            const response = await apiClient.post<ApiResponse<{ incident: any }>>('/api/navigation/traffic/report', data);
            return response.data;
        },

        getUserReports: async (options?: { bbox?: string; userId?: string; active?: boolean; incidentType?: string }): Promise<ApiResponse<{ incidents: any[] }>> => {
            const response = await apiClient.get<ApiResponse<{ incidents: any[] }>>('/api/navigation/traffic/reports', { params: options });
            return response.data;
        },

        resolveTrafficIncident : async (id: string): Promise<ApiResponse<{ incident: any }>> => {
            const response = await apiClient.patch<ApiResponse<{ incident: any }>>(`/api/navigation/traffic/resolve/${id}`);
            return response.data;
        },

        validateIncidentReport: async (id: string): Promise<ApiResponse<{ incident: any }>> => {
            const response = await apiClient.post<ApiResponse<{ incident: any }>>(`/api/navigation/traffic/validate/${id}`);
            return response.data;
        },

        invalidateIncidentReport: async (id: string): Promise<ApiResponse<{ incident: any }>> => {
            const response = await apiClient.post<ApiResponse<{ incident: any }>>(`/api/navigation/traffic/invalidate/${id}`);
            return response.data;
        }
    }
};

export default api;