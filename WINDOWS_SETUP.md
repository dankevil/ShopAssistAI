# Setting up ShopAssistAI on Windows

This guide will help you set up and run the ShopAssistAI project on a Windows machine.

## Prerequisites

1. **Node.js**: Install Node.js (version 20.x recommended) from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL**: Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
3. **Git**: Install Git from [git-scm.com](https://git-scm.com/download/win)

## Setup Steps

### 1. Clone the Repository

If you haven't already cloned the repository:

```bash
git clone <repository-url>
cd ShopAssistAI
```

### 2. Configure Environment Variables

The project includes a `.env` file with basic configuration. You need to:

1. Set up a PostgreSQL database
2. Update the `DATABASE_URL` in the `.env` file with your PostgreSQL connection string
3. Add your OpenAI API key to the `OPENAI_API_KEY` variable

Example `.env` configuration:
```
VITE_ALLOW_REPLIT_HOST=true
VITE_FORCE_SANDBOX_VIEW=true

# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/shopassist

# Session
SESSION_SECRET=local-development-secret

# OpenAI API (you need to add your own key here)
OPENAI_API_KEY=your-openai-api-key

# Node Environment
NODE_ENV=development
```

### 3. Install Dependencies

Install all required dependencies:

```bash
npm install
```

### 4. Set Up the Database

1. Create a PostgreSQL database named `shopassist`
2. Run database migrations:

```bash
npm run db:migrate
```

### 5. Run the Application

Start the development server:

```bash
# Using cross-env (recommended)
npm run dev

# Or using Windows-specific command
npm run windows:dev
```

The application should now be running at http://localhost:5000

## Building for Production

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
# Using cross-env (recommended)
npm run start

# Or using Windows-specific command
npm run windows:start
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify your DATABASE_URL is correct
- Check that the database exists

### Node.js Version Issues

This project is designed to work with Node.js 20.x. If you encounter issues, make sure you're using a compatible version:

```bash
node --version
```

### Port Conflicts

If port 5000 is already in use, you can modify the port in `server/config.ts`.
