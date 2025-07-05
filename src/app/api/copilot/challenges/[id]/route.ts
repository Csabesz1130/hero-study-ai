import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db, challenges, users, challengeParticipants, insertChallengeSchema } from '@/db/config'

// Validation schemas
const updateChallengeSchema = insertChallengeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  participantCount: true,
  teamCount: true,
  submissionCount: true,
  viewCount: true
}).partial()

const challengeParamsSchema = z.object({
  id: z.string().uuid('Invalid challenge ID')
})

// GET /api/copilot/challenges/[id] - Get single challenge
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate parameters
    const paramsResult = challengeParamsSchema.safeParse(params)
    if (!paramsResult.success) {
      return NextResponse.json(
        { error: 'Invalid challenge ID', details: paramsResult.error.format() },
        { status: 400 }
      )
    }

    const { id } = paramsResult.data

    // Fetch challenge with creator details and participants
    const [challenge] = await db
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
      .where(eq(challenges.id, id))
      .limit(1)

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await db
      .update(challenges)
      .set({ 
        viewCount: (challenge.viewCount || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(challenges.id, id))

    // Get participants list
    const participants = await db
      .select({
        userId: users.id,
        userName: users.name,
        userAvatar: users.avatar,
        userEmail: users.email,
        joinedAt: challengeParticipants.joinedAt,
        isActive: challengeParticipants.isActive
      })
      .from(challengeParticipants)
      .leftJoin(users, eq(challengeParticipants.userId, users.id))
      .where(
        and(
          eq(challengeParticipants.challengeId, id),
          eq(challengeParticipants.isActive, true)
        )
      )

    return NextResponse.json({
      data: {
        ...challenge,
        participants
      }
    })

  } catch (error) {
    console.error('Error fetching challenge:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/copilot/challenges/[id] - Update challenge
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate parameters
    const paramsResult = challengeParamsSchema.safeParse(params)
    if (!paramsResult.success) {
      return NextResponse.json(
        { error: 'Invalid challenge ID', details: paramsResult.error.format() },
        { status: 400 }
      )
    }

    const { id } = paramsResult.data

    // Simple authentication check - in production use proper session management
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = 'user-123' // This should come from authenticated session

    // Check permissions
    const permission = await checkChallengePermission(id, userId, 'update')
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason },
        { status: permission.reason === 'Challenge not found' ? 404 : 403 }
      )
    }

    const body = await request.json()

    // Validate request body
    const validationResult = updateChallengeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid challenge data', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Update challenge
    const [updatedChallenge] = await db
      .update(challenges)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(challenges.id, id))
      .returning()

    // Fetch updated challenge with creator details
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
      .where(eq(challenges.id, id))

    return NextResponse.json({
      message: 'Challenge updated successfully',
      data: challengeWithCreator
    })

  } catch (error) {
    console.error('Error updating challenge:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/copilot/challenges/[id] - Delete challenge
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate parameters
    const paramsResult = challengeParamsSchema.safeParse(params)
    if (!paramsResult.success) {
      return NextResponse.json(
        { error: 'Invalid challenge ID', details: paramsResult.error.format() },
        { status: 400 }
      )
    }

    const { id } = paramsResult.data

    // Simple authentication check - in production use proper session management
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = 'user-123' // This should come from authenticated session

    // Check permissions
    const permission = await checkChallengePermission(id, userId, 'delete')
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason },
        { status: permission.reason === 'Challenge not found' ? 404 : 403 }
      )
    }

    // Check if challenge can be deleted (no active teams/submissions)
    const challenge = permission.challenge
    if (challenge && ((challenge.teamCount ?? 0) > 0 || (challenge.submissionCount ?? 0) > 0)) {
      return NextResponse.json(
        { error: 'Cannot delete challenge with active teams or submissions' },
        { status: 400 }
      )
    }

    // Delete challenge (this will cascade delete participants)
    await db
      .delete(challenges)
      .where(eq(challenges.id, id))

    return NextResponse.json({
      message: 'Challenge deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting challenge:', error)
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
      status: challenges.status,
      teamCount: challenges.teamCount,
      submissionCount: challenges.submissionCount
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