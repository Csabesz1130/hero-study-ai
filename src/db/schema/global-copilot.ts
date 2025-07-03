import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, decimal, boolean, pgEnum } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

// Enums
export const challengeStatusEnum = pgEnum('challenge_status', ['draft', 'active', 'evaluation', 'completed', 'cancelled'])
export const difficultyLevelEnum = pgEnum('difficulty_level', ['beginner', 'intermediate', 'advanced', 'expert'])
export const teamStatusEnum = pgEnum('team_status', ['forming', 'active', 'completed', 'disbanded'])
export const submissionStatusEnum = pgEnum('submission_status', ['draft', 'submitted', 'under_review', 'evaluated', 'featured'])
export const userRoleEnum = pgEnum('user_role', ['user', 'moderator', 'admin', 'mentor'])

// Users tábla
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 500 }),
  bio: text('bio'),
  location: varchar('location', { length: 100 }),
  role: userRoleEnum('role').default('user').notNull(),
  preferences: jsonb('preferences').$type<{
    timezone?: string
    language?: string
    notifications?: {
      email: boolean
      push: boolean
      challenges: boolean
      teams: boolean
    }
    collaboration?: {
      preferredTeamSize: number
      workingHours: string[]
      communicationStyle: string
    }
  }>(),
  isVerified: boolean('is_verified').default(false),
  lastActive: timestamp('last_active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Challenges tábla
export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  shortDescription: varchar('short_description', { length: 500 }),
  creatorId: uuid('creator_id').notNull().references(() => users.id),
  status: challengeStatusEnum('status').default('draft').notNull(),
  difficulty: difficultyLevelEnum('difficulty').notNull(),
  skillsRequired: jsonb('skills_required').$type<string[]>(),
  tags: jsonb('tags').$type<string[]>(),
  criteria: jsonb('criteria').$type<{
    id: string
    name: string
    description: string
    weight: number
    maxScore: number
  }[]>(),
  resources: jsonb('resources').$type<{
    links: { title: string; url: string; type: string }[]
    documents: { title: string; url: string; type: string }[]
    videos: { title: string; url: string; platform: string }[]
  }>(),
  timeline: jsonb('timeline').$type<{
    startDate: string
    endDate: string
    milestones: { title: string; date: string; description: string }[]
  }>(),
  maxTeams: integer('max_teams'),
  teamSizeMin: integer('team_size_min').default(1),
  teamSizeMax: integer('team_size_max').default(5),
  prizesAndRewards: jsonb('prizes_and_rewards').$type<{
    monetary: { place: number; amount: number; currency: string }[]
    recognition: string[]
    certificates: boolean
    mentorship: boolean
  }>(),
  participantCount: integer('participant_count').default(0),
  teamCount: integer('team_count').default(0),
  submissionCount: integer('submission_count').default(0),
  viewCount: integer('view_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Challenge Participants tábla (many-to-many)
export const challengeParticipants = pgTable('challenge_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true)
})

// Teams tábla
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  leaderId: uuid('leader_id').notNull().references(() => users.id),
  status: teamStatusEnum('status').default('forming').notNull(),
  compatibilityScore: decimal('compatibility_score', { precision: 3, scale: 2 }),
  skills: jsonb('skills').$type<string[]>(),
  preferences: jsonb('preferences').$type<{
    communicationChannels: string[]
    meetingFrequency: string
    workingHours: string[]
    timezone: string
  }>(),
  currentSize: integer('current_size').default(1),
  maxSize: integer('max_size').default(5),
  inviteCode: varchar('invite_code', { length: 32 }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Team Members tábla (many-to-many)
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).default('member').notNull(), // leader, member, mentor
  skills: jsonb('skills').$type<string[]>(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true)
})

// User Skills tábla
export const userSkills = pgTable('user_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  skillName: varchar('skill_name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }), // technical, soft, domain
  proficiencyLevel: integer('proficiency_level').notNull(), // 1-10
  yearsOfExperience: decimal('years_of_experience', { precision: 3, scale: 1 }),
  isVerified: boolean('is_verified').default(false),
  verifiedBy: uuid('verified_by').references(() => users.id),
  endorsements: integer('endorsements').default(0),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Submissions tábla
