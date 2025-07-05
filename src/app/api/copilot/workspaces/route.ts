import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, desc, and, or } from 'drizzle-orm'
import { db, workspaces, teams, users, teamMembers } from '@/db/config'

// Validation schemas
const createWorkspaceSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  settings: z.object({
    permissions: z.object({
      canRead: z.array(z.string()).optional(),
      canWrite: z.array(z.string()).optional(),
      canAdmin: z.array(z.string()).optional()
    }).optional(),
    features: z.object({
      realTimeEditing: z.boolean().optional(),
      videoCall: z.boolean().optional(),
      fileSharing: z.boolean().optional(),
      taskManagement: z.boolean().optional()
    }).optional()
  }).optional()
})

const workspaceQuerySchema = z.object({
  teamId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10)
})

// GET /api/copilot/workspaces - List workspaces
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = 'user-123' // This should come from authenticated session
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryResult = workspaceQuerySchema.safeParse({
      teamId: searchParams.get('teamId'),
      isActive: searchParams.get('isActive'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.format() },
        { status: 400 }
      )
    }

    const { teamId, isActive, page, limit } = queryResult.data
    const offset = (page - 1) * limit

    // Build query conditions
    const whereConditions = []
    
    if (teamId) {
      whereConditions.push(eq(workspaces.teamId, teamId))
    }
    
    if (isActive !== undefined) {
      whereConditions.push(eq(workspaces.isActive, isActive))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Fetch workspaces with team and member details
    const workspacesList = await db
      .select({
        id: workspaces.id,
        teamId: workspaces.teamId,
        name: workspaces.name,
        description: workspaces.description,
        isActive: workspaces.isActive,
        settings: workspaces.settings,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        teamName: teams.name,
        teamLeaderId: teams.leaderId
      })
      .from(workspaces)
      .leftJoin(teams, eq(workspaces.teamId, teams.id))
      .where(whereClause)
      .orderBy(desc(workspaces.updatedAt))
      .limit(limit)
      .offset(offset)

    // Check user permissions for each workspace
    const accessibleWorkspaces = []
    for (const workspace of workspacesList) {
      const hasAccess = await checkWorkspaceAccess(workspace.id, userId)
      if (hasAccess) {
        accessibleWorkspaces.push(workspace)
      }
    }

    return NextResponse.json({
      data: accessibleWorkspaces,
      pagination: {
        page,
        limit,
        hasNext: workspacesList.length === limit,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/copilot/workspaces - Create new workspace
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
    const validationResult = createWorkspaceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid workspace data', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const workspaceData = validationResult.data

    // Check if user has permission to create workspace for this team
    const hasTeamAccess = await checkTeamMembership(workspaceData.teamId, userId)
    if (!hasTeamAccess) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 }
      )
    }

    // Set default settings with proper typing
    const defaultSettings = {
      permissions: {
        canRead: workspaceData.settings?.permissions?.canRead || [],
        canWrite: workspaceData.settings?.permissions?.canWrite || [],
        canAdmin: [userId]
      },
      features: {
        realTimeEditing: workspaceData.settings?.features?.realTimeEditing ?? true,
        videoCall: workspaceData.settings?.features?.videoCall ?? true,
        fileSharing: workspaceData.settings?.features?.fileSharing ?? true,
        taskManagement: workspaceData.settings?.features?.taskManagement ?? true
      }
    }

    const now = new Date()

    // Create workspace
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        teamId: workspaceData.teamId,
        name: workspaceData.name,
        description: workspaceData.description,
        isActive: workspaceData.isActive,
        settings: defaultSettings,
        createdAt: now,
        updatedAt: now
      })
      .returning()

    // Fetch workspace with team details
    const [workspaceWithDetails] = await db
      .select({
        id: workspaces.id,
        teamId: workspaces.teamId,
        name: workspaces.name,
        description: workspaces.description,
        isActive: workspaces.isActive,
        settings: workspaces.settings,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        teamName: teams.name
      })
      .from(workspaces)
      .leftJoin(teams, eq(workspaces.teamId, teams.id))
      .where(eq(workspaces.id, newWorkspace.id))

    return NextResponse.json({
      message: 'Workspace created successfully',
      data: workspaceWithDetails
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to check workspace access
async function checkWorkspaceAccess(workspaceId: string, userId: string): Promise<boolean> {
  try {
    const [workspace] = await db
      .select({
        id: workspaces.id,
        teamId: workspaces.teamId,
        settings: workspaces.settings
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1)

    if (!workspace) return false

    // Check team membership
    const isTeamMember = await checkTeamMembership(workspace.teamId, userId)
    if (!isTeamMember) return false

    // Check workspace-specific permissions
    const settings = workspace.settings as any
    if (settings?.permissions) {
      const { canRead, canWrite, canAdmin } = settings.permissions
      if (canAdmin?.includes(userId) || canWrite?.includes(userId) || canRead?.includes(userId)) {
        return true
      }
    }

    // Default: team members have read access
    return true

  } catch (error) {
    console.error('Error checking workspace access:', error)
    return false
  }
}

// Helper function to check team membership
async function checkTeamMembership(teamId: string, userId: string): Promise<boolean> {
  try {
    const memberCheck = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId),
          eq(teamMembers.isActive, true)
        )
      )
      .limit(1)

    return memberCheck.length > 0

  } catch (error) {
    console.error('Error checking team membership:', error)
    return false
  }
}