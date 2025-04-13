import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Connection pool létrehozása
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximális kapcsolatok száma
    idleTimeoutMillis: 30000, // Kapcsolat bezárása 30 másodperc inaktivitás után
    connectionTimeoutMillis: 2000, // Kapcsolódási időtúllépés 2 másodperc
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Drizzle kliens létrehozása
export const db = drizzle(pool, {
    schema,
    logger: process.env.NODE_ENV === 'development' ? {
        logQuery(query: string, params: unknown[]) {
            console.log('Query:', query);
            console.log('Params:', params);
        }
    } : false
});

// Kapcsolat kezelése
process.on('SIGINT', async () => {
    await pool.end();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await pool.end();
    process.exit(0);
});

// Kapcsolat ellenőrzése
export async function checkConnection() {
    try {
        await pool.query('SELECT 1');
        return true;
    } catch (error) {
        console.error('Adatbázis kapcsolat hiba:', error);
        return false;
    }
}

// Kapcsolat újraindítása
export async function restartConnection() {
    try {
        await pool.end();
        await pool.connect();
        return true;
    } catch (error) {
        console.error('Kapcsolat újraindítási hiba:', error);
        return false;
    }
}

// Tranzakció kezelése
export async function withTransaction<T>(callback: (db: typeof db) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(drizzle(client, { schema }));
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Batch műveletek kezelése
export async function batchInsert<T extends { id: string }>(
    table: any,
    data: T[],
    batchSize = 1000
) {
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await db.insert(table).values(batch);
    }
}

// Cache kezelése
export async function getCached<T>(key: string, ttl: number, callback: () => Promise<T>): Promise<T> {
    const cached = await db.query.resourceCache.findFirst({
        where: (cache, { eq }) => eq(cache.key, key)
    });

    if (cached && Date.now() - cached.createdAt.getTime() < cached.ttl * 1000) {
        return cached.value as T;
    }

    const result = await callback();
    await db.insert(schema.resourceCache).values({
        key,
        value: result,
        ttl
    }).onConflictDoUpdate({
        target: schema.resourceCache.key,
        set: {
            value: result,
            ttl,
            updatedAt: new Date()
        }
    });

    return result;
} 