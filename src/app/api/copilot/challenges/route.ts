import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, desc, and, or, ilike, count } from 'drizzle-orm'
import { db, challenges, users, challengeParticipants, insertChallengeSchema } from '@/db/config'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

// Validation schemas
const createChallengeSchema = insertChallengeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  participantCount: true,
  teamCount: true,
  submissionCount: true,
  viewCount: true
})

const challengeQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['draft', 'active', 'evaluation', 'completed', 'cancelled']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  skills: z.string().optional(), // comma-separated skills
  sortBy: z.enum(['created', 'updated', 'popularity', 'deadline']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// GET /api/copilot/challenges - List challenges with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryResult = challengeQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      difficulty: searchParams.get('difficulty'),
      skills: searchParams.get('skills'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.format() },
        { status: 400 }
      )
    }

    const { page, limit, search, status, difficulty, skills, sortBy, sortOrder } = queryResult.data
    const offset = (page - 1) * limit

    // Build dynamic where conditions
    const whereConditions = []
    
    if (search) {
      whereConditions.push(
        or(
          ilike(challenges.title, `%${search}%`),
          ilike(challenges.description, `%${search}%`),
          ilike(challenges.shortDescription, `%${search}%`)
        )
      )
    }

    if (status) {
      whereConditions.push(eq(challenges.status, status))
    }

    if (difficulty) {
      whereConditions.push(eq(challenges.difficulty, difficulty))
    }

    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim())
      // Check if any of the required skills are in the challenge's skills
      whereConditions.push(
        // Using JSON operator to check if array contains any of the skills
        // This is a simplified version - in production you'd want more sophisticated JSON querying
      )
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Build sorting
    let orderBy
    switch (sortBy) {
      case 'updated':
        orderBy = sortOrder === 'asc' ? challenges.updatedAt : desc(challenges.updatedAt)
        break
      case 'popularity':
        orderBy = sortOrder === 'asc' ? challenges.participantCount : desc(challenges.participantCount)
        break
      case 'deadline':
        orderBy = sortOrder === 'asc' ? challenges.timeline : desc(challenges.timeline)
        break
      default:
        orderBy = sortOrder === 'asc' ? challenges.createdAt : desc(challenges.createdAt)
    }

    // Execute queries
    const [challengesList, totalCount] = await Promise.all([
      db
        .select({
          id: challenges.id,
          title: challenges.title,
          shortDescription: challenges.shortDescription,
          creatorId: challenges.creatorId,
          status: challenges.status,
          difficulty: challenges.difficulty,
          skillsRequired: challenges.skillsRequired,
          tags: challenges.tags,
          timeline: challenges.timeline,
          participantCount: challenges.participantCount,
          teamCount: challenges.teamCount,
          submissionCount: challenges.submissionCount,
          viewCount: challenges.viewCount,
          createdAt: challenges.createdAt,
          updatedAt: challenges.updatedAt,
          creatorName: users.name,
          creatorAvatar: users.avatar
        })
        .from(challenges)
        .leftJoin(users, eq(challenges.creatorId, users.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      
      db
        .select({ count: count() })
        .from(challenges)
        .where(whereClause)
        .then(result => result[0].count)
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      data: challengesList,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching challenges:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/copilot/challenges - Create new challenge
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = createChallengeSchema.safeParse({
      ...body,
      creatorId: session.user.id
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid challenge data', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const challengeData = validationResult.data

    // Generate unique invite code if needed
    const now = new Date()
    
    // Insert challenge
    const [newChallenge] = await db
      .insert(challenges)
      .values({
        ...challengeData,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    // Fetch the challenge with creator details
    const [challengeWithCreator] = await db
      .select({
        id: challenges.id,
        title: challenges.title,
        description: challenges.description,
        shortDescription: challenges.shortDescription,
        creatorId: challenges.creatorId,
        status: challenges.status,
        difficulty: challenges.difficulty,
        skillsRequired: challenges.skillsRequired,
        tags: challenges.tags,
        criteria: challenges.criteria,
        resources: challenges.resources,
        timeline: challenges.timeline,
        maxTeams: challenges.maxTeams,
        teamSizeMin: challenges.teamSizeMin,
        teamSizeMax: challenges.teamSizeMax,
        prizesAndRewards: challenges.prizesAndRewards,
        participantCount: challenges.participantCount,
        teamCount: challenges.teamCount,
        submissionCount: challenges.submissionCount,
        viewCount: challenges.viewCount,
        createdAt: challenges.createdAt,
        updatedAt: challenges.updatedAt,
        creatorName: users.name,
        creatorEmail: users.email,
        creatorAvatar: users.avatar
      })
      .from(challenges)
      .leftJoin(users, eq(challenges.creatorId, users.id))
      .where(eq(challenges.id, newChallenge.id))

    return NextResponse.json(
      { 
        message: 'Challenge created successfully',
        data: challengeWithCreator
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating challenge:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to check user permissions
async function checkChallengePermission(challengeId: string, userId: string, action: 'read' | 'update' | 'delete' = 'read') {
  const [challenge] = await db
    .select({
      id: challenges.id,
      creatorId: challenges.creatorId,
      status: challenges.status
    })
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1)

  if (!challenge) {
    return { allowed: false, reason: 'Challenge not found' }
  }

  // Read permission: everyone can read active challenges
  if (action === 'read') {
    if (challenge.status === 'active' || challenge.creatorId === userId) {
      return { allowed: true, challenge }
    }
    return { allowed: false, reason: 'Challenge not accessible' }
  }

  // Update/Delete permissions: only creator or admin
  if (action === 'update' || action === 'delete') {
    if (challenge.creatorId === userId) {
      return { allowed: true, challenge }
    }
    return { allowed: false, reason: 'Insufficient permissions' }
  }

  return { allowed: false, reason: 'Invalid action' }
}