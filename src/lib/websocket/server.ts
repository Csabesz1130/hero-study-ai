import { Server } from 'socket.io'
import { createServer } from 'http'
import { NextApiRequest } from 'next'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db, workspaces, teams, teamMembers, users } from '@/db/config'

// Types for WebSocket events
interface ServerToClientEvents {
  // Workspace events
  'workspace:user-joined': (data: { userId: string; userName: string; avatar?: string }) => void
  'workspace:user-left': (data: { userId: string }) => void
  'workspace:user-typing': (data: { userId: string; userName: string }) => void
  'workspace:user-stopped-typing': (data: { userId: string }) => void
  
  // Document collaboration
  'document:operation': (data: { 
    documentId: string
    operation: any // OT (Operational Transform) operations
    userId: string
    timestamp: number
  }) => void
  'document:cursor': (data: {
    documentId: string
    userId: string
    userName: string
    position: { line: number; column: number }
    selection?: { start: { line: number; column: number }, end: { line: number; column: number } }
  }) => void
  'document:saved': (data: { documentId: string; version: number }) => void
  
  // Chat messages
  'chat:message': (data: {
    id: string
    userId: string
    userName: string
    avatar?: string
    message: string
    timestamp: number
    type: 'text' | 'code' | 'file' | 'system'
  }) => void
  'chat:typing': (data: { userId: string; userName: string }) => void
  'chat:stop-typing': (data: { userId: string }) => void
  
  // Video/Audio calls
  'call:started': (data: { callId: string; initiatorId: string; initiatorName: string }) => void
  'call:ended': (data: { callId: string }) => void
  'call:user-joined': (data: { callId: string; userId: string; userName: string }) => void
  'call:user-left': (data: { callId: string; userId: string }) => void
  'call:offer': (data: { callId: string; from: string; to: string; offer: any }) => void
  'call:answer': (data: { callId: string; from: string; to: string; answer: any }) => void
  'call:ice-candidate': (data: { callId: string; from: string; to: string; candidate: any }) => void
  
  // Task management
  'task:created': (data: { taskId: string; title: string; assignee?: string; createdBy: string }) => void
  'task:updated': (data: { taskId: string; updates: any; updatedBy: string }) => void
  'task:completed': (data: { taskId: string; completedBy: string }) => void
  'task:deleted': (data: { taskId: string; deletedBy: string }) => void
  
  // File sharing
  'file:uploaded': (data: { fileId: string; fileName: string; fileSize: number; uploadedBy: string }) => void
  'file:deleted': (data: { fileId: string; deletedBy: string }) => void
  
  // System events
  'error': (data: { message: string; code?: string }) => void
  'notification': (data: { type: 'info' | 'warning' | 'error' | 'success'; message: string }) => void
}

interface ClientToServerEvents {
  // Workspace events
  'workspace:join': (data: { workspaceId: string; userId: string }) => void
  'workspace:leave': (data: { workspaceId: string; userId: string }) => void
  'workspace:typing': (data: { workspaceId: string; userId: string }) => void
  'workspace:stop-typing': (data: { workspaceId: string; userId: string }) => void
  
  // Document collaboration
  'document:operation': (data: {
    workspaceId: string
    documentId: string
    operation: any
    userId: string
  }) => void
  'document:cursor': (data: {
    workspaceId: string
    documentId: string
    userId: string
    position: { line: number; column: number }
    selection?: { start: { line: number; column: number }, end: { line: number; column: number } }
  }) => void
  'document:save': (data: { workspaceId: string; documentId: string; content: string }) => void
  
  // Chat
  'chat:send': (data: {
    workspaceId: string
    message: string
    type: 'text' | 'code' | 'file'
    userId: string
  }) => void
  'chat:typing': (data: { workspaceId: string; userId: string }) => void
  'chat:stop-typing': (data: { workspaceId: string; userId: string }) => void
  
