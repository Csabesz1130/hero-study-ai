import { ResourceProvider, ExternalResource, ResourceSearchParams, ResourceType, ContentSource } from '@/types/content-enrichment';

export class YouTubeProvider implements ResourceProvider {
    private readonly API_KEY: string;
    private readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';

    constructor() {
        this.API_KEY = process.env.YOUTUBE_API_KEY || '';
        if (!this.API_KEY) {
            throw new Error('YouTube API key is required');
        }
    }

    async search(params: ResourceSearchParams): Promise<ExternalResource[]> {
        const searchUrl = `${this.BASE_URL}/search?part=snippet&q=${encodeURIComponent(params.query)}&type=video&maxResults=${params.limit || 10}&key=${this.API_KEY}`;

        try {
            const response = await fetch(searchUrl);
            const data = await response.json();

            if (!data.items) {
                return [];
            }

            return data.items.map((item: any) => this.mapToExternalResource(item));
        } catch (error) {
            console.error('YouTube search error:', error);
            return [];
        }
    }

    async getDetails(id: string): Promise<ExternalResource> {
        const videoUrl = `${this.BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${id}&key=${this.API_KEY}`;

        try {
            const response = await fetch(videoUrl);
            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                throw new Error('Video not found');
            }

            return this.mapToExternalResource(data.items[0], true);
        } catch (error) {
            console.error('YouTube getDetails error:', error);
            throw error;
        }
    }

    async validateResource(resource: ExternalResource): Promise<boolean> {
        try {
            const details = await this.getDetails(resource.id);
            return details !== null;
        } catch (error) {
            return false;
        }
    }

    private mapToExternalResource(item: any, includeDetails: boolean = false): ExternalResource {
        const duration = includeDetails ? this.parseDuration(item.contentDetails.duration) : undefined;
        const viewCount = includeDetails ? parseInt(item.statistics.viewCount) : undefined;
        const rating = includeDetails ? parseFloat(item.statistics.likeCount) / parseInt(item.statistics.viewCount) : undefined;

        return {
            id: item.id.videoId || item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            url: `https://www.youtube.com/watch?v=${item.id.videoId || item.id}`,
            type: ResourceType.VIDEO,
            source: ContentSource.YOUTUBE,
            qualityScore: this.calculateQualityScore(item, includeDetails),
            relevanceScore: 0, // Ezt a ranking rendszer számítja ki
            metadata: {
                duration,
                language: item.snippet.defaultLanguage || 'en',
                author: item.snippet.channelTitle,
                publicationDate: new Date(item.snippet.publishedAt),
                tags: item.snippet.tags || [],
                viewCount,
                rating
            },
            license: {
                type: 'YouTube Standard License',
                url: 'https://www.youtube.com/static?template=terms',
                attributionRequired: true,
                attributionText: `Video by ${item.snippet.channelTitle}`
            },
            createdAt: new Date(item.snippet.publishedAt),
            updatedAt: new Date()
        };
    }

    private parseDuration(duration: string): number {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return 0;

        const hours = (match[1] ? parseInt(match[1]) : 0);
        const minutes = (match[2] ? parseInt(match[2]) : 0);
        const seconds = (match[3] ? parseInt(match[3]) : 0);

        return hours * 3600 + minutes * 60 + seconds;
    }

    private calculateQualityScore(item: any, includeDetails: boolean): number {
        let score = 0.5; // Alapérték

        // Csatorna minősítése
        if (item.snippet.channelTitle.toLowerCase().includes('academy') ||
            item.snippet.channelTitle.toLowerCase().includes('education')) {
            score += 0.2;
        }

        if (includeDetails) {
            // Nézettség alapján
            const viewCount = parseInt(item.statistics.viewCount);
            if (viewCount > 1000000) score += 0.1;
            else if (viewCount > 100000) score += 0.05;

            // Like/dislike arány
            const likes = parseInt(item.statistics.likeCount);
            const dislikes = parseInt(item.statistics.dislikeCount);
            const total = likes + dislikes;
            if (total > 0) {
                score += (likes / total) * 0.2;
            }
        }

        return Math.min(score, 1.0);
    }
} 