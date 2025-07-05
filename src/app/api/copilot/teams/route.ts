import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, desc, and, or, count, inArray, notInArray } from 'drizzle-orm'
import { db, teams, users, teamMembers, userSkills, challenges, challengeParticipants, insertTeamSchema } from '@/db/config'
import crypto from 'crypto'

// Validation schemas
const createTeamSchema = insertTeamSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentSize: true,
  inviteCode: true,
  compatibilityScore: true
})

const teamFormationSchema = z.object({
  challengeId: z.string().uuid(),
  preferredTeamSize: z.number().min(2).max(10).default(4),
  requiredSkills: z.array(z.string()).optional(),
  preferredWorkingHours: z.array(z.string()).optional(),
  communicationStyle: z.enum(['async', 'sync', 'mixed']).default('mixed'),
  timezone: z.string().optional(),
  experience: z.enum(['beginner', 'intermediate', 'advanced']).optional()
})

const joinTeamSchema = z.object({
  teamId: z.string().uuid(),
  message: z.string().max(500).optional()
})

// AI-based team compatibility scoring
interface UserProfile {
  id: string
  name: string
  skills: Array<{
    skillName: string
    proficiencyLevel: number
    category: string
  }>
  preferences: {
    timezone?: string
    workingHours?: string[]
    communicationStyle?: string
  }
  reputation: {
    totalScore: number
    averageRating: number
  }
}

interface TeamCompatibility {
  skillComplementarity: number // 0-100
  timezoneAlignment: number // 0-100
  experienceBalance: number // 0-100
  communicationMatch: number // 0-100
  overallScore: number // 0-100
}

