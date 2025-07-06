import { EventEmitter } from 'events'
import { z } from 'zod'
import { db, activityLogs } from '@/db/config'

// Event types and schemas
export const EVENT_TYPES = {
  // Challenge events
  CHALLENGE_CREATED: 'challenge.created',
  CHALLENGE_UPDATED: 'challenge.updated',
  CHALLENGE_DELETED: 'challenge.deleted',
  CHALLENGE_STARTED: 'challenge.started',
  CHALLENGE_ENDED: 'challenge.ended',
  
  // Team events
  TEAM_CREATED: 'team.created',
  TEAM_UPDATED: 'team.updated',
  TEAM_DISBANDED: 'team.disbanded',
  TEAM_MEMBER_JOINED: 'team.member.joined',
  TEAM_MEMBER_LEFT: 'team.member.left',
  TEAM_MEMBER_INVITED: 'team.member.invited',
  
  // Workspace events
  WORKSPACE_CREATED: 'workspace.created',
  WORKSPACE_UPDATED: 'workspace.updated',
  WORKSPACE_DELETED: 'workspace.deleted',
  WORKSPACE_MEMBER_JOINED: 'workspace.member.joined',
  WORKSPACE_MEMBER_LEFT: 'workspace.member.left',
  
  // Submission events
  SUBMISSION_CREATED: 'submission.created',
  SUBMISSION_UPDATED: 'submission.updated',
  SUBMISSION_SUBMITTED: 'submission.submitted',
  SUBMISSION_EVALUATED: 'submission.evaluated',
  SUBMISSION_FEATURED: 'submission.featured',
  
  // Reputation events
  REPUTATION_UPDATED: 'reputation.updated',
  SKILL_ADDED: 'skill.added',
  SKILL_ENDORSED: 'skill.endorsed',
  ACHIEVEMENT_UNLOCKED: 'achievement.unlocked',
  BADGE_EARNED: 'badge.earned',
  
  // Notification events
  NOTIFICATION_CREATED: 'notification.created',
  EMAIL_QUEUED: 'email.queued',
  PUSH_NOTIFICATION_QUEUED: 'push.queued',
  
  // System events
  USER_ACTIVITY: 'user.activity',
  SYSTEM_ALERT: 'system.alert',
  PERFORMANCE_METRIC: 'performance.metric'
} as const

