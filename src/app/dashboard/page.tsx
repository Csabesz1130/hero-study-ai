"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { User, LearningObjective } from "@/types";
import toast from "react-hot-toast";

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [objectives, setObjectives] = useState<LearningObjective[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser({
                    id: user.uid,
                    email: user.email || "",
                    displayName: user.displayName || "",
                    photoURL: user.photoURL || undefined,
                    createdAt: new Date(user.metadata.creationTime || ""),
                    lastLogin: new Date(user.metadata.lastSignInTime || ""),
                });
            } else {
                router.push("/auth/login");
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast.success("Sikeres kijelentkezés!");
            router.push("/");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
                <div className="text-white">Betöltés...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
            <nav className="bg-gray-800 border-b border-gray-700">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">HeroStudy AI</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-300">{user?.displayName}</span>
                        <Button variant="outline" onClick={handleSignOut}>
                            Kijelentkezés
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tanulási Célok</CardTitle>
                            <CardDescription>
                                Aktív tanulási célok száma
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary-500">
                                {objectives.filter((obj) => obj.status === "active").length}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Teljesítés</CardTitle>
                            <CardDescription>
                                Átlagos teljesítési arány
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary-500">0%</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Idő</CardTitle>
                            <CardDescription>
                                Összes tanulási idő
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary-500">0 óra</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Tanulási Célok</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {objectives.map((objective) => (
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