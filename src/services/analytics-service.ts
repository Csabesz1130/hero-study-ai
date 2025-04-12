import { PrismaClient } from '@prisma/client';
import { AnalyticsEvent, LearningStyle, KnowledgeRetention, CognitiveLoad, ABTest, ABTestAssignment } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnalyticsEventData {
    type: string;
    data: any;
    sessionId?: string;
    metadata?: any;
}

export interface LearningStyleData {
    style: {
        visual: number;
        auditory: number;
        reading: number;
        kinesthetic: number;
    };
    confidence: number;
}

export interface KnowledgeRetentionData {
    topic: string;
    score: number;
    predictedScore: number;
}

export interface CognitiveLoadData {
    contentId: string;
    loadScore: number;
    factors: {
        complexity: number;
        novelty: number;
        timePressure: number;
        mentalEffort: number;
    };
}

export class AnalyticsService {
    // Események rögzítése
    async trackEvent(userId: string, eventData: AnalyticsEventData): Promise<AnalyticsEvent> {
        return prisma.analyticsEvent.create({
            data: {
                userId,
                ...eventData,
            },
        });
    }

    // Tanulási stílus frissítése
    async updateLearningStyle(userId: string, styleData: LearningStyleData): Promise<LearningStyle> {
        return prisma.learningStyle.upsert({
            where: { userId },
            update: {
                style: styleData.style,
                confidence: styleData.confidence,
                lastUpdated: new Date(),
            },
            create: {
                userId,
                ...styleData,
            },
        });
    }

    // Tudásmegtartás frissítése
    async updateKnowledgeRetention(userId: string, retentionData: KnowledgeRetentionData): Promise<KnowledgeRetention> {
        return prisma.knowledgeRetention.upsert({
            where: {
                userId_topic: {
                    userId,
                    topic: retentionData.topic,
                },
            },
            update: {
                score: retentionData.score,
                predictedScore: retentionData.predictedScore,
                lastAssessed: new Date(),
            },
            create: {
                userId,
                ...retentionData,
            },
        });
    }

    // Kognitív terhelés rögzítése
    async trackCognitiveLoad(userId: string, loadData: CognitiveLoadData): Promise<CognitiveLoad> {
        return prisma.cognitiveLoad.create({
            data: {
                userId,
                ...loadData,
            },
        });
    }

    // A/B teszt létrehozása
    async createABTest(testData: {
        name: string;
        description?: string;
        variants: any;
        startDate: Date;
        endDate?: Date;
    }): Promise<ABTest> {
        return prisma.aBTest.create({
            data: testData,
        });
    }

    // Felhasználó hozzárendelése A/B teszt variánshoz
    async assignToABTest(userId: string, testId: string, variant: string): Promise<ABTestAssignment> {
        return prisma.aBTestAssignment.create({
            data: {
                userId,
                testId,
                variant,
            },
        });
    }

    // Analitikai adatok lekérdezése
    async getUserAnalytics(userId: string, startDate: Date, endDate: Date) {
        const [events, style, retention, loads] = await Promise.all([
            prisma.analyticsEvent.findMany({
                where: {
                    userId,
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),
            prisma.learningStyle.findUnique({
                where: { userId },
            }),
            prisma.knowledgeRetention.findMany({
                where: { userId },
            }),
            prisma.cognitiveLoad.findMany({
                where: {
                    userId,
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),
        ]);

        return {
            events,
            learningStyle: style,
            knowledgeRetention: retention,
            cognitiveLoads: loads,
        };
    }

    // Adatok anonimizálása
    async anonymizeUserData(userId: string): Promise<void> {
        await prisma.analyticsEvent.updateMany({
            where: { userId },
            data: { anonymized: true },
        });
    }
}

export const analyticsService = new AnalyticsService(); 