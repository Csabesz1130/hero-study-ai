import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db/production';
import { knowledgeRetention } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { InferModel } from 'drizzle-orm';

type KnowledgeRetention = InferModel<typeof knowledgeRetention>;
type NewKnowledgeRetention = InferModel<typeof knowledgeRetention, 'insert'>;

export interface FlashcardItem {
    id: string;
    question: string;
    answer: string;
    difficulty: number; // 1-5 scale
    nextReviewDate: Date;
    lastReviewDate?: Date;
    repetitionCount: number;
    easeFactor: number; // SM-2 algorithm ease factor
    topicId?: string;
}

export interface SpacedRepetitionStats {
    cardsReviewed: number;
    easyResponses: number;
    hardResponses: number;
    averageDifficulty: number;
}

interface UseSpacedRepetitionProps {
    initialFlashcards?: FlashcardItem[];
    userId?: string;
    topicId?: string;
    onSessionComplete?: (stats: SpacedRepetitionStats) => void;
}

interface SpacedRepetitionItem {
    id: string;
    userId: string;
    resourceId: string;
    easeFactor: number;
    interval: number;
    repetitions: number;
    dueDate: Date;
    lastReviewedAt: Date | null;
    type: 'transformation' | 'note' | 'bookmark' | 'highlight' | 'question' | 'solution' | 'example';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ReviewOptions {
    initialDifficulty?: 'beginner' | 'intermediate' | 'advanced';
    type: KnowledgeRetention['type'];
}

export const useSpacedRepetition = ({
    initialFlashcards = [],
    userId,
    topicId,
    onSessionComplete,
}: UseSpacedRepetitionProps) => {
    const [flashcards, setFlashcards] = useState<FlashcardItem[]>(initialFlashcards);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(initialFlashcards.length === 0);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [sessionStats, setSessionStats] = useState<SpacedRepetitionStats>({
        cardsReviewed: 0,
        easyResponses: 0,
        hardResponses: 0,
        averageDifficulty: 0,
    });
    const [items, setItems] = useState<KnowledgeRetention[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Fetch flashcards if not provided
    useEffect(() => {
        const fetchFlashcards = async () => {
            if (initialFlashcards.length === 0 && topicId) {
                setIsLoading(true);
                try {
                    // In a real implementation, this would fetch from an API
                    // For now, we'll use mock data
                    setTimeout(() => {
                        const mockFlashcards: FlashcardItem[] = [
                            {
                                id: '1',
                                question: 'What is spaced repetition?',
                                answer: 'A learning technique that incorporates increasing intervals of time between subsequent review of previously learned material.',
                                difficulty: 3,
                                nextReviewDate: new Date(),
                                repetitionCount: 0,
                                easeFactor: 2.5,
                                topicId,
                            },
                            {
                                id: '2',
                                question: 'What is the forgetting curve?',
                                answer: 'A mathematical formula that describes the rate at which information is forgotten after it is initially learned.',
                                difficulty: 2,
                                nextReviewDate: new Date(),
                                repetitionCount: 0,
                                easeFactor: 2.5,
                                topicId,
                            },
                            {
                                id: '3',
                                question: 'Who created the SM-2 algorithm?',
                                answer: 'Piotr Wozniak, for his SuperMemo software in the late 1980s.',
                                difficulty: 4,
                                nextReviewDate: new Date(),
                                repetitionCount: 0,
                                easeFactor: 2.5,
                                topicId,
                            },
                        ];
                        setFlashcards(mockFlashcards);
                        setIsLoading(false);
                    }, 1000);
                } catch (error) {
                    console.error('Error fetching flashcards:', error);
                    setIsLoading(false);
                }
            }
        };

        fetchFlashcards();
    }, [initialFlashcards, topicId]);

    // Calculate next review date using SM-2 algorithm
    const calculateNextReviewDate = useCallback(
        (difficulty: number, repetitionCount: number, easeFactor: number): Date => {
            let newEaseFactor = easeFactor;
            let interval = 1; // days

            if (difficulty < 3) {
                // Reset repetition count for difficult cards
                repetitionCount = 0;
                interval = 1;
            } else {
                // Adjust ease factor based on performance
                newEaseFactor =
                    easeFactor + (0.1 - (5 - difficulty) * (0.08 + (5 - difficulty) * 0.02));

                // Ensure ease factor doesn't go below 1.3
                if (newEaseFactor < 1.3) newEaseFactor = 1.3;

                // Calculate interval
                if (repetitionCount === 0) {
                    interval = 1;
                } else if (repetitionCount === 1) {
                    interval = 6;
                } else {
                    interval = Math.round(interval * newEaseFactor);
                }
            }

            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + interval);
            return nextDate;
        },
        []
    );

    // Handle difficulty rating
    const handleDifficultyRating = useCallback(
        (difficulty: number) => {
            if (currentCardIndex >= flashcards.length) return;

            const updatedFlashcards = [...flashcards];
            const currentCard = { ...updatedFlashcards[currentCardIndex] };

            // Update card with new review information
            currentCard.difficulty = difficulty;
            currentCard.lastReviewDate = new Date();
            currentCard.repetitionCount =
                difficulty < 3 ? 0 : currentCard.repetitionCount + 1;
            currentCard.easeFactor =
                difficulty < 3
                    ? Math.max(1.3, currentCard.easeFactor - 0.2)
                    : currentCard.easeFactor + (0.1 - (5 - difficulty) * 0.08);
            currentCard.nextReviewDate = calculateNextReviewDate(
                difficulty,
                currentCard.repetitionCount,
                currentCard.easeFactor
            );

            updatedFlashcards[currentCardIndex] = currentCard;
            setFlashcards(updatedFlashcards);

            // Update session stats
            setSessionStats((prev) => {
                const newStats = {
                    cardsReviewed: prev.cardsReviewed + 1,
                    easyResponses: prev.easyResponses + (difficulty >= 4 ? 1 : 0),
                    hardResponses: prev.hardResponses + (difficulty <= 2 ? 1 : 0),
                    averageDifficulty:
                        (prev.averageDifficulty * prev.cardsReviewed + difficulty) /
                        (prev.cardsReviewed + 1),
                };
                return newStats;
            });

            // Update knowledge retention in database (in a real implementation)
            if (userId && topicId) {
                // This would be an API call in a real implementation
                console.log('Updating knowledge retention for user:', userId, 'topic:', topicId);
            }

            // Move to next card or end session
            if (currentCardIndex < flashcards.length - 1) {
                setCurrentCardIndex(currentCardIndex + 1);
            } else {
                setSessionComplete(true);
                if (onSessionComplete) {
                    onSessionComplete(sessionStats);
                }
            }
        },
        [
            currentCardIndex,
            flashcards,
            calculateNextReviewDate,
            userId,
            topicId,
            onSessionComplete,
            sessionStats,
        ]
    );

    // Reset session
    const resetSession = useCallback(() => {
        setCurrentCardIndex(0);
        setSessionComplete(false);
        setSessionStats({
            cardsReviewed: 0,
            easyResponses: 0,
            hardResponses: 0,
            averageDifficulty: 0,
        });
    }, []);

    // Get due cards for a topic
    const getDueCards = useCallback(
        (topicId?: string): FlashcardItem[] => {
            const now = new Date();
            return flashcards.filter(
                (card) =>
                    (!topicId || card.topicId === topicId) &&
                    card.nextReviewDate <= now
            );
        },
        [flashcards]
    );

    // Add a new flashcard
    const addFlashcard = useCallback(
        (flashcard: Omit<FlashcardItem, 'id' | 'nextReviewDate' | 'repetitionCount' | 'easeFactor'>) => {
            const newFlashcard: FlashcardItem = {
                ...flashcard,
                id: Math.random().toString(36).substring(2, 9), // Simple ID generation
                nextReviewDate: new Date(),
                repetitionCount: 0,
                easeFactor: 2.5,
            };
            setFlashcards((prev) => [...prev, newFlashcard]);
            return newFlashcard;
        },
        []
    );

    // Remove a flashcard
    const removeFlashcard = useCallback(
        (id: string) => {
            setFlashcards((prev) => prev.filter((card) => card.id !== id));
        },
        []
    );

    // Update a flashcard
    const updateFlashcard = useCallback(
        (id: string, updates: Partial<FlashcardItem>) => {
            setFlashcards((prev) =>
                prev.map((card) => (card.id === id ? { ...card, ...updates } : card))
            );
        },
        []
    );

    // SM-2 algoritmus implementációja
    const calculateNextReview = useCallback((quality: number, item: KnowledgeRetention): Partial<KnowledgeRetention> => {
        let { easeFactor, interval, repetitions } = item;

        if (quality >= 3) {
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
            repetitions += 1;
        } else {
            repetitions = 0;
            interval = 1;
        }

        // Ease factor frissítése (0.8 és 2.5 között)
        easeFactor = Math.max(0.8, Math.min(2.5, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))));

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + interval);

