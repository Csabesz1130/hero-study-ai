import React, { useState, useEffect } from 'react';
import { LearningPlan, KnowledgeItem, ReviewSchedule } from '@/types/spacedRepetition';
import { SpacedRepetitionService } from '@/services/spacedRepetitionService';
import { CalendarExportService } from '@/services/calendarExportService';
import { NotificationService } from '@/services/notificationService';
import styles from './LearningPlanView.module.css';

interface LearningPlanViewProps {
    items: KnowledgeItem[];
    onReviewComplete: (itemId: string, performance: any) => void;
}

export const LearningPlanView: React.FC<LearningPlanViewProps> = ({
    items,
    onReviewComplete
}) => {
    const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isExporting, setIsExporting] = useState(false);

    const spacedRepetitionService = new SpacedRepetitionService();
    const calendarExportService = new CalendarExportService();
    const notificationService = NotificationService.getInstance();

    useEffect(() => {
        const plan = spacedRepetitionService.generateLearningPlan(items, selectedDate);
        setLearningPlan(plan);
        notificationService.scheduleReviewNotifications(plan.reviews);
    }, [items, selectedDate]);

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
    };

    const handleReviewComplete = async (
        review: ReviewSchedule,
        rating: number,
        difficulty: number,
        responseTime: number
    ) => {
        const performance = {
            date: new Date(),
            rating,
            difficulty,
            responseTime
        };

        await onReviewComplete(review.itemId, performance);

        // Frissítjük a tanulási tervet
        const updatedPlan = spacedRepetitionService.generateLearningPlan(items, selectedDate);
        setLearningPlan(updatedPlan);
    };

    const handleExportCalendar = async () => {
        setIsExporting(true);
        try {
            if (!learningPlan) return;

            // iCalendar export
            const icalContent = calendarExportService.generateICalendar(learningPlan.reviews);
            const icalBlob = new Blob([icalContent], { type: 'text/calendar' });
            const icalUrl = URL.createObjectURL(icalBlob);

            // Google Calendar export
            const googleCalendarUrl = calendarExportService.generateGoogleCalendarUrl(learningPlan.reviews);

            // Letöltési linkek megjelenítése
            const icalLink = document.createElement('a');
            icalLink.href = icalUrl;
            icalLink.download = 'learning-plan.ics';
            icalLink.click();

            window.open(googleCalendarUrl, '_blank');
        } catch (error) {
            console.error('Hiba történt a naptár exportálása során:', error);
        } finally {
            setIsExporting(false);
        }
    };

    if (!learningPlan) {
        return <div className={styles.loading}>Betöltés...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Tanulási terv</h2>
                <div className={styles.dateSelector}>
                    <input
                        type="date"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => handleDateChange(new Date(e.target.value))}
                    />
                </div>
                <button
                    className={styles.exportButton}
                    onClick={handleExportCalendar}
                    disabled={isExporting}
                >
                    {isExporting ? 'Exportálás...' : 'Exportálás naptárba'}
                </button>
            </div>

            <div className={styles.stats}>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Új tételek:</span>
                    <span className={styles.statValue}>{learningPlan.newItems.length}</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Ismétlések:</span>
                    <span className={styles.statValue}>{learningPlan.reviews.length}</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Becsült idő:</span>
                    <span className={styles.statValue}>{learningPlan.estimatedDuration} perc</span>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.section}>
                    <h3>Új tételek</h3>
                    <div className={styles.items}>
                        {learningPlan.newItems.map(item => (
                            <div key={item.id} className={styles.item}>
                                <div className={styles.question}>{item.question}</div>
                                <div className={styles.answer}>{item.answer}</div>
                                <div className={styles.tags}>
                                    {item.tags.map(tag => (
                                        <span key={tag} className={styles.tag}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Ismétlések</h3>
                    <div className={styles.reviews}>
                        {learningPlan.reviews.map(review => (
                            <div key={review.id} className={styles.review}>
                                <div className={styles.reviewTime}>
                                    {new Date(review.scheduledDate).toLocaleTimeString()}
                                </div>
                                <div className={styles.reviewControls}>
                                    <button
                                        className={styles.completeButton}
                                        onClick={() => handleReviewComplete(review, 5, 3, 5)}
                                    >
                                        Teljesítve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}; 