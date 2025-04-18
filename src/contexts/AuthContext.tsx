import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, LoginCredentials, RegisterData, AuthResponse } from '@/types/user';
import { api } from '@/lib/api';

interface AuthContextType {
    authState: AuthState;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: Partial<User>) => Promise<void>;
    updatePreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        error: null
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadUser(token);
        } else {
            setAuthState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    const loadUser = async (token: string) => {
        try {
            const response = await api.get<User>('/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAuthState({
                user: response.data,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });
        } catch (error) {
            localStorage.removeItem('token');
            setAuthState({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: 'Hiba történt a felhasználói adatok betöltése közben'
            });
        }
    };

    const login = async (credentials: LoginCredentials) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
            const response = await api.post<AuthResponse>('/auth/login', credentials);
            const { user, token } = response.data;

            localStorage.setItem('token', token);
            setAuthState({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Hibás email vagy jelszó'
            }));
            throw error;
        }
    };

    const register = async (data: RegisterData) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
            const response = await api.post<AuthResponse>('/auth/register', data);
            const { user, token } = response.data;

            localStorage.setItem('token', token);
            setAuthState({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Hiba történt a regisztráció során'
            }));
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout', null, {
                headers: { Authorization: `Bearer ${authState.token}` }
            });
        } catch (error) {
            console.error('Hiba történt a kijelentkezés során:', error);
        } finally {
            localStorage.removeItem('token');
            setAuthState({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            });
        }
    };

    const updateUser = async (userData: Partial<User>) => {
        try {
            const response = await api.patch<User>('/users/me', userData, {
                headers: { Authorization: `Bearer ${authState.token}` }
            });
            setAuthState(prev => ({
                ...prev,
                user: response.data
            }));
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                error: 'Hiba történt a felhasználói adatok frissítése során'
            }));
            throw error;
        }
    };

    const updatePreferences = async (preferences: Partial<User['preferences']>) => {
        try {
            const response = await api.patch<User>('/users/me/preferences', preferences, {
                headers: { Authorization: `Bearer ${authState.token}` }
            });
            setAuthState(prev => ({
                ...prev,
                user: response.data
            }));
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                error: 'Hiba történt a preferenciák frissítése során'
            }));
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            authState,
            login,
            register,
            logout,
            updateUser,
            updatePreferences
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 