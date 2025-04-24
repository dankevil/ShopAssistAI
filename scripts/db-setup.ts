import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import ws from 'ws';
import * as schema from '../shared/schema';
import { users, stores, wordpressDataCache, conversations, messages, 
         faqCategories, faqs, settings, customerProfiles, messageFeedback,
         abandonedCarts, cartRecoveryAttempts, automationSettings,
         subscriptionPlans, subscriptionTransactions } from '../shared/schema';

// For Neon serverless PostgreSQL
neonConfig.webSocketConstructor = ws;

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Please set it to run database setup.');
    process.exit(1);
  }

  console.log('Setting up database...');
  
  try {
    // Create a database pool
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });
    
    console.log('Connected to database.');
    console.log('Creating tables...');

    // Create all tables defined in the schema
    // This approach is safer than manually creating tables and can handle schema changes
    console.log('Running migrations if available...');
    
    try {
      // Try running migrations if they exist
      await migrate(db, { migrationsFolder: './drizzle' });
      console.log('Migrations completed successfully!');
    } catch (migrationError) {
      console.warn('Migrations failed or no migrations found:', migrationError);
      console.log('Attempting to create schema directly...');
      
      // If migrations fail or don't exist, create tables directly
      try {
        // Create tables in the correct order (respecting foreign key constraints)
        console.log('Creating users table...');
        await db.schema.createTable(users).ifNotExists().execute();
        
        console.log('Creating stores table...');
        await db.schema.createTable(stores).ifNotExists().execute();
        
        console.log('Creating WordPress data cache table...');
        await db.schema.createTable(wordpressDataCache).ifNotExists().execute();
        
        console.log('Creating customer profiles table...');
        await db.schema.createTable(customerProfiles).ifNotExists().execute();
        
        console.log('Creating conversations table...');
        await db.schema.createTable(conversations).ifNotExists().execute();
        
        console.log('Creating messages table...');
        await db.schema.createTable(messages).ifNotExists().execute();
        
        console.log('Creating message feedback table...');
        await db.schema.createTable(messageFeedback).ifNotExists().execute();
        
        console.log('Creating FAQ categories table...');
        await db.schema.createTable(faqCategories).ifNotExists().execute();
        
        console.log('Creating FAQs table...');
        await db.schema.createTable(faqs).ifNotExists().execute();
        
        console.log('Creating settings table...');
        await db.schema.createTable(settings).ifNotExists().execute();
        
        console.log('Creating abandoned carts table...');
        await db.schema.createTable(abandonedCarts).ifNotExists().execute();
        
        console.log('Creating cart recovery attempts table...');
        await db.schema.createTable(cartRecoveryAttempts).ifNotExists().execute();
        
        console.log('Creating automation settings table...');
        await db.schema.createTable(automationSettings).ifNotExists().execute();
        
        console.log('Creating subscription plans table...');
        await db.schema.createTable(subscriptionPlans).ifNotExists().execute();
        
        console.log('Creating subscription transactions table...');
        await db.schema.createTable(subscriptionTransactions).ifNotExists().execute();
        
        console.log('All tables created successfully!');
      } catch (createError) {
        console.error('Error creating tables directly:', createError);
        throw createError;
      }
    }

    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

// Run the database setup
setupDatabase(); 