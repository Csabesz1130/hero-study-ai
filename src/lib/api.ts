import { LearningObjective, LearningProgress, Analytics } from "@/types";
import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Ha a token lejárt és még nem próbáltuk meg újra
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('Nincs refresh token');
                }

                const response = await axios.post(`${baseURL}/auth/refresh`, {
                    refreshToken
                });

                const { token } = response.data;
                localStorage.setItem('token', token);

                // Az eredeti kérés megismétlése az új tokennel
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Ha a refresh token is érvénytelen, kijelentkeztetjük a felhasználót
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Tanulási célok
export const objectives = {
    getAll: async (): Promise<LearningObjective[]> => {
        const response = await api.get('/learning/objectives');
        return response.data.data;
    },
    create: async (objective: Omit<LearningObjective, "id" | "createdAt" | "updatedAt">): Promise<LearningObjective> => {
        const response = await api.post('/learning/objectives', objective);
        return response.data.data;
    },
};

// Tanulási folyamat
export const progress = {
    getAll: async (): Promise<LearningProgress[]> => {
        const response = await api.get('/learning/progress');
        return response.data.data;
    },
    update: async (progress: Omit<LearningProgress, "lastAttempted">): Promise<LearningProgress> => {
        const response = await api.post('/learning/progress', progress);
        return response.data.data;
    },
};

// Analitika
export const analytics = {
    getByTimeRange: async (userId: string, timeRange: "week" | "month" | "year" = "week"): Promise<Analytics[]> => {
        const response = await api.get(`/learning/analytics?userId=${userId}&timeRange=${timeRange}`);
        return response.data.data;
    },
    update: async (analytics: Omit<Analytics, "id" | "date">): Promise<Analytics> => {
        const response = await api.post('/learning/analytics', analytics);
        return response.data.data;
    },
}; 