// Event schemas
export const baseEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.number(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export const challengeEventSchema = baseEventSchema.extend({
  data: z.object({
    challengeId: z.string(),
    title: z.string(),
    creatorId: z.string(),
    status: z.enum(['draft', 'active', 'evaluation', 'completed', 'cancelled']),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    participantCount: z.number().optional(),
    teamCount: z.number().optional()
  })
})

export const teamEventSchema = baseEventSchema.extend({
  data: z.object({
    teamId: z.string(),
    challengeId: z.string(),
    name: z.string(),
    leaderId: z.string(),
    status: z.enum(['forming', 'active', 'completed', 'disbanded']),
    memberCount: z.number().optional(),
    memberId: z.string().optional(), // For member join/leave events
    memberName: z.string().optional()
  })
})

export const workspaceEventSchema = baseEventSchema.extend({
  data: z.object({
    workspaceId: z.string(),
    teamId: z.string(),
    name: z.string(),
    memberId: z.string().optional(),
    memberName: z.string().optional()
  })
})

export const submissionEventSchema = baseEventSchema.extend({
  data: z.object({
    submissionId: z.string(),
    challengeId: z.string(),
    teamId: z.string(),
    title: z.string(),
    status: z.enum(['draft', 'submitted', 'under_review', 'evaluated', 'featured']),
    submittedBy: z.string(),
    evaluatorId: z.string().optional(),
    score: z.number().optional(),
    maxScore: z.number().optional()
  })
})

export const reputationEventSchema = baseEventSchema.extend({
  data: z.object({
    userId: z.string(),
    previousScore: z.number(),
    newScore: z.number(),
    change: z.number(),
    reason: z.string(),
    skillName: z.string().optional(),
    achievementId: z.string().optional(),
    badgeId: z.string().optional()
  })
})

export const notificationEventSchema = baseEventSchema.extend({
  data: z.object({
    recipientId: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.enum(['info', 'warning', 'error', 'success']),
    actionUrl: z.string().optional(),
    emailTemplate: z.string().optional(),
    pushPayload: z.record(z.any()).optional()
  })
})

export type BaseEvent = z.infer<typeof baseEventSchema>
export type ChallengeEvent = z.infer<typeof challengeEventSchema>
export type TeamEvent = z.infer<typeof teamEventSchema>
export type WorkspaceEvent = z.infer<typeof workspaceEventSchema>
export type SubmissionEvent = z.infer<typeof submissionEventSchema>
export type ReputationEvent = z.infer<typeof reputationEventSchema>
export type NotificationEvent = z.infer<typeof notificationEventSchema>

export type Event = ChallengeEvent | TeamEvent | WorkspaceEvent | SubmissionEvent | ReputationEvent | NotificationEvent

// Message Queue Interface
export interface MessageQueue {
  publish(event: Event): Promise<void>
  subscribe(eventType: string, handler: (event: Event) => Promise<void>): void
  unsubscribe(eventType: string, handler: (event: Event) => Promise<void>): void
  close(): Promise<void>
}

// In-Memory Message Queue (for development)
export class InMemoryMessageQueue implements MessageQueue {
  private eventEmitter: EventEmitter
  private handlers: Map<string, Set<(event: Event) => Promise<void>>> = new Map()

  constructor() {
    this.eventEmitter = new EventEmitter()
    this.eventEmitter.setMaxListeners(100) // Increase limit for multiple handlers
  }

  async publish(event: Event): Promise<void> {
    try {
      // Validate event
      const validatedEvent = baseEventSchema.parse(event)
      
      // Log event to database
      await this.logEvent(validatedEvent)
      
      // Emit event
      this.eventEmitter.emit(event.type, event)
      
      console.log(`Event published: ${event.type}`, event)
    } catch (error) {
      console.error('Error publishing event:', error)
      throw error
    }
  }

  subscribe(eventType: string, handler: (event: Event) => Promise<void>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    
    this.handlers.get(eventType)!.add(handler)
    
    // Wrap handler to catch errors
    const wrappedHandler = async (event: Event) => {
      try {
        await handler(event)
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error)
        
        // Publish error event
        await this.publish({
          id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: EVENT_TYPES.SYSTEM_ALERT,
          timestamp: Date.now(),
          data: {
            error: error instanceof Error ? error.message : 'Unknown error',
            eventType,
            originalEvent: event
          }
        } as any)
      }
    }
    
    this.eventEmitter.on(eventType, wrappedHandler)
  }

  unsubscribe(eventType: string, handler: (event: Event) => Promise<void>): void {
    const handlers = this.handlers.get(eventType)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.handlers.delete(eventType)
      }
    }
    
    this.eventEmitter.off(eventType, handler)
  }

  async close(): Promise<void> {
    this.eventEmitter.removeAllListeners()
    this.handlers.clear()
  }

  private async logEvent(event: BaseEvent): Promise<void> {
    try {
      await db.insert(activityLogs).values({
        userId: event.userId || 'system',
        action: 'event_published',
        entityType: 'event',
        entityId: event.id,
        metadata: {
          eventType: event.type,
          timestamp: event.timestamp,
          data: event.metadata
        },
        createdAt: new Date()
      })
    } catch (error) {
      console.error('Error logging event:', error)
    }
  }
}

// Event Bus - Singleton pattern
class EventBus {
  private messageQueue: MessageQueue
  private initialized = false

  constructor() {
    // Initialize with in-memory queue for development
    this.messageQueue = new InMemoryMessageQueue()
    this.setupEventHandlers()
    this.initialized = true
  }

  private setupEventHandlers(): void {
    // Challenge event handlers
    this.messageQueue.subscribe(EVENT_TYPES.CHALLENGE_CREATED, this.handleChallengeCreated.bind(this))
    this.messageQueue.subscribe(EVENT_TYPES.CHALLENGE_UPDATED, this.handleChallengeUpdated.bind(this))
    
    // Team event handlers
    this.messageQueue.subscribe(EVENT_TYPES.TEAM_CREATED, this.handleTeamCreated.bind(this))
    this.messageQueue.subscribe(EVENT_TYPES.TEAM_MEMBER_JOINED, this.handleTeamMemberJoined.bind(this))
    this.messageQueue.subscribe(EVENT_TYPES.TEAM_MEMBER_LEFT, this.handleTeamMemberLeft.bind(this))
    
    // Submission event handlers
    this.messageQueue.subscribe(EVENT_TYPES.SUBMISSION_CREATED, this.handleSubmissionCreated.bind(this))
    this.messageQueue.subscribe(EVENT_TYPES.SUBMISSION_SUBMITTED, this.handleSubmissionSubmitted.bind(this))
    this.messageQueue.subscribe(EVENT_TYPES.SUBMISSION_EVALUATED, this.handleSubmissionEvaluated.bind(this))
    
    // Reputation event handlers
    this.messageQueue.subscribe(EVENT_TYPES.REPUTATION_UPDATED, this.handleReputationUpdated.bind(this))
    this.messageQueue.subscribe(EVENT_TYPES.ACHIEVEMENT_UNLOCKED, this.handleAchievementUnlocked.bind(this))
    
    // Notification event handlers
    this.messageQueue.subscribe(EVENT_TYPES.NOTIFICATION_CREATED, this.handleNotificationCreated.bind(this))
  }

