import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from 'ws';

// Configure the WebSocket constructor for the Neon serverless driver
neonConfig.webSocketConstructor = ws;
import * as schema from "../shared/schema";
import { sql } from 'drizzle-orm';

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('Adding subscription-related columns to users table...');
  
  try {
    // Add subscription_tier column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_tier') THEN
          ALTER TABLE users ADD COLUMN subscription_tier text DEFAULT 'free';
        END IF;
      END $$;
    `);

    // Add stripe_customer_id column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
          ALTER TABLE users ADD COLUMN stripe_customer_id text;
        END IF;
      END $$;
    `);

    // Add stripe_subscription_id column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_subscription_id') THEN
          ALTER TABLE users ADD COLUMN stripe_subscription_id text;
        END IF;
      END $$;
    `);

    // Add subscription_status column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
          ALTER TABLE users ADD COLUMN subscription_status text DEFAULT 'active';
        END IF;
      END $$;
    `);

    // Add interactions_count column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'interactions_count') THEN
          ALTER TABLE users ADD COLUMN interactions_count integer DEFAULT 0;
        END IF;
      END $$;
    `);

    // Add interactions_reset column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'interactions_reset') THEN
          ALTER TABLE users ADD COLUMN interactions_reset timestamp;
        END IF;
      END $$;
    `);

    // Add subscription_start_date column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_start_date') THEN
          ALTER TABLE users ADD COLUMN subscription_start_date timestamp;
        END IF;
      END $$;
    `);

    // Add subscription_end_date column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_end_date') THEN
          ALTER TABLE users ADD COLUMN subscription_end_date timestamp;
        END IF;
      END $$;
    `);

    console.log('Creating subscription_plans table...');
    
    // Create subscription_plans table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        stripe_price_id TEXT,
        monthly_price DECIMAL(10, 2),
        yearly_price DECIMAL(10, 2),
        interactions INTEGER NOT NULL,
        description TEXT NOT NULL,
        features JSONB NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Creating subscription_transactions table...');
    
    // Create subscription_transactions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan_id INTEGER REFERENCES subscription_plans(id),
        type TEXT NOT NULL,
        stripe_invoice_id TEXT,
        stripe_payment_intent_id TEXT,
        amount DECIMAL(10, 2),
        currency TEXT DEFAULT 'usd',
        status TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Migration completed successfully!');
    
    // Insert default subscription plans if they don't exist
    await db.execute(sql`
      INSERT INTO subscription_plans (name, interactions, description, features)
      SELECT 'free', 500, 'Basic features for small stores just getting started', 
        jsonb_build_array(
          'Basic AI conversation engine', 
          'Shopify integration', 
          'Standard FAQ system', 
          'Basic analytics', 
          'Embedded widget with default branding', 
          'Community support'
        )
      WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'free');
    `);

    await db.execute(sql`
      INSERT INTO subscription_plans (name, monthly_price, yearly_price, interactions, description, features)
      SELECT 'starter', 29, 290, 2000, 'Enhanced features for growing businesses', 
        jsonb_build_array(
          'Increased usage (2,000 interactions/month)', 
          'All Free Tier features', 
          'Intelligent product recommendations', 
          'Basic cart recovery', 
          'Enhanced customization', 
          'Multi-language support (up to 3 languages)', 
          'Email support'
        )
      WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'starter');
    `);

    await db.execute(sql`
      INSERT INTO subscription_plans (name, monthly_price, yearly_price, interactions, description, features)
      SELECT 'pro', 99, 990, 10000, 'Enterprise-grade features for established businesses', 
        jsonb_build_array(
          'Higher usage (10,000 interactions/month)', 
          'All Starter Tier features', 
          'Advanced product recommendations', 
          'Full cart recovery automation', 
          'Comprehensive analytics', 
          'Multi-language support (unlimited languages)', 
          'Advanced customization', 
          'Priority support'
        )
      WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'pro');
    `);

    await db.execute(sql`
      INSERT INTO subscription_plans (name, interactions, description, features)
      SELECT 'enterprise', 0, 'For high-volume merchants or those requiring bespoke solutions', 
        jsonb_build_array(
          'Unlimited customer interactions', 
          'All Pro Tier features', 
          'Dedicated account manager', 
          'Custom AI training', 
          'Multi-channel support', 
          'Advanced integrations', 
          'SLA-backed support', 
          'White-labeling option'
        )
      WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'enterprise');
    `);

    console.log('Default plans inserted successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration script failed:', err);
    process.exit(1);
  });