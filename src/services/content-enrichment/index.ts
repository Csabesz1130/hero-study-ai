import { ExternalResource, ResourceSearchParams } from '@/types/content-enrichment';
import { ContentProviderService } from '../content-providers';
import { ContentRankingService } from '../content-ranking';
import { ResourceCacheService } from '../cache';
import { UserContributionService } from '../user-contributions';

export class ContentEnrichmentService {
    private contentProvider: ContentProviderService;
    private contentRanking: ContentRankingService;
    private cache: ResourceCacheService;
    private userContributions: UserContributionService;

    constructor() {
        this.contentProvider = new ContentProviderService();
        this.contentRanking = new ContentRankingService();
        this.cache = new ResourceCacheService();
        this.userContributions = new UserContributionService();
    }

    async enrichContent(content: string, context: string): Promise<ExternalResource[]> {
        try {
            // Keresési paraméterek előkészítése
            const searchParams: ResourceSearchParams = {
                query: content,
                limit: 20
            };

            // Gyorsítótár ellenőrzése
            const cacheKey = this.generateCacheKey(content, context);
            const cachedResources = await this.cache.get(cacheKey);

            if (cachedResources) {
                return cachedResources as ExternalResource[];
            }

            // Erőforrások keresése
            const resources = await this.contentProvider.search(searchParams);

            if (resources.length === 0) {
                return [];
            }

            // Relevancia alapú rangsorolás
            const rankedResources = await this.contentRanking.rankResources(resources, context);

            // Minőségi szűrés
            const filteredResources = rankedResources.filter(
                resource => resource.qualityScore >= 0.6
            );

            // Gyorsítótárba mentés
            await this.cache.set(cacheKey, filteredResources);

            return filteredResources;
        } catch (error) {
            console.error('Error enriching content:', error);
            return [];
        }
    }

    async getResourceDetails(resourceId: string, source: string): Promise<ExternalResource | null> {
        try {
            // Gyorsítótár ellenőrzése
            const cacheKey = `resource:${source}:${resourceId}`;
            const cachedResource = await this.cache.get(cacheKey);

            if (cachedResource) {
                return cachedResource as ExternalResource;
            }

            // Erőforrás részleteinek lekérése
            const resource = await this.contentProvider.getDetails(source, resourceId);

            if (!resource) {
                return null;
            }

            // Gyorsítótárba mentés
            await this.cache.set(cacheKey, resource);

            return resource;
        } catch (error) {
            console.error('Error getting resource details:', error);
            return null;
        }
    }

    async addUserContribution(contribution: any): Promise<void> {
        try {
            // Hozzájárulás érvényesítése
            const isValid = await this.userContributions.validateContribution(contribution);

            if (!isValid) {
                throw new Error('Invalid contribution');
            }

            // Hozzájárulás mentése
            await this.userContributions.addContribution(contribution);

            // Gyorsítótár frissítése
            const cacheKey = `resource:${contribution.source}:${contribution.resourceId}`;
            await this.cache.invalidate(cacheKey);
        } catch (error) {
            console.error('Error adding user contribution:', error);
            throw error;
        }
    }

    async preloadResources(resourceIds: string[]): Promise<void> {
        try {
            await this.cache.preloadResources(resourceIds);
        } catch (error) {
            console.error('Error preloading resources:', error);
        }
    }

    private generateCacheKey(content: string, context: string): string {
        // Egyedi kulcs generálása a tartalom és kontextus alapján
        const contentHash = this.hashString(content);
        const contextHash = this.hashString(context);
        return `enrichment:${contentHash}:${contextHash}`;
    }

    private hashString(str: string): string {
        // Egyszerű hash függvény a gyorsítótár kulcsokhoz
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    async getTopResources(limit: number = 10): Promise<ExternalResource[]> {
        try {
            // Itt implementálható a legnépszerűbb erőforrások lekérése
            // Például a felhasználói hozzájárulások és minősítések alapján
            return [];
        } catch (error) {
            console.error('Error getting top resources:', error);
            return [];
        }
    }

    async getResourceSuggestions(resourceId: string): Promise<ExternalResource[]> {
        try {
            // Itt implementálható a kapcsolódó erőforrások ajánlása
            // Például hasonló témájú vagy ugyanazon szerző által készített tartalmak
            return [];
        } catch (error) {
            console.error('Error getting resource suggestions:', error);
            return [];
        }
    }
} 