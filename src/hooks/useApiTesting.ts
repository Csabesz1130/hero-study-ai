import { useState } from "react";
import { api } from "@/lib/api";
import { LearningObjective, LearningProgress, Analytics } from "@/types";

export function useApiTesting() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Record<string, any>>({});

    const testPostEndpoints = async () => {
        setLoading(true);
        const newResults: Record<string, any> = {};

        try {
            // Test creating a new objective
            const newObjective = await api.objectives.create({
                title: "Teszt Tanulási Cél",
                description: "Ez egy teszt tanulási cél",
                difficulty: "beginner",
                status: "active",
                progress: 0,
            });
            newResults.createObjective = {
                status: "success",
                data: newObjective,
            };
        } catch (error) {
            newResults.createObjective = {
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }

        try {
            // Test updating progress
            const newProgress = await api.progress.update({
                userId: "test-user",
                objectiveId: "test-objective",
                watchTime: 300, // 5 minutes
                engagement: 75,
            });
            newResults.updateProgress = {
                status: "success",
                data: newProgress,
            };
        } catch (error) {
            newResults.updateProgress = {
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }

        try {
            // Test updating analytics
            const newAnalytics = await api.analytics.update({
                userId: "test-user",
                objectiveId: "test-objective",
                learningTime: 3600, // 1 hour
                completionRate: 85,
                averageScore: 90,
                lastActivity: new Date(),
            });
            newResults.updateAnalytics = {
                status: "success",
                data: newAnalytics,
            };
        } catch (error) {
            newResults.updateAnalytics = {
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }

        setResults(newResults);
        setLoading(false);
    };

    return {
        loading,
        results,
        testPostEndpoints,
    };
} 