"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useApiTesting } from "@/hooks/useApiTesting";

export function ApiTester() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Record<string, any>>({});
    const { loading: postLoading, results: postResults, testPostEndpoints } = useApiTesting();

    const testGetEndpoints = async () => {
        setLoading(true);
        const newResults: Record<string, any> = {};

        try {
            // Test objectives endpoints
            const objectives = await api.objectives.getAll();
            newResults.objectives = {
                status: "success",
                data: objectives,
            };
        } catch (error) {
            newResults.objectives = {
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }

        try {
            // Test progress endpoints
            const progress = await api.progress.getAll();
            newResults.progress = {
                status: "success",
                data: progress,
            };
        } catch (error) {
            newResults.progress = {
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }

        try {
            // Test analytics endpoints
            const analytics = await api.analytics.getByTimeRange("test-user", "week");
            newResults.analytics = {
                status: "success",
                data: analytics,
            };
        } catch (error) {
            newResults.analytics = {
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }

        setResults(newResults);
        setLoading(false);
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>API Tesztelő</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                onClick={testGetEndpoints}
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? "Tesztelés..." : "GET Végpontok Tesztelése"}
                            </Button>
                            <Button
                                onClick={testPostEndpoints}
                                disabled={postLoading}
                                className="w-full"
                            >
                                {postLoading ? "Tesztelés..." : "POST Végpontok Tesztelése"}
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">GET Végpontok Eredményei</h3>
                            {Object.entries(results).map(([endpoint, result]) => (
                                <div
                                    key={endpoint}
                                    className="p-4 rounded-lg bg-gray-800"
                                >
                                    <h4 className="text-md font-semibold text-white mb-2">
                                        {endpoint}
                                    </h4>
                                    <pre className="text-sm text-gray-300 overflow-auto">
                                        {JSON.stringify(result, null, 2)}
                                    </pre>
                                </div>
                            ))}

                            <h3 className="text-lg font-semibold text-white">POST Végpontok Eredményei</h3>
                            {Object.entries(postResults).map(([endpoint, result]) => (
                                <div
                                    key={endpoint}
                                    className="p-4 rounded-lg bg-gray-800"
                                >
                                    <h4 className="text-md font-semibold text-white mb-2">
                                        {endpoint}
                                    </h4>
                                    <pre className="text-sm text-gray-300 overflow-auto">
                                        {JSON.stringify(result, null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 