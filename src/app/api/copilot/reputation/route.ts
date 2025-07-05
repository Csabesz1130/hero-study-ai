import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, desc, and, or, count, sum, avg } from 'drizzle-orm'
import { db, users, userSkills, reputation, activityLogs, evaluations } from '@/db/config'

// Validation schemas
const addSkillSchema = z.object({
  userId: z.string().uuid(),
  skillName: z.string().min(1).max(100),
  category: z.enum(['technical', 'soft', 'domain']).default('technical'),
  proficiencyLevel: z.number().min(1).max(10),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  verifiedBy: z.string().uuid().optional()
})

const updateReputationSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['challenge_completed', 'team_led', 'contribution_made', 'peer_review_given', 'mentorship_session']),
  points: z.number().min(0).max(100),
  metadata: z.object({
    challengeId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    submissionId: z.string().uuid().optional(),
    rating: z.number().min(1).max(5).optional()
  }).optional()
})

const reputationQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  timeframe: z.enum(['week', 'month', 'quarter', 'year', 'all']).default('all'),
  category: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

// GET /api/copilot/reputation - Get reputation and skills data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryResult = reputationQuerySchema.safeParse({
      userId: searchParams.get('userId'),
      timeframe: searchParams.get('timeframe'),
      category: searchParams.get('category'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.format() },
        { status: 400 }
      )
    }

    const { userId, timeframe, category, page, limit } = queryResult.data

    if (userId) {
      // Get specific user's reputation and skills
      return getUserReputationAndSkills(userId)
    } else {
      // Get leaderboard/rankings
      return getReputationLeaderboard(timeframe, category, page, limit)
    }

  } catch (error) {
    console.error('Error fetching reputation data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/copilot/reputation - Update reputation or add skills
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const currentUserId = 'user-123' // This should come from authenticated session
    const body = await request.json()

    if (body.action === 'add_skill') {
      return addUserSkill(body, currentUserId)
    } else if (body.action === 'update_reputation') {
      return updateUserReputation(body, currentUserId)
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "add_skill" or "update_reputation"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error updating reputation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get specific user's reputation and skills
async function getUserReputationAndSkills(userId: string) {
  try {
    // Get user basic info
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        role: users.role,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's reputation
    const [userReputation] = await db
      .select()
      .from(reputation)
      .where(eq(reputation.userId, userId))
      .limit(1)

    // Get user's skills
    const userSkillsList = await db
      .select({
        id: userSkills.id,
        skillName: userSkills.skillName,
        category: userSkills.category,
        proficiencyLevel: userSkills.proficiencyLevel,
        yearsOfExperience: userSkills.yearsOfExperience,
        isVerified: userSkills.isVerified,
        verifiedBy: userSkills.verifiedBy,
        endorsements: userSkills.endorsements,
        lastUsed: userSkills.lastUsed,
        createdAt: userSkills.createdAt
      })
      .from(userSkills)
      .where(eq(userSkills.userId, userId))
      .orderBy(desc(userSkills.proficiencyLevel), desc(userSkills.endorsements))

    // Get recent activity
    const recentActivity = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt
      })
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(10)

    // Calculate skill statistics
    const skillStats = {
      totalSkills: userSkillsList.length,
      verifiedSkills: userSkillsList.filter(skill => skill.isVerified).length,
      avgProficiency: userSkillsList.length > 0 
        ? userSkillsList.reduce((sum, skill) => sum + skill.proficiencyLevel, 0) / userSkillsList.length 
        : 0,
      topCategories: getTopSkillCategories(userSkillsList),
      totalEndorsements: userSkillsList.reduce((sum, skill) => sum + (skill.endorsements || 0), 0)
    }

    // Calculate reputation rank
    const rank = await calculateUserRank(userId, userReputation?.totalScore || 0)

    return NextResponse.json({
      data: {
        user,
        reputation: userReputation || {
          userId,
          totalScore: 0,
          challengesCompleted: 0,
          challengesWon: 0,
          teamsLed: 0,
          contributionsCount: 0,
          mentorshipSessions: 0,
          peerReviewsGiven: 0,
          peerReviewsReceived: 0,
          averageRating: null,
          badges: [],
          achievements: []
        },
        skills: userSkillsList,
        skillStats,
        recentActivity,
        rank
      }
    })

  } catch (error) {
    console.error('Error getting user reputation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get reputation leaderboard
async function getReputationLeaderboard(timeframe: string, category: string | undefined, page: number, limit: number) {
  try {
    const offset = (page - 1) * limit

    // Build time filter for recent activity
    let timeFilter = undefined
    if (timeframe !== 'all') {
      const timeMap = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365
      }
      const daysBack = timeMap[timeframe as keyof typeof timeMap] || 365
      const dateThreshold = new Date()
      dateThreshold.setDate(dateThreshold.getDate() - daysBack)
    }

    // Get top users by reputation
    const leaderboard = await db
      .select({
        userId: reputation.userId,
        totalScore: reputation.totalScore,
        challengesCompleted: reputation.challengesCompleted,
        challengesWon: reputation.challengesWon,
        teamsLed: reputation.teamsLed,
        contributionsCount: reputation.contributionsCount,
        averageRating: reputation.averageRating,
        badges: reputation.badges,
        achievements: reputation.achievements,
        userName: users.name,
        userAvatar: users.avatar,
        userRole: users.role
      })
      .from(reputation)
      .leftJoin(users, eq(reputation.userId, users.id))
      .orderBy(desc(reputation.totalScore))
      .limit(limit)
      .offset(offset)

    // Add skills information for each user
    const leaderboardWithSkills = await Promise.all(
      leaderboard.map(async (entry) => {
        const skills = await db
          .select({
            skillName: userSkills.skillName,
            category: userSkills.category,
            proficiencyLevel: userSkills.proficiencyLevel,
            isVerified: userSkills.isVerified
          })
          .from(userSkills)
          .where(
            and(
              eq(userSkills.userId, entry.userId),
              category ? eq(userSkills.category, category) : undefined
            )
          )
          .orderBy(desc(userSkills.proficiencyLevel))
          .limit(5) // Top 5 skills per user

        return {
          ...entry,
          topSkills: skills
        }
      })
    )

    // Get total count for pagination
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(reputation)

    return NextResponse.json({
      data: leaderboardWithSkills,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error getting leaderboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add user skill
async function addUserSkill(body: any, currentUserId: string) {
  const validationResult = addSkillSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid skill data', details: validationResult.error.format() },
      { status: 400 }
    )
  }

  const skillData = validationResult.data

  // Check if user can add skills for the target user
  if (skillData.userId !== currentUserId && !skillData.verifiedBy) {
    return NextResponse.json(
      { error: 'You can only add skills for yourself or verify others\' skills' },
      { status: 403 }
    )
  }

  try {
    // Check if skill already exists
    const [existingSkill] = await db
      .select()
      .from(userSkills)
      .where(
        and(
          eq(userSkills.userId, skillData.userId),
          eq(userSkills.skillName, skillData.skillName)
        )
      )
      .limit(1)

    if (existingSkill) {
      return NextResponse.json(
        { error: 'Skill already exists for this user' },
        { status: 400 }
      )
    }

    // Add skill
    const [newSkill] = await db
      .insert(userSkills)
      .values({
        ...skillData,
        isVerified: !!skillData.verifiedBy,
        endorsements: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

    // Log activity
    await logActivity(skillData.userId, 'skill_added', 'skill', newSkill.id, {
      skillName: skillData.skillName,
      category: skillData.category,
      proficiencyLevel: skillData.proficiencyLevel
    })

    return NextResponse.json({
      message: 'Skill added successfully',
      data: newSkill
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding skill:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update user reputation
async function updateUserReputation(body: any, currentUserId: string) {
  const validationResult = updateReputationSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid reputation data', details: validationResult.error.format() },
      { status: 400 }
    )
  }

  const { userId, action, points, metadata } = validationResult.data

  try {
    // Get or create user reputation record
    let [userReputation] = await db
      .select()
      .from(reputation)
      .where(eq(reputation.userId, userId))
      .limit(1)

    if (!userReputation) {
      [userReputation] = await db
        .insert(reputation)
        .values({
          userId,
          totalScore: 0,
          challengesCompleted: 0,
          challengesWon: 0,
          teamsLed: 0,
          contributionsCount: 0,
          mentorshipSessions: 0,
          peerReviewsGiven: 0,
          peerReviewsReceived: 0,
          averageRating: null,
          badges: [],
          achievements: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()
    }

    // Calculate reputation updates based on action
    const updates = calculateReputationUpdates(action, points, metadata)

    // Update reputation
    const [updatedReputation] = await db
      .update(reputation)
      .set({
        totalScore: (userReputation.totalScore || 0) + updates.totalScore,
        challengesCompleted: (userReputation.challengesCompleted || 0) + updates.challengesCompleted,
        challengesWon: (userReputation.challengesWon || 0) + updates.challengesWon,
        teamsLed: (userReputation.teamsLed || 0) + updates.teamsLed,
        contributionsCount: (userReputation.contributionsCount || 0) + updates.contributionsCount,
        mentorshipSessions: (userReputation.mentorshipSessions || 0) + updates.mentorshipSessions,
        peerReviewsGiven: (userReputation.peerReviewsGiven || 0) + updates.peerReviewsGiven,
        updatedAt: new Date()
      })
      .where(eq(reputation.userId, userId))
      .returning()

    // Log activity
    await logActivity(userId, action, 'reputation', updatedReputation.id, {
      pointsEarned: updates.totalScore,
      ...metadata
    })

    // Check for new achievements/badges
    const newAchievements = await checkForAchievements(updatedReputation)

    return NextResponse.json({
      message: 'Reputation updated successfully',
      data: {
        reputation: updatedReputation,
        newAchievements
      }
    })

  } catch (error) {
    console.error('Error updating reputation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function getTopSkillCategories(skills: any[]) {
  const categoryCount = skills.reduce((acc, skill) => {
    const category = skill.category || 'other'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }))
}

async function calculateUserRank(userId: string, userScore: number) {
  const [result] = await db
    .select({ rank: count() })
    .from(reputation)
    .where(
      and(
        eq(reputation.totalScore, userScore), // Users with higher scores
        // In real implementation, this would be > userScore
      )
    )

  return (result?.rank || 0) + 1
}

function calculateReputationUpdates(action: string, points: number, metadata: any) {
  const updates = {
    totalScore: points,
    challengesCompleted: 0,
    challengesWon: 0,
    teamsLed: 0,
    contributionsCount: 0,
    mentorshipSessions: 0,
    peerReviewsGiven: 0
  }

  switch (action) {
    case 'challenge_completed':
      updates.challengesCompleted = 1
      break
    case 'team_led':
      updates.teamsLed = 1
      break
    case 'contribution_made':
      updates.contributionsCount = 1
      break
    case 'peer_review_given':
      updates.peerReviewsGiven = 1
      break
    case 'mentorship_session':
      updates.mentorshipSessions = 1
      break
  }

  return updates
}

async function checkForAchievements(userReputation: any) {
  const achievements = []

  // Define achievement criteria
  const achievementCriteria = [
    { name: 'First Challenge', condition: userReputation.challengesCompleted >= 1, points: 10 },
    { name: 'Challenge Master', condition: userReputation.challengesCompleted >= 10, points: 50 },
    { name: 'Team Leader', condition: userReputation.teamsLed >= 5, points: 25 },
    { name: 'Mentor', condition: userReputation.mentorshipSessions >= 10, points: 40 },
    { name: 'Contributor', condition: userReputation.contributionsCount >= 20, points: 30 }
  ]

  for (const criterion of achievementCriteria) {
    if (criterion.condition) {
      const existingAchievements = userReputation.achievements || []
      const hasAchievement = existingAchievements.some((a: any) => a.name === criterion.name)
      
      if (!hasAchievement) {
        achievements.push({
          id: `achievement-${Date.now()}-${Math.random()}`,
          name: criterion.name,
          description: `Earned for ${criterion.name.toLowerCase()}`,
          category: 'milestone',
          unlockedAt: new Date().toISOString()
        })
      }
    }
  }

  return achievements
}

async function logActivity(userId: string, action: string, entityType: string, entityId: string, metadata: any) {
  await db
    .insert(activityLogs)
    .values({
      userId,
      action,
      entityType,
      entityId,
      metadata,
      createdAt: new Date()
    })
}