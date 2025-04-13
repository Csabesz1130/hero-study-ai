import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, json, integer, uniqueIndex, index, boolean, real } from 'drizzle-orm/pg-core';

export async function up(db: any) {
    await db.execute(sql`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            email TEXT NOT NULL UNIQUE,
            name TEXT,
            preferences JSONB,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            messages JSONB NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS progress (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            scene_id TEXT NOT NULL,
            data JSONB NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, scene_id)
        );
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS external_resources (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            url TEXT NOT NULL,
            type TEXT NOT NULL,
            source TEXT NOT NULL,
            quality_score REAL NOT NULL DEFAULT 0,
            relevance_score REAL NOT NULL DEFAULT 0,
            metadata JSONB,
            license JSONB,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS contributions (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            resource_id TEXT NOT NULL REFERENCES external_resources(id) ON DELETE CASCADE,
            rating INTEGER NOT NULL,
            review TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, resource_id)
        );
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS resource_cache (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            key TEXT NOT NULL UNIQUE,
            value JSONB NOT NULL,
            ttl INTEGER NOT NULL DEFAULT 86400,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS analytics_events (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type TEXT NOT NULL,
            data JSONB NOT NULL,
            timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
            session_id TEXT,
            metadata JSONB,
            anonymized BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS learning_styles (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            style JSONB NOT NULL,
            confidence REAL NOT NULL DEFAULT 0,
            last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(user_id)
        );
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS knowledge_retention (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            topic TEXT NOT NULL,
            score REAL NOT NULL DEFAULT 0,
            predicted_score REAL NOT NULL DEFAULT 0,
            last_assessed TIMESTAMP NOT NULL DEFAULT NOW(),
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, topic)
        );
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS cognitive_loads (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content_id TEXT NOT NULL,
            load_score REAL NOT NULL DEFAULT 0,
            factors JSONB NOT NULL,
            timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ab_tests (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT,
            variants JSONB NOT NULL,
            results JSONB,
            start_date TIMESTAMP NOT NULL,
            end_date TIMESTAMP,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ab_test_assignments (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            test_id TEXT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            variant TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(test_id, user_id)
        );
    `);

    // Indexek létrehozása
    await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
        CREATE INDEX IF NOT EXISTS idx_progress_scene_id ON progress(scene_id);
        CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
        CREATE INDEX IF NOT EXISTS idx_contributions_resource_id ON contributions(resource_id);
        CREATE INDEX IF NOT EXISTS idx_resource_cache_key ON resource_cache(key);
        CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
        CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(type);
        CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_knowledge_retention_user_id ON knowledge_retention(user_id);
        CREATE INDEX IF NOT EXISTS idx_knowledge_retention_topic ON knowledge_retention(topic);
        CREATE INDEX IF NOT EXISTS idx_cognitive_loads_user_id ON cognitive_loads(user_id);
        CREATE INDEX IF NOT EXISTS idx_cognitive_loads_content_id ON cognitive_loads(content_id);
        CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
        CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_test_id ON ab_test_assignments(test_id);
        CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_user_id ON ab_test_assignments(user_id);
    `);
}

export async function down(db: any) {
    await db.execute(sql`
        DROP TABLE IF EXISTS ab_test_assignments;
        DROP TABLE IF EXISTS ab_tests;
        DROP TABLE IF EXISTS cognitive_loads;
        DROP TABLE IF EXISTS knowledge_retention;
        DROP TABLE IF EXISTS learning_styles;
        DROP TABLE IF EXISTS analytics_events;
        DROP TABLE IF EXISTS resource_cache;
        DROP TABLE IF EXISTS contributions;
        DROP TABLE IF EXISTS external_resources;
        DROP TABLE IF EXISTS progress;
        DROP TABLE IF EXISTS sessions;
        DROP TABLE IF EXISTS users;
    `);
} 