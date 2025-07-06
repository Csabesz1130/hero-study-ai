import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, desc, and, or, count, avg, sql } from 'drizzle-orm'
import { db, submissions, teams, challenges, users, evaluations, teamMembers, insertSubmissionSchema } from '@/db/config'

// Validation schemas
const createSubmissionSchema = insertSubmissionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  submittedBy: true
})

const submissionQuerySchema = z.object({
  challengeId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  status: z.enum(['draft', 'submitted', 'under_review', 'evaluated', 'featured']).optional(),
  featured: z.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  sortBy: z.enum(['created', 'updated', 'rating', 'title']).default('updated'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

const evaluateSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  evaluations: z.array(z.object({
    criteriaId: z.string().uuid(),
    score: z.number().min(0).max(100),
    maxScore: z.number().min(1).max(100),
    feedback: z.string().optional()
  })),
  overallFeedback: z.string().optional(),
  isPublic: z.boolean().default(false)
})

// GET /api/copilot/submissions - List submissions with filtering and showcase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryResult = submissionQuerySchema.safeParse({
      challengeId: searchParams.get('challengeId'),
      teamId: searchParams.get('teamId'),
      status: searchParams.get('status'),
      featured: searchParams.get('featured'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.format() },
        { status: 400 }
      )
    }

    const { challengeId, teamId, status, featured, page, limit, sortBy, sortOrder } = queryResult.data
    const offset = (page - 1) * limit

    // Build query conditions
    const whereConditions = []
    
    if (challengeId) {
      whereConditions.push(eq(submissions.challengeId, challengeId))
    }
    
    if (teamId) {
      whereConditions.push(eq(submissions.teamId, teamId))
    }
    
    if (status) {
      whereConditions.push(eq(submissions.status, status))
    }
    
    if (featured !== undefined) {
      if (featured) {
        whereConditions.push(eq(submissions.status, 'featured'))
      } else {
        whereConditions.push(sql`${submissions.status} != 'featured'`)
      }
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Build sorting
    let orderBy
    switch (sortBy) {
      case 'rating':
        // TODO: Join with evaluations to sort by average rating
        orderBy = sortOrder === 'asc' ? submissions.updatedAt : desc(submissions.updatedAt)
        break
      case 'title':
        orderBy = sortOrder === 'asc' ? submissions.title : desc(submissions.title)
        break
      case 'created':
        orderBy = sortOrder === 'asc' ? submissions.createdAt : desc(submissions.createdAt)
        break
      default:
        orderBy = sortOrder === 'asc' ? submissions.updatedAt : desc(submissions.updatedAt)
    }

    // Execute query
    const submissionsList = await db
      .select({
        id: submissions.id,
        challengeId: submissions.challengeId,
        teamId: submissions.teamId,
        title: submissions.title,
        description: submissions.description,
        summary: submissions.summary,
        status: submissions.status,
        files: submissions.files,
        links: submissions.links,
        tags: submissions.tags,
        technologies: submissions.technologies,
        features: submissions.features,
        submittedAt: submissions.submittedAt,
        submittedBy: submissions.submittedBy,
        createdAt: submissions.createdAt,
        updatedAt: submissions.updatedAt,
        // Team info
        teamName: teams.name,
        teamLeaderId: teams.leaderId,
        // Challenge info
        challengeTitle: challenges.title,
        challengeDifficulty: challenges.difficulty,
        // Submitter info
        submitterName: users.name,
        submitterAvatar: users.avatar
      })
      .from(submissions)
      .leftJoin(teams, eq(submissions.teamId, teams.id))
      .leftJoin(challenges, eq(submissions.challengeId, challenges.id))
      .leftJoin(users, eq(submissions.submittedBy, users.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    // Get evaluation scores for each submission
    const submissionsWithEvaluations = await Promise.all(
      submissionsList.map(async (submission) => {
        const evaluationStats = await db
          .select({
            avgScore: avg(evaluations.score),
            maxScore: avg(evaluations.maxScore),
            count: count()
          })
          .from(evaluations)
          .where(eq(evaluations.submissionId, submission.id))
          .groupBy(evaluations.submissionId)

        const stats = evaluationStats[0] || { avgScore: null, maxScore: null, count: 0 }
        
        return {
          ...submission,
          evaluation: {
            averageScore: stats.avgScore ? Number(stats.avgScore) : null,
            maxScore: stats.maxScore ? Number(stats.maxScore) : null,
            evaluationCount: Number(stats.count),
            percentage: stats.avgScore && stats.maxScore 
              ? (Number(stats.avgScore) / Number(stats.maxScore)) * 100 
              : null
          }
        }
      })
    )

    // Get total count for pagination
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(submissions)
      .where(whereClause)

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      data: submissionsWithEvaluations,
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
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/copilot/submissions - Create new submission
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = 'user-123' // This should come from authenticated session
    const body = await request.json()

    // Validate request body
    const validationResult = createSubmissionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid submission data', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const submissionData = validationResult.data

    // Check if user is member of the team
    const [teamMember] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, submissionData.teamId),
          eq(teamMembers.userId, userId),
          eq(teamMembers.isActive, true)
        )
      )
      .limit(1)

    if (!teamMember) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 }
      )
    }

    // Check if challenge is still accepting submissions
    const [challenge] = await db
      .select({
        id: challenges.id,
        status: challenges.status,
        timeline: challenges.timeline
      })
      .from(challenges)
      .where(eq(challenges.id, submissionData.challengeId))
      .limit(1)

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    if (challenge.status !== 'active') {
      return NextResponse.json(
        { error: 'Challenge is not accepting submissions' },
        { status: 400 }
      )
    }

    // Check if team already has a submission for this challenge
    const [existingSubmission] = await db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.challengeId, submissionData.challengeId),
          eq(submissions.teamId, submissionData.teamId)
        )
      )
      .limit(1)

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'Team already has a submission for this challenge' },
        { status: 400 }
      )
    }

    const now = new Date()

    // Create submission
    const [newSubmission] = await db
      .insert(submissions)
      .values({
        ...submissionData,
        submittedBy: userId,
        submittedAt: submissionData.status === 'submitted' ? now : null,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    // Update challenge submission count
    await db
      .update(challenges)
      .set({
        submissionCount: sql`${challenges.submissionCount} + 1`,
        updatedAt: now
      })
      .where(eq(challenges.id, submissionData.challengeId))

    // Fetch complete submission data
    const [submissionWithDetails] = await db
      .select({
        id: submissions.id,
        challengeId: submissions.challengeId,
        teamId: submissions.teamId,
        title: submissions.title,
        description: submissions.description,
        summary: submissions.summary,
        status: submissions.status,
        files: submissions.files,
        links: submissions.links,
        tags: submissions.tags,
        technologies: submissions.technologies,
        features: submissions.features,
        submittedAt: submissions.submittedAt,
        submittedBy: submissions.submittedBy,
        createdAt: submissions.createdAt,
        updatedAt: submissions.updatedAt,
        teamName: teams.name,
        challengeTitle: challenges.title,
        submitterName: users.name
      })
      .from(submissions)
      .leftJoin(teams, eq(submissions.teamId, teams.id))
      .leftJoin(challenges, eq(submissions.challengeId, challenges.id))
      .leftJoin(users, eq(submissions.submittedBy, users.id))
      .where(eq(submissions.id, newSubmission.id))

    return NextResponse.json({
      message: 'Submission created successfully',
      data: submissionWithDetails
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/copilot/submissions/evaluate - Evaluate submission
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = 'user-123' // This should come from authenticated session
    const body = await request.json()

    // Check if this is an evaluation request
    if (body.action !== 'evaluate') {
      return NextResponse.json(
        { error: 'Invalid action. Use action: "evaluate"' },
        { status: 400 }
      )
    }

    // Validate evaluation data
    const validationResult = evaluateSubmissionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid evaluation data', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { submissionId, evaluations: evaluationData, overallFeedback, isPublic } = validationResult.data

    // Check if submission exists and user has permission to evaluate
    const [submission] = await db
      .select({
        id: submissions.id,
        challengeId: submissions.challengeId,
        status: submissions.status
      })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1)

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (submission.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Submission is not ready for evaluation' },
        { status: 400 }
      )
    }

    // TODO: Check if user has evaluator permissions (admin, moderator, or challenge creator)

    const now = new Date()

    // Insert evaluations
    const evaluationResults = await Promise.all(
      evaluationData.map(async (evaluationItem) => {
        const [result] = await db
          .insert(evaluations)
          .values({
            submissionId,
            evaluatorId: userId,
            criteriaId: evaluationItem.criteriaId,
            score: evaluationItem.score.toString(),
            maxScore: evaluationItem.maxScore.toString(),
            feedback: evaluationItem.feedback,
            isPublic,
            createdAt: now,
            updatedAt: now
          })
          .returning()
        return result
      })
    )

    // Update submission status
    const [updatedSubmission] = await db
      .update(submissions)
      .set({
        status: 'evaluated',
        updatedAt: now
      })
      .where(eq(submissions.id, submissionId))
      .returning()

    // Calculate if submission should be featured (high score)
    const totalScore = evaluationData.reduce((sum, item) => sum + item.score, 0)
    const maxTotalScore = evaluationData.reduce((sum, item) => sum + item.maxScore, 0)
    const percentage = (totalScore / maxTotalScore) * 100

    if (percentage >= 85) { // Feature submissions with 85%+ score
      await db
        .update(submissions)
        .set({
          status: 'featured',
          updatedAt: now
        })
        .where(eq(submissions.id, submissionId))
    }

    return NextResponse.json({
      message: 'Submission evaluated successfully',
      data: {
        submission: updatedSubmission,
        evaluations: evaluationResults,
        score: {
          total: totalScore,
          maxTotal: maxTotalScore,
          percentage: Math.round(percentage * 100) / 100
        }
      }
    })

  } catch (error) {
    console.error('Error evaluating submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}