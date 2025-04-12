import { AnalyticsService, LearningStyleData, KnowledgeRetentionData } from './analytics-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MLService {
    private analyticsService: AnalyticsService;

    constructor() {
        this.analyticsService = new AnalyticsService();
    }

    // Tanulási stílus elemzése
    async analyzeLearningStyle(userId: string): Promise<LearningStyleData> {
        const events = await prisma.analyticsEvent.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' },
            take: 1000,
        });

        // Számítsuk ki a különböző tanulási stílusok súlyát
        const styleWeights = {
            visual: this.calculateVisualWeight(events),
            auditory: this.calculateAuditoryWeight(events),
            reading: this.calculateReadingWeight(events),
            kinesthetic: this.calculateKinestheticWeight(events),
        };

        // Normalizáljuk a súlyokat
        const total = Object.values(styleWeights).reduce((a, b) => a + b, 0);
        const normalizedStyle = {
            visual: styleWeights.visual / total,
            auditory: styleWeights.auditory / total,
            reading: styleWeights.reading / total,
            kinesthetic: styleWeights.kinesthetic / total,
        };

        // Számítsuk ki a modell bizonyosságát
        const confidence = this.calculateConfidence(events);

        return {
            style: normalizedStyle,
            confidence,
        };
    }

    // Tudásmegtartás előrejelzése
    async predictKnowledgeRetention(userId: string, topic: string): Promise<KnowledgeRetentionData> {
        const events = await prisma.analyticsEvent.findMany({
            where: {
                userId,
                metadata: {
                    path: ['topic'],
                    equals: topic,
                },
            },
        });

        const cognitiveLoads = await prisma.cognitiveLoad.findMany({
            where: {
                userId,
                contentId: topic,
            },
        });

        // Számítsuk ki a tudásmegtartás pontszámát
        const score = this.calculateRetentionScore(events, cognitiveLoads);

        // Előrejelzés a múltbeli adatok alapján
        const predictedScore = this.predictFutureRetention(events, cognitiveLoads);

        return {
            topic,
            score,
            predictedScore,
        };
    }

    // Kognitív terhelés becslése
    async estimateCognitiveLoad(content: string, userEvents: any[]): Promise<number> {
        const complexity = this.analyzeContentComplexity(content);
        const userEngagement = this.analyzeUserEngagement(userEvents);

        return this.calculateCognitiveLoad(complexity, userEngagement);
    }

    // Privát segédfüggvények
    private calculateVisualWeight(events: any[]): number {
        return events.filter(e =>
            e.type === 'video_watch' ||
            e.type === 'diagram_interaction'
        ).length;
    }

    private calculateAuditoryWeight(events: any[]): number {
        return events.filter(e =>
            e.type === 'audio_play' ||
            e.type === 'voice_interaction'
        ).length;
    }

    private calculateReadingWeight(events: any[]): number {
        return events.filter(e =>
            e.type === 'text_read' ||
            e.type === 'note_take'
        ).length;
    }

    private calculateKinestheticWeight(events: any[]): number {
        return events.filter(e =>
            e.type === 'interactive_exercise' ||
            e.type === 'simulation_interaction'
        ).length;
    }

    private calculateConfidence(events: any[]): number {
        const totalEvents = events.length;
        if (totalEvents < 10) return 0.5;
        if (totalEvents < 50) return 0.7;
        if (totalEvents < 100) return 0.8;
        return 0.9;
    }

    private calculateRetentionScore(events: any[], cognitiveLoads: any[]): number {
        const engagementScore = this.calculateEngagementScore(events);
        const loadScore = this.calculateLoadScore(cognitiveLoads);

        return (engagementScore * 0.7) + (loadScore * 0.3);
    }

    private predictFutureRetention(events: any[], cognitiveLoads: any[]): number {
        const currentScore = this.calculateRetentionScore(events, cognitiveLoads);
        const trend = this.calculateTrend(events);

        return currentScore + (trend * 0.1);
    }

    private analyzeContentComplexity(content: string): number {
        // Egyszerűsített komplexitás elemzés
        const wordCount = content.split(/\s+/).length;
        const sentenceCount = content.split(/[.!?]+/).length;
        const avgWordLength = content.replace(/[^a-zA-Z]/g, '').length / wordCount;

        return (wordCount * 0.4) + (sentenceCount * 0.3) + (avgWordLength * 0.3);
    }

    private analyzeUserEngagement(events: any[]): number {
        const timeSpent = events.reduce((acc, e) => acc + (e.data?.duration || 0), 0);
        const interactions = events.length;

        return (timeSpent * 0.6) + (interactions * 0.4);
    }

    private calculateCognitiveLoad(complexity: number, engagement: number): number {
        return (complexity * 0.7) + (engagement * 0.3);
    }

    private calculateEngagementScore(events: any[]): number {
        const timeSpent = events.reduce((acc, e) => acc + (e.data?.duration || 0), 0);
        const interactions = events.length;
        const completionRate = events.filter(e => e.type === 'content_complete').length / events.length;

        return (timeSpent * 0.4) + (interactions * 0.3) + (completionRate * 0.3);
    }

    private calculateLoadScore(cognitiveLoads: any[]): number {
        if (cognitiveLoads.length === 0) return 0.5;

        const avgLoad = cognitiveLoads.reduce((acc, load) => acc + load.loadScore, 0) / cognitiveLoads.length;
        return 1 - (avgLoad / 10); // Normalizálás 0-1 tartományba
    }

    private calculateTrend(events: any[]): number {
        if (events.length < 2) return 0;

        const recentEvents = events.slice(-10);
        const scores = recentEvents.map(e => e.data?.score || 0);
        const trend = scores[scores.length - 1] - scores[0];

        return trend / scores.length;
    }
}

export const mlService = new MLService(); 