  // Video/Audio calls
  'call:start': (data: { workspaceId: string; userId: string; type: 'video' | 'audio' }) => void
  'call:end': (data: { workspaceId: string; callId: string; userId: string }) => void
  'call:join': (data: { workspaceId: string; callId: string; userId: string }) => void
  'call:leave': (data: { workspaceId: string; callId: string; userId: string }) => void
  'call:offer': (data: { workspaceId: string; callId: string; from: string; to: string; offer: any }) => void
  'call:answer': (data: { workspaceId: string; callId: string; from: string; to: string; answer: any }) => void
  'call:ice-candidate': (data: { workspaceId: string; callId: string; from: string; to: string; candidate: any }) => void
  
  // Task management
  'task:create': (data: { workspaceId: string; title: string; description?: string; assignee?: string; userId: string }) => void
  'task:update': (data: { workspaceId: string; taskId: string; updates: any; userId: string }) => void
  'task:complete': (data: { workspaceId: string; taskId: string; userId: string }) => void
  'task:delete': (data: { workspaceId: string; taskId: string; userId: string }) => void
  
  // File sharing
  'file:upload': (data: { workspaceId: string; fileName: string; fileSize: number; fileType: string; userId: string }) => void
  'file:delete': (data: { workspaceId: string; fileId: string; userId: string }) => void
}

// Socket data interface
interface SocketData {
  userId: string
  userName: string
  avatar?: string
  workspaceId?: string
}

// Validation schemas
const workspaceEventSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid()
})

const documentOperationSchema = z.object({
  workspaceId: z.string().uuid(),
  documentId: z.string().uuid(),
  operation: z.any(),
  userId: z.string().uuid()
})

const chatMessageSchema = z.object({
  workspaceId: z.string().uuid(),
  message: z.string().min(1).max(1000),
  type: z.enum(['text', 'code', 'file']),
  userId: z.string().uuid()
})

// WebSocket server class
export class CollaborationWebSocketServer {
  private io: Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>
  private activeUsers: Map<string, Set<string>> = new Map() // workspaceId -> Set of userIds
  private typingUsers: Map<string, Set<string>> = new Map() // workspaceId -> Set of userIds
  private activeCalls: Map<string, { callId: string; participants: Set<string> }> = new Map()

