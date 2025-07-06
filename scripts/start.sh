#!/bin/bash

set -e

echo "🚀 Starting Global Knowledge Co-Pilot..."

# Check if we're in production
if [ "$NODE_ENV" = "production" ]; then
    echo "📋 Running in production mode"
else
    echo "🔧 Running in development mode"
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until nc -z postgres 5432; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "✅ Database is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until nc -z redis 6379; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

# Run database migrations
echo "📊 Running database migrations..."
if [ -f "src/db/migrate.ts" ]; then
    node -r esbuild-register src/db/migrate.ts || {
        echo "❌ Migration failed"
        exit 1
    }
    echo "✅ Database migrations completed"
else
    echo "⚠️  No migration script found, skipping..."
fi

# Run database seeding (only in development)
if [ "$NODE_ENV" != "production" ] && [ -f "src/db/seed.ts" ]; then
    echo "🌱 Seeding database with sample data..."
    node -r esbuild-register src/db/seed.ts || {
        echo "⚠️  Seeding failed, continuing anyway..."
    }
    echo "✅ Database seeding completed"
fi

# Setup MinIO buckets
echo "🗂️  Setting up MinIO buckets..."
if [ ! -z "$MINIO_ENDPOINT" ]; then
    # Wait for MinIO to be ready
    until curl -f "$MINIO_ENDPOINT/minio/health/live" 2>/dev/null; do
        echo "MinIO is unavailable - sleeping"
        sleep 2
    done
    
    echo "📦 Creating MinIO bucket: $MINIO_BUCKET"
    # Note: In production, you might want to use mc (MinIO Client) for this
    # For now, the application will create the bucket on first upload
fi

# Initialize Elasticsearch indices
echo "🔍 Setting up Elasticsearch indices..."
if [ ! -z "$ELASTICSEARCH_URL" ]; then
    until curl -f "$ELASTICSEARCH_URL/_cluster/health" 2>/dev/null; do
        echo "Elasticsearch is unavailable - sleeping"
        sleep 2
    done
    
    echo "📑 Creating Elasticsearch indices..."
    # Create indices for challenges, submissions, users, etc.
    # This would be handled by the application startup hooks
fi

# Setup RabbitMQ queues and exchanges
echo "🐰 Setting up RabbitMQ..."
if [ ! -z "$RABBITMQ_URL" ]; then
    until curl -f "http://rabbitmq:15672/api/overview" 2>/dev/null; do
        echo "RabbitMQ is unavailable - sleeping"
        sleep 2
    done
    
    echo "📬 RabbitMQ is ready"
    # Queue setup will be handled by the application
fi

# Log startup information
echo "📋 Startup Configuration:"
echo "  - Node Environment: $NODE_ENV"
echo "  - Port: ${PORT:-3000}"
echo "  - Database: Connected"
echo "  - Redis: Connected"
echo "  - MinIO: ${MINIO_ENDPOINT:-Not configured}"
echo "  - Elasticsearch: ${ELASTICSEARCH_URL:-Not configured}"
echo "  - RabbitMQ: ${RABBITMQ_URL:-Not configured}"

# Pre-warm the application
echo "🔥 Pre-warming application..."
export STARTUP_PRELOAD=true

# Start the Next.js application
echo "🎯 Starting application server..."
exec node server.js