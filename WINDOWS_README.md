# ShopAssistAI - Windows Setup Guide

This guide provides detailed instructions for setting up and running the ShopAssistAI project on Windows.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js**: Version 20.x or later
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation with `node --version`

2. **PostgreSQL**: Version 14.x or later
   - Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Remember the password you set during installation
   - Create a database named `shopassist`

3. **Git**: Latest version
   - Download from [git-scm.com](https://git-scm.com/download/win)

## Quick Setup

For a quick setup, you can use the provided batch files:

1. Configure your `.env` file (see Environment Configuration section)
2. Run `setup-windows.bat` to install dependencies and set up the database
3. Run `start-dev.bat` to start the development server

## Manual Setup

### 1. Clone the Repository (if you haven't already)

```bash
git clone <repository-url>
cd ShopAssistAI
```

### 2. Environment Configuration

The project requires several environment variables to be set. A basic `.env` file is included, but you need to update it with your specific configuration:

1. Open the `.env` file in a text editor
2. Update the following variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `SESSION_SECRET`: A secure random string for session encryption

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

```bash
npm install
```

### 4. Database Setup

1. Create a PostgreSQL database named `shopassist`
   ```sql
   CREATE DATABASE shopassist;
   ```

2. Run database migrations:
   ```bash
   npm run db:migrate
   ```

### 5. Running the Application

#### Development Mode

```bash
npm run windows:dev
```

The application will be available at http://localhost:5000

#### Production Mode

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run windows:start
   ```

## Batch Files

The project includes several batch files to simplify common tasks:

- `setup-windows.bat`: Installs dependencies and sets up the database
- `start-dev.bat`: Starts the development server
- `start-prod.bat`: Starts the production server

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Ensure PostgreSQL is running
   - Check Windows Services to verify PostgreSQL is running
   - Start it if needed: `net start postgresql-x64-14` (adjust for your version)

2. Verify your connection string
   - The default format is: `postgresql://username:password@localhost:5432/database_name`
   - Make sure the password and database name are correct

3. Check database existence
   - Connect to PostgreSQL: `psql -U postgres`
   - List databases: `\l`
   - Create if needed: `CREATE DATABASE shopassist;`

### Port Conflicts

If port 5000 is already in use:

1. You can modify the port in `server/config.ts`
2. Or terminate the process using the port:
   ```bash
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

### Node.js Version Issues

This project requires Node.js 20.x or later. If you encounter issues:

1. Check your Node.js version: `node --version`
2. Update Node.js if needed from [nodejs.org](https://nodejs.org/)

## Project Structure

- `client/`: Frontend React application
- `server/`: Backend Express server
- `shared/`: Shared code between frontend and backend
- `scripts/`: Utility scripts
- `drizzle/`: Database migration files

## Additional Resources

- [Original README.md](./README.md): General project information
- [DEPLOYMENT.md](./DEPLOYMENT.md): Deployment instructions
- [WINDOWS_SETUP.md](./WINDOWS_SETUP.md): Detailed Windows setup guide
