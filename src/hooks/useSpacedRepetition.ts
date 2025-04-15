import { useState, useEffect, useCallback } from 'react';
import { KnowledgeRetention } from '@prisma/client';

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
  };
};
