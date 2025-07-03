import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/global-copilot'

// Database configuration
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/hero_study_ai'

// Create postgres client
const client = postgres(connectionString, {
  prepare: false, // Disable prepared statements for serverless
})

// Create drizzle database instance
export const db = drizzle(client, { schema })

// Export schema for external use
export * from './schema/global-copilot'

// Database connection health check
export async function healthCheck(): Promise<boolean> {
  try {
    await client`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Close database connection
export async function closeConnection(): Promise<void> {
  await client.end()
}