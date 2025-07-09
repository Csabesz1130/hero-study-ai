"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Analytics } from "@/types";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { LearningTimeChart } from "@/components/analytics/LearningTimeChart";
import { CompletionRateChart } from "@/components/analytics/CompletionRateChart";

export default function AnalyticsPage() {
    const router = useRouter();
    const [analytics, setAnalytics] = useState<Analytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    const loadAnalytics = async () => {
        try {
            // TODO: Get actual user ID from auth context
            const userId = "temp-user-id";
            // @ts-expect-error - Külső api kliens típusa nem tartalmaz analytics namespace-t
            const data = await api.analytics.getByTimeRange(userId, timeRange);
            setAnalytics(data);
        } catch (error) {
            toast.error("Hiba történt az analitikai adatok betöltése közben");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="text-white">Betöltés...</div>
            </div>
        );
    }

    // Calculate statistics
    const totalLearningTime = analytics.reduce((acc, curr) => acc + curr.learningTime, 0);
    const averageCompletionRate = analytics.length > 0
        ? analytics.reduce((acc, curr) => acc + curr.completionRate, 0) / analytics.length
        : 0;
    const averageScore = analytics.length > 0
        ? analytics.reduce((acc, curr) => acc + curr.averageScore, 0) / analytics.length
        : 0;
    const lastActivity = analytics.length > 0
        ? new Date(analytics[0].lastActivity).toLocaleDateString("hu-HU")
        : "-";

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
            <nav className="bg-gray-800 border-b border-gray-700">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Analitika</h1>
                    <Button onClick={() => router.push("/dashboard")}>
                        Vissza az irányítópulthoz
                    </Button>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Teljesítmény Áttekintés</h2>
                    <div className="flex space-x-2">
                        <Button
                            variant={timeRange === "week" ? ("default" as any) : ("outline" as any)}
                            onClick={() => setTimeRange("week")}
                        >
                            Hét
                        </Button>
                        <Button
                            variant={timeRange === "month" ? ("default" as any) : ("outline" as any)}
                            onClick={() => setTimeRange("month")}
                        >
                            Hónap
                        </Button>
                        <Button
                            variant={timeRange === "year" ? ("default" as any) : ("outline" as any)}
                            onClick={() => setTimeRange("year")}
                        >
                            Év
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Összes Tanulási Idő</CardTitle>
                            <CardDescription>Az elmúlt {timeRange}ben</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary-500">
                                {Math.round(totalLearningTime / 60)} óra
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Teljesítési Arány</CardTitle>
                            <CardDescription>Az elmúlt {timeRange}ben</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary-500">
                                {Math.round(averageCompletionRate)}%
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Átlagos Pontszám</CardTitle>
                            <CardDescription>Az elmúlt {timeRange}ben</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary-500">
                                {Math.round(averageScore)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Utolsó Aktivítás</CardTitle>
                            <CardDescription>Az elmúlt {timeRange}ben</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary-500">
                                {lastActivity}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tanulási Trend</CardTitle>
                            <CardDescription>
                                Napi tanulási idő az elmúlt {timeRange}ben
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <LearningTimeChart data={analytics} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Teljesítési Trend</CardTitle>
                            <CardDescription>
                                Teljesítési arány az elmúlt {timeRange}ben
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CompletionRateChart data={analytics} />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
} 