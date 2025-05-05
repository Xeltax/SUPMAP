import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Types
export interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
  errors?: any[];
}

// Get API URL from environment variables
const getApiUrl = () => {
  // Use the API_URL from the environment variables
  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
  return apiUrl;
};

// Base API configuration
const apiConfig = {
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
};

// Custom fetch function with interceptors
const customFetch = async (url: string, options: RequestInit = {}) => {
  try {
    // Add token to headers if available
    const token = await AsyncStorage.getItem('token');
    const headers = {
      ...apiConfig.headers,
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Prepare request options
    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    // Make the request
    const fullUrl = `${apiConfig.baseURL}${url}`;
    const response = await fetch(fullUrl, requestOptions);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      // Check if this is not a login or register request
      const isLoginRequest = url.includes('/auth/login');
      const isRegisterRequest = url.includes('/auth/register');

      if (!isLoginRequest && !isRegisterRequest) {
        // Clear token and user data
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        
        // In a real app, you would redirect to login screen here
        // For example: navigation.navigate('Login')
      }
    }

    // Parse JSON response
    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// API Service
const api = {
  // Authentication
  auth: {
    login: async (email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> => {
      const { data } = await customFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return data;
    },

    register: async (username: string, email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> => {
      const { data } = await customFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      return data;
    },

    getProfile: async (): Promise<ApiResponse<{ user: any }>> => {
      const { data } = await customFetch('/api/auth/me', {
        method: 'GET',
      });
      return data;
    },

    updateProfile: async (userData: { username?: string; email?: string }): Promise<ApiResponse<{ user: any }>> => {
      const { data } = await customFetch('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(userData),
      });
      return data;
    },

    updatePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<{ user: any; token: string }>> => {
      const { data } = await customFetch('/api/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return data;
    },

    logout: async (): Promise<ApiResponse<null>> => {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      const { data } = await customFetch('/api/auth/logout', {
        method: 'POST',
      });
      return data;
    }
  },

  // Navigation and routes
  routes: {
    calculate: async (routeData: {
      origin: [number, number] | string;
      destination: [number, number] | string;
      waypoints?: Array<[number, number] | string>;
      routeType?: string;
      avoidTolls?: boolean;
      traffic?: boolean;
    }): Promise<ApiResponse<{ routes: any[] }>> => {
      const { data } = await customFetch('/api/navigation/routes/calculate', {
        method: 'POST',
        body: JSON.stringify(routeData),
      });
      return data;
    },

    search: async (query: string, options?: { limit?: number; countrySet?: string }): Promise<ApiResponse<{ locations: any[] }>> => {
      const queryParams = new URLSearchParams({ query, ...options as any }).toString();
      const { data } = await customFetch(`/api/navigation/routes/search?${queryParams}`, {
        method: 'GET',
      });
      return data;
    },

    getUserRoutes: async (options?: { favorite?: boolean; sort?: string; limit?: number; offset?: number }): Promise<ApiResponse<{ routes: any[] }>> => {
      const queryParams = options ? new URLSearchParams(options as any).toString() : '';
      const { data } = await customFetch(`/api/navigation/routes/user${queryParams ? `?${queryParams}` : ''}`, {
        method: 'GET',
      });
      return data;
    }
  },

  // Traffic and incidents
  traffic: {
    getTrafficIncidents: async (bbox: string, incidentType?: string): Promise<ApiResponse<{ incidents: any }>> => {
      const queryParams = new URLSearchParams({ bbox, ...(incidentType ? { incidentType } : {}) }).toString();
      const { data } = await customFetch(`/api/navigation/traffic/incidents?${queryParams}`, {
        method: 'GET',
      });
      return data;
    },

    reportTrafficIncident: async (incidentData: {
      incidentType: string;
      coordinates: [number, number];
      description?: string;
      severity?: string;
      durationMinutes?: number;
    }): Promise<ApiResponse<{ incident: any }>> => {
      const { data } = await customFetch('/api/navigation/traffic/report', {
        method: 'POST',
        body: JSON.stringify(incidentData),
      });
      return data;
    }
  }
};

export default api;
