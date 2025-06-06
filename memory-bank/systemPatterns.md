# System Patterns

- Architecture: Client-Server (Vite/React frontend, Node.js/Express backend).
- Key Decisions:
    - Use OpenAI for core LLM capabilities.
    - Support multiple e-commerce platforms (Shopify, WordPress).
    - Platform-specific integration via dedicated services (`ShopifyService`, `WordPressService`).
    - Shared database schema (`shared/schema.ts`) using Drizzle ORM (likely PostgreSQL in production, `MemStorage` for dev).
    - Centralized API request handling (`client/src/lib/apiRequest.ts`, `client/src/lib/api.ts`).
    - TanStack Query for frontend data fetching and state management.
    - Shadcn/ui for UI components.
- Database:
    - `stores` table uses `platform` enum ('shopify', 'wordpress') and `credentials` (JSONB) to store platform-specific auth info (Shopify: `{ accessToken }`, WP: `{ username, applicationPassword }`).
    - `wordpress_data_cache` table stores fetched data (posts, pages, products, etc.) keyed by `storeId` and `dataType`, updated via daily sync or manual trigger.
    - `settings` table stores configuration per `storeId`, intended to be mostly platform-agnostic.
- Authentication:
    - User auth via session cookies (express-session).
    - Shopify: OAuth 2.0 flow.
    - WordPress: Basic Auth with Admin Username and Application Password over HTTPS (via `WordPressService`).
- API Structure:
    - Platform-specific routes (e.g., `/api/shopify/auth`, `/api/wordpress/connect`, `/api/wordpress/sync`).
    - Generic routes handling multiple platforms (e.g., `/api/stores`, `/api/settings`, `/api/chat`).
    - `/api/chat` endpoint checks `store.platform` to fetch relevant context (Shopify data or WP cached data) before calling LLM.
- Component Relationships:
    - `Sidebar` links to platform-specific integration pages.
    - `pages/shopify.tsx` uses `ShopifyIntegration.tsx`.
    - `pages/wordpress.tsx` uses `WordPressIntegration.tsx`.
    - Integration components handle connection UI, display sync status/info, and provide access to settings sections (likely reusing common setting components). 