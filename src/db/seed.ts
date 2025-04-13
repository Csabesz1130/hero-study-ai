import { db } from './production';
import { users, sessions, progress, externalResources, contributions, learningStyles, knowledgeRetention } from './schema';

async function main() {
    try {
        console.log('Seed indítása...');

        // Felhasználók létrehozása
        const user1 = await db.insert(users).values({
            id: 'user1',
            email: 'test1@example.com',
            name: 'Teszt Felhasználó 1',
            preferences: {
                language: 'hu',
                theme: 'light',
                notifications: true
            }
        }).returning();

        const user2 = await db.insert(users).values({
            id: 'user2',
            email: 'test2@example.com',
            name: 'Teszt Felhasználó 2',
            preferences: {
                language: 'en',
                theme: 'dark',
                notifications: false
            }
        }).returning();

        // Munkamenetek létrehozása
        await db.insert(sessions).values([
            {
                id: 'session1',
                userId: user1[0].id,
                messages: [
                    { role: 'user', content: 'Szia!', timestamp: new Date() },
                    { role: 'assistant', content: 'Üdvözöllek! Hogyan segíthetek?', timestamp: new Date() }
                ]
            },
            {
                id: 'session2',
                userId: user2[0].id,
                messages: [
                    { role: 'user', content: 'Hello!', timestamp: new Date() },
                    { role: 'assistant', content: 'Hi! How can I help you?', timestamp: new Date() }
                ]
            }
        ]);

        // Haladás létrehozása
        await db.insert(progress).values([
            {
                id: 'progress1',
                userId: user1[0].id,
                sceneId: 'scene1',
                data: {
                    completed: true,
                    score: 95,
                    timeSpent: 1200
                }
            },
            {
                id: 'progress2',
                userId: user2[0].id,
                sceneId: 'scene2',
                data: {
                    completed: false,
                    score: 75,
                    timeSpent: 800
                }
            }
        ]);

        // Külső források létrehozása
        const resource1 = await db.insert(externalResources).values({
            id: 'resource1',
            title: 'TypeScript Dokumentáció',
            description: 'A TypeScript hivatalos dokumentációja',
            url: 'https://www.typescriptlang.org/docs/',
            type: 'documentation',
            source: 'typescriptlang.org',
            qualityScore: 0.95,
            relevanceScore: 0.9,
            metadata: {
                tags: ['typescript', 'programming', 'documentation']
            },
            license: {
                type: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        }).returning();

        const resource2 = await db.insert(externalResources).values({
            id: 'resource2',
            title: 'React Tanulás',
            description: 'React tanulási útmutató kezdőknek',
            url: 'https://react.dev/learn',
            type: 'tutorial',
            source: 'react.dev',
            qualityScore: 0.9,
            relevanceScore: 0.85,
            metadata: {
                tags: ['react', 'javascript', 'frontend']
            },
            license: {
                type: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        }).returning();

        // Hozzájárulások létrehozása
        await db.insert(contributions).values([
            {
                id: 'contribution1',
                userId: user1[0].id,
                resourceId: resource1[0].id,
                rating: 5,
                review: 'Nagyon hasznos dokumentáció!'
            },
            {
                id: 'contribution2',
                userId: user2[0].id,
                resourceId: resource2[0].id,
                rating: 4,
                review: 'Good tutorial for beginners.'
            }
        ]);

        // Tanulási stílusok létrehozása
        await db.insert(learningStyles).values([
            {
                id: 'style1',
                userId: user1[0].id,
                style: {
                    visual: 0.7,
                    auditory: 0.3,
                    reading: 0.8,
                    kinesthetic: 0.4
                },
                confidence: 0.85
            },
            {
                id: 'style2',
                userId: user2[0].id,
                style: {
                    visual: 0.5,
                    auditory: 0.7,
                    reading: 0.6,
                    kinesthetic: 0.8
                },
                confidence: 0.9
            }
        ]);

        // Tudásmegtartás létrehozása
        await db.insert(knowledgeRetention).values([
            {
                id: 'retention1',
                userId: user1[0].id,
                topic: 'typescript',
                score: 0.9,
                predictedScore: 0.85
            },
            {
                id: 'retention2',
                userId: user2[0].id,
                topic: 'react',
                score: 0.8,
                predictedScore: 0.75
            }
        ]);

        console.log('Seed sikeresen befejeződött!');
    } catch (error) {
        console.error('Hiba történt a seed során:', error);
        process.exit(1);
    }
}

main(); 