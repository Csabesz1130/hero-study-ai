import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { up, down } from './migrations/0000_initial';

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool);

    try {
        console.log('Migráció indítása...');
        await up(db);
        console.log('Migráció sikeresen befejeződött!');
    } catch (error) {
        console.error('Hiba történt a migráció során:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main(); 