import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db, users, activityLogs, userRoleEnum } from '@/db/config'
import { hash, compare } from 'bcryptjs'
import { cookies } from 'next/headers'

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'

// Type definitions
export interface JWTPayload {
  userId: string
  email: string
  name: string
  role: 'user' | 'moderator' | 'admin' | 'mentor'
  permissions: string[]
  iat: number
  exp: number
}

export interface RefreshTokenPayload {
  userId: string
  tokenVersion: number
  type: 'refresh'
  iat: number
  exp: number
}

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'user' | 'moderator' | 'admin' | 'mentor'
  permissions: string[]
  isVerified: boolean
  lastActive: Date | null
}

// Permission definitions
export const PERMISSIONS = {
  // Challenge permissions
  CREATE_CHALLENGE: 'create_challenge',
  EDIT_CHALLENGE: 'edit_challenge',
  DELETE_CHALLENGE: 'delete_challenge',
  EVALUATE_SUBMISSION: 'evaluate_submission',
  FEATURE_SUBMISSION: 'feature_submission',
  
  // Team permissions
  CREATE_TEAM: 'create_team',
  JOIN_TEAM: 'join_team',
  LEAVE_TEAM: 'leave_team',
  INVITE_TEAM_MEMBER: 'invite_team_member',
  REMOVE_TEAM_MEMBER: 'remove_team_member',
  
  // Workspace permissions
  CREATE_WORKSPACE: 'create_workspace',
  ACCESS_WORKSPACE: 'access_workspace',
  MANAGE_WORKSPACE: 'manage_workspace',
  
  // Submission permissions
  CREATE_SUBMISSION: 'create_submission',
  EDIT_SUBMISSION: 'edit_submission',
  DELETE_SUBMISSION: 'delete_submission',
  VIEW_SUBMISSION: 'view_submission',
  
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  MODERATE_CONTENT: 'moderate_content',
  VIEW_ANALYTICS: 'view_analytics',
  SYSTEM_SETTINGS: 'system_settings'
} as const

// Role-based permissions
const USER_PERMISSIONS = [
  PERMISSIONS.CREATE_CHALLENGE,
  PERMISSIONS.CREATE_TEAM,
  PERMISSIONS.JOIN_TEAM,
  PERMISSIONS.LEAVE_TEAM,
  PERMISSIONS.INVITE_TEAM_MEMBER,
  PERMISSIONS.CREATE_WORKSPACE,
  PERMISSIONS.ACCESS_WORKSPACE,
  PERMISSIONS.CREATE_SUBMISSION,
  PERMISSIONS.EDIT_SUBMISSION,
  PERMISSIONS.VIEW_SUBMISSION
]

const ROLE_PERMISSIONS: Record<string, string[]> = {
  user: USER_PERMISSIONS,
  moderator: [
    ...USER_PERMISSIONS,
    PERMISSIONS.EDIT_CHALLENGE,
    PERMISSIONS.DELETE_CHALLENGE,
    PERMISSIONS.EVALUATE_SUBMISSION,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.REMOVE_TEAM_MEMBER,
    PERMISSIONS.MANAGE_WORKSPACE,
    PERMISSIONS.DELETE_SUBMISSION
  ],
  admin: [
    ...USER_PERMISSIONS,
    PERMISSIONS.EDIT_CHALLENGE,
    PERMISSIONS.DELETE_CHALLENGE,
    PERMISSIONS.EVALUATE_SUBMISSION,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.REMOVE_TEAM_MEMBER,
    PERMISSIONS.MANAGE_WORKSPACE,
    PERMISSIONS.DELETE_SUBMISSION,
    PERMISSIONS.FEATURE_SUBMISSION,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.SYSTEM_SETTINGS
  ],
  mentor: [
    ...USER_PERMISSIONS,
    PERMISSIONS.EVALUATE_SUBMISSION,
    PERMISSIONS.MODERATE_CONTENT
  ]
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false)
})

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().optional(),
  location: z.string().optional()
})

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})

// JWT utility functions
export function generateTokens(user: AuthUser): { accessToken: string; refreshToken: string } {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions
  }

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'hero-study-ai',
    audience: 'hero-study-ai-client'
  })

  const refreshTokenPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    tokenVersion: 1, // In production, this should be stored in database
    type: 'refresh'
  }

  const refreshToken = jwt.sign(refreshTokenPayload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'hero-study-ai',
    audience: 'hero-study-ai-client'
  })

  return { accessToken, refreshToken }
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'hero-study-ai',
      audience: 'hero-study-ai-client'
    }) as JWTPayload

    return payload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'hero-study-ai',
      audience: 'hero-study-ai-client'
    }) as RefreshTokenPayload

    if (payload.type !== 'refresh') {
      return null
    }

    return payload
  } catch (error) {
    console.error('Refresh token verification failed:', error)
    return null
  }
}

