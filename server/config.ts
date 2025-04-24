/**
 * Configuration management for ThinkStore AI Chatbot Platform
 * 
 * This file handles environment variable validation and provides a central
 * configuration object for the application.
 */

// Required environment variables in production
const REQUIRED_ENV_VARS_PROD = [
  'OPENAI_API_KEY',
  'SESSION_SECRET',
  'DATABASE_URL'
];

// Optional environment variables (with fallbacks)
const OPTIONAL_ENV_VARS = [
  'NODE_ENV',
  'SHOPIFY_API_KEY',
  'SHOPIFY_API_SECRET'
];

/**
 * Validate that all required environment variables are present in production
 */
export function validateEnvironment(): void {
  // Only enforce required variables in production
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  
  const missingVars = REQUIRED_ENV_VARS_PROD.filter(
    varName => !process.env[varName]
  );
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missingVars.join(', ')}`
    );
  }
}

/**
 * Configuration object with application settings
 */
export const config = {
  environment: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  server: {
    port: 5000,
    host: '0.0.0.0',
  },
  
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'ai-chatbot-secret',
    sessionMaxAge: 86400000, // 24 hours
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // per window
    },
  },
  
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  apis: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      defaultModel: 'gpt-4o',
    },
    shopify: {
      apiKey: process.env.SHOPIFY_API_KEY || '',
      apiSecret: process.env.SHOPIFY_API_SECRET || '',
    },
  },
};