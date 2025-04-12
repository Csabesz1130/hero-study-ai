import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService } from '@/services/analytics-service';
import { mlService } from '@/services/ml-service';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
    events: any[];
    learningStyle: any;
    knowledgeRetention: any[];
    cognitiveLoads: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const AnalyticsDashboard: React.FC = () => {
    const { user } = useAuth();
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;

            try {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30); // Utolsó 30 nap
                const endDate = new Date();

                const data = await analyticsService.getUserAnalytics(
                    user.id,
                    startDate,
                    endDate
                );
                setAnalyticsData(data);
            } catch (err) {
                setError('Hiba történt az adatok betöltése közben');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [user]);

    if (loading) return <div>Betöltés...</div>;
    if (error) return <div>{error}</div>;
    if (!analyticsData) return <div>Nincs elérhető adat</div>;

    // Tanulási stílus adatok előkészítése
    const learningStyleData = analyticsData.learningStyle
        ? Object.entries(analyticsData.learningStyle.style).map(([name, value]) => ({
            name,
            value: Number(value) * 100,
        }))
        : [];

    // Tudásmegtartás adatok előkészítése
    const retentionData = analyticsData.knowledgeRetention.map((item) => ({
        topic: item.topic,
        current: item.score * 100,
        predicted: item.predictedScore * 100,
    }));

    // Kognitív terhelés adatok előkészítése
    const cognitiveLoadData = analyticsData.cognitiveLoads.map((load) => ({
        date: new Date(load.timestamp).toLocaleDateString(),
        load: load.loadScore,
    }));

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">Tanulási Analitika</h1>

            {/* Tanulási Stílus */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Tanulási Stílus</h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={learningStyleData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {learningStyleData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tudásmegtartás */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Tudásmegtartás</h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={retentionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="topic" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="current" fill="#8884d8" name="Jelenlegi" />
                            <Bar dataKey="predicted" fill="#82ca9d" name="Előrejelzett" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Kognitív Terhelés */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Kognitív Terhelés</h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cognitiveLoadData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="load"
                                stroke="#8884d8"
                                name="Terhelés"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tanulási Események */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Tanulási Események</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Típus
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Időpont
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Adatok
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {analyticsData.events.map((event, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {event.type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(event.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {JSON.stringify(event.data)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}; 