"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { LearningObjective } from "@/types";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function Objectives() {
    const router = useRouter();
    const [objectives, setObjectives] = useState<LearningObjective[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        difficulty: "beginner" as const,
    });

    useEffect(() => {
        loadObjectives();
    }, []);

    const loadObjectives = async () => {
        try {
            const data = await api.objectives.getAll();
            setObjectives(data);
        } catch (error) {
            toast.error("Hiba történt a tanulási célok betöltése közben");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const newObjective = await api.objectives.create(formData);
            setObjectives([...objectives, newObjective]);
            setFormData({ title: "", description: "", difficulty: "beginner" });
            toast.success("Tanulási cél sikeresen létrehozva!");
        } catch (error) {
            toast.error("Hiba történt a tanulási cél létrehozása közben");
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
            <nav className="bg-gray-800 border-b border-gray-700">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Tanulási Célok</h1>
                    <Button onClick={() => router.push("/dashboard")}>
                        Vissza az irányítópulthoz
                    </Button>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            type="text"
                            placeholder="Cím"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            required
                        />
                        <Input
                            type="text"
                            placeholder="Leírás"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            required
                        />
                        <select
                            className="bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={formData.difficulty}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    difficulty: e.target.value as "beginner" | "intermediate" | "advanced",
                                })
                            }
                        >
                            <option value="beginner">Kezdő</option>
                            <option value="intermediate">Haladó</option>
                            <option value="advanced">Szakértő</option>
                        </select>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Létrehozás..." : "Létrehozás"}
                        </Button>
                    </div>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {objectives
                        .filter((objective) => objective.status === "active")
                        .map((objective) => (
                            <Card key={objective.id}>
                                <CardHeader>
                                    <CardTitle>{objective.title}</CardTitle>
                                    <CardDescription>
                                        {objective.difficulty === "beginner"
                                            ? "Kezdő"
                                            : objective.difficulty === "intermediate"
                                                ? "Haladó"
                                                : "Szakértő"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-300">{objective.description}</p>
                                    <div className="mt-4">
                                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                                            <div
                                                className="bg-primary-500 h-2.5 rounded-full"
                                                style={{ width: `${objective.progress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-2">
                                            {objective.progress}% teljesítve
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            </main>
        </div>
    );
} 