// GET /api/copilot/teams - List teams with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const challengeId = searchParams.get('challengeId')
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const offset = (page - 1) * limit

    // Build query conditions
    const whereConditions = []
    
    if (challengeId) {
      whereConditions.push(eq(teams.challengeId, challengeId))
    }
    
    if (status) {
      whereConditions.push(eq(teams.status, status as any))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Fetch teams with members and leader info
    const teamsList = await db
      .select({
        id: teams.id,
        challengeId: teams.challengeId,
        name: teams.name,
        description: teams.description,
        leaderId: teams.leaderId,
        status: teams.status,
        compatibilityScore: teams.compatibilityScore,
        skills: teams.skills,
        preferences: teams.preferences,
        currentSize: teams.currentSize,
        maxSize: teams.maxSize,
        inviteCode: teams.inviteCode,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        leaderName: users.name,
        leaderAvatar: users.avatar,
        challengeTitle: challenges.title
      })
      .from(teams)
      .leftJoin(users, eq(teams.leaderId, users.id))
      .leftJoin(challenges, eq(teams.challengeId, challenges.id))
      .where(whereClause)
      .orderBy(desc(teams.createdAt))
      .limit(limit)
      .offset(offset)

    // Get team members for each team
    const teamsWithMembers = await Promise.all(
      teamsList.map(async (team) => {
        const members = await db
          .select({
            userId: teamMembers.userId,
            role: teamMembers.role,
            skills: teamMembers.skills,
            joinedAt: teamMembers.joinedAt,
            userName: users.name,
            userAvatar: users.avatar
          })
          .from(teamMembers)
          .leftJoin(users, eq(teamMembers.userId, users.id))
          .where(
            and(
              eq(teamMembers.teamId, team.id),
              eq(teamMembers.isActive, true)
            )
          )

        return {
          ...team,
          members
        }
      })
    )

    return NextResponse.json({
      data: teamsWithMembers,
      pagination: {
        page,
        limit,
        hasNext: teamsList.length === limit,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/copilot/teams - Create new team or request AI team formation
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

    // Check if this is an AI team formation request
    if (body.requestType === 'ai-formation') {
      return handleAITeamFormation(body, userId)
    }

    // Manual team creation
    const validationResult = createTeamSchema.safeParse({
      ...body,
      leaderId: userId
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid team data', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const teamData = validationResult.data

    // Generate invite code
    const inviteCode = crypto.randomBytes(16).toString('hex')
    const now = new Date()

    // Create team
    const [newTeam] = await db
      .insert(teams)
      .values({
        ...teamData,
        inviteCode,
        currentSize: 1,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    // Add creator as team leader
    await db
      .insert(teamMembers)
      .values({
        teamId: newTeam.id,
        userId: userId,
        role: 'leader',
        joinedAt: now,
        isActive: true
      })

    // Fetch complete team data
    const [teamWithDetails] = await db
      .select({
        id: teams.id,
        challengeId: teams.challengeId,
        name: teams.name,
        description: teams.description,
        leaderId: teams.leaderId,
        status: teams.status,
        compatibilityScore: teams.compatibilityScore,
        skills: teams.skills,
        preferences: teams.preferences,
        currentSize: teams.currentSize,
        maxSize: teams.maxSize,
        inviteCode: teams.inviteCode,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        leaderName: users.name,
        leaderAvatar: users.avatar
      })
      .from(teams)
      .leftJoin(users, eq(teams.leaderId, users.id))
      .where(eq(teams.id, newTeam.id))

    return NextResponse.json({
      message: 'Team created successfully',
      data: teamWithDetails
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// AI Team Formation Handler
async function handleAITeamFormation(body: any, userId: string) {
  try {
    const validationResult = teamFormationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid team formation request', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { challengeId, preferredTeamSize, requiredSkills, preferredWorkingHours, communicationStyle, timezone, experience } = validationResult.data

    // Get challenge details and participants
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1)

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    // Get available participants (not in teams yet)
    const availableParticipants = await getAvailableParticipants(challengeId, userId)
    
    if (availableParticipants.length < preferredTeamSize - 1) {
      return NextResponse.json(
        { error: 'Not enough available participants for team formation' },
        { status: 400 }
      )
    }

    // AI Team Formation Algorithm
    const suggestedTeams = await generateTeamSuggestions(
      userId,
      availableParticipants,
      preferredTeamSize,
      requiredSkills,
      challenge.skillsRequired as string[] || []
    )

    return NextResponse.json({
      message: 'AI team suggestions generated',
      data: {
        suggestedTeams,
        availableParticipants: availableParticipants.length,
        requestedSize: preferredTeamSize
      }
    })

  } catch (error) {
    console.error('Error in AI team formation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get available participants for team formation
async function getAvailableParticipants(challengeId: string, excludeUserId: string): Promise<UserProfile[]> {
  // Get users who joined the challenge but are not in active teams
  const participants = await db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      preferences: users.preferences
    })
    .from(users)
    .innerJoin(challengeParticipants, eq(challengeParticipants.userId, users.id))
    .where(
      and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.isActive, true)
        // TODO: Add subquery to exclude users already in teams
      )
    )

  // For each participant, get their skills and reputation
  const participantsWithDetails = await Promise.all(
    participants.map(async (participant) => {
      const [skills, reputation] = await Promise.all([
        db
          .select({
            skillName: userSkills.skillName,
            proficiencyLevel: userSkills.proficiencyLevel,
            category: userSkills.category
          })
          .from(userSkills)
          .where(eq(userSkills.userId, participant.id)),
        
        // Get reputation data - simplified version
        { totalScore: 100, averageRating: 4.2 }
      ])

      return {
        id: participant.id,
        name: participant.name || '',
        skills: skills.map(skill => ({
          skillName: skill.skillName,
          proficiencyLevel: skill.proficiencyLevel,
          category: skill.category || 'general'
        })),
        preferences: participant.preferences || {},
        reputation
      } as UserProfile
    })
  )

  return participantsWithDetails
}

// AI Algorithm for team suggestions
async function generateTeamSuggestions(
  userId: string,
  availableParticipants: UserProfile[],
  teamSize: number,
  requiredSkills: string[] = [],
  challengeSkills: string[] = []
): Promise<Array<{
  members: UserProfile[]
  compatibility: TeamCompatibility
  reasoning: string[]
}>> {
  const suggestions = []
  
  // Get current user profile
  const currentUser = await getUserProfile(userId)
  if (!currentUser) {
    throw new Error('User profile not found')
  }

  // Simple greedy algorithm for team formation
  // In production, this would use more sophisticated ML algorithms
  
  for (let attempt = 0; attempt < 3 && suggestions.length < 3; attempt++) {
    const teamMembers = [currentUser]
    const remainingParticipants = [...availableParticipants]
    
    // Skill-based selection
    while (teamMembers.length < teamSize && remainingParticipants.length > 0) {
      const scores = remainingParticipants.map(participant => ({
        participant,
        score: calculateMemberCompatibility(teamMembers, participant, challengeSkills)
      }))
      
      scores.sort((a, b) => b.score - a.score)
      
      if (scores.length > 0) {
        const selected = scores[attempt % Math.min(scores.length, 3)] // Add randomness
        teamMembers.push(selected.participant)
        const index = remainingParticipants.indexOf(selected.participant)
        remainingParticipants.splice(index, 1)
      }
    }

    if (teamMembers.length >= 2) {
      const compatibility = calculateTeamCompatibility(teamMembers)
      const reasoning = generateReasoningForTeam(teamMembers, compatibility)
      
      suggestions.push({
        members: teamMembers,
        compatibility,
        reasoning
      })
    }
  }

  return suggestions.sort((a, b) => b.compatibility.overallScore - a.compatibility.overallScore)
}

// Helper functions for AI calculations
async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      preferences: users.preferences
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) return null

  const skills = await db
    .select({
      skillName: userSkills.skillName,
      proficiencyLevel: userSkills.proficiencyLevel,
      category: userSkills.category
    })
    .from(userSkills)
    .where(eq(userSkills.userId, userId))

  return {
    id: user.id,
    name: user.name || '',
    skills: skills.map(skill => ({
      skillName: skill.skillName,
      proficiencyLevel: skill.proficiencyLevel,
      category: skill.category || 'general'
    })),
    preferences: user.preferences || {},
    reputation: { totalScore: 100, averageRating: 4.2 } // Simplified
  }
}

function calculateMemberCompatibility(currentTeam: UserProfile[], candidate: UserProfile, requiredSkills: string[]): number {
  let score = 0
  
  // Skill complementarity (40%)
  const teamSkills = new Set(currentTeam.flatMap(member => member.skills.map(s => s.skillName)))
  const candidateSkills = new Set(candidate.skills.map(s => s.skillName))
  const newSkills = Array.from(candidateSkills).filter(skill => !teamSkills.has(skill))
  const skillScore = (newSkills.length / Math.max(candidateSkills.size, 1)) * 40
  
  // Required skills coverage (30%)
  const requiredSkillsScore = requiredSkills.filter(skill => candidateSkills.has(skill)).length / Math.max(requiredSkills.length, 1) * 30
  
  // Reputation (20%)
  const reputationScore = (candidate.reputation.averageRating / 5) * 20
  
  // Random factor for diversity (10%)
  const diversityScore = Math.random() * 10
  
  return skillScore + requiredSkillsScore + reputationScore + diversityScore
}

function calculateTeamCompatibility(team: UserProfile[]): TeamCompatibility {
  // Simplified compatibility calculation
  // In production, this would be much more sophisticated
  
  const skillComplementarity = calculateSkillComplementarity(team)
  const timezoneAlignment = calculateTimezoneAlignment(team)
  const experienceBalance = calculateExperienceBalance(team)
  const communicationMatch = calculateCommunicationMatch(team)
  
  const overallScore = (skillComplementarity + timezoneAlignment + experienceBalance + communicationMatch) / 4
  
  return {
    skillComplementarity,
    timezoneAlignment,
    experienceBalance,
    communicationMatch,
    overallScore
  }
}

function calculateSkillComplementarity(team: UserProfile[]): number {
  const allSkills = new Set(team.flatMap(member => member.skills.map(s => s.skillName)))
  const avgSkillsPerMember = allSkills.size / team.length
  return Math.min(100, avgSkillsPerMember * 20) // Simplified scoring
}

function calculateTimezoneAlignment(team: UserProfile[]): number {
  // Simplified: assume good alignment if similar timezones
  const timezones = team.map(member => member.preferences.timezone).filter(Boolean)
  if (timezones.length === 0) return 50 // Neutral if no timezone info
  
  const uniqueTimezones = new Set(timezones)
  return uniqueTimezones.size === 1 ? 100 : Math.max(0, 100 - (uniqueTimezones.size - 1) * 25)
}

function calculateExperienceBalance(team: UserProfile[]): number {
  // Simplified: check if team has good mix of experience levels
  const avgSkillLevels = team.map(member => {
    const skills = member.skills
    return skills.length > 0 ? skills.reduce((sum, skill) => sum + skill.proficiencyLevel, 0) / skills.length : 0
  })
  
  const variance = avgSkillLevels.length > 1 ? 
    avgSkillLevels.reduce((sum, level) => sum + Math.pow(level - avgSkillLevels.reduce((a, b) => a + b, 0) / avgSkillLevels.length, 2), 0) / avgSkillLevels.length : 0
  
  // Good balance should have some variance but not too much
  return Math.max(0, 100 - variance * 10)
}

function calculateCommunicationMatch(team: UserProfile[]): number {
  // Simplified: assume good match for now
  return 75 + Math.random() * 25
}

function generateReasoningForTeam(team: UserProfile[], compatibility: TeamCompatibility): string[] {
  const reasoning = []
  
  if (compatibility.skillComplementarity > 80) {
    reasoning.push('Excellent skill complementarity - team covers diverse technical areas')
  } else if (compatibility.skillComplementarity > 60) {
    reasoning.push('Good skill balance with some overlap for collaboration')
  }
  
  if (compatibility.timezoneAlignment > 80) {
    reasoning.push('Great timezone alignment for real-time collaboration')
  }
  
  if (compatibility.experienceBalance > 70) {
    reasoning.push('Balanced experience levels for effective mentoring')
  }
  
  if (compatibility.overallScore > 80) {
    reasoning.push('Highly recommended team formation with strong compatibility')
  } else if (compatibility.overallScore > 60) {
    reasoning.push('Good team potential with solid foundation for collaboration')
  }
  
  return reasoning
}