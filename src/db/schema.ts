import { pgTable, text, timestamp, json, integer, uniqueIndex, index, boolean, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
    id: text('id').primaryKey().notNull(),
    email: text('email').notNull().unique(),
    name: text('name'),
    preferences: json('preferences'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const sessions = pgTable('sessions', {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id').notNull().references(() => users.id),
    messages: json('messages').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const progress = pgTable('progress', {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id').notNull().references(() => users.id),
    sceneId: text('scene_id').notNull(),
    data: json('data').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    userSceneIdx: uniqueIndex('user_scene_idx').on(table.userId, table.sceneId)
}));

export const externalResources = pgTable('external_resources', {
    id: text('id').primaryKey().notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    url: text('url').notNull(),
    type: text('type').notNull(),
    source: text('source').notNull(),
    qualityScore: real('quality_score').default(0).notNull(),
    relevanceScore: real('relevance_score').default(0).notNull(),
    metadata: json('metadata'),
    license: json('license'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const contributions = pgTable('contributions', {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id').notNull().references(() => users.id),
    resourceId: text('resource_id').notNull().references(() => externalResources.id),
    rating: integer('rating').notNull(),
    review: text('review'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    userResourceIdx: uniqueIndex('user_resource_idx').on(table.userId, table.resourceId),
    userIdx: index('user_idx').on(table.userId),
    resourceIdx: index('resource_idx').on(table.resourceId)
}));

export const resourceCache = pgTable('resource_cache', {
    id: text('id').primaryKey().notNull(),
    key: text('key').notNull().unique(),
    value: json('value').notNull(),
    ttl: integer('ttl').default(86400).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    keyIdx: index('key_idx').on(table.key)
}));

export const analyticsEvents = pgTable('analytics_events', {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id').notNull().references(() => users.id),
    type: text('type').notNull(),
    data: json('data').notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    sessionId: text('session_id'),
    metadata: json('metadata'),
    anonymized: boolean('anonymized').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    userIdx: index('user_idx').on(table.userId),
    typeIdx: index('type_idx').on(table.type),
    timestampIdx: index('timestamp_idx').on(table.timestamp)
}));

export const learningStyles = pgTable('learning_styles', {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id').notNull().references(() => users.id),
    style: json('style').notNull(),
    confidence: real('confidence').default(0).notNull(),
    lastUpdated: timestamp('last_updated').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    userIdx: uniqueIndex('user_idx').on(table.userId)
}));

export const knowledgeRetention = pgTable('knowledge_retention', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    resourceId: text('resource_id').notNull(),
    easeFactor: real('ease_factor').notNull().default(2.5),
    interval: integer('interval').notNull().default(0),
    repetitions: integer('repetitions').notNull().default(0),
    dueDate: timestamp('due_date').notNull(),
    lastReviewedAt: timestamp('last_reviewed_at'),
    type: text('type', { enum: ['transformation', 'note', 'bookmark', 'highlight', 'question', 'solution', 'example'] }).notNull(),
    difficulty: text('difficulty', { enum: ['beginner', 'intermediate', 'advanced'] }).notNull().default('intermediate'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const cognitiveLoads = pgTable('cognitive_loads', {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id').notNull().references(() => users.id),
    contentId: text('content_id').notNull(),
    loadScore: real('load_score').default(0).notNull(),
    factors: json('factors').notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    userIdx: index('user_idx').on(table.userId),
    contentIdx: index('content_idx').on(table.contentId)
}));

export const abTests = pgTable('ab_tests', {
    id: text('id').primaryKey().notNull(),
    name: text('name').notNull(),
    description: text('description'),
    variants: json('variants').notNull(),
    results: json('results'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    status: text('status').default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    statusIdx: index('status_idx').on(table.status)
}));

export const abTestAssignments = pgTable('ab_test_assignments', {
    id: text('id').primaryKey().notNull(),
    testId: text('test_id').notNull().references(() => abTests.id),
    userId: text('user_id').notNull().references(() => users.id),
    variant: text('variant').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    testUserIdx: uniqueIndex('test_user_idx').on(table.testId, table.userId),
    testIdx: index('test_idx').on(table.testId),
    userIdx: index('user_idx').on(table.userId)
}));

// Relációk definiálása
export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
    progress: many(progress),
    analyticsEvents: many(analyticsEvents),
    learningStyle: many(learningStyles),
    knowledgeRetention: many(knowledgeRetention),
    cognitiveLoads: many(cognitiveLoads),
    abTestAssignments: many(abTestAssignments)
}));

export const externalResourcesRelations = relations(externalResources, ({ many }) => ({
    contributions: many(contributions)
}));

export const abTestsRelations = relations(abTests, ({ many }) => ({
    assignments: many(abTestAssignments)
})); 