export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id),
  teamId: uuid('team_id').notNull().references(() => teams.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  summary: varchar('summary', { length: 1000 }),
  status: submissionStatusEnum('status').default('draft').notNull(),
  files: jsonb('files').$type<{
    id: string
    filename: string
    url: string
    size: number
    mimeType: string
    description?: string
  }[]>(),
  links: jsonb('links').$type<{
    title: string
    url: string
    type: 'demo' | 'repository' | 'documentation' | 'presentation' | 'other'
  }[]>(),
  tags: jsonb('tags').$type<string[]>(),
  technologies: jsonb('technologies').$type<string[]>(),
  features: jsonb('features').$type<string[]>(),
  submittedAt: timestamp('submitted_at'),
  submittedBy: uuid('submitted_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Evaluations tábla
export const evaluations = pgTable('evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
  evaluatorId: uuid('evaluator_id').notNull().references(() => users.id),
  criteriaId: uuid('criteria_id').notNull(),
  score: decimal('score', { precision: 4, scale: 2 }).notNull(),
  maxScore: decimal('max_score', { precision: 4, scale: 2 }).notNull(),
  feedback: text('feedback'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Reputation tábla
export const reputation = pgTable('reputation', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalScore: integer('total_score').default(0).notNull(),
  challengesCompleted: integer('challenges_completed').default(0),
  challengesWon: integer('challenges_won').default(0),
  teamsLed: integer('teams_led').default(0),
  contributionsCount: integer('contributions_count').default(0),
  mentorshipSessions: integer('mentorship_sessions').default(0),
  peerReviewsGiven: integer('peer_reviews_given').default(0),
  peerReviewsReceived: integer('peer_reviews_received').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
  badges: jsonb('badges').$type<{
    id: string
    name: string
    description: string
    iconUrl: string
    earnedAt: string
  }[]>(),
  achievements: jsonb('achievements').$type<{
    id: string
    name: string
    description: string
    category: string
    unlockedAt: string
  }[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Workspaces tábla (MongoDB-ben lesz a dokumentumok tartalma)
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  settings: jsonb('settings').$type<{
    permissions: {
      canRead: string[] // user IDs
      canWrite: string[]
      canAdmin: string[]
    }
    features: {
      realTimeEditing: boolean
      videoCall: boolean
      fileSharing: boolean
      taskManagement: boolean
    }
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Activity Logs tábla (tracking user actions)
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(), // join_challenge, create_team, submit_solution
  entityType: varchar('entity_type', { length: 50 }).notNull(), // challenge, team, submission
  entityId: uuid('entity_id').notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)

export const insertChallengeSchema = createInsertSchema(challenges)
export const selectChallengeSchema = createSelectSchema(challenges)

export const insertTeamSchema = createInsertSchema(teams)
export const selectTeamSchema = createSelectSchema(teams)

export const insertSubmissionSchema = createInsertSchema(submissions)
export const selectSubmissionSchema = createSelectSchema(submissions)

export const insertUserSkillSchema = createInsertSchema(userSkills)
export const selectUserSkillSchema = createSelectSchema(userSkills)

export const insertReputationSchema = createInsertSchema(reputation)
export const selectReputationSchema = createSelectSchema(reputation)

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Challenge = typeof challenges.$inferSelect
export type NewChallenge = typeof challenges.$inferInsert

export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert

export type TeamMember = typeof teamMembers.$inferSelect
export type NewTeamMember = typeof teamMembers.$inferInsert

export type UserSkill = typeof userSkills.$inferSelect
export type NewUserSkill = typeof userSkills.$inferInsert

export type Submission = typeof submissions.$inferSelect
export type NewSubmission = typeof submissions.$inferInsert

export type Evaluation = typeof evaluations.$inferSelect
export type NewEvaluation = typeof evaluations.$inferInsert

export type Reputation = typeof reputation.$inferSelect
export type NewReputation = typeof reputation.$inferInsert

export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert

export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert