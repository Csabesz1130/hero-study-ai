import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    EducationalContent,
    ContentFormat,
    LearningPreference,
    ContentTransformation
} from '../types/educational-content';
import { db } from '../db/production';
import { educationalContents, contentFormats, learningPreferences } from '../db/schema';

export const useContentTransformation = () => {
    const { data: session } = useSession();
    const [content, setContent] = useState<EducationalContent[]>([]);
    const [preferences, setPreferences] = useState<LearningPreference | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Tartalom vizuális formátumra konvertálása
    const transformToVisual = async (content: EducationalContent) => {
        try {
            const response = await fetch('/api/content/transform-to-visual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            const visualContent = await response.json();
            return visualContent;
        } catch (err) {
            setError('Hiba történt a vizuális transzformáció során');
            throw err;
        }
    };

    // Hangoptimalizált verzió generálása
    const generateAudioVersion = async (content: EducationalContent) => {
        try {
            const response = await fetch('/api/content/generate-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    preferences: preferences?.interactionStyle
                })
            });

            const audioContent = await response.json();
            return audioContent;
        } catch (err) {
            setError('Hiba történt az audio verzió generálása során');
            throw err;
        }
    };

    // Interaktív szimuláció generálása
    const createInteractiveSimulation = async (content: EducationalContent) => {
        try {
            const response = await fetch('/api/content/create-simulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    preferences: preferences?.interactionStyle
                })
            });

            const simulation = await response.json();
            return simulation;
        } catch (err) {
            setError('Hiba történt a szimuláció generálása során');
            throw err;
        }
    };

    // Térbeli tudásmapping generálása
    const generateSpatialMapping = async (content: EducationalContent) => {
        try {
            const response = await fetch('/api/content/generate-spatial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            const spatialContent = await response.json();
            return spatialContent;
        } catch (err) {
            setError('Hiba történt a térbeli mapping generálása során');
            throw err;
        }
    };

    // Tartalom sűrűségének dinamikus szabályozása
    const adjustContentDensity = async (content: EducationalContent, engagement: number) => {
        try {
            const response = await fetch('/api/content/adjust-density', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    engagement,
                    preferences: preferences?.attentionPatterns
                })
            });

            const adjustedContent = await response.json();
            return adjustedContent;
        } catch (err) {
            setError('Hiba történt a tartalom sűrűségének szabályozása során');
            throw err;
        }
    };

    // Modális váltás kezelése
    const handleModalitySwitch = async (content: EducationalContent, engagement: number) => {
        try {
            const response = await fetch('/api/content/switch-modality', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    engagement,
                    preferences: preferences?.preferredFormats
                })
            });

            const switchedContent = await response.json();
            return switchedContent;
        } catch (err) {
            setError('Hiba történt a modális váltás során');
            throw err;
        }
    };

    // Fejlett feliratolás és annotáció
    const enhanceVideoContent = async (content: EducationalContent) => {
        try {
            const response = await fetch('/api/content/enhance-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    preferences: preferences?.interactionStyle
                })
            });

            const enhancedContent = await response.json();
            return enhancedContent;
        } catch (err) {
            setError('Hiba történt a videó tartalom fejlesztése során');
            throw err;
        }
    };

    // Adatok betöltése
    useEffect(() => {
        const loadData = async () => {
            if (!session?.user?.id) return;

            try {
                const [contentData, preferencesData] = await Promise.all([
                    db.select().from(educationalContents).where({ userId: session.user.id }),
                    db.select().from(learningPreferences).where({ userId: session.user.id })
                ]);

                setContent(contentData);
                setPreferences(preferencesData[0] || null);
                setLoading(false);
            } catch (err) {
                setError('Hiba történt az adatok betöltése során');
                setLoading(false);
            }
        };

        loadData();
    }, [session]);

    return {
        content,
        preferences,
        loading,
        error,
        transformToVisual,
        generateAudioVersion,
        createInteractiveSimulation,
        generateSpatialMapping,
        adjustContentDensity,
        handleModalitySwitch,
        enhanceVideoContent
    };
}; 