  // Event handlers
  private async handleChallengeCreated(event: Event): Promise<void> {
    if (!('data' in event) || !('challengeId' in event.data)) return
    console.log('Handling challenge created event:', event)
    
    // Send notification to followers
    await this.publish({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: EVENT_TYPES.NOTIFICATION_CREATED,
      timestamp: Date.now(),
      data: {
        recipientId: 'all_users', // This would be resolved to actual user IDs
        title: 'New Challenge Available',
        message: `${event.data.title} challenge has been created!`,
        type: 'info',
        actionUrl: `/challenges/${event.data.challengeId}`
      }
    } as NotificationEvent)
  }

  private async handleChallengeUpdated(event: Event): Promise<void> {
    console.log('Handling challenge updated event:', event)
    // Update search index, notify participants, etc.
  }

  private async handleTeamCreated(event: Event): Promise<void> {
    if (!('data' in event) || !('teamId' in event.data)) return
    console.log('Handling team created event:', event)
    
    // Create workspace for team
    await this.publish({
      id: `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: EVENT_TYPES.WORKSPACE_CREATED,
      timestamp: Date.now(),
      userId: event.data.leaderId,
      data: {
        workspaceId: `ws_${event.data.teamId}`,
        teamId: event.data.teamId,
        name: `${event.data.name} Workspace`
      }
    } as WorkspaceEvent)
  }

  private async handleTeamMemberJoined(event: Event): Promise<void> {
    if (!('data' in event) || !('teamId' in event.data)) return
    console.log('Handling team member joined event:', event)
    
    // Send notification to team members
    await this.publish({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: EVENT_TYPES.NOTIFICATION_CREATED,
      timestamp: Date.now(),
      data: {
        recipientId: event.data.leaderId,
        title: 'New Team Member',
        message: `${event.data.memberName || 'Someone'} has joined your team "${event.data.name}"`,
        type: 'info',
        actionUrl: `/teams/${event.data.teamId}`
      }
    } as NotificationEvent)
  }

  private async handleTeamMemberLeft(event: Event): Promise<void> {
    console.log('Handling team member left event:', event)
    // Handle team member leaving logic
  }

  private async handleSubmissionCreated(event: Event): Promise<void> {
    console.log('Handling submission created event:', event)
    
    // Update challenge submission count
    // This would typically be handled by the Challenge Service
  }

  private async handleSubmissionSubmitted(event: Event): Promise<void> {
    if (!('data' in event) || !('submissionId' in event.data)) return
    console.log('Handling submission submitted event:', event)
    
    // Notify evaluators
    await this.publish({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: EVENT_TYPES.NOTIFICATION_CREATED,
      timestamp: Date.now(),
      data: {
        recipientId: 'evaluators', // This would be resolved to actual evaluator IDs
        title: 'New Submission to Review',
        message: `"${event.data.title}" submission is ready for evaluation`,
        type: 'info',
        actionUrl: `/submissions/${event.data.submissionId}`
      }
    } as NotificationEvent)
  }

  private async handleSubmissionEvaluated(event: Event): Promise<void> {
    if (!('data' in event) || !('submissionId' in event.data)) return
    console.log('Handling submission evaluated event:', event)
    
    // Update reputation based on evaluation
    if ('score' in event.data && 'maxScore' in event.data && event.data.score && event.data.maxScore) {
      const percentage = (event.data.score / event.data.maxScore) * 100
      let reputationChange = 0
      
      if (percentage >= 90) reputationChange = 50
      else if (percentage >= 80) reputationChange = 30
      else if (percentage >= 70) reputationChange = 20
      else if (percentage >= 60) reputationChange = 10
      else reputationChange = 5
      
      await this.publish({
        id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: EVENT_TYPES.REPUTATION_UPDATED,
        timestamp: Date.now(),
        userId: event.data.submittedBy,
        data: {
          userId: event.data.submittedBy,
          previousScore: 0, // This would be fetched from database
          newScore: reputationChange,
          change: reputationChange,
          reason: 'Submission evaluated'
        }
      } as ReputationEvent)
    }
  }

  private async handleReputationUpdated(event: Event): Promise<void> {
    if (!('data' in event) || !('userId' in event.data)) return
    console.log('Handling reputation updated event:', event)
    
    // Check for achievements
    if ('newScore' in event.data && event.data.newScore >= 1000) {
      await this.publish({
        id: `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: EVENT_TYPES.ACHIEVEMENT_UNLOCKED,
        timestamp: Date.now(),
        userId: event.data.userId,
        data: {
          userId: event.data.userId,
          previousScore: event.data.previousScore || 0,
          newScore: event.data.newScore,
          change: event.data.change || 0,
          reason: event.data.reason || 'Achievement unlocked',
          achievementId: 'reputation_master'
        }
      } as ReputationEvent)
    }
  }

  private async handleAchievementUnlocked(event: Event): Promise<void> {
    if (!('data' in event) || !('userId' in event.data)) return
    console.log('Handling achievement unlocked event:', event)
    
    // Send congratulation notification
    await this.publish({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: EVENT_TYPES.NOTIFICATION_CREATED,
      timestamp: Date.now(),
      data: {
        recipientId: event.data.userId,
        title: 'Achievement Unlocked!',
        message: `Congratulations! You've unlocked a new achievement.`,
        type: 'success',
        actionUrl: `/profile/achievements`
      }
    } as NotificationEvent)
  }

  private async handleNotificationCreated(event: Event): Promise<void> {
    if (!('data' in event) || !('recipientId' in event.data)) return
    console.log('Handling notification created event:', event)
    
    // Queue email if needed
    if (event.data.emailTemplate) {
      await this.publish({
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: EVENT_TYPES.EMAIL_QUEUED,
        timestamp: Date.now(),
        data: {
          recipientId: event.data.recipientId,
          title: event.data.title,
          message: event.data.message,
          type: event.data.type,
          emailTemplate: event.data.emailTemplate
        }
      } as NotificationEvent)
    }
    
    // Queue push notification if needed
    if (event.data.pushPayload) {
      await this.publish({
        id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: EVENT_TYPES.PUSH_NOTIFICATION_QUEUED,
        timestamp: Date.now(),
        data: {
          recipientId: event.data.recipientId,
          title: event.data.title,
          message: event.data.message,
          type: event.data.type,
          pushPayload: event.data.pushPayload
        }
      } as NotificationEvent)
    }
  }

  // Public API
  async publish(event: Event): Promise<void> {
    if (!this.initialized) {
      throw new Error('EventBus not initialized')
    }
    
    return this.messageQueue.publish(event)
  }

  subscribe(eventType: string, handler: (event: Event) => Promise<void>): void {
    if (!this.initialized) {
      throw new Error('EventBus not initialized')
    }
    
    this.messageQueue.subscribe(eventType, handler)
  }

  unsubscribe(eventType: string, handler: (event: Event) => Promise<void>): void {
    if (!this.initialized) {
      throw new Error('EventBus not initialized')
    }
    
    this.messageQueue.unsubscribe(eventType, handler)
  }

  async close(): Promise<void> {
    if (this.initialized) {
      await this.messageQueue.close()
      this.initialized = false
    }
  }
}

