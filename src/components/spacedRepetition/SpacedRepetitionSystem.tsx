import React, { useState, useEffect } from 'react';
import {
    KnowledgeItem,
    PerformanceRecord,
    AlgorithmParameters
} from '@/types/spacedRepetition';
import { SpacedRepetitionService } from '@/services/spacedRepetitionService';
import { LearningPlanView } from './LearningPlanView';
import { PerformanceView } from './PerformanceView';
import styles from './SpacedRepetitionSystem.module.css';

interface SpacedRepetitionSystemProps {
    initialItems: KnowledgeItem[];
    onItemsUpdate: (items: KnowledgeItem[]) => void;
}

export const SpacedRepetitionSystem: React.FC<SpacedRepetitionSystemProps> = ({
    initialItems,
    onItemsUpdate
}) => {
    const [items, setItems] = useState<KnowledgeItem[]>(initialItems);
    const [parameters, setParameters] = useState<AlgorithmParameters>({
        initialEaseFactor: 2.5,
        minimumEaseFactor: 1.3,
        maximumEaseFactor: 2.5,
        difficultyWeight: 0.3,
        performanceWeight: 0.5,
        responseTimeWeight: 0.2,
        intervalModifier: 1.0,
        newItemsPerDay: 20,
        maxReviewsPerDay: 100
    });

    const spacedRepetitionService = new SpacedRepetitionService(parameters);

    const handleReviewComplete = async (
        itemId: string,
        performance: PerformanceRecord
    ) => {
        const updatedItems = items.map(item => {
            if (item.id === itemId) {
                const newInterval = spacedRepetitionService.calculateNextInterval(
                    item,
                    performance
                );
                const newEaseFactor = spacedRepetitionService.updateEaseFactor(
                    item.metadata.easeFactor,
                    performance
                );

                return {
                    ...item,
                    metadata: {
                        ...item.metadata,
                        lastReviewed: new Date(),
                        nextReview: new Date(
                            Date.now() + newInterval * 24 * 60 * 60 * 1000
                        ),
                        easeFactor: newEaseFactor,
                        interval: newInterval,
                        repetitions: item.metadata.repetitions + 1,
                        performanceHistory: [
                            ...item.metadata.performanceHistory,
                            performance
                        ]
                    }
                };
            }
            return item;
        });

        setItems(updatedItems);
        onItemsUpdate(updatedItems);
    };

    const handleParametersUpdate = (newParameters: Partial<AlgorithmParameters>) => {
        setParameters(prev => ({ ...prev, ...newParameters }));
    };

    const progress = spacedRepetitionService.calculateUserProgress(items);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Ismétlési rendszer</h1>
                <div className={styles.controls}>
                    <button
                        className={styles.settingsButton}
                        onClick={() => {/* TODO: Settings modal */ }}
                    >
                        Beállítások
                    </button>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.main}>
                    <LearningPlanView
                        items={items}
                        onReviewComplete={handleReviewComplete}
                    />
                </div>
                <div className={styles.sidebar}>
                    <PerformanceView progress={progress} />
                </div>
            </div>
        </div>
    );
}; 