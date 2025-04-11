import { UserContribution, ExternalResource } from '@/types/content-enrichment';
import { db } from '@/lib/db';
import { contentRankingService } from '../content-ranking';
import { resourceCacheService } from '../cache';

export class UserContributionService {
    private readonly MIN_RATING_COUNT = 5;
    private readonly MIN_CONTRIBUTION_SCORE = 0.7;

    async addContribution(contribution: UserContribution): Promise<void> {
        try {
            // Ellenőrizzük a felhasználó jogosultságait
            const userScore = await this.calculateUserScore(contribution.userId);
            if (userScore < this.MIN_CONTRIBUTION_SCORE) {
                throw new Error('Insufficient user contribution score');
            }

            // Mentjük a hozzájárulást
            await db.userContributions.create({
                data: {
                    userId: contribution.userId,
                    resourceId: contribution.resourceId,
                    rating: contribution.rating,
                    review: contribution.review,
                    createdAt: contribution.createdAt
                }
            });

            // Frissítjük az erőforrás minősítését
            await this.updateResourceScore(contribution.resourceId);
        } catch (error) {
            console.error('Error adding contribution:', error);
            throw error;
        }
    }

    async getUserContributions(userId: string): Promise<UserContribution[]> {
        return db.userContributions.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getResourceContributions(resourceId: string): Promise<UserContribution[]> {
        return db.userContributions.findMany({
            where: { resourceId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async calculateUserScore(userId: string): Promise<number> {
        const contributions = await this.getUserContributions(userId);

        if (contributions.length < this.MIN_RATING_COUNT) {
            return 0;
        }

        // Számítjuk a felhasználó pontszámát a hozzájárulások alapján
        const score = contributions.reduce((total, contribution) => {
            const timeWeight = this.calculateTimeWeight(contribution.createdAt);
            return total + (contribution.rating * timeWeight);
        }, 0) / contributions.length;

        return Math.min(score, 1.0);
    }

    private async updateResourceScore(resourceId: string): Promise<void> {
        const contributions = await this.getResourceContributions(resourceId);

        if (contributions.length === 0) {
            return;
        }

        // Számítjuk az új minősítési pontszámot
        const newScore = contributions.reduce((total, contribution) => {
            const userWeight = this.calculateUserWeight(contribution.userId);
            const timeWeight = this.calculateTimeWeight(contribution.createdAt);
            return total + (contribution.rating * userWeight * timeWeight);
        }, 0) / contributions.length;

        // Frissítjük az erőforrást
        const resource = await db.externalResources.findUnique({
            where: { id: resourceId }
        });

        if (resource) {
            await db.externalResources.update({
                where: { id: resourceId },
                data: {
                    qualityScore: newScore,
                    updatedAt: new Date()
                }
            });

            // Frissítjük a gyorsítótárat
            await resourceCacheService.invalidate(resourceId);
        }
    }

    private calculateTimeWeight(date: Date): number {
        const now = new Date();
        const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
        return Math.max(0.5, 1 - (diffInDays / 365)); // 1 év alatt lineárisan csökken
    }

    private async calculateUserWeight(userId: string): Promise<number> {
        const userScore = await this.calculateUserScore(userId);
        return userScore;
    }

    async validateContribution(contribution: UserContribution): Promise<boolean> {
        // Ellenőrizzük a felhasználó jogosultságait
        const userScore = await this.calculateUserScore(contribution.userId);
        if (userScore < this.MIN_CONTRIBUTION_SCORE) {
            return false;
        }

        // Ellenőrizzük, hogy a felhasználó már értékelte-e az erőforrást
        const existingContribution = await db.userContributions.findFirst({
            where: {
                userId: contribution.userId,
                resourceId: contribution.resourceId
            }
        });

        if (existingContribution) {
            return false;
        }

        // Ellenőrizzük az értékelés érvényességét
        if (contribution.rating < 1 || contribution.rating > 5) {
            return false;
        }

        return true;
    }

    async getTopContributors(limit: number = 10): Promise<{ userId: string; score: number }[]> {
        const users = await db.userContributions.groupBy({
            by: ['userId'],
            _count: {
                userId: true
            },
            orderBy: {
                _count: {
                    userId: 'desc'
                }
            },
            take: limit
        });

        return Promise.all(
            users.map(async (user) => ({
                userId: user.userId,
                score: await this.calculateUserScore(user.userId)
            }))
        );
    }
} 