        return {
            easeFactor,
            interval,
            repetitions,
            dueDate,
            lastReviewedAt: new Date()
        };
    }, []);

    const scheduleReview = useCallback(async (resourceId: string, options: ReviewOptions) => {
        try {
            const initialEaseFactor = options.initialDifficulty === 'beginner' ? 2.5 :
                options.initialDifficulty === 'intermediate' ? 2.0 : 1.5;

            const newItem: NewKnowledgeRetention = {
                id: crypto.randomUUID(),
                userId: 'current-user', // TODO: Használd a tényleges felhasználói ID-t
                resourceId,
                easeFactor: initialEaseFactor,
                interval: 0,
                repetitions: 0,
                dueDate: new Date(),
                lastReviewedAt: null,
                type: options.type,
                difficulty: options.initialDifficulty || 'intermediate',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await db.insert(knowledgeRetention).values(newItem);
            setItems(prev => [...prev, newItem as KnowledgeRetention]);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Hiba történt az ismétlés ütemezésekor'));
        }
    }, []);

    const submitReview = useCallback(async (itemId: string, quality: number) => {
        try {
            const item = items.find(i => i.id === itemId);
            if (!item) throw new Error('Az elem nem található');

            const updates = calculateNextReview(quality, item);

            await db.update(knowledgeRetention)
                .set({
                    ...updates,
                    updatedAt: new Date()
                })
                .where(eq(knowledgeRetention.id, itemId));

            setItems(prev => prev.map(i =>
                i.id === itemId ? { ...i, ...updates, updatedAt: new Date() } : i
            ));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Hiba történt az ismétlés mentésekor'));
        }
    }, [items, calculateNextReview]);

    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            const result = await db.select().from(knowledgeRetention)
                .where(eq(knowledgeRetention.userId, 'current-user')); // TODO: Használd a tényleges felhasználói ID-t

            setItems(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Hiba történt az elemek betöltésekor'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    return {
        flashcards,
        currentCardIndex,
        currentCard: flashcards[currentCardIndex],
        isLoading,
        sessionComplete,
        sessionStats,
        handleDifficultyRating,
        resetSession,
        getDueCards,
        addFlashcard,
        removeFlashcard,
        updateFlashcard,
        items,
        loading,
        error,
        scheduleReview,
        submitReview,
        getDueItems: useCallback(() => {
            const now = new Date();
            return items.filter(item => item.dueDate <= now);
        }, [items])
    };
};
