import { ResourceProvider, ExternalResource, ResourceSearchParams } from '@/types/content-enrichment';
import { YouTubeProvider } from './youtube';
import { ArxivProvider } from './arxiv';
import { KhanAcademyProvider } from './khan-academy';
import { WikipediaProvider } from './wikipedia';

export class ContentProviderService {
    private providers: Map<string, ResourceProvider>;

    constructor() {
        this.providers = new Map();
        this.initializeProviders();
    }

    private initializeProviders() {
        this.providers.set('youtube', new YouTubeProvider());
        this.providers.set('arxiv', new ArxivProvider());
        this.providers.set('khan_academy', new KhanAcademyProvider());
        this.providers.set('wikipedia', new WikipediaProvider());
    }

    async search(params: ResourceSearchParams): Promise<ExternalResource[]> {
        const results: ExternalResource[] = [];

        // Párhuzamos keresés minden szolgáltatónál
        const searchPromises = Array.from(this.providers.values()).map(provider =>
            provider.search(params).catch(error => {
                console.error(`Search error in provider:`, error);
                return [];
            })
        );

        const providerResults = await Promise.all(searchPromises);
        results.push(...providerResults.flat());

        return results;
    }

    async getDetails(source: string, id: string): Promise<ExternalResource | null> {
        const provider = this.providers.get(source);
        if (!provider) {
            throw new Error(`Provider not found: ${source}`);
        }
        return provider.getDetails(id);
    }

    async validateResource(resource: ExternalResource): Promise<boolean> {
        const provider = this.providers.get(resource.source);
        if (!provider) {
            throw new Error(`Provider not found: ${resource.source}`);
        }
        return provider.validateResource(resource);
    }
} 