  constructor(server: any) {
    this.io = new Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`)

      // Authentication middleware
      socket.use(async ([event, ...args], next) => {
        try {
          // TODO: Implement JWT token verification
          const userId = socket.handshake.auth.userId
          const userName = socket.handshake.auth.userName
          
          if (!userId || !userName) {
            return next(new Error('Authentication required'))
          }

          socket.data = {
            userId,
            userName,
            avatar: socket.handshake.auth.avatar
          }
          
          next()
        } catch (error) {
          next(new Error('Authentication failed'))
        }
      })

      // Workspace events
      socket.on('workspace:join', async (data) => {
        try {
          const validated = workspaceEventSchema.parse(data)
          const canJoin = await this.verifyWorkspaceAccess(validated.workspaceId, validated.userId)
          
          if (!canJoin) {
            socket.emit('error', { message: 'Access denied to workspace' })
            return
          }

          // Join workspace room
          socket.join(validated.workspaceId)
          socket.data.workspaceId = validated.workspaceId

          // Track active users
          if (!this.activeUsers.has(validated.workspaceId)) {
            this.activeUsers.set(validated.workspaceId, new Set())
          }
          this.activeUsers.get(validated.workspaceId)!.add(validated.userId)

          // Notify others
          socket.to(validated.workspaceId).emit('workspace:user-joined', {
            userId: validated.userId,
            userName: socket.data.userName,
            avatar: socket.data.avatar
          })

          console.log(`User ${validated.userId} joined workspace ${validated.workspaceId}`)
        } catch (error) {
          socket.emit('error', { message: 'Invalid workspace join request' })
        }
      })

      socket.on('workspace:leave', async (data) => {
        try {
          const validated = workspaceEventSchema.parse(data)
          
          socket.leave(validated.workspaceId)
          
          // Remove from active users
          this.activeUsers.get(validated.workspaceId)?.delete(validated.userId)
          this.typingUsers.get(validated.workspaceId)?.delete(validated.userId)

          // Notify others
          socket.to(validated.workspaceId).emit('workspace:user-left', {
            userId: validated.userId
          })

          console.log(`User ${validated.userId} left workspace ${validated.workspaceId}`)
        } catch (error) {
          socket.emit('error', { message: 'Invalid workspace leave request' })
        }
      })

      // Document collaboration
      socket.on('document:operation', async (data) => {
        try {
          const validated = documentOperationSchema.parse(data)
          
          // Broadcast operation to all other users in workspace
          socket.to(validated.workspaceId).emit('document:operation', {
            documentId: validated.documentId,
            operation: validated.operation,
            userId: validated.userId,
            timestamp: Date.now()
          })

          console.log(`Document operation from ${validated.userId} in workspace ${validated.workspaceId}`)
        } catch (error) {
          socket.emit('error', { message: 'Invalid document operation' })
        }
      })

      socket.on('document:cursor', async (data) => {
        try {
          const validated = z.object({
            workspaceId: z.string().uuid(),
            documentId: z.string().uuid(),
            userId: z.string().uuid(),
            position: z.object({
              line: z.number(),
              column: z.number()
            }),
            selection: z.object({
              start: z.object({ line: z.number(), column: z.number() }),
              end: z.object({ line: z.number(), column: z.number() })
            }).optional()
          }).parse(data)
          
          // Broadcast cursor position to others
          socket.to(validated.workspaceId).emit('document:cursor', {
            documentId: validated.documentId,
            userId: validated.userId,
            userName: socket.data.userName,
            position: validated.position,
            selection: validated.selection
          })
        } catch (error) {
          socket.emit('error', { message: 'Invalid cursor position' })
        }
      })

      // Chat functionality
      socket.on('chat:send', async (data) => {
        try {
          const validated = chatMessageSchema.parse(data)
          
          const messageData = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: validated.userId,
            userName: socket.data.userName,
            avatar: socket.data.avatar,
            message: validated.message,
            timestamp: Date.now(),
            type: validated.type
          }
          
          // Broadcast to all users in workspace
          this.io.to(validated.workspaceId).emit('chat:message', messageData)

          console.log(`Chat message from ${validated.userId} in workspace ${validated.workspaceId}`)
        } catch (error) {
          socket.emit('error', { message: 'Invalid chat message' })
        }
      })

      socket.on('chat:typing', async (data) => {
        try {
          const validated = workspaceEventSchema.parse(data)
          
          if (!this.typingUsers.has(validated.workspaceId)) {
            this.typingUsers.set(validated.workspaceId, new Set())
          }
          this.typingUsers.get(validated.workspaceId)!.add(validated.userId)

          socket.to(validated.workspaceId).emit('chat:typing', {
            userId: validated.userId,
            userName: socket.data.userName
          })
        } catch (error) {
          socket.emit('error', { message: 'Invalid typing notification' })
        }
      })

      socket.on('chat:stop-typing', async (data) => {
        try {
          const validated = workspaceEventSchema.parse(data)
          
          this.typingUsers.get(validated.workspaceId)?.delete(validated.userId)
          
          socket.to(validated.workspaceId).emit('chat:stop-typing', {
            userId: validated.userId
          })
        } catch (error) {
          socket.emit('error', { message: 'Invalid stop typing notification' })
        }
      })

      // Video/Audio call events
      socket.on('call:start', async (data) => {
        try {
          const validated = z.object({
            workspaceId: z.string().uuid(),
            userId: z.string().uuid(),
            type: z.enum(['video', 'audio'])
          }).parse(data)
          
          const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          this.activeCalls.set(validated.workspaceId, {
            callId,
            participants: new Set([validated.userId])
          })

          socket.to(validated.workspaceId).emit('call:started', {
            callId,
            initiatorId: validated.userId,
            initiatorName: socket.data.userName
          })

          console.log(`Call started by ${validated.userId} in workspace ${validated.workspaceId}`)
        } catch (error) {
          socket.emit('error', { message: 'Invalid call start request' })
        }
      })

      // WebRTC signaling
      socket.on('call:offer', async (data) => {
        try {
          const validated = z.object({
            workspaceId: z.string().uuid(),
            callId: z.string(),
            from: z.string().uuid(),
            to: z.string().uuid(),
            offer: z.any()
          }).parse(data)
          
          socket.to(validated.workspaceId).emit('call:offer', {
            callId: validated.callId,
            from: validated.from,
            to: validated.to,
            offer: validated.offer
          })
        } catch (error) {
          socket.emit('error', { message: 'Invalid call offer' })
        }
      })

      socket.on('call:answer', async (data) => {
        try {
          const validated = z.object({
            workspaceId: z.string().uuid(),
            callId: z.string(),
            from: z.string().uuid(),
            to: z.string().uuid(),
            answer: z.any()
          }).parse(data)
          
          socket.to(validated.workspaceId).emit('call:answer', {
            callId: validated.callId,
            from: validated.from,
            to: validated.to,
            answer: validated.answer
          })
        } catch (error) {
          socket.emit('error', { message: 'Invalid call answer' })
        }
      })

      socket.on('call:ice-candidate', async (data) => {
        try {
          const validated = z.object({
            workspaceId: z.string().uuid(),
            callId: z.string(),
            from: z.string().uuid(),
            to: z.string().uuid(),
            candidate: z.any()
          }).parse(data)
          
          socket.to(validated.workspaceId).emit('call:ice-candidate', {
            callId: validated.callId,
            from: validated.from,
            to: validated.to,
            candidate: validated.candidate
          })
        } catch (error) {
          socket.emit('error', { message: 'Invalid ICE candidate' })
        }
      })

      // Disconnect handler
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`)
        
