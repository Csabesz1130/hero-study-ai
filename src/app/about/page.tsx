import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export default function About() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        Rólunk
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        A HeroStudy AI egy innovatív tanulási platform, amely az AI technológiát használja a személyre szabott tanulási élmény létrehozásához.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mi a Célunk?</CardTitle>
                            <CardDescription>
                                A tanulás demokratizálása és hatékonyabbá tétele
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-400">
                                A HeroStudy AI célja, hogy mindenki számára elérhetővé tegye a minőségi oktatást.
                                Az AI technológiát használjuk a személyre szabott tanulási útvonalak létrehozásához,
                                amelyek figyelembe veszik az egyén egyedi igényeit és tanulási stílusát.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Hogyan Működik?</CardTitle>
                            <CardDescription>
                                AI-alapú személyre szabás és folyamatos adaptáció
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-400">
                                Platformunk az OpenAI és ElevenLabs technológiáit használja a
                                tanulási tartalom generálásához és személyre szabásához. A Pinecone
                                vektort adatbázis segítségével optimalizáljuk a tartalom ajánlásait
                                és a tanulási folyamatot.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Támogatás</CardTitle>
                            <CardDescription>
                                Intelligens tanulási segédlet
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-400">
                                Az AI folyamatosan elemzi a tanulási folyamatot és adaptálja a
                                tartalmat az egyén teljesítményéhez és igényeihez.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Interaktív Tartalom</CardTitle>
                            <CardDescription>
                                Különböző formátumokban
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-400">
                                Videók, kvízek és szimulációk segítenek a hatékony tanulásban és
                                a tudás megszerzésében.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Analitika</CardTitle>
                            <CardDescription>
                                Részletes visszajelzés
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-400">
                                A platform részletes analitikát nyújt a tanulási folyamatról,
                                segítve a fejlődés követését és a célok elérését.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
} 