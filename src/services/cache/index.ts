import { ExternalResource, ResourceCache } from '@/types/content-enrichment';
import Redis from 'ioredis';

export class ResourceCacheService implements ResourceCache {
    private redis: Redis;
    private readonly DEFAULT_TTL = 24 * 60 * 60; // 24 óra

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD
        });
    }

    async get(key: string): Promise<ExternalResource | null> {
        try {
            const data = await this.redis.get(key);
            if (!data) return null;

            const resource = JSON.parse(data);
            return {
                ...resource,
                createdAt: new Date(resource.createdAt),
                updatedAt: new Date(resource.updatedAt),
                metadata: {
                    ...resource.metadata,
                    publicationDate: resource.metadata.publicationDate ? new Date(resource.metadata.publicationDate) : undefined
                }
            };
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key: string, resource: ExternalResource, ttl: number = this.DEFAULT_TTL): Promise<void> {
        try {
            await this.redis.setex(key, ttl, JSON.stringify(resource));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    async invalidate(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            console.error('Cache invalidate error:', error);
        }
    }

    async getBatch(keys: string[]): Promise<Map<string, ExternalResource>> {
        const results = new Map<string, ExternalResource>();

        try {
            const values = await this.redis.mget(keys);

            values.forEach((value, index) => {
                if (value) {
                    const resource = JSON.parse(value);
                    results.set(keys[index], {
                        ...resource,
                        createdAt: new Date(resource.createdAt),
                        updatedAt: new Date(resource.updatedAt),
                        metadata: {
                            ...resource.metadata,
                            publicationDate: resource.metadata.publicationDate ? new Date(resource.metadata.publicationDate) : undefined
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Cache getBatch error:', error);
        }

        return results;
    }

    async setBatch(resources: Map<string, ExternalResource>, ttl: number = this.DEFAULT_TTL): Promise<void> {
        try {
            const pipeline = this.redis.pipeline();

            resources.forEach((resource, key) => {
                pipeline.setex(key, ttl, JSON.stringify(resource));
            });

            await pipeline.exec();
        } catch (error) {
            console.error('Cache setBatch error:', error);
        }
    }

    async preloadResources(keys: string[]): Promise<void> {
        try {
            const missingKeys = [];
            const cachedResources = await this.getBatch(keys);

            // Ellenőrizzük, mely kulcsok hiányoznak a gyorsítótárból
            keys.forEach(key => {
                if (!cachedResources.has(key)) {
                    missingKeys.push(key);
                }
            });

            if (missingKeys.length > 0) {
                // Itt implementálható a hiányzó erőforrások előzetes betöltése
                console.log(`Preloading ${missingKeys.length} missing resources`);
            }
        } catch (error) {
            console.error('Cache preload error:', error);
        }
    }

    async clearExpired(): Promise<void> {
        try {
            // Redis automatikusan kezeli a lejárt kulcsokat
            // Ha szükséges, implementálható egyéni tisztítási logika
        } catch (error) {
            console.error('Cache clearExpired error:', error);
        }
    }
} 