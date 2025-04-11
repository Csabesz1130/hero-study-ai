import { ExternalResource, ResourceRanking } from '@/types/content-enrichment';
import { naturalLanguageService } from '../nlp';

export class ContentRankingService implements ResourceRanking {
    private readonly RELEVANCE_WEIGHTS = {
        title: 0.3,
        description: 0.2,
        tags: 0.15,
        author: 0.1,
        metadata: 0.25
    };

    private readonly QUALITY_WEIGHTS = {
        viewCount: 0.2,
        rating: 0.3,
        duration: 0.1,
        authorReputation: 0.2,
        recency: 0.2
    };

    async calculateRelevanceScore(resource: ExternalResource, context: string): Promise<number> {
        const scores = {
            title: await this.calculateTextSimilarity(resource.title, context),
            description: await this.calculateTextSimilarity(resource.description, context),
            tags: await this.calculateTagsRelevance(resource.metadata.tags || [], context),
            author: await this.calculateAuthorRelevance(resource.metadata.author || '', context),
            metadata: await this.calculateMetadataRelevance(resource.metadata, context)
        };

        return Object.entries(scores).reduce((total, [key, score]) => {
            return total + (score * this.RELEVANCE_WEIGHTS[key as keyof typeof scores]);
        }, 0);
    }

    calculateQualityScore(resource: ExternalResource): number {
        const scores = {
            viewCount: this.normalizeViewCount(resource.metadata.viewCount || 0),
            rating: resource.metadata.rating || 0,
            duration: this.normalizeDuration(resource.metadata.duration || 0),
            authorReputation: this.calculateAuthorReputation(resource),
            recency: this.calculateRecencyScore(resource.createdAt)
        };

        return Object.entries(scores).reduce((total, [key, score]) => {
            return total + (score * this.QUALITY_WEIGHTS[key as keyof typeof scores]);
        }, 0);
    }

    async rankResources(resources: ExternalResource[], context: string): Promise<ExternalResource[]> {
        // Relevancia és minőségi pontszámok kiszámítása
        const rankedResources = await Promise.all(resources.map(async (resource) => {
            const relevanceScore = await this.calculateRelevanceScore(resource, context);
            const qualityScore = this.calculateQualityScore(resource);

            return {
                ...resource,
                relevanceScore,
                qualityScore
            };
        }));

        // Rangsorolás a kombinált pontszám alapján
        return rankedResources.sort((a, b) => {
            const scoreA = (a.relevanceScore * 0.7) + (a.qualityScore * 0.3);
            const scoreB = (b.relevanceScore * 0.7) + (b.qualityScore * 0.3);
            return scoreB - scoreA;
        });
    }

    private async calculateTextSimilarity(text1: string, text2: string): Promise<number> {
        return naturalLanguageService.calculateSimilarity(text1, text2);
    }

    private async calculateTagsRelevance(tags: string[], context: string): Promise<number> {
        if (!tags.length) return 0;

        const tagScores = await Promise.all(
            tags.map(tag => this.calculateTextSimilarity(tag, context))
        );

        return tagScores.reduce((sum, score) => sum + score, 0) / tags.length;
    }

    private async calculateAuthorRelevance(author: string, context: string): Promise<number> {
        if (!author) return 0;
        return this.calculateTextSimilarity(author, context);
    }

    private async calculateMetadataRelevance(metadata: any, context: string): Promise<number> {
        const relevantFields = ['language', 'difficulty'];
        let score = 0;

        for (const field of relevantFields) {
            if (metadata[field]) {
                score += await this.calculateTextSimilarity(metadata[field], context);
            }
        }

        return score / relevantFields.length;
    }

    private normalizeViewCount(views: number): number {
        if (views === 0) return 0;
        return Math.min(Math.log10(views) / 7, 1);
    }

    private normalizeDuration(duration: number): number {
        // Ideális videó hossz: 5-15 perc
        const idealMin = 5 * 60;
        const idealMax = 15 * 60;

        if (duration < idealMin) return duration / idealMin;
        if (duration > idealMax) return 1 - ((duration - idealMax) / (idealMax * 2));
        return 1;
    }

    private calculateAuthorReputation(resource: ExternalResource): number {
        // Alapértelmezett érték, később implementálható a szerző hírnevének kiszámítása
        return 0.5;
    }

    private calculateRecencyScore(date: Date): number {
        const now = new Date();
        const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
        return Math.max(0, 1 - (diffInDays / 365)); // 1 év alatt lineárisan csökken
    }
} 