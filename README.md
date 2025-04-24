# ThinkStore AI Chatbot

An advanced AI-powered Shopify chatbot platform that transforms e-commerce customer interactions through intelligent, context-aware communication and dynamic engagement strategies.

## Features

- AI-powered conversational capabilities using OpenAI GPT models
- Shopify integration for product information and order status lookups
- FAQ management system with categorization
- Multi-language support
- Real-time cart recovery messaging
- Customizable chat widget for embedding in online stores
- Customer profile management

## Tech Stack

- **Frontend**: React with Tailwind CSS and Shadcn UI components
- **Backend**: Node.js + Express
- **AI Engine**: OpenAI GPT-4 API
- **Database**: PostgreSQL with Drizzle ORM
- **Integration**: Shopify Admin and Storefront APIs

## Development

To run the application in development mode:

```bash
npm run dev
```

## Database Management

The application uses Drizzle ORM with PostgreSQL. Here are common database operations:

- **Push Schema Changes**: Pushes your schema changes to the database
  ```bash
  npm run db:push
  ```

- **Generate Migrations**: Generate SQL migrations from your schema changes
  ```bash
  # This command should be added to package.json
  drizzle-kit generate:pg
  ```

- **Run Migrations**: Apply migrations to the database
  ```bash
  # This command should be added to package.json
  tsx scripts/db-migrate.ts
  ```

- **Explore Database**: Launch Drizzle Studio to explore your database
  ```bash
  # This command should be added to package.json
  drizzle-kit studio
  ```

## Production Deployment

To prepare the application for production:

1. Build the application:
   ```bash
   npm run build
   ```

2. Run migrations on your production database:
   ```bash
   # Set DATABASE_URL to your production database
   export DATABASE_URL="your-production-db-url"
   tsx scripts/db-migrate.ts
   ```

3. Start the production server:
   ```bash
   npm run start
   ```

## Security Features

The application includes the following security features:

- CSP (Content Security Policy) headers
- CSRF protection
- Rate limiting for API endpoints
- Secure session management with PostgreSQL
- HTTP security headers via Helmet
- Secure cookie configuration
- Input validation using Zod schemas

## Environment Variables

The following environment variables are required:

- `DATABASE_URL`: PostgreSQL database connection string
- `SESSION_SECRET`: Secret for session encryption
- `OPENAI_API_KEY`: API key for OpenAI GPT models
- `SHOPIFY_API_KEY`: API key for Shopify API (for store integration)
- `SHOPIFY_API_SECRET`: API secret for Shopify API

For Stripe integration (optional):
- `STRIPE_SECRET_KEY`: Stripe secret key
- `VITE_STRIPE_PUBLIC_KEY`: Stripe publishable key (for frontend)