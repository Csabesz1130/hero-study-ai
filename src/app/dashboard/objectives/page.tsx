"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { LearningObjective } from "@/types";
import toast from "react-hot-toast";

export default function Objectives() {
    const router = useRouter();
    const [objectives, setObjectives] = useState<LearningObjective[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        difficulty: "beginner" as const,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // TODO: Implement objective creation with Firebase
            const newObjective: LearningObjective = {
                id: "temp-id",
                userId: "temp-user-id",
                title: formData.title,
                description: formData.description,
                difficulty: formData.difficulty,
                status: "draft",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            setObjectives([...objectives, newObjective]);
            setFormData({ title: "", description: "", difficulty: "beginner" });
            toast.success("Tanulási cél létrehozva!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Új Tanulási Cél</CardTitle>
                            <CardDescription>
                                Hozzon létre egy új tanulási célt
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="title" className="text-sm font-medium">
                                        Cím
                                    </label>
                                    <Input
                                        id="title"
                                        type="text"
                                        placeholder="Pl. JavaScript alapok"
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="description" className="text-sm font-medium">
                                        Leírás
                                    </label>
                                    <Input
                                        id="description"
                                        type="text"
                                        placeholder="Rövid leírás a célról"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="difficulty" className="text-sm font-medium">
                                        Nehézség
                                    </label>
                                    <select
                                        id="difficulty"
                                        className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
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
                                        <option value="advanced">Haladó</option>
                                    </select>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Létrehozás..." : "Létrehozás"}
                                </Button>
                            </CardContent>
                        </form>
                    </Card>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">Aktív Célok</h2>
                        {objectives
                            .filter((obj) => obj.status === "active")
                            .map((objective) => (
                                <Card key={objective.id}>
                                    <CardHeader>
                                        <CardTitle>{objective.title}</CardTitle>
                                        <CardDescription>
                                            {objective.difficulty === "beginner"
                                                ? "Kezdő"
                                                : objective.difficulty === "intermediate"
                                                    ? "Haladó"
                                                    : "Haladó"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-400">{objective.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>
                </div>
            </main>
        </div>
    );
} 