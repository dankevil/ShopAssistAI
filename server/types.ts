import 'express-session';

// Extend the Express Session to include custom fields
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    shopifyState?: string;
    shopifyShop?: string;
  }
}