#!/bin/bash
# Deployment script for ThinkStore AI Chatbot
# This script automates the build and deployment process

set -e  # Exit immediately if a command exits with a non-zero status

# Check if environment is provided
if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh [production|staging]"
  exit 1
fi

ENVIRONMENT=$1
echo "🚀 Starting deployment to $ENVIRONMENT environment..."

# Validate required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL is not set. Please set it before deploying."
  exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ Error: OPENAI_API_KEY is not set. Please set it before deploying."
  exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
  echo "❌ Error: SESSION_SECRET is not set. Please set it before deploying."
  exit 1
fi

# Build the application
echo "📦 Building the application..."
npm run build

# Run database migrations
echo "🔄 Running database migrations..."
NODE_ENV=$ENVIRONMENT tsx scripts/db-migrate.ts

# Start the application based on environment
if [ "$ENVIRONMENT" = "production" ]; then
  echo "🚀 Starting production server..."
  NODE_ENV=production node dist/index.js
else
  echo "🚀 Starting staging server..."
  NODE_ENV=staging node dist/index.js
fi