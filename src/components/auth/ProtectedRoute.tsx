import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

interface ProtectedRouteProps {
    children: React.ReactNode;
    roles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
    const { authState } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!authState.isLoading) {
            if (!authState.isAuthenticated) {
                router.push('/login');
            } else if (roles && !roles.includes(authState.user?.role || '')) {
                router.push('/unauthorized');
            }
        }
    }, [authState, roles, router]);

    if (authState.isLoading) {
        return <div>Betöltés...</div>;
    }

    if (!authState.isAuthenticated) {
        return null;
    }

    if (roles && !roles.includes(authState.user?.role || '')) {
        return null;
    }

    return <>{children}</>;
}; 