        if (socket.data.workspaceId && socket.data.userId) {
          // Remove from active users
          this.activeUsers.get(socket.data.workspaceId)?.delete(socket.data.userId)
          this.typingUsers.get(socket.data.workspaceId)?.delete(socket.data.userId)
          
          // Notify others
          socket.to(socket.data.workspaceId).emit('workspace:user-left', {
            userId: socket.data.userId
          })
        }
      })
    })
  }

  private async verifyWorkspaceAccess(workspaceId: string, userId: string): Promise<boolean> {
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

      if (!workspace) {
        return false
      }

      // Check if user is team member
      const [teamMember] = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, workspace.teamId),
            eq(teamMembers.userId, userId),
            eq(teamMembers.isActive, true)
          )
        )
        .limit(1)

      if (!teamMember) {
        return false
      }

      // Check workspace permissions
      const settings = workspace.settings as any
      if (settings?.permissions?.canRead && !settings.permissions.canRead.includes(userId)) {
        return false
      }

      return true
    } catch (error) {
      console.error('Error verifying workspace access:', error)
      return false
    }
  }

  public getActiveUsers(workspaceId: string): string[] {
    return Array.from(this.activeUsers.get(workspaceId) || [])
  }

  public getTypingUsers(workspaceId: string): string[] {
    return Array.from(this.typingUsers.get(workspaceId) || [])
  }

  public close() {
    this.io.close()
  }
}

// Export singleton instance
let wsServer: CollaborationWebSocketServer | null = null

export function initializeWebSocketServer(server: any): CollaborationWebSocketServer {
  if (!wsServer) {
    wsServer = new CollaborationWebSocketServer(server)
  }
  return wsServer
}

export function getWebSocketServer(): CollaborationWebSocketServer | null {
  return wsServer
}