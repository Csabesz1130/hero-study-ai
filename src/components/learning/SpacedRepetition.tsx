import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Text } from '../typography/Text';
import { Heading } from '../typography/Heading';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
  difficulty: number; // 1-5 scale
  nextReviewDate: Date;
  lastReviewDate?: Date;
  repetitionCount: number;
  easeFactor: number; // SM-2 algorithm ease factor
}

interface SpacedRepetitionProps {
  topicId?: string;
  initialFlashcards?: FlashcardItem[];
  onComplete?: () => void;
}

export const SpacedRepetition: React.FC<SpacedRepetitionProps> = ({
  topicId,
  initialFlashcards = [],
  onComplete,
}) => {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>(initialFlashcards);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(initialFlashcards.length === 0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    cardsReviewed: 0,
    easyResponses: 0,
    hardResponses: 0,
    averageDifficulty: 0,
  });

  useEffect(() => {
    if (initialFlashcards.length === 0 && topicId) {
      // In a real implementation, this would fetch flashcards from an API
      setIsLoading(true);
      // Simulate API call
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
          },
          {
            id: '2',
            question: 'What is the forgetting curve?',
            answer: 'A mathematical formula that describes the rate at which information is forgotten after it is initially learned.',
            difficulty: 2,
            nextReviewDate: new Date(),
            repetitionCount: 0,
            easeFactor: 2.5,
          },
          {
            id: '3',
            question: 'Who created the SM-2 algorithm?',
            answer: 'Piotr Wozniak, for his SuperMemo software in the late 1980s.',
            difficulty: 4,
            nextReviewDate: new Date(),
            repetitionCount: 0,
            easeFactor: 2.5,
          },
        ];
        setFlashcards(mockFlashcards);
        setIsLoading(false);
      }, 1000);
    }
  }, [topicId, initialFlashcards]);

  const calculateNextReviewDate = (
    difficulty: number,
    repetitionCount: number,
    easeFactor: number
  ): Date => {
    // Implementation of SM-2 algorithm
    let newEaseFactor = easeFactor;
    let interval = 1; // days

    if (difficulty < 3) {
      // Reset repetition count for difficult cards
      repetitionCount = 0;
      interval = 1;
    } else {
      // Adjust ease factor based on performance
      newEaseFactor = easeFactor + (0.1 - (5 - difficulty) * (0.08 + (5 - difficulty) * 0.02));
      
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
  };

  const handleDifficultyRating = (difficulty: number) => {
    if (currentCardIndex >= flashcards.length) return;

    const updatedFlashcards = [...flashcards];
    const currentCard = { ...updatedFlashcards[currentCardIndex] };
    
    // Update card with new review information
    currentCard.difficulty = difficulty;
    currentCard.lastReviewDate = new Date();
    currentCard.repetitionCount = difficulty < 3 ? 0 : currentCard.repetitionCount + 1;
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
    setSessionStats(prev => ({
      cardsReviewed: prev.cardsReviewed + 1,
      easyResponses: prev.easyResponses + (difficulty >= 4 ? 1 : 0),
      hardResponses: prev.hardResponses + (difficulty <= 2 ? 1 : 0),
      averageDifficulty: 
        (prev.averageDifficulty * prev.cardsReviewed + difficulty) / 
        (prev.cardsReviewed + 1),
    }));

    // Move to next card or end session
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      setSessionComplete(true);
      if (onComplete) onComplete();
    }
  };

  const restartSession = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
    setSessionStats({
      cardsReviewed: 0,
      easyResponses: 0,
      hardResponses: 0,
      averageDifficulty: 0,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <Card className="p-6 max-w-lg mx-auto">
        <Heading level={2} className="mb-4">Session Complete!</Heading>
        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <Text>Cards Reviewed:</Text>
            <Text className="font-bold">{sessionStats.cardsReviewed}</Text>
          </div>
          <div className="flex justify-between">
            <Text>Easy Responses:</Text>
            <Text className="font-bold">{sessionStats.easyResponses}</Text>
          </div>
          <div className="flex justify-between">
            <Text>Hard Responses:</Text>
            <Text className="font-bold">{sessionStats.hardResponses}</Text>
          </div>
          <div className="flex justify-between">
            <Text>Average Difficulty:</Text>
            <Text className="font-bold">{sessionStats.averageDifficulty.toFixed(1)}</Text>
          </div>
        </div>
        <div className="flex space-x-4">
          <Button onClick={restartSession} variant="primary">
            Start New Session
          </Button>
          <Button onClick={() => router.push('/dashboard')} variant="secondary">
            Back to Dashboard
          </Button>
        </div>
      </Card>
    );
  }

  if (flashcards.length === 0) {
    return (
      <Card className="p-6 max-w-lg mx-auto">
        <Heading level={2} className="mb-4">No Flashcards Available</Heading>
        <Text className="mb-6">There are no flashcards available for this topic yet.</Text>
        <Button onClick={() => router.push('/dashboard')} variant="primary">
          Back to Dashboard
        </Button>
      </Card>
    );
  }

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <Text>Card {currentCardIndex + 1} of {flashcards.length}</Text>
        <Text>Topic: {topicId || 'General Knowledge'}</Text>
      </div>

      <Card 
        className={`p-6 mb-6 min-h-[200px] flex items-center justify-center cursor-pointer transition-all duration-300 ${
          isFlipped ? 'bg-blue-50' : 'bg-white'
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="text-center">
          <Heading level={3} className="mb-2">
            {isFlipped ? 'Answer' : 'Question'}
          </Heading>
          <Text className="text-lg">
            {isFlipped ? currentCard.answer : currentCard.question}
          </Text>
          {!isFlipped && (
            <Text className="text-sm text-gray-500 mt-4">
              Click to reveal answer
            </Text>
          )}
        </div>
      </Card>

      {isFlipped && (
        <div className="space-y-2">
          <Text className="text-center mb-2">How difficult was this card for you?</Text>
          <div className="flex justify-between">
            <Button 
              onClick={() => handleDifficultyRating(1)} 
              variant="primary"
              className="flex-1 mx-1 bg-red-500 hover:bg-red-600"
            >
              Very Hard
            </Button>
            <Button 
              onClick={() => handleDifficultyRating(2)} 
              variant="primary"
              className="flex-1 mx-1 bg-orange-500 hover:bg-orange-600"
            >
              Hard
            </Button>
            <Button 
              onClick={() => handleDifficultyRating(3)} 
              variant="secondary"
              className="flex-1 mx-1"
            >
              Medium
            </Button>
            <Button 
              onClick={() => handleDifficultyRating(4)} 
              variant="primary"
              className="flex-1 mx-1 bg-blue-500 hover:bg-blue-600"
            >
              Easy
            </Button>
            <Button 
              onClick={() => handleDifficultyRating(5)} 
              variant="primary"
              className="flex-1 mx-1 bg-green-500 hover:bg-green-600"
            >
              Very Easy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
