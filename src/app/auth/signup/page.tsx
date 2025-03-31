"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import toast from "react-hot-toast";

export default function SignUp() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        displayName: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            await updateProfile(userCredential.user, {
                displayName: formData.displayName,
            });

            toast.success("Sikeres regisztráció!");
            router.push("/dashboard");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Regisztráció</CardTitle>
                    <CardDescription>
                        Hozzon létre egy fiókot a HeroStudy AI platformon
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="displayName" className="text-sm font-medium">
                                Teljes név
                            </label>
                            <Input
                                id="displayName"
                                type="text"
                                placeholder="Kovács János"
                                value={formData.displayName}
                                onChange={(e) =>
                                    setFormData({ ...formData, displayName: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email cím
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="kovacs.janos@example.com"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">
                                Jelszó
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Regisztráció..." : "Regisztráció"}
                        </Button>
                        <p className="text-sm text-gray-400 text-center">
                            Már van fiókja?{" "}
                            <Link href="/auth/login" className="text-primary-500 hover:underline">
                                Bejelentkezés
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
} 