import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface PrivacySettings {
    anonymizeData: boolean;
    allowAnalytics: boolean;
    allowPersonalization: boolean;
    allowCookies: boolean;
    allowLocationTracking: boolean;
    allowEmailNotifications: boolean;
    allowPushNotifications: boolean;
    dataRetentionPeriod: number; // napokban
    exportData: boolean;
}

export const usePrivacySettings = () => {
    const { data: session } = useSession();
    const [settings, setSettings] = useState<PrivacySettings>({
        anonymizeData: false,
        allowAnalytics: true,
        allowPersonalization: true,
        allowCookies: true,
        allowLocationTracking: false,
        allowEmailNotifications: true,
        allowPushNotifications: false,
        dataRetentionPeriod: 365,
        exportData: true
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!session?.user) return;

            try {
                const response = await fetch('/api/analytics/privacy');
                if (!response.ok) throw new Error('Nem sikerült betölteni a beállításokat');

                const data = await response.json();
                setSettings(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [session]);

    const updateSettings = async (newSettings: Partial<PrivacySettings>) => {
        if (!session?.user) return;

        try {
            const response = await fetch('/api/analytics/privacy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settings: { ...settings, ...newSettings },
                }),
            });

            if (!response.ok) throw new Error('Nem sikerült menteni a beállításokat');

            setSettings(prev => ({ ...prev, ...newSettings }));
            setSuccess('Beállítások sikeresen mentve');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt');
        }
    };

    const exportUserData = async () => {
        if (!session?.user) return;

        try {
            const response = await fetch('/api/analytics/export', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Nem sikerült exportálni az adatokat');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `user-data-${new Date().toISOString()}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setSuccess('Adatok sikeresen exportálva');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt');
        }
    };

    const deleteUserData = async () => {
        if (!session?.user) return;

        try {
            const response = await fetch('/api/analytics/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Nem sikerült törölni az adatokat');

            setSuccess('Adatok sikeresen törölve');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt');
        }
    };

    return {
        settings,
        loading,
        error,
        success,
        updateSettings,
        exportUserData,
        deleteUserData
    };
}; 