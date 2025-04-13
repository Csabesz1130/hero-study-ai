import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MemoryPalace, MemoryConcept, MnemonicDevice, SpacedRepetitionSchedule } from '../types/memory';
import { db } from '../db/production';
import { memoryPalaces, memoryConcepts, mnemonicDevices, spacedRepetitionSchedules } from '../db/schema';

export const useMemoryTechniques = () => {
    const { data: session } = useSession();
    const [palaces, setPalaces] = useState<MemoryPalace[]>([]);
    const [concepts, setConcepts] = useState<MemoryConcept[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Memóriapalota generálása
    const generateMemoryPalace = async (name: string, description: string) => {
        try {
            const newPalace = await db.insert(memoryPalaces).values({
                userId: session?.user?.id,
                name,
                description,
                locations: [],
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();

            setPalaces([...palaces, newPalace[0]]);
            return newPalace[0];
        } catch (err) {
            setError('Hiba történt a memóriapalota generálása során');
            throw err;
        }
    };

    // Élénk képek generálása fogalmakhoz
    const generateVividImagery = async (concept: MemoryConcept) => {
        try {
            const imagery = await fetch('/api/memory/generate-imagery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concept })
            }).then(res => res.json());

            const newMnemonic = await db.insert(mnemonicDevices).values({
                conceptId: concept.id,
                type: 'imagery',
                content: imagery,
                effectiveness: 0.8,
                lastUsed: new Date()
            }).returning();

            return newMnemonic[0];
        } catch (err) {
            setError('Hiba történt a kép generálása során');
            throw err;
        }
    };

    // Térbeli asszociációk létrehozása
    const createSpatialAssociations = async (concept: MemoryConcept, palace: MemoryPalace) => {
        try {
            const associations = await fetch('/api/memory/create-associations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concept, palace })
            }).then(res => res.json());

            return associations;
        } catch (err) {
            setError('Hiba történt az asszociációk létrehozása során');
            throw err;
        }
    };

    // Térközelt ismétlés ütemezése
    const scheduleSpacedRepetition = async (conceptId: string) => {
        try {
            const schedule = await db.insert(spacedRepetitionSchedules).values({
                userId: session?.user?.id,
                conceptId,
                intervals: [1, 3, 7, 14, 30], // napok
                currentInterval: 0,
                nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 nap
                retentionScore: 0.5
            }).returning();

            return schedule[0];
        } catch (err) {
            setError('Hiba történt az ismétlés ütemezése során');
            throw err;
        }
    };

    // Többérzékszervi erősítés
    const reinforceMultimodal = async (concept: MemoryConcept) => {
        try {
            const reinforcement = await fetch('/api/memory/reinforce-multimodal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concept })
            }).then(res => res.json());

            return reinforcement;
        } catch (err) {
            setError('Hiba történt a többérzékszervi erősítés során');
            throw err;
        }
    };

    // Adatok betöltése
    useEffect(() => {
        const loadData = async () => {
            if (!session?.user?.id) return;

            try {
                const [palacesData, conceptsData] = await Promise.all([
                    db.select().from(memoryPalaces).where({ userId: session.user.id }),
                    db.select().from(memoryConcepts).where({ userId: session.user.id })
                ]);

                setPalaces(palacesData);
                setConcepts(conceptsData);
                setLoading(false);
            } catch (err) {
                setError('Hiba történt az adatok betöltése során');
                setLoading(false);
            }
        };

        loadData();
    }, [session]);

    return {
        palaces,
        concepts,
        loading,
        error,
        generateMemoryPalace,
        generateVividImagery,
        createSpatialAssociations,
        scheduleSpacedRepetition,
        reinforceMultimodal
    };
}; 