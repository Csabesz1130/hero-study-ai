import React, { useState } from 'react';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';
import { useProblemSolving } from '@/hooks/useProblemSolving';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useTransformationVideo } from '@/hooks/useTransformationVideo';
import styles from './DemoShowcase.module.css';

const DemoShowcase: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'spaced' | 'problem' | 'collab' | 'transform'>('spaced');

    // Hookok inicializálása
    const {
        flashcards,
        currentCard,
        handleDifficultyRating,
        sessionStats
    } = useSpacedRepetition({
        initialFlashcards: [
            {
                id: '1',
                question: 'Mi az a spaced repetition?',
                answer: 'Egy tanulási technika, ami a tanulási intervallumok optimalizálásán alapul.',
                difficulty: 3,
                nextReviewDate: new Date(),
                repetitionCount: 0,
                easeFactor: 2.5
            }
        ]
    });

    const {
        currentViewpoint,
        currentStep,
        switchViewpoint,
        nextStep,
        requestHint
    } = useProblemSolving({
        session: {
            id: 'demo',
            title: 'Bemutató feladat',
            description: 'Egy egyszerű matematikai probléma megoldása',
            difficulty: 'intermediate',
            timeEstimate: 15,
            viewpoints: [
                {
                    type: 'expert',
                    thoughtProcess: [
                        {
                            step: 'Probléma elemzése',
                            confidence: 0.9,
                            visualization: 'flowchart'
                        }
                    ]
                }
            ]
        }
    });

    const {
        messages,
        sendMessage,
        sharedResources,
        shareResource
    } = useCollaboration({
        roomId: 'demo-room',
        userId: 'demo-user'
    });

    const {
        playSequence,
        pauseSequence,
        currentStep: transformStep
    } = useTransformationVideo({
        steps: [
            {
                id: '1',
                title: 'Bemutató lépés',
                description: 'Egy egyszerű átalakítási folyamat',
                duration: 5,
                audioUrl: '/demo-audio.mp3',
                visualEffect: 'fade'
            }
        ]
    });

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>HeroStudy AI - Funkció bemutató</h1>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'spaced' ? styles.active : ''}`}
                    onClick={() => setActiveTab('spaced')}
                >
                    Spaced Repetition
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'problem' ? styles.active : ''}`}
                    onClick={() => setActiveTab('problem')}
                >
                    Problémamegoldás
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'collab' ? styles.active : ''}`}
                    onClick={() => setActiveTab('collab')}
                >
                    Együttműködés
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'transform' ? styles.active : ''}`}
                    onClick={() => setActiveTab('transform')}
                >
                    Átalakítás
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'spaced' && (
                    <div className={styles.section}>
                        <h2>Spaced Repetition Demo</h2>
                        {currentCard && (
                            <div className={styles.card}>
                                <p className={styles.question}>{currentCard.question}</p>
                                <p className={styles.answer}>{currentCard.answer}</p>
                                <div className={styles.difficultyButtons}>
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => handleDifficultyRating(level)}
                                            className={styles.difficultyButton}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className={styles.stats}>
                            <p>Áttekintett kártyák: {sessionStats.cardsReviewed}</p>
                            <p>Könnyű válaszok: {sessionStats.easyResponses}</p>
                            <p>Nehéz válaszok: {sessionStats.hardResponses}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'problem' && (
                    <div className={styles.section}>
                        <h2>Problémamegoldás Demo</h2>
                        <div className={styles.viewpointSelector}>
                            <button onClick={() => switchViewpoint('expert')}>
                                Szakértő nézőpont
                            </button>
                            <button onClick={() => switchViewpoint('novice')}>
                                Kezdő nézőpont
                            </button>
                        </div>
                        {currentStep && (
                            <div className={styles.step}>
                                <h3>{currentStep.title}</h3>
                                <p>{currentStep.description}</p>
                                <button onClick={() => requestHint()}>
                                    Segítség kérése
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'collab' && (
                    <div className={styles.section}>
                        <h2>Együttműködés Demo</h2>
                        <div className={styles.chat}>
                            {messages.map((msg, index) => (
                                <div key={index} className={styles.message}>
                                    <strong>{msg.userId}:</strong> {msg.content}
                                </div>
                            ))}
                        </div>
                        <div className={styles.resources}>
                            <h3>Megosztott erőforrások</h3>
                            {sharedResources.map((res, index) => (
                                <div key={index} className={styles.resource}>
                                    <h4>{res.title}</h4>
                                    <p>{res.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'transform' && (
                    <div className={styles.section}>
                        <h2>Átalakítás Demo</h2>
                        <div className={styles.transformControls}>
                            <button onClick={playSequence}>Lejátszás</button>
                            <button onClick={pauseSequence}>Szünet</button>
                        </div>
                        {transformStep && (
                            <div className={styles.transformStep}>
                                <h3>{transformStep.title}</h3>
                                <p>{transformStep.description}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DemoShowcase; 