// Authentication middleware
export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Try to get token from Authorization header
    const authHeader = request.headers.get('authorization')
    let token = authHeader?.replace('Bearer ', '')

    // If no auth header, try to get from cookies
    if (!token) {
      const cookieStore = cookies()
      token = cookieStore.get('accessToken')?.value
    }

    if (!token) {
      return null
    }

    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    // Get fresh user data from database
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        role: users.role,
        isVerified: users.isVerified,
        lastActive: users.lastActive
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1)

    if (!user) {
      return null
    }

    // Update last active timestamp
    await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, user.id))

    return {
      ...user,
      avatar: user.avatar || undefined,
      isVerified: user.isVerified ?? false,
      permissions: getRolePermissions(user.role)
    }
  } catch (error) {
    console.error('Authentication failed:', error)
    return null
  }
}

// Permission checking
export function getRolePermissions(role: 'user' | 'moderator' | 'admin' | 'mentor'): string[] {
  return ROLE_PERMISSIONS[role] || []
}

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false
  return user.permissions.includes(permission)
}

export function requirePermission(permission: string) {
  return async (request: NextRequest) => {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!hasPermission(user, permission)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return user
  }
}

// Auth API handlers
export async function handleLogin(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = loginSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid login data', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { email, password, rememberMe } = validationResult.data

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // For demo purposes, we'll skip password verification
    // In production, you would verify the hashed password
    // const isPasswordValid = await compare(password, user.hashedPassword)
    const isPasswordValid = true // Demo mode

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create auth user object
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || undefined,
      role: user.role,
      permissions: getRolePermissions(user.role),
      isVerified: user.isVerified ?? false,
      lastActive: user.lastActive
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(authUser)

    // Log activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: 'login',
      entityType: 'user',
      entityId: user.id,
      metadata: {
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        rememberMe
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
      createdAt: new Date()
    })

    // Update last active
    await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, user.id))

    // Set cookies
    const response = NextResponse.json({
      message: 'Login successful',
      user: authUser,
      tokens: {
        accessToken,
        refreshToken
      }
    })

    // Set HTTP-only cookies
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 days or 1 day
    })

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function handleRegister(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = registerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid registration data', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { email, password, name, bio, location } = validationResult.data

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password (in production)
    // const hashedPassword = await hash(password, 12)

    const now = new Date()

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        bio,
        location,
        role: 'user',
        isVerified: false,
        preferences: {
          timezone: 'UTC',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            challenges: true,
            teams: true
          },
          collaboration: {
            preferredTeamSize: 3,
            workingHours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
            communicationStyle: 'collaborative'
          }
        },
        createdAt: now,
        updatedAt: now
      })
      .returning()

    // Create auth user object
    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar: newUser.avatar || undefined,
      role: newUser.role,
      permissions: getRolePermissions(newUser.role),
      isVerified: newUser.isVerified ?? false,
      lastActive: newUser.lastActive
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(authUser)

    // Log activity
    await db.insert(activityLogs).values({
      userId: newUser.id,
      action: 'register',
      entityType: 'user',
      entityId: newUser.id,
      metadata: {
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
      createdAt: now
    })

    // Set cookies
    const response = NextResponse.json({
      message: 'Registration successful',
      user: authUser,
      tokens: {
        accessToken,
        refreshToken
      }
    }, { status: 201 })

    // Set HTTP-only cookies
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 1 day
    })

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    return response

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function handleRefreshToken(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = refreshTokenSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid refresh token data' },
        { status: 400 }
      )
    }

    const { refreshToken } = validationResult.data

    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Get fresh user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Create auth user object
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || undefined,
      role: user.role,
      permissions: getRolePermissions(user.role),
      isVerified: user.isVerified ?? false,
      lastActive: user.lastActive
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(authUser)

    // Update last active
    await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, user.id))

    return NextResponse.json({
      message: 'Token refreshed successfully',
      user: authUser,
      tokens: {
        accessToken,
        refreshToken: newRefreshToken
      }
    })

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function handleLogout(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (user) {
      // Log activity
      await db.insert(activityLogs).values({
        userId: user.id,
        action: 'logout',
        entityType: 'user',
        entityId: user.id,
        metadata: {
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent')
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        createdAt: new Date()
      })
    }

    // Clear cookies
    const response = NextResponse.json({
      message: 'Logout successful'
    })

    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    })

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    })

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get current user
export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  return await authenticateRequest(request)
}