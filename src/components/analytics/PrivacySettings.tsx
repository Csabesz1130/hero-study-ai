import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService } from '@/services/analytics-service';

export const PrivacySettings: React.FC = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        trackBehavior: true,
        trackPerformance: true,
        trackPreferences: true,
        anonymizeData: false,
        deleteData: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSettingChange = (setting: keyof typeof settings) => {
        setSettings((prev) => ({
            ...prev,
            [setting]: !prev[setting],
        }));
    };

    const handleSaveSettings = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Itt implementálhatjuk a beállítások mentését
            // Például egy API hívással vagy lokális tárolással

            setSuccess('Beállítások sikeresen mentve');
        } catch (err) {
            setError('Hiba történt a beállítások mentése közben');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnonymizeData = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await analyticsService.anonymizeUserData(user.id);
            setSuccess('Adatok sikeresen anonimizálva');
        } catch (err) {
            setError('Hiba történt az adatok anonimizálása közben');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">Adatvédelmi Beállítások</h1>

            <div className="bg-white p-6 rounded-lg shadow space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Adatgyűjtési Beállítások</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium">Viselkedés követése</h3>
                                <p className="text-sm text-gray-500">
                                    Tanulási viselkedés és interakciók rögzítése
                                </p>
                            </div>
                            <button
                                onClick={() => handleSettingChange('trackBehavior')}
                                className={`px-4 py-2 rounded-md ${settings.trackBehavior
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                            >
                                {settings.trackBehavior ? 'Bekapcsolva' : 'Kikapcsolva'}
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium">Teljesítmény követése</h3>
                                <p className="text-sm text-gray-500">
                                    Tudásmegtartás és előrehaladás mérése
                                </p>
                            </div>
                            <button
                                onClick={() => handleSettingChange('trackPerformance')}
                                className={`px-4 py-2 rounded-md ${settings.trackPerformance
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                            >
                                {settings.trackPerformance ? 'Bekapcsolva' : 'Kikapcsolva'}
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium">Preferenciák követése</h3>
                                <p className="text-sm text-gray-500">
                                    Tanulási stílus és preferenciák elemzése
                                </p>
                            </div>
                            <button
                                onClick={() => handleSettingChange('trackPreferences')}
                                className={`px-4 py-2 rounded-md ${settings.trackPreferences
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                            >
                                {settings.trackPreferences ? 'Bekapcsolva' : 'Kikapcsolva'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-xl font-semibold mb-4">Adatkezelés</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium">Adatok anonimizálása</h3>
                                <p className="text-sm text-gray-500">
                                    Meglévő adatok személyes azonosító adatainak eltávolítása
                                </p>
                            </div>
                            <button
                                onClick={handleAnonymizeData}
                                disabled={loading}
                                className="px-4 py-2 rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50"
                            >
                                {loading ? 'Folyamatban...' : 'Anonimizálás'}
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium">Adatok törlése</h3>
                                <p className="text-sm text-gray-500">
                                    Összes analitikai adat végleges törlése
                                </p>
                            </div>
                            <button
                                onClick={() => handleSettingChange('deleteData')}
                                className={`px-4 py-2 rounded-md ${settings.deleteData
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                            >
                                {settings.deleteData ? 'Megerősítés' : 'Törlés'}
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-100 text-red-800 rounded-md">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-4 bg-green-100 text-green-800 rounded-md">
                        {success}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        onClick={handleSaveSettings}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Mentés...' : 'Beállítások mentése'}
                    </button>
                </div>
            </div>
        </div>
    );
}; 