// Export singleton instance
export const eventBus = new EventBus()

// Helper functions for common event publishing
export async function publishChallengeEvent(
  type: string,
  challengeId: string,
  title: string,
  creatorId: string,
  status: string,
  difficulty: string,
  metadata?: Record<string, any>
): Promise<void> {
  await eventBus.publish({
    id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: Date.now(),
    userId: creatorId,
    metadata,
    data: {
      challengeId,
      title,
      creatorId,
      status: status as any,
      difficulty: difficulty as any
    }
  } as ChallengeEvent)
}

export async function publishTeamEvent(
  type: string,
  teamId: string,
  challengeId: string,
  name: string,
  leaderId: string,
  status: string,
  metadata?: Record<string, any>
): Promise<void> {
  await eventBus.publish({
    id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: Date.now(),
    userId: leaderId,
    metadata,
    data: {
      teamId,
      challengeId,
      name,
      leaderId,
      status: status as any
    }
  } as TeamEvent)
}

export async function publishSubmissionEvent(
  type: string,
  submissionId: string,
  challengeId: string,
  teamId: string,
  title: string,
  status: string,
  submittedBy: string,
  metadata?: Record<string, any>
): Promise<void> {
  await eventBus.publish({
    id: `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: Date.now(),
    userId: submittedBy,
    metadata,
    data: {
      submissionId,
      challengeId,
      teamId,
      title,
      status: status as any,
      submittedBy
    }
  } as SubmissionEvent)
}

export async function publishReputationEvent(
  userId: string,
  previousScore: number,
  newScore: number,
  reason: string,
  metadata?: Record<string, any>
): Promise<void> {
  await eventBus.publish({
    id: `reputation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EVENT_TYPES.REPUTATION_UPDATED,
    timestamp: Date.now(),
    userId,
    metadata,
    data: {
      userId,
      previousScore,
      newScore,
      change: newScore - previousScore,
      reason
    }
  } as ReputationEvent)
}

export async function publishNotificationEvent(
  recipientId: string,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' | 'success',
  actionUrl?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await eventBus.publish({
    id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EVENT_TYPES.NOTIFICATION_CREATED,
    timestamp: Date.now(),
    metadata,
    data: {
      recipientId,
      title,
      message,
      type,
      actionUrl
    }
  } as NotificationEvent)
}