export interface User {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'teacher' | 'admin';
    preferences: UserPreferences;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date;
    isActive: boolean;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
        email: boolean;
        push: boolean;
        frequency: 'daily' | 'weekly' | 'monthly';
    };
    accessibility: {
        fontSize: number;
        highContrast: boolean;
        screenReader: boolean;
    };
    learning: {
        preferredTime: string;
        dailyGoal: number;
        topics: string[];
        difficulty: 'beginner' | 'intermediate' | 'advanced';
    };
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    role: 'student' | 'teacher';
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordResetConfirm {
    token: string;
    password: string;
} 