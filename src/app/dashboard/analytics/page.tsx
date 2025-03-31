"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Analytics } from "@/types";

export default function AnalyticsPage() {
    const router = useRouter();
    const [analytics, setAnalytics] = useState<Analytics[]>([]);
    const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");

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
                            variant={timeRange === "week" ? "default" : "outline"}
                            onClick={() => setTimeRange("week")}
                        >
                            Hét
                        </Button>
                        <Button
                            variant={timeRange === "month" ? "default" : "outline"}
                            onClick={() => setTimeRange("month")}
                        >
                            Hónap
                        </Button>
                        <Button
                            variant={timeRange === "year" ? "default" : "outline"}
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
                            <p className="text-3xl font-bold text-primary-500">0 óra</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Teljesítési Arány</CardTitle>
                            <CardDescription>Az elmúlt {timeRange}ben</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary-500">0%</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Átlagos Pontszám</CardTitle>
                            <CardDescription>Az elmúlt {timeRange}ben</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary-500">0</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Utolsó Aktivítás</CardDescription>
                            <CardDescription>Az elmúlt {timeRange}ben</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary-500">-</p>
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
                            <div className="h-64 flex items-center justify-center text-gray-400">
                                Grafikon helye
                            </div>
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
                            <div className="h-64 flex items-center justify-center text-gray-400">
                                Grafikon helye
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
} 