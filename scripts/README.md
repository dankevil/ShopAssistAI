# Database Setup Instructions

This document provides instructions for setting up and managing the database for the ShopAssistAI project.

## Prerequisites

- Node.js and npm installed
- A PostgreSQL database (this project uses Neon Serverless Postgres)
- The `DATABASE_URL` environment variable set with your database connection string

## Setting Up the Database

To set up the database tables for the first time, run:

```bash
npm run db:setup
```

This script will:
1. Connect to your database using the `DATABASE_URL` environment variable
2. Try to run any existing migrations in the `drizzle` folder first
3. If migrations fail or don't exist, it will create all necessary tables directly 
4. Ensure all tables are created in the correct order respecting foreign key constraints

## Database Migration

For incremental database changes after initial setup, you can use:

```bash
npm run db:migrate
```

This runs the migration scripts in the `drizzle` folder.

## Generating Migrations

This project uses Drizzle ORM for database management. To generate new migrations after schema changes:

```bash
npm run db:push
```

This will analyze your schema and create migration files.

## Database Schema

The database schema is defined in `shared/schema.ts`. The main tables include:

- users - User accounts
- stores - Connected e-commerce stores
- conversations - Chat conversations
- messages - Individual chat messages
- faqs & faqCategories - FAQ management
- settings - Store-specific settings
- customerProfiles - Customer information
- wordpressDataCache - Cache for WordPress data
- And several others for subscriptions, abandoned carts, etc.

## Environment Variables

Ensure you have these environment variables set:

```
DATABASE_URL=postgres://username:password@hostname:port/database
```

For local development, you can create a `.env` file in the root directory.

## Troubleshooting

- **Connection Issues**: Verify your DATABASE_URL is correct and the database server is accessible
- **Permission Issues**: Ensure your database user has CREATE TABLE permissions
- **Migration Errors**: Check the drizzle migration files for syntax errors 