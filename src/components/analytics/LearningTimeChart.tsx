"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Analytics } from "@/types";

interface LearningTimeChartProps {
    data: Analytics[];
}

export function LearningTimeChart({ data }: LearningTimeChartProps) {
    const chartData = data.map((item) => ({
        date: new Date(item.date).toLocaleDateString("hu-HU", {
            month: "short",
            day: "numeric",
        }),
        learningTime: Math.round(item.learningTime / 60), // Convert to hours
    }));

    return (
        <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF" }}
                    />
                    <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF" }}
                        label={{
                            value: "Óra",
                            angle: -90,
                            position: "insideLeft",
                            fill: "#9CA3AF",
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "none",
                            borderRadius: "0.5rem",
                        }}
                        labelStyle={{ color: "#9CA3AF" }}
                    />
                    <Line
                        type="monotone"
                        dataKey="learningTime"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        dot={{ fill: "#4F46E5", strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
} 