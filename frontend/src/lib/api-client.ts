import axios from 'axios';
import { getSession } from 'next-auth/react';

if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
}

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 10000,
});

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const session = await getSession();
            if (session?.accessToken) {
                config.headers.Authorization = `Bearer ${session.accessToken}`;
            }
        } catch (error) {
            console.error('Failed to get session:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized - could redirect to login
            console.warn('Unauthorized request');
        }
        return Promise.reject(error);
    },
);

export default apiClient;
