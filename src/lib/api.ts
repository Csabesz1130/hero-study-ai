import { LearningObjective, LearningProgress, Analytics } from "@/types";

const API_BASE_URL = "/api/learning";

export const api = {
    // Tanulási célok
    objectives: {
        getAll: async (): Promise<LearningObjective[]> => {
            const response = await fetch(`${API_BASE_URL}/objectives`);
            if (!response.ok) throw new Error("Failed to fetch objectives");
            const data = await response.json();
            return data.data;
        },
        create: async (objective: Omit<LearningObjective, "id" | "createdAt" | "updatedAt">): Promise<LearningObjective> => {
            const response = await fetch(`${API_BASE_URL}/objectives`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(objective),
            });
            if (!response.ok) throw new Error("Failed to create objective");
            const data = await response.json();
            return data.data;
        },
    },

    // Tanulási folyamat
    progress: {
        getAll: async (): Promise<LearningProgress[]> => {
            const response = await fetch(`${API_BASE_URL}/progress`);
            if (!response.ok) throw new Error("Failed to fetch progress");
            const data = await response.json();
            return data.data;
        },
        update: async (progress: Omit<LearningProgress, "lastAttempted">): Promise<LearningProgress> => {
            const response = await fetch(`${API_BASE_URL}/progress`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(progress),
            });
            if (!response.ok) throw new Error("Failed to update progress");
            const data = await response.json();
            return data.data;
        },
    },

    // Analitika
    analytics: {
        getByTimeRange: async (userId: string, timeRange: "week" | "month" | "year" = "week"): Promise<Analytics[]> => {
            const response = await fetch(
                `${API_BASE_URL}/analytics?userId=${userId}&timeRange=${timeRange}`
            );
            if (!response.ok) throw new Error("Failed to fetch analytics");
            const data = await response.json();
            return data.data;
        },
        update: async (analytics: Omit<Analytics, "id" | "date">): Promise<Analytics> => {
            const response = await fetch(`${API_BASE_URL}/analytics`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(analytics),
            });
            if (!response.ok) throw new Error("Failed to update analytics");
            const data = await response.json();
            return data.data;
        },
    },
}; 