"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Analytics } from "@/types";

interface CompletionRateChartProps {
    data: Analytics[];
}

export function CompletionRateChart({ data }: CompletionRateChartProps) {
    const chartData = data.map((item) => ({
        date: new Date(item.date).toLocaleDateString("hu-HU", {
            month: "short",
            day: "numeric",
        }),
        completionRate: item.completionRate,
    }));

    return (
        <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient
                            id="completionRate"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="5%"
                                stopColor="#10B981"
                                stopOpacity={0.8}
                            />
                            <stop
                                offset="95%"
                                stopColor="#10B981"
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
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
                            value: "%",
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
                    <Area
                        type="monotone"
                        dataKey="completionRate"
                        stroke="#10B981"
                        fillOpacity={1}
                        fill="url(#completionRate)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
} 