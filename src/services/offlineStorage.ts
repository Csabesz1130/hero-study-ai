import { MicroLearningContent, UserEngagement } from '@/types/microLearning';

class OfflineStorage {
    private static readonly DB_NAME = 'microLearningDB';
    private static readonly DB_VERSION = 1;
    private static readonly CONTENT_STORE = 'content';
    private static readonly ENGAGEMENT_STORE = 'engagement';
    private static readonly SYNC_QUEUE = 'syncQueue';

    private db: IDBDatabase | null = null;

    constructor() {
        this.initDB();
    }

    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(OfflineStorage.DB_NAME, OfflineStorage.DB_VERSION);

            request.onerror = () => {
                console.error('Adatbázis inicializálása sikertelen');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Tartalom tároló létrehozása
                if (!db.objectStoreNames.contains(OfflineStorage.CONTENT_STORE)) {
                    const contentStore = db.createObjectStore(OfflineStorage.CONTENT_STORE, { keyPath: 'id' });
                    contentStore.createIndex('tags', 'tags', { multiEntry: true });
                }

                // Interakció tároló létrehozása
                if (!db.objectStoreNames.contains(OfflineStorage.ENGAGEMENT_STORE)) {
                    const engagementStore = db.createObjectStore(OfflineStorage.ENGAGEMENT_STORE, { keyPath: 'id' });
                    engagementStore.createIndex('userId', 'userId');
                    engagementStore.createIndex('contentId', 'contentId');
                }

                // Szinkronizációs sor létrehozása
                if (!db.objectStoreNames.contains(OfflineStorage.SYNC_QUEUE)) {
                    db.createObjectStore(OfflineStorage.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    public async saveContent(content: MicroLearningContent): Promise<void> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(OfflineStorage.CONTENT_STORE, 'readwrite');
            const store = transaction.objectStore(OfflineStorage.CONTENT_STORE);

            const request = store.put(content);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    public async getContent(contentId: string): Promise<MicroLearningContent | null> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(OfflineStorage.CONTENT_STORE, 'readonly');
            const store = transaction.objectStore(OfflineStorage.CONTENT_STORE);

            const request = store.get(contentId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    public async getAllContent(): Promise<MicroLearningContent[]> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(OfflineStorage.CONTENT_STORE, 'readonly');
            const store = transaction.objectStore(OfflineStorage.CONTENT_STORE);

            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    public async saveEngagement(engagement: UserEngagement): Promise<void> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(OfflineStorage.ENGAGEMENT_STORE, 'readwrite');
            const store = transaction.objectStore(OfflineStorage.ENGAGEMENT_STORE);

            const request = store.put(engagement);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    public async getEngagements(userId: string): Promise<UserEngagement[]> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(OfflineStorage.ENGAGEMENT_STORE, 'readonly');
            const store = transaction.objectStore(OfflineStorage.ENGAGEMENT_STORE);
            const index = store.index('userId');

            const request = index.getAll(userId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    public async queueSync(operation: {
        type: 'content' | 'engagement';
        action: 'create' | 'update' | 'delete';
        data: any;
    }): Promise<void> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(OfflineStorage.SYNC_QUEUE, 'readwrite');
            const store = transaction.objectStore(OfflineStorage.SYNC_QUEUE);

            const request = store.add({
                timestamp: new Date(),
                ...operation
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    public async processSyncQueue(): Promise<void> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(OfflineStorage.SYNC_QUEUE, 'readwrite');
            const store = transaction.objectStore(OfflineStorage.SYNC_QUEUE);

            const request = store.getAll();

            request.onsuccess = async () => {
                const operations = request.result;
                for (const operation of operations) {
                    try {
                        await this.syncOperation(operation);
                        await this.removeFromQueue(operation.id);
                    } catch (error) {
                        console.error('Szinkronizációs művelet sikertelen:', error);
                    }
                }
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }

    private async syncOperation(operation: any): Promise<void> {
        const { type, action, data } = operation;

        switch (type) {
            case 'content':
                await this.syncContent(action, data);
                break;
            case 'engagement':
                await this.syncEngagement(action, data);
                break;
        }
    }

    private async syncContent(action: string, data: MicroLearningContent): Promise<void> {
        const response = await fetch(`/api/content/${data.id}`, {
            method: action === 'delete' ? 'DELETE' : action === 'update' ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Tartalom szinkronizálása sikertelen');
        }
    }

    private async syncEngagement(action: string, data: UserEngagement): Promise<void> {
        const response = await fetch(`/api/engagements/${data.id}`, {
            method: action === 'delete' ? 'DELETE' : action === 'update' ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Interakció szinkronizálása sikertelen');
        }
    }

    private async removeFromQueue(id: number): Promise<void> {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(OfflineStorage.SYNC_QUEUE, 'readwrite');
            const store = transaction.objectStore(OfflineStorage.SYNC_QUEUE);

            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const offlineStorage = new OfflineStorage(); 