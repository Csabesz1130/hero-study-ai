import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService } from '@/services/analytics-service';

interface ABTest {
    id: string;
    name: string;
    description?: string;
    variants: any;
    results?: any;
    startDate: string;
    endDate?: string;
    status: string;
}

interface TestAssignment {
    testId: string;
    variant: string;
}

export const ABTesting: React.FC = () => {
    const { user } = useAuth();
    const [tests, setTests] = useState<ABTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newTest, setNewTest] = useState({
        name: '',
        description: '',
        variants: [{ name: '', description: '' }],
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        const fetchTests = async () => {
            if (!user) return;

            try {
                const activeTests = await prisma.aBTest.findMany({
                    where: { status: 'active' },
                });
                setTests(activeTests);
            } catch (err) {
                setError('Hiba történt a tesztek betöltése közben');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTests();
    }, [user]);

    const handleCreateTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const test = await analyticsService.createABTest({
                name: newTest.name,
                description: newTest.description,
                variants: newTest.variants,
                startDate: new Date(newTest.startDate),
                endDate: newTest.endDate ? new Date(newTest.endDate) : undefined,
            });

            setTests([...tests, test]);
            setNewTest({
                name: '',
                description: '',
                variants: [{ name: '', description: '' }],
                startDate: '',
                endDate: '',
            });
        } catch (err) {
            setError('Hiba történt a teszt létrehozása közben');
            console.error(err);
        }
    };

    const handleAddVariant = () => {
        setNewTest({
            ...newTest,
            variants: [...newTest.variants, { name: '', description: '' }],
        });
    };

    const handleVariantChange = (index: number, field: string, value: string) => {
        const updatedVariants = [...newTest.variants];
        updatedVariants[index] = {
            ...updatedVariants[index],
            [field]: value,
        };
        setNewTest({ ...newTest, variants: updatedVariants });
    };

    if (loading) return <div>Betöltés...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">A/B Tesztelés</h1>

            {/* Új teszt létrehozása */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Új Teszt Létrehozása</h2>
                <form onSubmit={handleCreateTest} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Teszt neve
                        </label>
                        <input
                            type="text"
                            value={newTest.name}
                            onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Leírás
                        </label>
                        <textarea
                            value={newTest.description}
                            onChange={(e) =>
                                setNewTest({ ...newTest, description: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Variánsok
                        </label>
                        {newTest.variants.map((variant, index) => (
                            <div key={index} className="mt-2 space-y-2">
                                <input
                                    type="text"
                                    placeholder="Variáns neve"
                                    value={variant.name}
                                    onChange={(e) =>
                                        handleVariantChange(index, 'name', e.target.value)
                                    }
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Variáns leírása"
                                    value={variant.description}
                                    onChange={(e) =>
                                        handleVariantChange(index, 'description', e.target.value)
                                    }
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddVariant}
                            className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Variáns hozzáadása
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Kezdő dátum
                            </label>
                            <input
                                type="date"
                                value={newTest.startDate}
                                onChange={(e) =>
                                    setNewTest({ ...newTest, startDate: e.target.value })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Befejező dátum (opcionális)
                            </label>
                            <input
                                type="date"
                                value={newTest.endDate}
                                onChange={(e) =>
                                    setNewTest({ ...newTest, endDate: e.target.value })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Teszt létrehozása
                    </button>
                </form>
            </div>

            {/* Aktív tesztek */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Aktív tesztek</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Név
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Leírás
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Variánsok
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Eredmények
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Állapot
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tests.map((test) => (
                                <tr key={test.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {test.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {test.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {Object.keys(test.variants).join(', ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {test.results
                                            ? JSON.stringify(test.results)
                                            : 'Nincs még adat'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {test.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}; 